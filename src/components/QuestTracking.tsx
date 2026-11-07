import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTimeTracking } from "@/hooks/useActiveTimeTracking";
import { useCheckinHeartbeat } from "@/hooks/useCheckinHeartbeat";
import { getActiveTimeQuestKey, updateUserTimezone } from "@/lib/quests.functions";
import { ActiveTimeStillHereDialog } from "@/components/ActiveTimeStillHereDialog";
import { toast } from "sonner";

/**
 * Global quest tracking component that mounts tracking hooks for:
 * - Active Time quests (pings every 30s while user is active)
 * - Check-in quests (pings for daily active time requirement)
 * 
 * Automatically:
 * - Starts tracking when user has an active quest
 * - Stops when quest is completed
 * - Updates browser timezone on mount
 * - Shows "still here?" prompts for active time
 * - Shows toast notifications on quest completion
 * 
 * Mount this component once in the authenticated app layout.
 */
export function QuestTracking() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const fetchActiveTimeKey = useServerFn(getActiveTimeQuestKey);
  const setTimezone = useServerFn(updateUserTimezone);

  console.log("[QuestTracking] Component mounted - tracking hooks active");

  // Detect and update browser timezone on first load
  useEffect(() => {
    if (!session) return;

    const detectAndUpdateTimezone = async () => {
      try {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserTimezone) {
          console.log("[QuestTracking] Updating user timezone to:", browserTimezone);
          await setTimezone({ timezone: browserTimezone });
        }
      } catch (err) {
        console.error("[QuestTracking] Failed to detect/update timezone:", err);
      }
    };

    detectAndUpdateTimezone();
  }, [session?.user.id]);

  // Get active time quest key if user has one in progress
  const activeTimeQuestKey = useQuery({
    queryKey: ["active-time-quest-key", session?.user.id],
    enabled: Boolean(session),
    queryFn: () => fetchActiveTimeKey({}),
    staleTime: 30_000, // Cache for 30s
    refetchInterval: 60_000, // Re-check every minute
    select: (data) => data.questKey,
  });

  // Log when active time quest is found
  useEffect(() => {
    if (activeTimeQuestKey.data) {
      console.log("[QuestTracking] Active time quest found for user:", activeTimeQuestKey.data);
    }
  }, [activeTimeQuestKey.data]);

  // Get initial token from active time progress
  const activeTimeProgress = useQuery({
    queryKey: ["active-time-progress", activeTimeQuestKey.data],
    enabled: Boolean(activeTimeQuestKey.data),
    queryFn: async () => {
      if (!activeTimeQuestKey.data) return null;
      const { data } = await supabase
        .from("quest_active_time_progress")
        .select("ping_token, total_seconds, today_seconds")
        .eq("user_id", session!.user.id)
        .eq("quest_key", activeTimeQuestKey.data)
        .maybeSingle();
      console.log("[QuestTracking] Active time progress fetched:", data);
      return data;
    },
    staleTime: 10_000,
  });

  // Get active check-in quests
  const checkinQuests = useQuery({
    queryKey: ["checkin-quests", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      // Find check-in quest sessions with incomplete days
      const { data: sessions } = await supabase
        .from("quest_sessions")
        .select(
          `
          quest_key,
          checkin_days:quest_checkin_days!inner(local_date, active_seconds, completed_at)
        `,
        )
        .eq("user_id", session!.user.id)
        .eq("quest_type", "checkin")
        .order("started_at", { ascending: false });

      // Find sessions with at least one incomplete day
      return (
        sessions
          ?.filter((s: any) => {
            const days = s.checkin_days || [];
            return days.some((d: any) => !d.completed_at);
          })
          .map((s: any) => ({
            questKey: s.quest_key,
            incompleteDay: s.checkin_days.find((d: any) => !d.completed_at),
          })) || []
      );
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Mount active time tracking
  const activeTimeTracking = useActiveTimeTracking(
    activeTimeQuestKey.data || null,
    activeTimeProgress.data?.ping_token || null,
  );

  // Auto-start active time tracking when quest becomes active
  useEffect(() => {
    if (activeTimeQuestKey.data && !activeTimeTracking.isTracking) {
      console.log("[QuestTracking] Starting active time tracking for:", activeTimeQuestKey.data);
      activeTimeTracking.startTracking();
    } else if (!activeTimeQuestKey.data && activeTimeTracking.isTracking) {
      console.log("[QuestTracking] Stopping active time tracking");
      activeTimeTracking.stopTracking();
    }
  }, [activeTimeQuestKey.data]);

  // Log active time tracking state changes
  useEffect(() => {
    if (activeTimeTracking.isTracking) {
      console.log("[QuestTracking] Active time tracking state:", {
        isTracking: activeTimeTracking.isTracking,
        isPaused: activeTimeTracking.isPaused,
        showStillHerePrompt: activeTimeTracking.showStillHerePrompt,
        lastPingAt: activeTimeTracking.lastPingAt,
        error: activeTimeTracking.error,
      });
    }
  }, [
    activeTimeTracking.isTracking,
    activeTimeTracking.isPaused,
    activeTimeTracking.showStillHerePrompt,
    activeTimeTracking.lastPingAt,
  ]);

  // Mount check-in heartbeat for first incomplete day
  const firstCheckinQuest = checkinQuests.data?.[0];
  const checkinHeartbeat = useCheckinHeartbeat({
    questKey: firstCheckinQuest?.questKey || "",
    enabled: Boolean(firstCheckinQuest),
    onDayComplete: (data) => {
      console.log("[QuestTracking] Check-in day completed:", data);
      toast.success(
        data.stepReward
          ? `🎉 Check-in Day Complete! You earned ${data.stepReward} coins!`
          : "🎉 Check-in Day Complete! Keep your streak going!",
      );
      // Refresh sessions and profile
      void queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
      void queryClient.invalidateQueries({ queryKey: ["checkin-quests", session?.user.id] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // Log check-in heartbeat state
  useEffect(() => {
    if (firstCheckinQuest) {
      console.log("[QuestTracking] Check-in heartbeat state:", {
        questKey: firstCheckinQuest.questKey,
        activeSeconds: checkinHeartbeat.activeSeconds,
        requiredSeconds: checkinHeartbeat.requiredSeconds,
        isPinging: checkinHeartbeat.isPinging,
      });
    }
  }, [
    firstCheckinQuest?.questKey,
    checkinHeartbeat.activeSeconds,
    checkinHeartbeat.requiredSeconds,
    checkinHeartbeat.isPinging,
  ]);

  // Show "Still here?" dialog for active time
  return (
    <>
      {activeTimeTracking.showStillHerePrompt && (
        <ActiveTimeStillHereDialog
          open={activeTimeTracking.showStillHerePrompt}
          onConfirm={activeTimeTracking.confirmStillHere}
        />
      )}
    </>
  );
}
