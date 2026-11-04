import { Progress } from "@/components/ui/progress";
import { Clock, Pause } from "lucide-react";

type ActiveTimeProgressProps = {
  accumulatedMinutes: number;
  targetMinutes: number;
  todayMinutes?: number;
  dailyCapMinutes?: number;
  isPaused?: boolean;
};

/**
 * Progress bar for active time quests.
 * Shows minutes accumulated / target with optional daily cap indicator.
 */
export function ActiveTimeProgress({
  accumulatedMinutes,
  targetMinutes,
  todayMinutes,
  dailyCapMinutes,
  isPaused = false,
}: ActiveTimeProgressProps) {
  const progressPercent = Math.min(100, (accumulatedMinutes / targetMinutes) * 100);
  const isComplete = accumulatedMinutes >= targetMinutes;
  const isDailyCapped = todayMinutes !== undefined && dailyCapMinutes !== undefined && todayMinutes >= dailyCapMinutes;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {Math.floor(accumulatedMinutes)} / {targetMinutes} min
          </span>
          {isPaused && (
            <div className="flex items-center gap-1 text-xs text-orange-500">
              <Pause className="h-3 w-3" />
              <span>Paused</span>
            </div>
          )}
        </div>
        <span className="text-sm font-medium">
          {isComplete ? "Ready to claim!" : `${Math.floor(progressPercent)}%`}
        </span>
      </div>
      
      <Progress value={progressPercent} className="h-2" />
      
      {isDailyCapped && (
        <p className="text-xs text-orange-500">
          Daily cap reached ({dailyCapMinutes} min). Progress will resume tomorrow.
        </p>
      )}
      
      {todayMinutes !== undefined && dailyCapMinutes !== undefined && !isDailyCapped && (
        <p className="text-xs text-muted-foreground">
          Today: {Math.floor(todayMinutes)} / {dailyCapMinutes} min
        </p>
      )}
    </div>
  );
}
