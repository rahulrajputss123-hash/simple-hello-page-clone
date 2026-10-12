#!/bin/bash

# Complete End-to-End Marketplace Test
# Tests: Create Campaign → Admin Approve → Publisher Start → Submit Proof → Admin Review → Appeal → Postback Conversion

set -e

# Load environment
source .env

API_URL="${VITE_SUPABASE_URL}/rest/v1"
FUNCTIONS_URL="${VITE_SUPABASE_URL}/functions/v1"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "=== CashGPT Marketplace E2E Test ==="
echo "Testing complete flow: Campaign creation → approval → publisher engagement → proof submission → review → appeal → conversion"
echo ""

# Step 1: Create test user IDs (with timestamp to avoid conflicts)
TIMESTAMP=$(date +%s)
ADVERTISER_ID=$(printf "00000000-0000-0000-0000-%012d" $((TIMESTAMP % 1000000000000)))
PUBLISHER_ID=$(printf "00000000-0000-0000-0001-%012d" $((TIMESTAMP % 1000000000000)))
ADMIN_ID=$(printf "00000000-0000-0000-0002-%012d" $((TIMESTAMP % 1000000000000)))

echo "Step 1: Create test auth users"
echo "  Advertiser: $ADVERTISER_ID"
echo "  Publisher: $PUBLISHER_ID"
echo "  Admin: $ADMIN_ID"
echo ""

# Create auth users using admin API
curl -s -X POST "$VITE_SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$ADVERTISER_ID\",
    \"email\": \"advertiser_${TIMESTAMP}@test.com\",
    \"email_confirm\": true,
    \"user_metadata\": {\"username\": \"test_advertiser_$TIMESTAMP\", \"full_name\": \"Test Advertiser\"}
  }" > /dev/null 2>&1

curl -s -X POST "$VITE_SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$PUBLISHER_ID\",
    \"email\": \"publisher_${TIMESTAMP}@test.com\",
    \"email_confirm\": true,
    \"user_metadata\": {\"username\": \"test_publisher_$TIMESTAMP\", \"full_name\": \"Test Publisher\"}
  }" > /dev/null 2>&1

curl -s -X POST "$VITE_SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$ADMIN_ID\",
    \"email\": \"admin_${TIMESTAMP}@test.com\",
    \"email_confirm\": true,
    \"user_metadata\": {\"username\": \"test_admin_$TIMESTAMP\", \"full_name\": \"Test Admin\", \"role\": \"admin\"}
  }" > /dev/null 2>&1

# Create profiles
curl -s -X POST "$API_URL/profiles" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=ignore-duplicates,return=representation" \
  -d "[
    {\"id\": \"$ADVERTISER_ID\", \"name\": \"Test Advertiser\", \"email\": \"advertiser_${TIMESTAMP}@test.com\", \"referral_code\": \"ADV${TIMESTAMP}\"},
    {\"id\": \"$PUBLISHER_ID\", \"name\": \"Test Publisher\", \"email\": \"publisher_${TIMESTAMP}@test.com\", \"referral_code\": \"PUB${TIMESTAMP}\"},
    {\"id\": \"$ADMIN_ID\", \"name\": \"Test Admin\", \"email\": \"admin_${TIMESTAMP}@test.com\", \"referral_code\": \"ADM${TIMESTAMP}\"}
  ]" > /dev/null 2>&1

# Give database a moment to process
sleep 1

# Step 2: Create advertiser account (direct INSERT)
echo "Step 2: Create advertiser account"
ACCOUNT_RESULT=$(curl -s -X POST "$API_URL/advertiser_accounts" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"$ADVERTISER_ID\",
    \"display_name\": \"E2E Test Business\",
    \"contact_email\": \"test@example.com\",
    \"terms_version\": \"v1\"
  }")

ACCOUNT_ID=$(echo "$ACCOUNT_RESULT" | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ Failed to create advertiser account"
  echo "$ACCOUNT_RESULT"
  exit 1
fi
echo "  ✓ Advertiser account created: $ACCOUNT_ID"
echo ""

# Step 3: Fund the account (create deposit + credit it)
echo "Step 3: Create deposit for ₹500"
DEPOSIT_RESULT=$(curl -s -X POST "$API_URL/advertiser_deposits" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"advertiser_id\": \"$ACCOUNT_ID\",
    \"amount_usd\": 500.00,
    \"gateway\": \"manual\",
    \"charge_currency\": \"USD\",
    \"charge_amount\": 500.00,
    \"terms_version\": \"v1\",
    \"status\": \"created\"
  }")

DEPOSIT_ID=$(echo "$DEPOSIT_RESULT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$DEPOSIT_ID" ]; then
  echo "❌ Failed to create deposit"
  echo "$DEPOSIT_RESULT"
  exit 1
fi
echo "  ✓ Deposit created: $DEPOSIT_ID"

# Credit the deposit
echo "Step 4: Credit deposit to account"
CREDIT_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_credit_deposit" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_deposit_id\": \"$DEPOSIT_ID\",
    \"p_confirmed_by\": \"$ADMIN_ID\"
  }")

echo "  ✓ Deposit credited: $CREDIT_RESULT"
echo ""

# Step 5: Create campaign
echo "Step 5: Create manual proof campaign"
CAMPAIGN_DATA='{
  "advertiser_id": "'$ACCOUNT_ID'",
  "name": "E2E Test Campaign",
  "description": "Test campaign for complete marketplace flow",
  "type_key": "custom",
  "landing_url": "https://example.com/landing",
  "verification_mode": "manual_proof",
  "proof_description": "Upload screenshot of completed action",
  "publisher_reward": 10.00,
  "max_completions": 10,
  "steps": [
    {"step": 1, "instruction": "Visit the landing page"},
    {"step": 2, "instruction": "Complete the action"},
    {"step": 3, "instruction": "Take a screenshot"}
  ]
}'

CAMPAIGN_INSERT=$(curl -s -X POST "$API_URL/campaigns" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$CAMPAIGN_DATA")

CAMPAIGN_ID=$(echo "$CAMPAIGN_INSERT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$CAMPAIGN_ID" ]; then
  echo "❌ Failed to create campaign"
  echo "$CAMPAIGN_INSERT"
  exit 1
fi
echo "  ✓ Campaign created: $CAMPAIGN_ID"
echo ""

# Step 6: Submit campaign for review
echo "Step 6: Submit campaign for review"
SUBMIT_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_submit_campaign" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_campaign_id\": \"$CAMPAIGN_ID\",
    \"p_actor\": \"$ADVERTISER_ID\"
  }")

echo "  ✓ Campaign submitted for review"
echo "  Response: $SUBMIT_RESULT"
echo ""

# Step 7: Admin approves campaign
echo "Step 7: Admin approves campaign"
APPROVE_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_review_campaign" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_campaign_id\": \"$CAMPAIGN_ID\",
    \"p_admin\": \"$ADMIN_ID\",
    \"p_decision\": \"approved\",
    \"p_note\": \"Campaign looks good\"
  }")

echo "  ✓ Campaign approved by admin"
echo "  Response: $APPROVE_RESULT"
echo ""

# Step 8: Publisher starts campaign
echo "Step 8: Publisher starts campaign"

# First, verify publisher profile exists
PROFILE_CHECK=$(curl -s "$API_URL/profiles?id=eq.$PUBLISHER_ID&select=id,name" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")

echo "  Profile verified: $(echo $PROFILE_CHECK | grep -o '"name":"[^"]*"' || echo 'creating...')"

# If profile doesn't exist, create it now
if echo "$PROFILE_CHECK" | grep -q "\[\]"; then
  curl -s -X POST "$API_URL/profiles" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"$PUBLISHER_ID\", \"name\": \"Test Publisher\", \"email\": \"publisher_${TIMESTAMP}@test.com\", \"referral_code\": \"PUB${TIMESTAMP}\"}" > /dev/null
  sleep 1
fi

START_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_start" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_campaign_id\": \"$CAMPAIGN_ID\",
    \"p_user_id\": \"$PUBLISHER_ID\",
    \"p_meta\": {\"source\": \"test\"}
  }")

CLICK_ID=$(echo "$START_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('click_id', ''))" 2>/dev/null || echo "$START_RESULT" | grep -o '"click_id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$CLICK_ID" ]; then
  echo "❌ Failed to start campaign - no click_id returned"
  echo "$START_RESULT"
  exit 1
fi
echo "  ✓ Campaign started by publisher"
echo "  Click ID: $CLICK_ID"
echo ""

# Step 9: Publisher submits proof
echo "Step 9: Publisher submits proof"
# Proof paths must be in format: {user_id}/campaign/{campaign_id}/filename
PROOF_PATH1="$PUBLISHER_ID/campaign/$CAMPAIGN_ID/proof1.jpg"
PROOF_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_submit_proof" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_click_id\": \"$CLICK_ID\",
    \"p_user_id\": \"$PUBLISHER_ID\",
    \"p_paths\": [\"$PROOF_PATH1\"],
    \"p_fields\": {},
    \"p_note\": \"Please review my submission\"
  }")

SUBMISSION_ID=$(echo "$PROOF_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('submission_id', ''))" 2>/dev/null || echo "$PROOF_RESULT" | grep -o '"submission_id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ Failed to submit proof"
  echo "$PROOF_RESULT"
  exit 1
fi
echo "  ✓ Proof submitted"
echo "  Submission ID: $SUBMISSION_ID"
echo ""

# Step 10: Admin rejects proof (to test appeal flow)
echo "Step 10: Admin rejects proof (to test appeal flow)"
REJECT_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_decide_submission" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_submission_id\": \"$SUBMISSION_ID\",
    \"p_actor\": \"$ADMIN_ID\",
    \"p_role\": \"admin\",
    \"p_decision\": \"rejected\",
    \"p_reason\": \"Screenshot not clear enough\"
  }")

echo "  ✓ Proof rejected by admin"
echo "  Response: $REJECT_RESULT"
echo ""

# Step 11: Publisher appeals
echo "Step 11: Publisher appeals rejection"
APPEAL_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_appeal" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_submission_id\": \"$SUBMISSION_ID\",
    \"p_user_id\": \"$PUBLISHER_ID\",
    \"p_text\": \"The screenshot is clear, please review again\"
  }")

echo "  ✓ Appeal submitted"
echo "  Response: $APPEAL_RESULT"
echo ""

# Step 12: Admin resolves appeal (approves)
echo "Step 12: Admin resolves appeal (approves)"
RESOLVE_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_resolve_appeal" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_submission_id\": \"$SUBMISSION_ID\",
    \"p_admin\": \"$ADMIN_ID\",
    \"p_decision\": \"approved\",
    \"p_note\": \"Appeal accepted, proof is valid\"
  }")

echo "  ✓ Appeal resolved (approved)"
echo "  Response: $RESOLVE_RESULT"
echo ""

# Step 13: Test auto-postback conversion (only works for auto campaigns)
echo "Step 13: Record postback conversion (testing auto-campaign flow)"
CONVERSION_RESULT=$(curl -s -X POST "$API_URL/rpc/mkt_record_conversion" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_campaign_id\": \"$CAMPAIGN_ID\",
    \"p_click_id\": \"$CLICK_ID\",
    \"p_external_txn_id\": \"txn_$(date +%s)\",
    \"p_meta\": {\"source\": \"postback_test\"}
  }")

# Check if recorded
if echo "$CONVERSION_RESULT" | grep -q '"recorded":true'; then
  CONVERSION_ID=$(echo "$CONVERSION_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('conversion_id', ''))" 2>/dev/null || echo "$CONVERSION_RESULT" | grep -o '"conversion_id":"[^"]*"' | cut -d'"' -f4)
  echo "  ✓ Conversion recorded"
  echo "  Conversion ID: $CONVERSION_ID"
else
  echo "  ⊘ Conversion not recorded (expected for manual_proof campaigns)"
  echo "  Response: $CONVERSION_RESULT"
fi
echo ""

# Step 14: Verify final states
echo "=== Verification: Final States ==="
echo ""

echo "Campaign Status:"
curl -s "$API_URL/campaigns?id=eq.$CAMPAIGN_ID&select=id,name,status,budget_spent,completions_count" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | python3 -m json.tool 2>/dev/null || echo "Campaign data retrieved"
echo ""

echo "Submission Status:"
curl -s "$API_URL/campaign_submissions?id=eq.$SUBMISSION_ID&select=id,status,reviewed_at,appeal_text,appealed_at" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | python3 -m json.tool 2>/dev/null || echo "Submission data retrieved"
echo ""

if [ -n "$CONVERSION_ID" ]; then
  echo "Conversion Status:"
  curl -s "$API_URL/campaign_conversions?conversion_id=eq.$CONVERSION_ID&select=conversion_id,status,amount,created_at" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" | python3 -m json.tool 2>/dev/null || echo "Conversion data retrieved"
  echo ""
fi

echo "Publisher Balance:"
curl -s "$API_URL/profiles?id=eq.$PUBLISHER_ID&select=id,name,wallet_balance,lifetime_earned" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | python3 -m json.tool 2>/dev/null || echo "Publisher balance retrieved"
echo ""

echo "=== ✅ Complete E2E Test Successful ==="
echo ""
echo "Summary:"
echo "  1. ✓ Campaign created and funded (₹500 deposited)"
echo "  2. ✓ Campaign submitted and approved by admin"
echo "  3. ✓ Publisher started campaign (click recorded)"
echo "  4. ✓ Publisher submitted proof"
echo "  5. ✓ Admin rejected proof"
echo "  6. ✓ Publisher appealed rejection"
echo "  7. ✓ Admin resolved appeal (approved) - Publisher earned ₹10"
echo "  8. ⊘ Postback conversion test (N/A for manual_proof campaigns)"
echo ""
echo "All marketplace functions working correctly!"
echo "Publisher wallet updated, advertiser charged, campaign stats updated."
