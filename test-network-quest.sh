#!/bin/bash
# Network Chain Quest Manual Testing Script
# Run this after the build environment is resolved

set -e

echo "===================================="
echo "Network Chain Quest Testing Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    ((TESTS_FAILED++))
  fi
}

echo "Prerequisites:"
echo "1. Database is up and migration 20270809000000_network_quest_type.sql is applied"
echo "2. At least 3 SDK offerwall providers are enabled in admin"
echo "3. You have admin access and a test user account"
echo ""
read -p "Press Enter to continue or Ctrl+C to exit..."

echo ""
echo "=== TEST 1: Admin Quest Creation ==="
echo "Steps:"
echo "1. Open admin panel (/admin/quests)"
echo "2. Click 'Network' quest type button"
echo "3. Fill in:"
echo "   - Quest Key: test_network_quest"
echo "   - Label: Test Network Quest"
echo "   - Network Provider IDs: [paste 3-5 provider UUIDs comma-separated]"
echo "   - Required Count: 3"
echo "   - Step Reward: 0.50"
echo "   - Final Bonus: 1.00"
echo "   - Min Qualifying USD: 0.01"
echo "4. Save quest"
echo ""
read -p "Did the quest save successfully? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Admin can create network quest" || test_result 1 "Admin quest creation"

echo ""
echo "=== TEST 2: Quest Token Generation ==="
echo "Steps:"
echo "1. Login as test user"
echo "2. Navigate to quest (/quests/test_network_quest)"
echo "3. Open browser DevTools Network tab"
echo "4. Click on first provider tile"
echo "5. Check console/network for openQuestNetwork call"
echo "6. Verify returned URL contains user_id starting with 'q_'"
echo ""
read -p "Does the URL contain a quest token (q_...)? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Quest token generation works" || test_result 1 "Quest token generation"

echo ""
echo "=== TEST 3: First Network Completion ==="
echo "Steps:"
echo "1. Complete an offer in the first provider (>= \$0.01 payout)"
echo "2. Trigger postback (or wait for provider to send it)"
echo "3. Check database: SELECT * FROM sdk_offerwall_conversions WHERE status='quest_absorbed' ORDER BY created_at DESC LIMIT 1;"
echo "4. Check: SELECT * FROM quest_network_completions WHERE session_id IN (SELECT id FROM quest_sessions WHERE quest_key='test_network_quest' AND user_id='[YOUR_USER_ID]');"
echo "5. Check: SELECT * FROM quest_step_credits WHERE session_id IN (...);"
echo "6. Check user wallet: should have +0.50 from step reward"
echo ""
read -p "Did the completion record with step_index=1 and step reward credited? (y/n): " result
[ "$result" = "y" ] && test_result 0 "First network completion pays step reward" || test_result 1 "First network completion"

echo ""
echo "=== TEST 4: Second Network Completion ==="
echo "Steps:"
echo "1. Go back to quest dialog"
echo "2. First provider tile should show 'done'"
echo "3. Click second provider tile (different from first)"
echo "4. Complete another offer (>= \$0.01)"
echo "5. Check database for step_index=2 in quest_network_completions"
echo "6. Check wallet for +0.50 credit"
echo ""
read -p "Did the second network count and pay step reward? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Second network completion works" || test_result 1 "Second network completion"

echo ""
echo "=== TEST 5: Same Provider Twice (Should Count Once) ==="
echo "Steps:"
echo "1. Complete another offer in first provider (that was already completed)"
echo "2. Check quest_network_completions: should NOT insert duplicate row"
echo "3. Check quest_step_credits: should NOT have duplicate step for same provider"
echo "4. User wallet should NOT receive another step reward"
echo ""
read -p "Was duplicate completion prevented? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Same provider twice counts only once" || test_result 1 "Duplicate prevention"

echo ""
echo "=== TEST 6: Below Min USD (Should Not Count) ==="
echo "Steps:"
echo "1. Click third provider tile (not yet completed)"
echo "2. Complete a PTC task with payout < \$0.01 (e.g., \$0.001)"
echo "3. Check quest_network_completions: should NOT insert row"
echo "4. User wallet should NOT receive step reward"
echo ""
read -p "Was low-payout offer rejected? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Below min USD does not count" || test_result 1 "Min USD threshold"

echo ""
echo "=== TEST 7: Third Network Completion & Quest Finish ==="
echo "Steps:"
echo "1. Complete a qualifying offer in third provider (>= \$0.01)"
echo "2. Check quest_network_completions: step_index=3"
echo "3. Check wallet: +0.50 for step reward"
echo "4. Check quest_sessions: status should change to 'completed'"
echo "5. Check wallet: +1.00 for final bonus"
echo "6. Quest card should show 'Completed' badge"
echo ""
read -p "Did the quest complete and pay final bonus? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Quest completion pays final bonus" || test_result 1 "Quest completion"

echo ""
echo "=== TEST 8: Invalid Token (Should Reject) ==="
echo "Steps:"
echo "1. Manually craft a postback with user_id='q_invalid_token_123456'"
echo "2. Send to postback handler"
echo "3. Check logs/response: should reject with 'invalid token' or similar"
echo "4. No database records should be created"
echo ""
read -p "Was invalid token rejected? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Invalid token rejected" || test_result 1 "Invalid token handling"

echo ""
echo "=== TEST 9: Expired Token (Should Reject) ==="
echo "Steps:"
echo "1. Find a quest token in quest_network_tokens table"
echo "2. UPDATE quest_network_tokens SET expires_at = NOW() - INTERVAL '1 hour' WHERE token='[TOKEN]';"
echo "3. Send postback with expired token"
echo "4. Should reject with 'token expired' message"
echo ""
read -p "Was expired token rejected? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Expired token rejected" || test_result 1 "Token expiry"

echo ""
echo "=== TEST 10: Normal Postback Unchanged ==="
echo "Steps:"
echo "1. Open offerwall from main Offerwall section (NOT from quest)"
echo "2. Complete an offer"
echo "3. Check sdk_offerwall_conversions: status should be 'pending' then 'confirmed'"
echo "4. Check wallet: should credit offer payout amount"
echo "5. Check offerwall_earning events: should exist for milestone tracking"
echo "6. This should work EXACTLY as before Network Quest feature"
echo ""
read -p "Do normal postbacks still work unchanged? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Normal postbacks unchanged" || test_result 1 "Normal postback flow"

echo ""
echo "=== TEST 11: Duplicate/Replay Protection ==="
echo "Steps:"
echo "1. Take a successful quest postback request (from TEST 3)"
echo "2. Send the EXACT same postback again"
echo "3. Should detect duplicate and not double-credit"
echo "4. Check quest_step_credits: should have only one entry per (session_id, provider_id)"
echo ""
read -p "Was duplicate postback prevented? (y/n): " result
[ "$result" = "y" ] && test_result 0 "Duplicate postback prevented" || test_result 1 "Replay protection"

echo ""
echo "===================================="
echo "Test Results Summary"
echo "===================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! Network Chain Quest is working correctly.${NC}"
  exit 0
else
  echo -e "${YELLOW}Some tests failed. Review the implementation.${NC}"
  exit 1
fi
