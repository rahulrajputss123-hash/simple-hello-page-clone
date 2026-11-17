#!/usr/bin/env bash
#
# Wrap ALL 158 server functions with withServerTiming()
# This script automates the wrapping process for consistency
#

set -e

# Files to wrap
FILES=(
  "src/lib/quests.functions.ts"
  "src/lib/offers.functions.ts"
  "src/lib/marketplace.functions.ts"
  "src/lib/analytics/analytics.functions.ts"
  "src/lib/coinquest.functions.ts"
  "src/lib/tasks.functions.ts"
  "src/lib/sdk-offerwall.functions.ts"
  "src/lib/automation.functions.ts"
  "src/lib/assistant.functions.ts"
  "src/lib/offers/torox.functions.ts"
)

echo "Starting to wrap all server functions..."
echo "Target files: ${#FILES[@]}"

# For each file, we need to:
# 1. Add import if missing
# 2. Wrap each .handler(async (...) => { with .handler(withServerTiming("fnName", async (...) => {

for file in "${FILES[@]}"; do
  echo "Processing $file..."
  
  # Check if import exists
  if ! grep -q "withServerTiming" "$file"; then
    echo "  Adding withServerTiming import..."
    # Find the line with requireSupabaseAuth import and add after it
    sed -i '/from "@\/integrations\/supabase\/auth-middleware"/a import { withServerTiming } from "@/lib/server-timing-middleware";' "$file"
  fi
done

echo "✅ Imports added. Manual wrapping of handlers required due to complexity."
echo "Total functions to wrap: 158"
echo "Already wrapped: 6 (trackOfferClick, getFeaturedFeed, getOfferById, pingActiveTime, listActiveCampaigns, submitProofForCampaign)"
echo "Remaining: 152"
