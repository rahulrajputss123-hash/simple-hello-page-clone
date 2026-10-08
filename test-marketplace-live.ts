/**
 * Live Database Test Script for Marketplace Phase 3-5
 * 
 * This script tests the ACTUAL function signatures against the live Supabase database
 * 
 * Run with: npx tsx test-marketplace-live.ts
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables!");
  console.error("Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("✅ Connected to Supabase:", SUPABASE_URL);
console.log("\n" + "=".repeat(80));
console.log("MARKETPLACE PHASE 3-5 LIVE DATABASE TESTS");
console.log("=".repeat(80) + "\n");

// Test user IDs (you'll need to replace with actual UUIDs from your database)
let TEST_ADVERTISER_ID = "00000000-0000-0000-0000-000000000001";
let TEST_PUBLISHER_ID = "00000000-0000-0000-0000-000000000002";
let TEST_ADMIN_ID = "00000000-0000-0000-0000-000000000003";

// Test IDs that will be created
let createdCampaignId: string;
let createdClickId: string;
let createdSubmissionId: string;
let createdConversionId: string;

async function setupTestUsers() {
  console.log("📝 Setting up test users...\n");

  // Get or create test advertiser
  const { data: advertiser, error: advError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "test-advertiser@cashgpt.test")
    .maybeSingle();

  if (advertiser) {
    TEST_ADVERTISER_ID = advertiser.id;
    console.log("✅ Found test advertiser:", TEST_ADVERTISER_ID);
  } else {
    console.log("⚠️  No test advertiser found. Please create one manually.");
  }

  // Get or create test publisher
  const { data: publisher, error: pubError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "test-publisher@cashgpt.test")
    .maybeSingle();

  if (publisher) {
    TEST_PUBLISHER_ID = publisher.id;
    console.log("✅ Found test publisher:", TEST_PUBLISHER_ID);
  } else {
    console.log("⚠️  No test publisher found. Please create one manually.");
  }

  // Check for admin role
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (admins) {
    TEST_ADMIN_ID = admins.id;
    console.log("✅ Found admin user:", TEST_ADMIN_ID);
  }

  console.log();
}

async function testPhase3_CreateCampaign() {
  console.log("🧪 PHASE 3: Campaign Creation");
  console.log("-".repeat(80));

  try {
    // Test 1: Insert campaign in draft status
    console.log("\n1. Creating campaign (INSERT + mkt_submit_campaign)...");

    const { data: campaign, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        advertiser_id: TEST_ADVERTISER_ID,
        type_key: "microtask",
        name: "Test Campaign - " + new Date().toISOString(),
        summary: "This is a test campaign for Phase 3-5 validation",
        verification_mode: "manual",
        max_completions: 100,
        publisher_reward: 1.0,
        min_seconds_to_convert: 60,
        countries: ["ALL"],
        proof_instructions: "Please upload a screenshot showing you completed the task.",
        status: "draft",
      })
      .select("id, status")
      .single();

    if (insertError) {
      console.error("❌ INSERT failed:", insertError);
      return;
    }

    createdCampaignId = campaign.id;
    console.log(`✅ Campaign created: ${createdCampaignId}, status: ${campaign.status}`);

    // Test 2: Submit for review using mkt_submit_campaign
    console.log("\n2. Submitting campaign for review (mkt_submit_campaign)...");

    const { data: submitResult, error: submitError } = await supabase.rpc(
      "mkt_submit_campaign",
      {
        p_campaign_id: createdCampaignId,
        p_actor: TEST_ADVERTISER_ID,
      }
    );

    if (submitError) {
      console.error("❌ mkt_submit_campaign failed:", submitError);
      return;
    }

    console.log("✅ Campaign submitted:", JSON.stringify(submitResult, null, 2));

    // Test 3: Admin review campaign
    console.log("\n3. Admin reviewing campaign (mkt_review_campaign)...");

    const { data: reviewResult, error: reviewError } = await supabase.rpc(
      "mkt_review_campaign",
      {
        p_campaign_id: createdCampaignId,
        p_admin: TEST_ADMIN_ID,
        p_decision: "approved",
        p_note: "Test approval - looks good!",
      }
    );

    if (reviewError) {
      console.error("❌ mkt_review_campaign failed:", reviewError);
      return;
    }

    console.log("✅ Campaign reviewed:", JSON.stringify(reviewResult, null, 2));

    // Test 4: Add budget
    console.log("\n4. Adding budget (mkt_add_budget)...");

    const { data: budgetResult, error: budgetError } = await supabase.rpc(
      "mkt_add_budget",
      {
        p_campaign_id: createdCampaignId,
        p_actor: TEST_ADVERTISER_ID,
        p_completions: 50,
      }
    );

    if (budgetError) {
      console.error("❌ mkt_add_budget failed:", budgetError);
      console.error("   This might be because advertiser has no deposit balance.");
      console.error("   You may need to add test deposit first.");
    } else {
      console.log("✅ Budget added:", JSON.stringify(budgetResult, null, 2));
    }

    console.log("\n✅ PHASE 3 TESTS COMPLETE\n");
  } catch (error) {
    console.error("❌ Phase 3 test error:", error);
  }
}

async function testPhase4_ManualProof() {
  console.log("🧪 PHASE 4: Manual Proof Submission");
  console.log("-".repeat(80));

  if (!createdCampaignId) {
    console.error("❌ No campaign ID from Phase 3. Skipping Phase 4.");
    return;
  }

  try {
    // Test 1: Publisher starts campaign (mkt_start)
    console.log("\n1. Publisher starting campaign (mkt_start)...");

    const ipHash = crypto
      .createHash("sha256")
      .update("192.168.1.100")
      .digest("hex");

    const { data: startResult, error: startError } = await supabase.rpc("mkt_start", {
      p_campaign_id: createdCampaignId,
      p_user_id: TEST_PUBLISHER_ID, // NOT publisher_id!
      p_meta: {
        ip_hash: ipHash,
        user_agent: "Mozilla/5.0 Test Agent",
        timestamp: new Date().toISOString(),
      },
    });

    if (startError) {
      console.error("❌ mkt_start failed:", startError);
      return;
    }

    createdClickId = startResult.click_id;
    console.log("✅ Click recorded:", JSON.stringify(startResult, null, 2));

    // Test 2: Publisher submits proof (mkt_submit_proof)
    console.log("\n2. Publisher submitting proof (mkt_submit_proof)...");

    const { data: proofResult, error: proofError } = await supabase.rpc(
      "mkt_submit_proof",
      {
        p_click_id: createdClickId,
        p_user_id: TEST_PUBLISHER_ID, // NOT publisher_id!
        p_paths: ["https://example.com/proof1.jpg", "https://example.com/proof2.jpg"], // ARRAY!
        p_fields: { task_completed: true, time_spent: "5 minutes" },
        p_note: "I completed this task successfully. Please review!",
      }
    );

    if (proofError) {
      console.error("❌ mkt_submit_proof failed:", proofError);
      return;
    }

    createdSubmissionId = proofResult.submission_id;
    console.log("✅ Proof submitted:", JSON.stringify(proofResult, null, 2));

    // Test 3: Admin/Advertiser decides on submission (mkt_decide_submission)
    console.log("\n3. Admin deciding on submission (mkt_decide_submission)...");

    const { data: decisionResult, error: decisionError } = await supabase.rpc(
      "mkt_decide_submission",
      {
        p_submission_id: createdSubmissionId,
        p_actor: TEST_ADMIN_ID,
        p_role: "admin",
        p_decision: "rejected", // Test rejection first to test appeal
        p_reason: "The screenshot is not clear enough. Please resubmit with better quality.",
      }
    );

    if (decisionError) {
      console.error("❌ mkt_decide_submission failed:", decisionError);
      return;
    }

    console.log("✅ Submission decided:", JSON.stringify(decisionResult, null, 2));

    // Test 4: Publisher appeals (mkt_appeal)
    console.log("\n4. Publisher appealing rejection (mkt_appeal)...");

    const { data: appealResult, error: appealError } = await supabase.rpc("mkt_appeal", {
      p_submission_id: createdSubmissionId,
      p_user_id: TEST_PUBLISHER_ID, // NOT publisher_id!
      p_text: "I believe my proof was clear. Please review again. The screenshot shows all required elements.",
    });

    if (appealError) {
      console.error("❌ mkt_appeal failed:", appealError);
      return;
    }

    console.log("✅ Appeal submitted:", JSON.stringify(appealResult, null, 2));

    // Test 5: Admin resolves appeal (mkt_resolve_appeal)
    console.log("\n5. Admin resolving appeal (mkt_resolve_appeal)...");

    const { data: resolveResult, error: resolveError } = await supabase.rpc(
      "mkt_resolve_appeal",
      {
        p_submission_id: createdSubmissionId,
        p_admin: TEST_ADMIN_ID,
        p_decision: "approved",
        p_note: "After reviewing again, the proof is acceptable. Approved.",
      }
    );

    if (resolveError) {
      console.error("❌ mkt_resolve_appeal failed:", resolveError);
      return;
    }

    console.log("✅ Appeal resolved:", JSON.stringify(resolveResult, null, 2));

    console.log("\n✅ PHASE 4 TESTS COMPLETE\n");
  } catch (error) {
    console.error("❌ Phase 4 test error:", error);
  }
}

async function testPhase5_AutoConversion() {
  console.log("🧪 PHASE 5: Auto-Conversion Tracking");
  console.log("-".repeat(80));

  if (!createdCampaignId) {
    console.error("❌ No campaign ID. Skipping Phase 5.");
    return;
  }

  try {
    // Create a new auto-mode campaign for conversion testing
    console.log("\n1. Creating auto-conversion campaign...");

    const { data: autoCampaign, error: autoError } = await supabase
      .from("campaigns")
      .insert({
        advertiser_id: TEST_ADVERTISER_ID,
        type_key: "microtask",
        name: "Auto Campaign - " + new Date().toISOString(),
        summary: "Test auto-conversion campaign",
        verification_mode: "auto", // AUTO mode!
        max_completions: 100,
        publisher_reward: 0.5,
        min_seconds_to_convert: 30,
        postback_url: "https://example.com/postback",
        postback_secret: "test_secret_key_12345",
        status: "draft",
      })
      .select("id")
      .single();

    if (autoError) {
      console.error("❌ Auto campaign creation failed:", autoError);
      return;
    }

    const autoCampaignId = autoCampaign.id;
    console.log(`✅ Auto campaign created: ${autoCampaignId}`);

    // Submit and approve campaign
    await supabase.rpc("mkt_submit_campaign", {
      p_campaign_id: autoCampaignId,
      p_actor: TEST_ADVERTISER_ID,
    });

    await supabase.rpc("mkt_review_campaign", {
      p_campaign_id: autoCampaignId,
      p_admin: TEST_ADMIN_ID,
      p_decision: "approved",
      p_note: "Auto-approved for testing",
    });

    // Test 2: Publisher starts auto campaign
    console.log("\n2. Publisher starting auto campaign (mkt_start)...");

    const ipHash2 = crypto
      .createHash("sha256")
      .update("203.0.113.42")
      .digest("hex");

    const { data: autoStart, error: autoStartError } = await supabase.rpc("mkt_start", {
      p_campaign_id: autoCampaignId,
      p_user_id: TEST_PUBLISHER_ID,
      p_meta: {
        ip_hash: ipHash2,
        user_agent: "Auto Test Agent",
      },
    });

    if (autoStartError) {
      console.error("❌ Auto mkt_start failed:", autoStartError);
      return;
    }

    const autoClickId = autoStart.click_id;
    console.log("✅ Auto click recorded:", JSON.stringify(autoStart, null, 2));

    // Test 3: Record conversion (mkt_record_conversion)
    console.log("\n3. Recording conversion (mkt_record_conversion)...");

    const sourceIpHash = crypto
      .createHash("sha256")
      .update("198.51.100.10")
      .digest("hex");

    const { data: conversionResult, error: conversionError } = await supabase.rpc(
      "mkt_record_conversion",
      {
        p_campaign_id: autoCampaignId,
        p_click_id: autoClickId,
        p_external_txn_id: "TXN_" + Date.now(),
        p_meta: {
          signature_valid: true,
          source_ip_hash: sourceIpHash, // NOT raw ip_address!
          raw_payload: {
            amount: 10.0,
            currency: "USD",
            partner_id: "test_partner",
          },
        },
      }
    );

    if (conversionError) {
      console.error("❌ mkt_record_conversion failed:", conversionError);
      return;
    }

    createdConversionId = conversionResult.conversion_id;
    console.log("✅ Conversion recorded:", JSON.stringify(conversionResult, null, 2));

    // If held for review, test admin decision
    if (conversionResult.status === "held_for_review") {
      console.log("\n4. Admin deciding on held conversion (mkt_decide_conversion)...");

      const { data: decideResult, error: decideError } = await supabase.rpc(
        "mkt_decide_conversion",
        {
          p_conversion_id: createdConversionId,
          p_admin: TEST_ADMIN_ID,
          p_decision: "approved",
          p_note: "Looks legitimate, approved.",
        }
      );

      if (decideError) {
        console.error("❌ mkt_decide_conversion failed:", decideError);
      } else {
        console.log("✅ Conversion decided:", JSON.stringify(decideResult, null, 2));
      }
    }

    console.log("\n✅ PHASE 5 TESTS COMPLETE\n");
  } catch (error) {
    console.error("❌ Phase 5 test error:", error);
  }
}

async function cleanup() {
  console.log("🧹 Cleaning up test data...\n");

  if (createdCampaignId) {
    await supabase.from("campaigns").delete().eq("id", createdCampaignId);
    console.log("✅ Deleted test campaign");
  }

  console.log();
}

async function main() {
  await setupTestUsers();
  await testPhase3_CreateCampaign();
  await testPhase4_ManualProof();
  await testPhase5_AutoConversion();

  console.log("=".repeat(80));
  console.log("🎉 ALL TESTS COMPLETE!");
  console.log("=".repeat(80));
  console.log();
  console.log("Summary:");
  console.log(`  Campaign ID: ${createdCampaignId || "N/A"}`);
  console.log(`  Click ID: ${createdClickId || "N/A"}`);
  console.log(`  Submission ID: ${createdSubmissionId || "N/A"}`);
  console.log(`  Conversion ID: ${createdConversionId || "N/A"}`);
  console.log();
  console.log("⚠️  Note: Test data was created in your live database.");
  console.log("   Run cleanup if needed (currently commented out)");
  console.log();

  // Uncomment to cleanup:
  // await cleanup();
}

main().catch(console.error);
