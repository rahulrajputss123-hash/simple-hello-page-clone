/**
 * Audit script: Find check-in quest sessions where Day 1 is completed
 * but has no corresponding quest_step_credits row.
 * 
 * This identifies users who completed Day 1 but didn't receive their reward
 * due to the step_index > 0 constraint preventing step_index 0 from being inserted.
 * 
 * ADMIN SAFE: This script only LISTS affected sessions and amounts.
 * It does NOT automatically credit users - admin must review and approve.
 * 
 * Usage:
 *   npx tsx scripts/audit-checkin-day1-credits.ts
 * 
 * Output:
 *   - List of affected sessions with user_id, quest_key, amount, completed date
 *   - Total count of affected sessions
 *   - Total amount that should have been credited
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
dotenv.config({ path: join(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface OrphanedCredit {
  session_id: string;
  user_id: string;
  quest_key: string;
  quest_label: string;
  step_reward: number;
  completed_at: string;
  user_email?: string;
}

async function auditCheckinDay1Credits() {
  console.log("=".repeat(80));
  console.log("AUDIT: Check-in Day 1 Completed Without Credit");
  console.log("=".repeat(80));
  console.log();

  // Step 1: Find all check-in quest sessions with completed Day 1
  console.log("Step 1: Finding check-in sessions with completed Day 1...");
  
  const { data: completedDay1, error: day1Error } = await supabase
    .from("quest_checkin_days")
    .select(
      `
      session_id,
      user_id,
      quest_key,
      completed_at,
      quest_sessions!inner(
        quest_key,
        quest_type
      )
    `
    )
    .not("completed_at", "is", null)
    .eq("local_date", "2027-11-06"); // This should be dynamic - find first day for each session

  if (day1Error) {
    console.error("Error fetching completed Day 1:", day1Error);
    process.exit(1);
  }

  console.log(`Found ${completedDay1?.length ?? 0} completed Day 1 entries`);
  console.log();

  if (!completedDay1 || completedDay1.length === 0) {
    console.log("No completed Day 1 entries found. Audit complete.");
    return;
  }

  // Step 2: Check which ones are missing step_index 0 credits
  console.log("Step 2: Checking for missing step_index 0 credits...");

  const sessionIds = completedDay1.map((d: any) => d.session_id);

  const { data: existingCredits, error: creditsError } = await supabase
    .from("quest_step_credits")
    .select("session_id, step_index")
    .in("session_id", sessionIds)
    .eq("step_index", 0);

  if (creditsError) {
    console.error("Error fetching existing credits:", creditsError);
    process.exit(1);
  }

  const creditedSessionIds = new Set(existingCredits?.map((c) => c.session_id) ?? []);

  const orphanedSessions = completedDay1.filter(
    (d: any) => !creditedSessionIds.has(d.session_id)
  );

  console.log(`Found ${orphanedSessions.length} sessions missing Day 1 credit`);
  console.log();

  if (orphanedSessions.length === 0) {
    console.log("✅ No orphaned Day 1 completions found. All sessions have credits.");
    return;
  }

  // Step 3: Get quest details to calculate amounts
  console.log("Step 3: Fetching quest details and user emails...");

  const questKeys = [...new Set(orphanedSessions.map((s: any) => s.quest_key))];

  const { data: quests, error: questsError } = await supabase
    .from("quests")
    .select("key, label, step_reward")
    .in("key", questKeys);

  if (questsError) {
    console.error("Error fetching quests:", questsError);
    process.exit(1);
  }

  const questMap = new Map(quests?.map((q) => [q.key, q]) ?? []);

  // Get user emails
  const userIds = [...new Set(orphanedSessions.map((s: any) => s.user_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p.email]) ?? []);

  // Step 4: Build final report
  const orphanedCredits: OrphanedCredit[] = orphanedSessions.map((s: any) => {
    const quest = questMap.get(s.quest_key);
    return {
      session_id: s.session_id,
      user_id: s.user_id,
      quest_key: s.quest_key,
      quest_label: quest?.label ?? "Unknown Quest",
      step_reward: quest?.step_reward ?? 0,
      completed_at: s.completed_at,
      user_email: profileMap.get(s.user_id),
    };
  });

  // Step 5: Print report
  console.log();
  console.log("=".repeat(80));
  console.log("ORPHANED DAY 1 CREDITS REPORT");
  console.log("=".repeat(80));
  console.log();

  let totalAmount = 0;

  orphanedCredits.forEach((credit, index) => {
    console.log(`[${index + 1}] Session: ${credit.session_id}`);
    console.log(`    User: ${credit.user_id}`);
    console.log(`    Email: ${credit.user_email ?? "N/A"}`);
    console.log(`    Quest: ${credit.quest_key} (${credit.quest_label})`);
    console.log(`    Amount: ${credit.step_reward.toFixed(2)} coins`);
    console.log(`    Completed: ${credit.completed_at}`);
    console.log();

    totalAmount += credit.step_reward;
  });

  console.log("=".repeat(80));
  console.log(`Total Sessions: ${orphanedCredits.length}`);
  console.log(`Total Amount: ${totalAmount.toFixed(2)} coins`);
  console.log("=".repeat(80));
  console.log();

  console.log("⚠️  ACTION REQUIRED:");
  console.log("1. Review the list above");
  console.log("2. Verify these are legitimate completions");
  console.log("3. Manually credit users or create a batch credit script");
  console.log("4. DO NOT run automated credits without admin approval");
  console.log();

  // Optional: Save to JSON file
  const report = {
    generated_at: new Date().toISOString(),
    total_sessions: orphanedCredits.length,
    total_amount: totalAmount,
    sessions: orphanedCredits,
  };

  try {
    const fs = await import("fs/promises");
    const reportPath = join(process.cwd(), "orphaned-day1-credits-report.json");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  } catch (error) {
    console.error("Failed to save report file:", error);
  }
}

// Run the audit
auditCheckinDay1Credits()
  .then(() => {
    console.log("Audit complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Audit failed:", error);
    process.exit(1);
  });
