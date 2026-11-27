type ProgressBlockProps = {
  currentVisit: number;
  totalVisits: number;
  secondsDone: number;
  visitSeconds: number;
  statusText: string;
};

export function ProgressBlock({
  currentVisit,
  totalVisits,
  secondsDone,
  visitSeconds,
  statusText,
}: ProgressBlockProps) {
  const percentage = Math.min(100, (secondsDone / visitSeconds) * 100);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative size-16 shrink-0">
          <svg className="size-16 -rotate-90 transform" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-muted"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-primary"
              strokeWidth="3"
              strokeDasharray={`${percentage} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold tabular-nums">
              {secondsDone}/{visitSeconds}
            </span>
          </div>
        </div>

        {/* Text info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">
            Sponsor {currentVisit}/{totalVisits}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}
