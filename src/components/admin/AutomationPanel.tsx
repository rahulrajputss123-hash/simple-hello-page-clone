import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { SectionTitle, EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatMoney } from "@/lib/coinquest";
import { automationStats, listAutomationLogs, retryConversion } from "@/lib/automation.functions";
import { listSdkConversions } from "@/lib/sdk-offerwall.functions";

type StatusFilter = "all" | "info" | "success" | "warning" | "error";

const statusTone: Record<string, string> = {
  success: "text-emerald-600",
  error: "text-destructive",
  warning: "text-amber-600",
  info: "text-muted-foreground",
};

export function AutomationPanel() {
  const queryClient = useQueryClient();
  const fetchStats = useServerFn(automationStats);
  const fetchLogs = useServerFn(listAutomationLogs);
  const fetchConversions = useServerFn(listSdkConversions);
  const runRetry = useServerFn(retryConversion);

  const [status, setStatus] = useState<StatusFilter>("all");

  const stats = useQuery({ queryKey: ["automation-stats"], queryFn: () => fetchStats({}) });
  const logs = useQuery({
    queryKey: ["automation-logs", status],
    queryFn: () => fetchLogs({ data: status === "all" ? { limit: 50 } : { status, limit: 50 } }),
  });
  const conversions = useQuery({
    queryKey: ["automation-conversions"],
    queryFn: () => fetchConversions({ data: { limit: 50 } }),
  });

  const retry = useMutation({
    mutationFn: (conversionId: string) => runRetry({ data: { conversionId } }),
    onSuccess: (result) => {
      if (result.ok) toast.success("Conversion credited.");
      else toast.error(`Retry skipped: ${result.reason}`);
      void queryClient.invalidateQueries({ queryKey: ["automation-conversions"] });
      void queryClient.invalidateQueries({ queryKey: ["automation-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["automation-stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const retryable = (conversions.data ?? []).filter(
    (c) => c.status === "pending" || c.status === "rejected",
  );

  return (
    <div className="space-y-4">
      <SectionTitle>Automation health</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Events (24h)" value={String(stats.data?.events24h ?? 0)} />
        <Stat label="Errors (24h)" value={String(stats.data?.errors24h ?? 0)} />
        <Stat label="Credited conversions" value={String(stats.data?.creditedConversions ?? 0)} />
        <Stat label="Duplicates blocked" value={String(stats.data?.duplicateConversions ?? 0)} />
      </div>

      <SectionTitle>Conversions needing attention</SectionTitle>
      {conversions.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : retryable.length === 0 ? (
        <EmptyState title="Nothing to retry" description="All conversions processed cleanly." />
      ) : (
        <div className="space-y-2">
          {retryable.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.provider_transaction_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.status} · {formatMoney(Number(c.reward_amount))} ·{" "}
                    {formatDateTime(c.received_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="jade"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(c.id)}
                >
                  Retry
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionTitle>Automation logs</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {(["all", "success", "warning", "error", "info"] as StatusFilter[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={status === key ? "jade" : "outline"}
            onClick={() => setStatus(key)}
          >
            {key}
          </Button>
        ))}
      </div>
      {logs.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (logs.data ?? []).length === 0 ? (
        <EmptyState title="No logs yet" description="Automation events will appear here." />
      ) : (
        <div className="space-y-2">
          {(logs.data ?? []).map((log) => (
            <div key={log.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{log.event_type}</p>
                <span className={`text-xs ${statusTone[log.status] ?? "text-muted-foreground"}`}>
                  {log.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{log.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {log.source} · {formatDateTime(log.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
