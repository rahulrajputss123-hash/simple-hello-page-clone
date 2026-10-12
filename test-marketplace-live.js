/**
 * Live Database Test Script for Marketplace Phase 3-5
 * Plain JavaScript version - no TypeScript compilation needed
 * 
 * Run with: node test-marketplace-live.js
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env file
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables!");
  console.error("Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nFound env vars:", Object.keys(process.env).filter(k => k.includes("SUPABASE")));
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

// Test user IDs - will be fetched from database
let TEST_ADVERTISER_ID = null;
let TEST_PUBLISHER_ID = null;
let TEST_ADMIN_ID = null;

// Test IDs that will be created
let createdCampaignId;
let createdClickId;
let createdSubmissionId;
let createdConversionId;
let autoCampaignId;
let autoClickId;

async function setupTestUsers() {
  console.log("📝 Setting up test users...\n");

  // Get any user from profiles to use as advertiser
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .limit(3);

  if (error || !users || users.length === 0) {
    console.error("❌ Failed to fetch users:", error?.message);
    console.error("⚠️  Please ensure you have at least one user in the profiles table");
    process.exit(1);
  }

  // Assign roles
  TEST_ADVERTISER_ID = users[0].id;
  TEST_PUBLISHER_ID = users.length > 1 ? users[1].id : users[0].id;
  TEST_ADMIN_ID = users.find(u => u.role === "admin")?.id || users[0].id;

  console.log("✅ Test Advertiser:", TEST_ADVERTISER_ID, users[0].email);
  console.log("✅ Test Publisher:", TEST_PUBLISHER_ID, users.length > 1 ? users[1].email : users[0].email);
  console.log("✅ Test Admin:", TEST_ADMIN_ID);
  console.log();
}

async function testPhase3_CreateCampaign() {
  console.log("🧪 PHASE 3: Campaign Creation");
  console.log("-".repeat(80));

  try {
    // Test 1: Insert campaign in draft status
    console.log("\n1. Creating campaign (INSERT)...");

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
      console.error("❌ INSERT failed:", insertError.message);
      return false;
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
      console.error("❌ mkt_submit_campaign failed:", submitError.message);
      return false;
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
      console.error("❌ mkt_review_campaign failed:", reviewError.message);
      return false;
    }

    console.log("✅ Campaign reviewed:", JSON.stringify(reviewResult, null, 2));

    console.log("\n✅ PHASE 3 TESTS PASSED\n");
    return true;
  } catch (error) {
    console.error("❌ Phase 3 test error:", error.message);
    return false;
  }
}

async function testPhase4_ManualProof() {
  console.log("🧪 PHASE 4: Manual Proof Submission");
  console.log("-".repeat(80));

  if (!createdCampaignId) {
    console.error("❌ No campaign ID from Phase 3. Skipping Phase 4.");
    return false;
  }

  try {
    // Make campaign active by setting status
    console.log("\n0. Setting campaign to active...");
    await supabase.rpc("mkt_set_campaign_status", {
      p_campaign_id: createdCampaignId,
      p_actor: TEST_ADMIN_ID,
      p_actor_role: "admin",
      p_target: "active",
      p_reason: "Test activation",
    });

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
      console.error("❌ mkt_start failed:", startError.message);
      return false;
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
      console.error("❌ mkt_submit_proof failed:", proofError.message);
      return false;
    }

    createdSubmissionId = proofResult.submission_id;
    console.log("✅ Proof submitted:", JSON.stringify(proofResult, null, 2));

    // Test 3: Admin/Advertiser decides on submission (mkt_decide_submission)
    console.log("\n3. Admin deciding on submission - REJECTING (mkt_decide_submission)...");

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
      console.error("❌ mkt_decide_submission failed:", decisionError.message);
      return false;
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
      console.error("❌ mkt_appeal failed:", appealError.message);
      return false;
    }

    console.log("✅ Appeal submitted:", JSON.stringify(appealResult, null, 2));

    // Test 5: Admin resolves appeal (mkt_resolve_appeal)
    console.log("\n5. Admin resolving appeal - APPROVING (mkt_resolve_appeal)...");

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
      console.error("❌ mkt_resolve_appeal failed:", resolveError.message);
      return false;
    }

    console.log("✅ Appeal resolved:", JSON.stringify(resolveResult, null, 2));

    console.log("\n✅ PHASE 4 TESTS PASSED\n");
    return true;
  } catch (error) {
    console.error("❌ Phase 4 test error:", error.message);
    return false;
  }
}

async function testPhase5_AutoConversion() {
  console.log("🧪 PHASE 5: Auto-Conversion Tracking");
  console.log("-".repeat(80));

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
        min_seconds_to_convert: 5, // Short for testing
        postback_url: "https://example.com/postback",
        postback_secret: "test_secret_key_12345",
        status: "draft",
      })
      .select("id")
      .single();

    if (autoError) {
      console.error("❌ Auto campaign creation failed:", autoError.message);
      return false;
    }

    autoCampaignId = autoCampaign.id;
    console.log(`✅ Auto campaign created: ${autoCampaignId}`);

    // Submit and approve campaign
    console.log("\n2. Submitting and approving auto campaign...");
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

    // Set to active
    await supabase.rpc("mkt_set_campaign_status", {
      p_campaign_id: autoCampaignId,
      p_actor: TEST_ADMIN_ID,
      p_actor_role: "admin",
      p_target: "active",
      p_reason: "Test activation",
    });

    console.log("✅ Auto campaign approved and activated");

    // Test 3: Publisher starts auto campaign
    console.log("\n3. Publisher starting auto campaign (mkt_start)...");

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
      console.error("❌ Auto mkt_start failed:", autoStartError.message);
      return false;
    }

    autoClickId = autoStart.click_id;
    console.log("✅ Auto click recorded:", JSON.stringify(autoStart, null, 2));

    // Wait for min_seconds_to_convert to pass
    console.log("\n4. Waiting 6 seconds (to pass min_seconds_to_convert)...");
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Test 4: Record conversion (mkt_record_conversion)
    console.log("\n5. Recording conversion (mkt_record_conversion)...");

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
      console.error("❌ mkt_record_conversion failed:", conversionError.message);
      return false;
    }

    createdConversionId = conversionResult.conversion_id;
    console.log("✅ Conversion recorded:", JSON.stringify(conversionResult, null, 2));

    // If held for review, test admin decision
    if (conversionResult.status === "held_for_review") {
      console.log("\n6. Admin deciding on held conversion (mkt_decide_conversion)...");

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
        console.error("❌ mkt_decide_conversion failed:", decideError.message);
      } else {
        console.log("✅ Conversion decided:", JSON.stringify(decideResult, null, 2));
      }
    }

    console.log("\n✅ PHASE 5 TESTS PASSED\n");
    return true;
  } catch (error) {
    console.error("❌ Phase 5 test error:", error.message);
    return false;
  }
}

async function main() {
  try {
    await setupTestUsers();
    
    const phase3Pass = await testPhase3_CreateCampaign();
    const phase4Pass = await testPhase4_ManualProof();
    const phase5Pass = await testPhase5_AutoConversion();

    console.log("=".repeat(80));
    console.log("🎉 TEST RESULTS");
    console.log("=".repeat(80));
    console.log();
    console.log(`Phase 3 (Campaign Creation): ${phase3Pass ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Phase 4 (Manual Proof): ${phase4Pass ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Phase 5 (Auto Conversion): ${phase5Pass ? "✅ PASS" : "❌ FAIL"}`);
    console.log();
    console.log("Test Data Created:");
    console.log(`  Campaign ID: ${createdCampaignId || "N/A"}`);
    console.log(`  Click ID: ${createdClickId || "N/A"}`);
    console.log(`  Submission ID: ${createdSubmissionId || "N/A"}`);
    console.log(`  Conversion ID: ${createdConversionId || "N/A"}`);
    console.log();

    if (phase3Pass && phase4Pass && phase5Pass) {
      console.log("✅ ALL TESTS PASSED - Functions are working correctly!");
      process.exit(0);
    } else {
      console.log("❌ SOME TESTS FAILED - Review errors above");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
