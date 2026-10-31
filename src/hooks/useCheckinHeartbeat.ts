import { useEffect, useRef, useState } from 'react';
import { pingActiveTime } from '@/lib/quests.functions';
import { toast } from 'sonner';

interface UseCheckinHeartbeatOptions {
  questKey: string;
  enabled: boolean; // Only run when quest is active and day is incomplete
  onDayComplete?: (data: { stepReward?: number }) => void;
}

interface HeartbeatState {
  activeSeconds: number;
  requiredSeconds: number;
  isPinging: boolean;
}

/**
 * Hook that sends active time pings every 30 seconds while the user is visible and focused.
 * Only runs when enabled=true (quest active, day incomplete).
 * Stops automatically when day completes.
 */
export function useCheckinHeartbeat({
  questKey,
  enabled,
  onDayComplete,
}: UseCheckinHeartbeatOptions) {
  const [state, setState] = useState<HeartbeatState>({
    activeSeconds: 0,
    requiredSeconds: 0,
    isPinging: false,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);
  const isFocusedRef = useRef(true);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track window focus
  useEffect(() => {
    const handleFocus = () => {
      isFocusedRef.current = true;
    };
    const handleBlur = () => {
      isFocusedRef.current = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Ping function
  const sendPing = async () => {
    // Only ping if visible, focused, and enabled
    if (!isVisibleRef.current || !isFocusedRef.current || !enabled) {
      return;
    }

    setState((prev) => ({ ...prev, isPinging: true }));

    try {
      const result = await pingActiveTime({ questKey });

      if (!result.success) {
        console.warn('[Checkin Heartbeat] Ping failed:', result.error);
        setState((prev) => ({ ...prev, isPinging: false }));
        return;
      }

      const { dayCompleted, activeSeconds, requiredSeconds, stepReward } = result.data;

      setState({
        activeSeconds: activeSeconds ?? 0,
        requiredSeconds: requiredSeconds ?? 0,
        isPinging: false,
      });

      if (dayCompleted) {
        // Day just completed!
        onDayComplete?.({ stepReward });
        
        // Show success toast
        toast.success(
          stepReward
            ? `🎉 Day Complete! You earned ${stepReward} coins! Keep your streak going.`
            : '🎉 Day Complete! Keep your streak going!'
        );
      }
    } catch (error) {
      console.error('[Checkin Heartbeat] Ping error:', error);
      setState((prev) => ({ ...prev, isPinging: false }));
    }
  };

  // Start/stop interval based on enabled state
  useEffect(() => {
    if (enabled) {
      // Send immediate ping on mount/enable
      sendPing();

      // Then set up 30s interval
      intervalRef.current = setInterval(sendPing, 30000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [enabled, questKey]);

  return state;
}
