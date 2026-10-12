import { Inbox, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-background-alt">
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <h3 className="text-base">{title}</h3>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-background-alt">
        <WifiOff className="size-6 text-muted-foreground" />
      </span>
      <h3 className="text-base">Something went wrong</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        We couldn't load this right now. Check your connection and try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 mt-6 flex items-end justify-between gap-3">
      <h2 className="text-lg">{children}</h2>
      {action}
    </div>
  );
}
