import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState, SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/coinquest";
import {
  adminAdjustWallet,
  adminOverview,
  adminRespondTicket,
  adminSetFlag,
  adminUpdateOfferClaim,
  adminUpdateWithdrawal,
} from "@/lib/coinquest.functions";
import { OffersManager } from "@/components/admin/OffersManager";
import { QuestsManager } from "@/components/admin/QuestsManager";
import { TasksManager } from "@/components/admin/TasksManager";
import { BannersManager } from "@/components/admin/BannersManager";
import { ClaimProofPreview } from "@/components/admin/ClaimProofPreview";
import { SdkOfferwallManager } from "@/components/admin/SdkOfferwallManager";
import { AutomationPanel } from "@/components/admin/AutomationPanel";
import { OfferFeedAutomationPanel } from "@/components/admin/OfferFeedAutomationPanel";
import {
  adminDashboard,
  listOfferProviders,
  syncOfferProvider,
  upsertOfferProvider,
} from "@/lib/offers.functions";
import { LifeBuoy, Network } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — CashGPT" },
      { name: "description", content: "Review withdrawals, offer claims, tickets and users." },
      { property: "og:title", content: "Admin — CashGPT" },
      { property: "og:description", content: "Review withdrawals, offer claims, tickets and users." },
    ],
  }),
  component: AdminPage,
});

type TabKey =
  | "dashboard"
  | "offers"
  | "quests"
  | "tasks"
  | "banners"
  | "withdrawals"
  | "claims"
  | "tickets"
  | "users"
  | "providers"
  | "sdk-offerwalls"
  | "automation"
  | "offer-feed";

function AdminPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const overview = useServerFn(adminOverview);
  const updateWithdrawal = useServerFn(adminUpdateWithdrawal);
  const updateClaim = useServerFn(adminUpdateOfferClaim);
  const respondTicket = useServerFn(adminRespondTicket);
  const setFlag = useServerFn(adminSetFlag);
  const adjustWallet = useServerFn(adminAdjustWallet);
  const fetchProviders = useServerFn(listOfferProviders);
  const fetchDashboard = useServerFn(adminDashboard);
  const saveProvider = useServerFn(upsertOfferProvider);
  const runSync = useServerFn(syncOfferProvider);

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const data = useQuery({
    queryKey: ["admin-overview"],
    enabled: isAdmin,
    queryFn: () => overview({}),
  });

  const refresh = () => void queryClient.invalidateQueries();
  const onError = (error: Error) => toast.error(error.message);

  const withdrawalAction = useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected"; note?: string }) =>
      updateWithdrawal({ data: { id: input.id, status: input.status, note: input.note ?? null } }),
    onSuccess: () => {
      toast.success("Withdrawal updated.");
      refresh();
    },
    onError,
  });

  const claimAction = useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected"; note?: string }) =>
      updateClaim({ data: { id: input.id, status: input.status, note: input.note ?? null } }),
    onSuccess: () => {
      toast.success("Offer claim updated.");
      refresh();
    },
    onError,
  });

  const ticketAction = useMutation({
    mutationFn: (input: { id: string; response: string }) =>
      respondTicket({ data: { id: input.id, response: input.response, status: "resolved" } }),
    onSuccess: () => {
      toast.success("Reply sent.");
      refresh();
    },
    onError,
  });

  const flagAction = useMutation({
    mutationFn: (input: { userId: string; flagged: boolean }) => setFlag({ data: input }),
    onSuccess: () => {
      toast.success("User updated.");
      refresh();
    },
    onError,
  });

  const adjustAction = useMutation({
    mutationFn: (input: { userId: string; amount: number; reason: string }) =>
      adjustWallet({ data: input }),
    onSuccess: () => {
      toast.success("Wallet adjusted.");
      refresh();
    },
    onError,
  });

  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    enabled: isAdmin,
    queryFn: () => fetchDashboard({}),
  });

  const providers = useQuery({
    queryKey: ["offer-providers"],
    enabled: isAdmin,
    queryFn: () => fetchProviders({}),
  });

  const connectAdblue = useMutation({
    mutationFn: () =>
      saveProvider({
        data: {
          name: "AdBlueMedia",
          slug: "adbluemedia",
          providerType: "cpa" as const,
          enabled: true,
          syncConfig: { user_id: "788820" },
          defaultRevenueShare: 0.6,
        },
      }),
    onSuccess: () => {
      toast.success("AdBlueMedia connected.");
      void queryClient.invalidateQueries({ queryKey: ["offer-providers"] });
    },
    onError,
  });

  const syncAction = useMutation({
    mutationFn: (providerId: string) => runSync({ data: { providerId } }),
    onSuccess: (result) => {
      toast.success(
        `Synced ${result.provider}: ${result.upserted} offers imported, ${result.deactivated} deactivated.`,
      );
      refresh();
    },
    onError,
  });

  if (!isAdmin) {
    return (
      <AppShell subtitle="Admin">
        <p className="mt-8 text-center text-sm text-muted-foreground">
          You don't have access to the admin panel.
        </p>
      </AppShell>
    );
  }

  const totals = data.data?.totals;
  const pendingWithdrawals = (data.data?.withdrawals ?? []).filter((w) => w.status === "pending");
  const pendingClaims = (data.data?.claims ?? []).filter((c) => c.status === "pending");
  const openTickets = (data.data?.tickets ?? []).filter((t) => t.status !== "resolved");

  const note = (id: string) => notes[id] ?? "";
  const setNote = (id: string, value: string) => setNotes((prev) => ({ ...prev, [id]: value }));

  return (
    <AppShell subtitle="Admin">
      <h1 className="mt-2 text-2xl">Admin panel</h1>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Users" value={String(totals?.users ?? 0)} />
        <Stat label="Flagged" value={String(totals?.flagged ?? 0)} />
        <Stat label="Wallet liability" value={formatMoney(totals?.liability)} />
        <Stat label="Lifetime paid out" value={formatMoney(totals?.withdrawn)} />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["dashboard", "Dashboard"],
            ["offers", "Offers"],
            ["quests", "Quests"],
            ["tasks", "Tasks"],
            ["banners", "Banners"],
            ["withdrawals", `Payouts (${pendingWithdrawals.length})`],
            ["claims", `Claims (${pendingClaims.length})`],
            ["tickets", `Tickets (${openTickets.length})`],
            ["users", "Users"],
            ["providers", "Networks"],
            ["sdk-offerwalls", "SDK Offerwalls"],
            ["automation", "Automation"],
            ["offer-feed", "Offer Feed"],
          ] as [TabKey, string][]
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "jade" : "outline"}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          <SectionTitle>Overview</SectionTitle>
          {dashboard.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : dashboard.data ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Total users" value={String(dashboard.data.users.total)} />
                <Stat label="Active (30d)" value={String(dashboard.data.users.active)} />
                <Stat label="Total earned" value={formatMoney(dashboard.data.money.lifetimeEarned)} />
                <Stat
                  label="Total withdrawn"
                  value={formatMoney(dashboard.data.money.lifetimeWithdrawn)}
                />
                <Stat
                  label="Pending payouts"
                  value={`${dashboard.data.money.pendingWithdrawalCount} · ${formatMoney(
                    dashboard.data.money.pendingWithdrawalAmount,
                  )}`}
                />
                <Stat
                  label="Wallet liability"
                  value={formatMoney(dashboard.data.money.walletLiability)}
                />
                <Stat
                  label="Offer completions"
                  value={String(dashboard.data.offers.completions)}
                />
                <Stat
                  label="Network revenue"
                  value={formatMoney(dashboard.data.money.networkRevenue)}
                />
              </div>
              <div className="surface-card p-3 text-sm">
                <p className="font-semibold">Offers</p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.data.offers.total} total · {dashboard.data.offers.manual} manual ·{" "}
                  {dashboard.data.offers.network} network · {dashboard.data.offers.active} active
                </p>
              </div>
              <div className="surface-card p-3 text-sm">
                <p className="font-semibold">Referrals</p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.data.referrals.total} total · {dashboard.data.referrals.credited}{" "}
                  credited · {formatMoney(dashboard.data.referrals.paid)} paid
                </p>
              </div>
              {dashboard.data.providers.length > 0 && (
                <div className="surface-card p-3 text-sm">
                  <p className="font-semibold">Networks</p>
                  {dashboard.data.providers.map((provider) => (
                    <p key={provider.id} className="text-xs text-muted-foreground">
                      {provider.name} · {provider.enabled ? "enabled" : "disabled"} ·{" "}
                      {provider.syncStatus} ·{" "}
                      {provider.lastSyncedAt
                        ? `synced ${formatDateTime(provider.lastSyncedAt)}`
                        : "never synced"}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {tab === "offers" && (
        <>
          <SectionTitle>Offer management</SectionTitle>
          <OffersManager />
        </>
      )}

      {tab === "tasks" && <TasksManager />}

      {tab === "quests" && (
        <>
          <SectionTitle>Starter Quests</SectionTitle>
          <QuestsManager />
        </>
      )}

      {tab === "banners" && (
        <>
          <SectionTitle>Banners</SectionTitle>
          <BannersManager />
        </>
      )}

      {data.isLoading && tab !== "dashboard" && tab !== "offers" && tab !== "tasks" && tab !== "quests" && tab !== "banners" && (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      )}

      {tab === "withdrawals" && (
        <>
          <SectionTitle>Withdrawal requests</SectionTitle>
          {!data.data?.withdrawals.length ? (
            <EmptyState icon={LifeBuoy} title="No withdrawals yet" description="Requests appear here for manual review." />
          ) : (
            <ul className="space-y-2">
              {data.data.withdrawals.map((request) => (
                <li key={request.id} className="surface-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-amount">{formatMoney(request.amount)}</p>
                    <span className="rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize">
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {request.user?.name || request.user?.email || "Unknown user"} ·{" "}
                    {formatDateTime(request.created_at)}
                  </p>
                  {request.status === "pending" && (
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Optional note for the user"
                        value={note(request.id)}
                        onChange={(event) => setNote(request.id, event.target.value)}
                        maxLength={300}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="jade"
                          disabled={withdrawalAction.isPending}
                          onClick={() =>
                            withdrawalAction.mutate({
                              id: request.id,
                              status: "approved",
                              note: note(request.id),
                            })
                          }
                        >
                          Approve & pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={withdrawalAction.isPending}
                          onClick={() =>
                            withdrawalAction.mutate({
                              id: request.id,
                              status: "rejected",
                              note: note(request.id),
                            })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                  {request.admin_note && (
                    <p className="mt-2 text-xs text-muted-foreground">Note: {request.admin_note}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "claims" && (
        <>
          <SectionTitle>Offer claims</SectionTitle>
          {!data.data?.claims.length ? (
            <EmptyState icon={LifeBuoy} title="No offer claims" description="User offer submissions land here." />
          ) : (
            <ul className="space-y-2">
              {data.data.claims.map((claim) => (
                <li key={claim.id} className="surface-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{claim.offers?.title ?? "Offer"}</p>
                    <span className="rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize">
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {claim.user?.name || claim.user?.email || "Unknown"} ·{" "}
                    {formatMoney(claim.reward_amount)} · {formatDateTime(claim.created_at)}
                  </p>
                  {(claim as { proof_url?: string | null }).proof_url && (
                    <ClaimProofPreview
                      path={(claim as { proof_url: string }).proof_url}
                    />
                  )}
                  {claim.status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="jade"
                        disabled={claimAction.isPending}
                        onClick={() => claimAction.mutate({ id: claim.id, status: "approved" })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={claimAction.isPending}
                        onClick={() => claimAction.mutate({ id: claim.id, status: "rejected" })}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "tickets" && (
        <>
          <SectionTitle>Support tickets</SectionTitle>
          {!data.data?.tickets.length ? (
            <EmptyState icon={LifeBuoy} title="No tickets" description="User messages appear here." />
          ) : (
            <ul className="space-y-2">
              {data.data.tickets.map((ticket) => (
                <li key={ticket.id} className="surface-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{ticket.subject}</p>
                    <span className="rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize">
                      {ticket.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ticket.user?.email ?? "Unknown"} · {formatDateTime(ticket.created_at)}
                  </p>
                  <p className="mt-2 text-sm">{ticket.description}</p>
                  {ticket.admin_response ? (
                    <p className="mt-2 rounded-xl bg-background-alt p-2 text-sm">
                      {ticket.admin_response}
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        rows={3}
                        maxLength={1000}
                        placeholder="Write a reply"
                        value={note(ticket.id)}
                        onChange={(event) => setNote(ticket.id, event.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="jade"
                        disabled={note(ticket.id).trim().length < 2 || ticketAction.isPending}
                        onClick={() =>
                          ticketAction.mutate({ id: ticket.id, response: note(ticket.id).trim() })
                        }
                      >
                        Send reply
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "users" && (
        <>
          <SectionTitle>Users</SectionTitle>
          <ul className="space-y-2">
            {(data.data?.users ?? []).map((user) => (
              <li key={user.id} className="surface-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{user.name || user.email || user.id}</p>
                  {user.is_flagged && (
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                      Flagged
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.email} · {user.referral_code}
                </p>
                <p className="mt-1 text-xs">
                  Balance {formatMoney(user.wallet_balance)} · Held {formatMoney(user.held_balance)} ·
                  Earned {formatMoney(user.lifetime_earned)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => flagAction.mutate({ userId: user.id, flagged: !user.is_flagged })}
                  >
                    {user.is_flagged ? "Unflag" : "Flag"}
                  </Button>
                  <Input
                    className="h-9 w-28"
                    placeholder="±$"
                    inputMode="decimal"
                    value={note(user.id)}
                    onChange={(event) => setNote(user.id, event.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="gold"
                    disabled={!Number.isFinite(Number(note(user.id))) || !note(user.id)}
                    onClick={() =>
                      adjustAction.mutate({
                        userId: user.id,
                        amount: Number(note(user.id)),
                        reason: "Manual admin adjustment",
                      })
                    }
                  >
                    Adjust
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "sdk-offerwalls" && <SdkOfferwallManager />}

      {tab === "automation" && <AutomationPanel />}

      {tab === "offer-feed" && (
        <>
          <SectionTitle>Offer Feed Automation</SectionTitle>
          <OfferFeedAutomationPanel />
        </>
      )}

      {tab === "providers" && (
        <>
          <SectionTitle>Offer networks</SectionTitle>
          {providers.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !providers.data?.length ? (
            <EmptyState
              icon={Network}
              title="No networks connected"
              description="Connect AdBlueMedia to import network offers into Featured Offers."
            />
          ) : (
            <ul className="space-y-2">
              {providers.data.map((provider) => (
                <li key={provider.id} className="surface-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{provider.name}</p>
                    <span className="rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize">
                      {provider.sync_status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {provider.slug} · {provider.enabled ? "Enabled" : "Disabled"} · revenue share{" "}
                    {Math.round(provider.default_revenue_share * 100)}% ·{" "}
                    {provider.last_synced_at
                      ? `synced ${formatDateTime(provider.last_synced_at)}`
                      : "never synced"}
                  </p>
                  {provider.sync_error && (
                    <p className="mt-1 text-xs text-destructive">{provider.sync_error}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="jade"
                      disabled={syncAction.isPending}
                      onClick={() => syncAction.mutate(provider.id)}
                    >
                      {syncAction.isPending && syncAction.variables === provider.id
                        ? "Syncing…"
                        : "Sync now"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!providers.data?.some((p) => p.slug === "adbluemedia") && (
            <Button
              className="mt-3"
              variant="gold"
              disabled={connectAdblue.isPending}
              onClick={() => connectAdblue.mutate()}
            >
              {connectAdblue.isPending ? "Connecting…" : "Connect AdBlueMedia"}
            </Button>
          )}
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-amount text-lg">{value}</p>
    </div>
  );
}
