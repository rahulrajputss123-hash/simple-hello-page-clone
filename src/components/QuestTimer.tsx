import { useEffect, useState } from "react";
import { Clock, Pause, CheckCircle2, Gift } from "lucide-react";

interface QuestTimerProps {
  /** Current active seconds from server */
  activeSeconds: number;
  /** Required seconds to complete */
  requiredSeconds: number;
  /** Whether the day/quest is completed */
  completed: boolean;
  /** Whether tracking is paused */
  paused?: boolean;
  /** Whether daily cap is reached */
  dailyCapReached?: boolean;
  /** Whether reward has been credited */
  credited?: boolean;
  /** Last ping timestamp for local tick */
  lastPingAt?: number | null;
  /** Compact mode for card display */
  compact?: boolean;
}

/**
 * Live timer component for checkin and active_time quests.
 * Shows mm:ss format with local ticking between server pings.
 * 
 * States:
 * - Tracking: green timer counting up
 * - Paused: yellow pause icon with "Still here?" prompt
 * - Completed: green check with completion message
 * - Daily cap reached: info message
 * - Reward credited: gold gift icon
 */
export function QuestTimer({
  activeSeconds,
  requiredSeconds,
  completed,
  paused = false,
  dailyCapReached = false,
  credited = false,
  lastPingAt,
  compact = false,
}: QuestTimerProps) {
  // Local tick state - increments every second between server pings
  const [localTick, setLocalTick] = useState(0);

  // Reset local tick when server data updates
  useEffect(() => {
    setLocalTick(0);
  }, [activeSeconds, lastPingAt]);

  // Increment local tick every second if not paused/completed
  useEffect(() => {
    if (paused || completed || credited || dailyCapReached) {
      return;
    }

    const interval = setInterval(() => {
      setLocalTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, completed, credited, dailyCapReached]);

  // Calculate current display seconds (server + local tick)
  const currentSeconds = Math.min(activeSeconds + localTick, requiredSeconds);
  const remainingSeconds = Math.max(0, requiredSeconds - currentSeconds);

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercent = Math.min(100, (currentSeconds / requiredSeconds) * 100);

  if (credited) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        <Gift className={`${compact ? "size-3.5" : "size-4"} text-gold-dark`} />
        <span className="font-medium text-gold-dark">Reward Credited</span>
      </div>
    );
  }

  if (completed) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        <CheckCircle2 className={`${compact ? "size-3.5" : "size-4"} text-emerald-600`} />
        <span className="font-medium text-emerald-600">
          {compact ? "Complete!" : "Day Complete!"}
        </span>
      </div>
    );
  }

  if (dailyCapReached) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        <CheckCircle2 className={`${compact ? "size-3.5" : "size-4"} text-blue-600`} />
        <span className="font-medium text-blue-600">Daily Cap Reached</span>
      </div>
    );
  }

  if (paused) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        <Pause className={`${compact ? "size-3.5" : "size-4"} text-amber-600`} />
        <span className="font-medium text-amber-600">Paused - Still here?</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Timer Display */}
      <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        <Clock className={`${compact ? "size-3.5" : "size-4"} text-emerald-600`} />
        <span className="font-mono font-semibold text-emerald-600">
          {formatTime(currentSeconds)}
        </span>
        <span className="text-muted-foreground">
          / {formatTime(requiredSeconds)}
        </span>
        {!compact && remainingSeconds > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {formatTime(remainingSeconds)} left
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Status Text */}
      {!compact && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Tracking active</span> — Keep the app
          open and stay engaged
        </p>
      )}
    </div>
  );
}

/**
 * Compact checkin day indicator - one row with colored dots and labels.
 * Green = done, Orange = today, Grey = locked
 */
export function CheckinDayDotsCompact({
  totalDays,
  completedDays,
  currentDay,
}: {
  totalDays: number;
  completedDays: number;
  currentDay: number;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: totalDays }, (_, i) => {
        const dayNum = i + 1;
        const isCompleted = dayNum <= completedDays;
        const isCurrent = dayNum === currentDay;

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`size-2.5 rounded-full ${
                isCompleted
                  ? "bg-emerald-500"
                  : isCurrent
                    ? "bg-amber-500"
                    : "bg-gray-300"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                isCompleted
                  ? "text-emerald-600"
                  : isCurrent
                    ? "text-amber-600"
                    : "text-gray-400"
              }`}
            >
              Day {dayNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact timer for check-in and active_time cards.
 * Shows mm:ss / target with thin progress bar below.
 * Ticks locally every second for active_time quests.
 */
export function CompactTimer({
  currentSeconds,
  targetSeconds,
  status,
  isLive = false,
}: {
  currentSeconds: number;
  targetSeconds: number;
  status?: string;
  /** If true, timer ticks locally every second (for active_time) */
  isLive?: boolean;
}) {
  // Local tick state - increments every second for live timers
  const [localTick, setLocalTick] = useState(0);

  // Reset local tick when server data updates
  useEffect(() => {
    setLocalTick(0);
  }, [currentSeconds]);

  // Increment local tick every second if live
  useEffect(() => {
    if (!isLive) {
      return;
    }

    const interval = setInterval(() => {
      setLocalTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  const displaySeconds = isLive ? Math.min(currentSeconds + localTick, targetSeconds) : currentSeconds;

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.min(100, (displaySeconds / targetSeconds) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-center gap-1.5 text-xs">
        <Clock className="size-3.5 text-emerald-600" />
        <span className="font-mono font-semibold text-emerald-600">
          {formatTime(displaySeconds)}
        </span>
        <span className="text-gray-400">/</span>
        <span className="font-mono text-gray-600">{formatTime(targetSeconds)}</span>
      </div>
      
      {/* Thin progress bar */}
      <div className="relative h-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {status && (
        <p className="text-center text-[10px] text-gray-500">{status}</p>
      )}
    </div>
  );
}

/**
 * Next day unlock countdown.
 * Shows when the next day will unlock (e.g., "Day 2 unlocks in 4h 23m")
 */
export function NextDayCountdown({ unlocksAt }: { unlocksAt: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = unlocksAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Available now");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [unlocksAt]);

  return (
    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="size-3.5" />
      <span>Next day unlocks in {timeLeft}</span>
    </div>
  );
}
