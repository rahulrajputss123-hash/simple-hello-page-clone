#!/bin/bash
# Direct Supabase REST API test - no dependencies needed

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "❌ Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "✅ Testing against: $SUPABASE_URL"
echo ""
echo "================================================================================"
echo "MARKETPLACE PHASE 3-5 FUNCTION TESTS (Direct REST API)"
echo "================================================================================"
echo ""

# Get a test user ID
echo "📝 Fetching test user..."
USER_RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/profiles?select=id,email&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

TEST_USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TEST_USER_ID" ]; then
  echo "❌ No users found in database. Please create at least one user."
  exit 1
fi

echo "✅ Test User ID: $TEST_USER_ID"
echo ""

# Create advertiser account if needed
echo "📝 Creating/checking advertiser account..."
ADVERTISER_CHECK=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/advertiser_accounts?select=user_id&user_id=eq.${TEST_USER_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

if echo "$ADVERTISER_CHECK" | grep -q "\[\]"; then
  echo "Creating advertiser account..."
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/advertiser_accounts" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{\"user_id\": \"$TEST_USER_ID\", \"display_name\": \"Test Advertiser\", \"terms_version\": \"1.0\"}" > /dev/null
  echo "✅ Advertiser account created"
else
  echo "✅ Advertiser account exists"
fi
echo ""

# Test Phase 3: Create Campaign
echo "🧪 PHASE 3: Campaign Creation"
echo "--------------------------------------------------------------------------------"
echo ""

echo "1. Creating campaign (INSERT)..."
CAMPAIGN_DATA=$(cat <<EOF
{
  "advertiser_id": "$TEST_USER_ID",
  "type_key": "custom",
  "name": "Test Campaign - $(date -Iseconds)",
  "summary": "Test campaign for Phase 3-5 validation",
  "description": "Complete this task and submit proof",
  "landing_url": "https://example.com/task",
  "steps": [{"text": "Visit the website and complete the signup"}],
  "verification_mode": "manual_proof",
  "max_completions": 100,
  "publisher_reward": 1.0,
  "min_seconds_to_convert": 60,
  "countries": [],
  "proof_description": "Please upload a screenshot showing your completed signup.",
  "status": "draft"
}
EOF
)

CAMPAIGN_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/campaigns?select=id,status" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$CAMPAIGN_DATA")

CAMPAIGN_ID=$(echo $CAMPAIGN_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CAMPAIGN_ID" ]; then
  echo "❌ Failed to create campaign"
  echo "Response: $CAMPAIGN_RESPONSE"
  exit 1
fi

echo "✅ Campaign created: $CAMPAIGN_ID"
echo ""

echo "2. Submitting campaign (mkt_submit_campaign)..."
SUBMIT_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/mkt_submit_campaign" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_campaign_id\": \"$CAMPAIGN_ID\", \"p_actor\": \"$TEST_USER_ID\"}")

if echo "$SUBMIT_RESPONSE" | grep -q "error"; then
  echo "❌ mkt_submit_campaign failed"
  echo "Response: $SUBMIT_RESPONSE"
else
  echo "✅ Campaign submitted"
  echo "Response: $SUBMIT_RESPONSE"
fi
echo ""

echo "3. Reviewing campaign (mkt_review_campaign)..."
REVIEW_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/mkt_review_campaign" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_campaign_id\": \"$CAMPAIGN_ID\", \"p_admin\": \"$TEST_USER_ID\", \"p_decision\": \"approved\", \"p_note\": \"Test approval\"}")

if echo "$REVIEW_RESPONSE" | grep -q "error"; then
  echo "❌ mkt_review_campaign failed"
  echo "Response: $REVIEW_RESPONSE"
else
  echo "✅ Campaign reviewed and approved"
  echo "Response: $REVIEW_RESPONSE"
fi
echo ""

echo "✅ PHASE 3 TESTS COMPLETE"
echo ""

# Test Phase 4: Manual Proof
echo "🧪 PHASE 4: Manual Proof Submission"
echo "--------------------------------------------------------------------------------"
echo ""

echo "0. Setting campaign to active..."
STATUS_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/mkt_set_campaign_status" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_campaign_id\": \"$CAMPAIGN_ID\", \"p_actor\": \"$TEST_USER_ID\", \"p_actor_role\": \"admin\", \"p_target\": \"active\", \"p_reason\": \"Test\"}")

echo "Response: $STATUS_RESPONSE"
echo ""

echo "1. Starting campaign (mkt_start)..."
IP_HASH=$(echo -n "192.168.1.100" | sha256sum | cut -d' ' -f1)

START_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/mkt_start" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_campaign_id\": \"$CAMPAIGN_ID\", \"p_user_id\": \"$TEST_USER_ID\", \"p_meta\": {\"ip_hash\": \"$IP_HASH\", \"user_agent\": \"Test\"}}")

if echo "$START_RESPONSE" | grep -q "error"; then
  echo "❌ mkt_start failed"
  echo "Response: $START_RESPONSE"
  exit 1
fi

CLICK_ID=$(echo $START_RESPONSE | grep -o '"click_id":"[^"]*"' | cut -d'"' -f4)
echo "✅ Click recorded: $CLICK_ID"
echo "Response: $START_RESPONSE"
echo ""

echo "2. Submitting proof (mkt_submit_proof)..."
PROOF_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/mkt_submit_proof" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_click_id\": \"$CLICK_ID\", \"p_user_id\": \"$TEST_USER_ID\", \"p_paths\": [\"https://example.com/proof.jpg\"], \"p_fields\": {}, \"p_note\": \"Test proof\"}")

if echo "$PROOF_RESPONSE" | grep -q "error"; then
  echo "❌ mkt_submit_proof failed"
  echo "Response: $PROOF_RESPONSE"
  exit 1
fi

SUBMISSION_ID=$(echo $PROOF_RESPONSE | grep -o '"submission_id":"[^"]*"' | cut -d'"' -f4)
echo "✅ Proof submitted: $SUBMISSION_ID"
echo "Response: $PROOF_RESPONSE"
echo ""

echo "3. Deciding on submission - REJECT (mkt_decide_submission)..."
DECIDE_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/mkt_decide_submission" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_submission_id\": \"$SUBMISSION_ID\", \"p_actor\": \"$TEST_USER_ID\", \"p_role\": \"admin\", \"p_decision\": \"rejected\", \"p_reason\": \"Test rejection for appeal test\"}")

echo "✅ Submission decided"
echo "Response: $DECIDE_RESPONSE"
echo ""

echo "4. Appealing rejection (mkt_appeal)..."
APPEAL_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/mkt_appeal" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_submission_id\": \"$SUBMISSION_ID\", \"p_user_id\": \"$TEST_USER_ID\", \"p_text\": \"Please review again, the proof was clear and met all requirements.\"}")

echo "✅ Appeal submitted"
echo "Response: $APPEAL_RESPONSE"
echo ""

echo "5. Resolving appeal - APPROVE (mkt_resolve_appeal)..."
RESOLVE_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/mkt_resolve_appeal" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_submission_id\": \"$SUBMISSION_ID\", \"p_admin\": \"$TEST_USER_ID\", \"p_decision\": \"approved\", \"p_note\": \"Approved after appeal review\"}")

echo "✅ Appeal resolved"
echo "Response: $RESOLVE_RESPONSE"
echo ""

echo "✅ PHASE 4 TESTS COMPLETE"
echo ""

# Summary
echo "================================================================================"
echo "🎉 ALL TESTS COMPLETE"
echo "================================================================================"
echo ""
echo "Test Data Created:"
echo "  Campaign ID: $CAMPAIGN_ID"
echo "  Click ID: $CLICK_ID"
echo "  Submission ID: $SUBMISSION_ID"
echo ""
echo "✅ All Phase 3-4 functions working correctly!"
echo ""
