/**
 * Verification script for network quest progress fix
 * Tests session b506c638-d088-4c3f-bfeb-656ca83bb7c6 with completion in quest_network_completions
 */

import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY;

describe.skipIf(shouldSkip)("Network Quest Progress Fix", () => {
  it("should show correct progress from current_step after postback", async () => {
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const sessionId = "b506c638-d088-4c3f-bfeb-656ca83bb7c6";

    // Verify completion exists
    const { data: completions } = await supabaseAdmin
      .from("quest_network_completions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("kind", "network");

    console.log("Completions found:", completions?.length || 0);
    expect(completions).not.toBeNull();
    expect(completions?.length).toBeGreaterThan(0);

    // Check quest_sessions.current_step
    const { data: session } = await supabaseAdmin
      .from("quest_sessions")
      .select("current_step, user_id, quest_key")
      .eq("id", sessionId)
      .single();

    console.log("Session current_step:", session?.current_step);
    console.log("Session quest_key:", session?.quest_key);
    console.log("Session user_id:", session?.user_id);

    expect(session).not.toBeNull();
    expect(session?.current_step).toBe(completions?.length || 0);

    // Use the actual getNetworkQuestProgressImpl function
    const { getNetworkQuestProgressImpl } = await import("./src/lib/quests.server");
    
    if (session?.user_id && session?.quest_key) {
      const progress = await getNetworkQuestProgressImpl(session.user_id, session.quest_key);
      
      console.log("Progress returned:", {
        done: progress?.done,
        required: progress?.required,
        providers: progress?.providers?.length,
      });

      expect(progress).not.toBeNull();
      expect(progress?.done).toBe(completions?.length || 0);
      expect(progress?.required).toBe(3); // Default for Network quest
    }
  });
});
