/**
 * Admin Country Analytics Dashboard
 * Shows per-country metrics and feed health status
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCountryAnalytics, getFeedHealthStatus } from "@/lib/offers.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type DateRange = "7d" | "15d" | "30d" | "custom";

export function CountryAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const getDateRange = () => {
    if (dateRange === "custom") {
      return {
        startDate: customStartDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: customEndDate || new Date().toISOString().split("T")[0],
      };
    }

    const days = dateRange === "7d" ? 7 : dateRange === "15d" ? 15 : 30;
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["countryAnalytics", startDate, endDate],
    queryFn: () => getCountryAnalytics({ data: { startDate, endDate } }),
  });

  const { data: feedHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["feedHealthStatus"],
    queryFn: () => getFeedHealthStatus({ data: {} }),
    refetchInterval: 60000, // Refresh every minute
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Country Analytics</h2>
          <p className="text-muted-foreground">
            Offers, clicks, claims, and rewards per country
          </p>
        </div>
      </div>

      <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
        <TabsList>
          <TabsTrigger value="7d">Last 7 days</TabsTrigger>
          <TabsTrigger value="15d">Last 15 days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 days</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        {dateRange === "custom" && (
          <div className="mt-4 flex gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input px-3 py-2"
              />
            </div>
          </div>
        )}
      </Tabs>

      <div className="grid gap-6">
        {/* Country Analytics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Country Performance</CardTitle>
            <CardDescription>
              {startDate} to {endDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading analytics...</div>
            ) : !analytics || analytics.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No data for selected period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Offers Available</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Offers Clicked</TableHead>
                      <TableHead className="text-right">Started</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Approved</TableHead>
                      <TableHead className="text-right">Rejected</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Rewards Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.map((row) => (
                      <TableRow key={row.country}>
                        <TableCell className="font-medium">
                          {row.country === "Unknown" ? (
                            <span className="text-muted-foreground">Unknown</span>
                          ) : (
                            row.country
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.distinctOffersAvailable.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">{row.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {row.distinctOffersClicked.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.claimsByStatus.started.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.claimsByStatus.pending.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.claimsByStatus.approved.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.claimsByStatus.rejected.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.distinctUsers.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.rewardTotalApproved)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feed Health Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Feed Health Status</CardTitle>
            <CardDescription>
              Cache freshness and error tracking per provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading status...</div>
            ) : !feedHealth || feedHealth.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No providers configured</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Total Rows</TableHead>
                      <TableHead className="text-right">Fresh</TableHead>
                      <TableHead className="text-right">Expired</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead className="text-right">Zero Offers</TableHead>
                      <TableHead className="text-right">Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedHealth.map((row) => {
                      const healthScore =
                        row.totalRows === 0
                          ? 0
                          : ((row.freshRows / row.totalRows) * 100).toFixed(0);
                      const hasIssues =
                        row.rowsWithError > 0 || row.expiredRows > row.totalRows * 0.5;

                      return (
                        <TableRow key={row.providerId}>
                          <TableCell className="font-medium">{row.providerName}</TableCell>
                          <TableCell className="text-right">{row.totalRows}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {row.freshRows}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {row.expiredRows}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {row.rowsWithError}
                          </TableCell>
                          <TableCell className="text-right text-yellow-600">
                            {row.rowsWithZeroOffers}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={hasIssues ? "destructive" : "default"}>
                              {healthScore}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
