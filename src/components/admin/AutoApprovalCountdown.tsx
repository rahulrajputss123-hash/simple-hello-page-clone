import { Clock, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface AutoApprovalCountdownProps {
  autoApproveAt: string | null;
  autoApproveEligible: boolean;
  autoApproveReason?: string | null;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Due now";
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AutoApprovalCountdown({
  autoApproveAt,
  autoApproveEligible,
  autoApproveReason,
}: AutoApprovalCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!autoApproveAt || !autoApproveEligible) return;

    const updateCountdown = () => {
      const now = Date.now();
      const target = new Date(autoApproveAt).getTime();
      setTimeRemaining(target - now);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [autoApproveAt, autoApproveEligible]);

  // Not eligible for auto-approval
  if (!autoApproveEligible && autoApproveReason) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        <span>Auto-approval: {autoApproveReason}</span>
      </div>
    );
  }

  // No auto-approval configured
  if (!autoApproveAt) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        <span>Auto-approval off</span>
      </div>
    );
  }

  // Eligible - show countdown
  if (timeRemaining !== null) {
    const isOverdue = timeRemaining <= 0;
    return (
      <div
        className={`mt-2 flex items-center gap-1.5 text-xs ${
          isOverdue
            ? "text-amber-600 dark:text-amber-400 font-medium"
            : "text-blue-600 dark:text-blue-400"
        }`}
      >
        <Clock className="size-3.5 shrink-0 animate-pulse" />
        <span>
          {isOverdue ? "Auto-approving..." : `Auto-approves in ${formatTimeRemaining(timeRemaining)}`}
        </span>
      </div>
    );
  }

  return null;
}

interface AutoApprovedBadgeProps {
  reviewSource?: string | null;
}

export function AutoApprovedBadge({ reviewSource }: AutoApprovedBadgeProps) {
  if (reviewSource !== "auto") return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
      <Clock className="size-3" />
      Auto-approved
    </span>
  );
}
