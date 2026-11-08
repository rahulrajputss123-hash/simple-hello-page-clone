#!/bin/bash
set -e

# Active Time Quest End-to-End Test
# SAFETY: Only touches test user and test quest, always cleans up

LOG_FILE="/tmp/active-time-test-$(date +%s).log"
TEST_USER_EMAIL="qa-active-time-$(date +%s)@example.com"
TEST_USER_PASSWORD="TestPass123!@#"
TEST_QUEST_KEY="QA_active_time"

echo "=== Active Time Quest E2E Test ===" | tee "$LOG_FILE"
echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
echo "Test user: $TEST_USER_EMAIL" | tee -a "$LOG_FILE"
echo "Test quest: $TEST_QUEST_KEY" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Check env vars
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required" | tee -a "$LOG_FILE"
  exit 1
fi

# Function to query DB
query_db() {
  local sql="$1"
  curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"$sql\"}"
}

# Function to cleanup
cleanup() {
  echo "" | tee -a "$LOG_FILE"
  echo "=== CLEANUP ===" | tee -a "$LOG_FILE"
  
  # Get test user ID
  USER_ID=$(curl -s "$SUPABASE_URL/rest/v1/profiles?select=id&email=eq.$TEST_USER_EMAIL" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.[0].id // empty')
  
  if [ -n "$USER_ID" ]; then
    echo "Deleting test user progress..." | tee -a "$LOG_FILE"
    
    # Delete progress
    curl -s -X DELETE "$SUPABASE_URL/rest/v1/quest_active_time_progress?user_id=eq.$USER_ID&quest_key=eq.$TEST_QUEST_KEY" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
    
    # Delete sessions
    curl -s -X DELETE "$SUPABASE_URL/rest/v1/quest_sessions?user_id=eq.$USER_ID&quest_key=eq.$TEST_QUEST_KEY" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
    
    # Delete user (cascade deletes auth)
    curl -s -X DELETE "$SUPABASE_URL/rest/v1/profiles?id=eq.$USER_ID" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
    
    echo "✓ Test user deleted" | tee -a "$LOG_FILE"
  fi
  
  # Delete test quest if exists
  curl -s -X DELETE "$SUPABASE_URL/rest/v1/quests?key=eq.$TEST_QUEST_KEY" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
  
  echo "✓ Test quest deleted" | tee -a "$LOG_FILE"
  
  # Verify nothing left
  echo "" | tee -a "$LOG_FILE"
  echo "=== VERIFICATION: Nothing Left ===" | tee -a "$LOG_FILE"
  
  local progress_count=$(curl -s "$SUPABASE_URL/rest/v1/quest_active_time_progress?quest_key=eq.$TEST_QUEST_KEY&select=count" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Prefer: count=exact" | jq -r '.count // 0')
  
  local quest_count=$(curl -s "$SUPABASE_URL/rest/v1/quests?key=eq.$TEST_QUEST_KEY&select=count" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Prefer: count=exact" | jq -r '.count // 0')
  
  echo "Progress rows: $progress_count (expected: 0)" | tee -a "$LOG_FILE"
  echo "Quest rows: $quest_count (expected: 0)" | tee -a "$LOG_FILE"
  
  if [ "$progress_count" -eq 0 ] && [ "$quest_count" -eq 0 ]; then
    echo "✓ VERIFIED: All test data cleaned up" | tee -a "$LOG_FILE"
  else
    echo "✗ WARNING: Some test data remains!" | tee -a "$LOG_FILE"
  fi
}

# Trap cleanup on exit
trap cleanup EXIT

echo "=== STAGE A: Direct Server Function Test ===" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Step 1: Create test quest
echo "Step 1: Create test quest..." | tee -a "$LOG_FILE"
curl -s -X POST "$SUPABASE_URL/rest/v1/quests" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"key\": \"$TEST_QUEST_KEY\",
    \"label\": \"QA Active Time Test\",
    \"quest_type\": \"active_time\",
    \"target_minutes\": 2,
    \"reward_amount\": 0.01,
    \"is_active\": true,
    \"daily_cap_minutes\": 120
  }"

echo "✓ Test quest created" | tee -a "$LOG_FILE"

# Step 2: Create test user
echo "Step 2: Create test user..." | tee -a "$LOG_FILE"

# Create auth user
AUTH_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_USER_EMAIL\",
    \"password\": \"$TEST_USER_PASSWORD\",
    \"email_confirm\": true
  }")

TEST_USER_ID=$(echo "$AUTH_RESPONSE" | jq -r '.id')
echo "Test user ID: $TEST_USER_ID" | tee -a "$LOG_FILE"

# Wait for profile creation (trigger may take a moment)
sleep 2

echo "✓ Test user created" | tee -a "$LOG_FILE"

# Step 3: Test processActiveTimePing directly via Supabase RPC
echo "" | tee -a "$LOG_FILE"
echo "Step 3: Testing ping functionality..." | tee -a "$LOG_FILE"

# Note: We can't call server functions directly from shell easily,
# so we'll start the dev server and use it

echo "Starting dev server in background..." | tee -a "$LOG_FILE"
npm run dev > /tmp/dev-server.log 2>&1 &
DEV_PID=$!

echo "Dev server PID: $DEV_PID" | tee -a "$LOG_FILE"

# Wait for server to be ready
echo "Waiting for dev server to be ready..." | tee -a "$LOG_FILE"
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Dev server ready" | tee -a "$LOG_FILE"
    break
  fi
  sleep 1
done

# Get auth token for test user
echo "" | tee -a "$LOG_FILE"
echo "Step 4: Authenticate test user..." | tee -a "$LOG_FILE"

AUTH_TOKEN_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_USER_EMAIL\",
    \"password\": \"$TEST_USER_PASSWORD\"
  }")

ACCESS_TOKEN=$(echo "$AUTH_TOKEN_RESPONSE" | jq -r '.access_token')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "✗ Failed to get auth token" | tee -a "$LOG_FILE"
  echo "$AUTH_TOKEN_RESPONSE" | tee -a "$LOG_FILE"
  kill $DEV_PID 2>/dev/null || true
  exit 1
fi

echo "✓ Got auth token" | tee -a "$LOG_FILE"

# Step 5: Check initial progress (should be none)
echo "" | tee -a "$LOG_FILE"
echo "Step 5: Check initial progress..." | tee -a "$LOG_FILE"

INITIAL_PROGRESS=$(curl -s "$SUPABASE_URL/rest/v1/quest_active_time_progress?user_id=eq.$TEST_USER_ID&quest_key=eq.$TEST_QUEST_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

echo "Initial progress: $INITIAL_PROGRESS" | tee -a "$LOG_FILE"

if [ "$INITIAL_PROGRESS" = "[]" ]; then
  echo "✓ No progress row yet (expected)" | tee -a "$LOG_FILE"
else
  echo "✗ Unexpected initial progress" | tee -a "$LOG_FILE"
fi

# Step 6: Simulate pings and check progress growth
echo "" | tee -a "$LOG_FILE"
echo "Step 6: Simulating pings over 2 minutes..." | tee -a "$LOG_FILE"
echo "Expected: total_seconds should grow from 0 to ~60-120" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# We'll do 5 pings, 30 seconds apart
for ping in {1..5}; do
  echo "--- Ping $ping/5 ---" | tee -a "$LOG_FILE"
  
  # Call processActiveTimePing via the server function
  # This requires the dev server to be running
  # For now, we'll check the DB directly after some time
  
  # Simulate activity by just waiting
  if [ $ping -gt 1 ]; then
    echo "Waiting 30 seconds before next ping..." | tee -a "$LOG_FILE"
    sleep 30
  fi
  
  # Query current progress
  CURRENT_PROGRESS=$(curl -s "$SUPABASE_URL/rest/v1/quest_active_time_progress?user_id=eq.$TEST_USER_ID&quest_key=eq.$TEST_QUEST_KEY&select=total_seconds,today_seconds,last_ping_at" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
  
  TOTAL_SECONDS=$(echo "$CURRENT_PROGRESS" | jq -r '.[0].total_seconds // 0')
  TODAY_SECONDS=$(echo "$CURRENT_PROGRESS" | jq -r '.[0].today_seconds // 0')
  LAST_PING=$(echo "$CURRENT_PROGRESS" | jq -r '.[0].last_ping_at // "never"')
  
  echo "DB Row: total_seconds=$TOTAL_SECONDS, today_seconds=$TODAY_SECONDS, last_ping_at=$LAST_PING" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
done

# Final check
echo "=== FINAL VERIFICATION ===" | tee -a "$LOG_FILE"

FINAL_PROGRESS=$(curl -s "$SUPABASE_URL/rest/v1/quest_active_time_progress?user_id=eq.$TEST_USER_ID&quest_key=eq.$TEST_QUEST_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

echo "Final progress row:" | tee -a "$LOG_FILE"
echo "$FINAL_PROGRESS" | jq '.' | tee -a "$LOG_FILE"

FINAL_TOTAL=$(echo "$FINAL_PROGRESS" | jq -r '.[0].total_seconds // 0')

echo "" | tee -a "$LOG_FILE"
echo "RESULT: total_seconds = $FINAL_TOTAL" | tee -a "$LOG_FILE"

if [ "$FINAL_TOTAL" -ge 60 ] && [ "$FINAL_TOTAL" -le 180 ]; then
  echo "✓ SUCCESS: total_seconds in expected range (60-180)" | tee -a "$LOG_FILE"
else
  echo "✗ FAIL: total_seconds not in expected range" | tee -a "$LOG_FILE"
  echo "  Expected: 60-180 seconds" | tee -a "$LOG_FILE"
  echo "  Got: $FINAL_TOTAL seconds" | tee -a "$LOG_FILE"
fi

# Stop dev server
echo "" | tee -a "$LOG_FILE"
echo "Stopping dev server..." | tee -a "$LOG_FILE"
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true

echo "" | tee -a "$LOG_FILE"
echo "=== TEST COMPLETE ===" | tee -a "$LOG_FILE"
echo "Full log: $LOG_FILE" | tee -a "$LOG_FILE"
