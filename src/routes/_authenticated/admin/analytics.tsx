import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { BarChart3, TrendingDown, AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getFunnelAnalytics, getTopClientErrors, getTopProofErrors } from "@/lib/analytics/analytics.functions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

type DateRange = "7d" | "15d" | "30d" | "custom";

function AnalyticsPage() {
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [country, setCountry] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const fetchFunnel = useServerFn(getFunnelAnalytics);
  const fetchClientErrors = useServerFn(getTopClientErrors);
  const fetchProofErrors = useServerFn(getTopProofErrors);

  // Calculate date range
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const to = now.toISOString();
    let from: string;

    if (dateRange === "custom" && customFrom && customTo) {
      from = new Date(customFrom).toISOString();
      return { fromDate: from, toDate: new Date(customTo).toISOString() };
    }

    switch (dateRange) {
      case "7d":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "15d":
        from = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "30d":
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    return { fromDate: from, toDate: to };
  }, [dateRange, customFrom, customTo]);

  const funnel = useQuery({
    queryKey: ["admin-funnel", fromDate, toDate, country],
    queryFn: () =>
      fetchFunnel({
        data: {
          fromDate,
          toDate,
          country: country === "all" ? null : country,
        },
      }),
    enabled: Boolean(profile?.roles?.includes("admin")),
  });

  const clientErrors = useQuery({
    queryKey: ["admin-client-errors", fromDate, toDate, country],
    queryFn: () =>
      fetchClientErrors({
        data: {
          fromDate,
          toDate,
          country: country === "all" ? null : country,
          limit: 10,
        },
      }),
    enabled: Boolean(profile?.roles?.includes("admin")),
  });

  const proofErrors = useQuery({
    queryKey: ["admin-proof-errors", fromDate, toDate, country],
    queryFn: () =>
      fetchProofErrors({
        data: {
          fromDate,
          toDate,
          country: country === "all" ? null : country,
          limit: 10,
        },
      }),
    enabled: Boolean(profile?.roles?.includes("admin")),
  });

  if (!profile?.roles?.includes("admin")) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SectionTitle icon={BarChart3}>Analytics & Funnel</SectionTitle>

      {/* Filters */}
      <div className="surface-card space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Date Range</label>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="15d">Last 15 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Country</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="IN">India</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="PH">Philippines</SelectItem>
                <SelectItem value="PK">Pakistan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === "custom" && (
            <div className="md:col-span-3 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">From Date</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">To Date</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Funnel Table */}
      <div className="surface-card space-y-4">
        <h3 className="font-semibold">User Funnel</h3>

        {funnel.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : funnel.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium">Step</th>
                  <th className="pb-2 text-right font-medium">Users</th>
                  <th className="pb-2 text-right font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {funnel.data.steps.map((step, index) => (
                  <tr key={step.step} className="border-b border-border/50">
                    <td className="py-3">
                      <span className="font-mono text-xs">{step.step}</span>
                    </td>
                    <td className="py-3 text-right font-semibold">{step.count.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {step.conversionRate !== null ? (
                        <span
                          className={
                            step.conversionRate < 50
                              ? "text-destructive"
                              : step.conversionRate < 75
                                ? "text-amber-500"
                                : "text-green-600"
                          }
                        >
                          {step.conversionRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No funnel data available</p>
        )}
      </div>

      {/* Error Analysis */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Client Errors */}
        <div className="surface-card space-y-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-destructive" />
            Top Client Errors
          </h3>

          {clientErrors.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : clientErrors.data && clientErrors.data.length > 0 ? (
            <div className="space-y-2">
              {clientErrors.data.map((error, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border p-2">
                  <span className="font-mono text-xs text-muted-foreground">{error.route}</span>
                  <span className="font-semibold text-destructive">{error.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No client errors recorded</p>
          )}
        </div>

        {/* Proof Errors */}
        <div className="surface-card space-y-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingDown className="size-4 text-amber-500" />
            Top Proof Errors
          </h3>

          {proofErrors.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : proofErrors.data && proofErrors.data.length > 0 ? (
            <div className="space-y-2">
              {proofErrors.data.map((error, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border p-2">
                  <span className="font-mono text-xs">{error.error_code}</span>
                  <span className="font-semibold text-amber-500">{error.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No proof errors recorded</p>
          )}
        </div>
      </div>

      <div className="surface-card">
        <p className="text-xs text-muted-foreground">
          Data is collected from client-side events and server-side validations. Events older than 90 days
          are automatically deleted. User identifiers use anonymous IDs for non-logged-in users.
        </p>
      </div>
    </AppShell>
  );
}
