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
  adminListUsers,
  adminListWithdrawals,
  adminListClaims,
  adminListTickets,
} from "@/lib/coinquest.functions";
import { payoutMethodLabel, isCryptoMethod, getExplorerUrl } from "@/lib/payout-methods";
import { OffersManager } from "@/components/admin/OffersManager";
import { PremiumOnboardingManager } from "@/components/admin/PremiumOnboardingManager";
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
import { LifeBuoy, Network, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AdvertisersList,
  CampaignApprovals,
  FinancialOverview,
  ProofReviews,
} from "@/components/admin/MarketplaceManagers";
import { MarketplaceSettingsPanel } from "@/components/admin/MarketplaceSettingsPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — CashGPT" },
      { name: "description", content: "Review withdrawals, offer claims, tickets and users." },
      { property: "og:title", content: "Admin — CashGPT" },
      {
        property: "og:description",
        content: "Review withdrawals, offer claims, tickets and users.",
      },
    ],
  }),
  component: AdminPage,
});

/**
 * Renders the masked payout snapshot stored on a withdrawal request. The
 * snapshot is written masked-safe at request time, so nothing here can reveal a
 * full account number, email or wallet address.
 */
function payoutSnapshotLines(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return [];
  const record = snapshot as Record<string, unknown>;
  const pick = (key: string) => {
    const value = record[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  return [
    pick("masked"),
    pick("holder_name"),
    pick("bank_name"),
    pick("country_bank_code"),
    pick("country"),
  ].filter((line): line is string => Boolean(line));
}

type TabKey =
  | "dashboard"
  | "offers"
  | "quests"
  | "tasks"
  | "banners"
  | "onboarding"
  | "withdrawals"
  | "claims"
  | "tickets"
  | "users"
  | "providers"
  | "sdk-offerwalls"
  | "automation"
  | "offer-feed"
  | "campaigns"
  | "proof-reviews"
  | "advertisers";

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
  const fetchUsers = useServerFn(adminListUsers);
  const fetchWithdrawals = useServerFn(adminListWithdrawals);
  const fetchClaims = useServerFn(adminListClaims);
  const fetchTickets = useServerFn(adminListTickets);

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [notes, setNotes] = useState<Record<string, string>>({});
  /** Admin-entered fulfilment reference, keyed by withdrawal id. */
  const [references, setReferences] = useState<Record<string, string>>({});
  /** Transaction hash for crypto withdrawals, keyed by withdrawal id. */
  const [transactionHashes, setTransactionHashes] = useState<Record<string, string>>({});

  // Users tab state
  const [userSearch, setUserSearch] = useState("");
  const [userFlaggedOnly, setUserFlaggedOnly] = useState(false);
  const [userPage, setUserPage] = useState(1);

  // Withdrawals tab state
  const [withdrawalStatus, setWithdrawalStatus] = useState<"pending" | "approved" | "rejected" | "all">("all");
  const [withdrawalPage, setWithdrawalPage] = useState(1);

  // Claims tab state
  const [claimStatus, setClaimStatus] = useState<"pending" | "approved" | "rejected" | "all">("all");
  const [claimPage, setClaimPage] = useState(1);

  // Tickets tab state
  const [ticketStatus, setTicketStatus] = useState<"open" | "resolved" | "all">("all");
  const [ticketPage, setTicketPage] = useState(1);

  const totals = useQuery({
    queryKey: ["admin-totals"],
    enabled: isAdmin,
    queryFn: () => overview({}),
  });

  const users = useQuery({
    queryKey: ["admin-users", userSearch, userFlaggedOnly, userPage],
    enabled: isAdmin && tab === "users",
    queryFn: () => fetchUsers({ data: { search: userSearch, flaggedOnly: userFlaggedOnly, page: userPage } }),
  });

  const withdrawals = useQuery({
    queryKey: ["admin-withdrawals", withdrawalStatus, withdrawalPage],
    enabled: isAdmin && tab === "withdrawals",
    queryFn: () => fetchWithdrawals({ data: { status: withdrawalStatus, page: withdrawalPage } }),
  });

  const claims = useQuery({
    queryKey: ["admin-claims", claimStatus, claimPage],
    enabled: isAdmin && tab === "claims",
    queryFn: () => fetchClaims({ data: { status: claimStatus, page: claimPage } }),
  });

  const tickets = useQuery({
    queryKey: ["admin-tickets", ticketStatus, ticketPage],
    enabled: isAdmin && tab === "tickets",
    queryFn: () => fetchTickets({ data: { status: ticketStatus, page: ticketPage } }),
  });

  const refresh = () => void queryClient.invalidateQueries();
  const onError = (error: Error) => toast.error(error.message);

  const withdrawalAction = useMutation({
    mutationFn: (input: {
      id: string;
      status: "approved" | "rejected";
      note?: string;
      referenceId?: string;
      transactionHash?: string;
    }) =>
      updateWithdrawal({
        data: {
          id: input.id,
          status: input.status,
          note: input.note ?? null,
          referenceId: input.referenceId?.trim() ? input.referenceId.trim() : null,
          transactionHash: input.transactionHash?.trim() ? input.transactionHash.trim() : null,
        },
      }),
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

  const totalData = totals.data?.totals;

  const note = (id: string) => notes[id] ?? "";
  const setNote = (id: string, value: string) => setNotes((prev) => ({ ...prev, [id]: value }));
  const reference = (id: string) => references[id] ?? "";
  const setReference = (id: string, value: string) =>
    setReferences((prev) => ({ ...prev, [id]: value }));
  const transactionHash = (id: string) => transactionHashes[id] ?? "";
  const setTransactionHash = (id: string, value: string) =>
    setTransactionHashes((prev) => ({ ...prev, [id]: value }));

  return (
    <AppShell subtitle="Admin">
      <h1 className="mt-2 text-2xl">Admin panel</h1>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Users" value={String(totalData?.users ?? 0)} />
        <Stat label="Flagged" value={String(totalData?.flagged ?? 0)} />
        <Stat label="Wallet liability" value={formatMoney(totalData?.liability)} />
        <Stat label="Lifetime paid out" value={formatMoney(totalData?.withdrawn)} />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["dashboard", "Dashboard"],
            ["offers", "Offers"],
            ["quests", "Quests"],
            ["tasks", "Tasks"],
            ["banners", "Banners"],
            ["onboarding", "Onboarding"],
            ["withdrawals", `Payouts (${withdrawals.data?.pendingCount ?? 0})`],
            ["claims", `Claims (${claims.data?.pendingCount ?? 0})`],
            ["tickets", `Tickets (${tickets.data?.openCount ?? 0})`],
            ["users", "Users"],
            ["providers", "Networks"],
            ["sdk-offerwalls", "SDK Offerwalls"],
            ["automation", "Automation"],
            ["offer-feed", "Offer Feed"],
            ["campaigns", "Campaigns ★"],
            ["proof-reviews", "Proof Reviews ★"],
            ["advertisers", "Advertisers ★"],
          ] as [TabKey, string][]
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "jade" : "outline"}
            onClick={() => setTab(key)}
            data-testid={key === "onboarding" ? "admin-tab-onboarding" : `admin-tab-${key}`}
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
                <Stat
                  label="Total earned"
                  value={formatMoney(dashboard.data.money.lifetimeEarned)}
                />
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
                <Stat label="Offer completions" value={String(dashboard.data.offers.completions)} />
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

      {tab === "onboarding" && (
        <>
          <SectionTitle>Premium onboarding</SectionTitle>
          <PremiumOnboardingManager />
        </>
      )}

      {tab === "withdrawals" && (
        <>
          <SectionTitle>Withdrawal requests</SectionTitle>
          
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={withdrawalStatus === "all" ? "jade" : "outline"}
              onClick={() => { setWithdrawalStatus("all"); setWithdrawalPage(1); }}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={withdrawalStatus === "pending" ? "jade" : "outline"}
              onClick={() => { setWithdrawalStatus("pending"); setWithdrawalPage(1); }}
            >
              Pending
            </Button>
            <Button
              size="sm"
              variant={withdrawalStatus === "approved" ? "jade" : "outline"}
              onClick={() => { setWithdrawalStatus("approved"); setWithdrawalPage(1); }}
            >
              Approved
            </Button>
            <Button
              size="sm"
              variant={withdrawalStatus === "rejected" ? "jade" : "outline"}
              onClick={() => { setWithdrawalStatus("rejected"); setWithdrawalPage(1); }}
            >
              Rejected
            </Button>
          </div>

          {withdrawals.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : !withdrawals.data?.withdrawals.length ? (
            <EmptyState
              icon={LifeBuoy}
              title="No withdrawals"
              description="Requests appear here for manual review."
            />
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {withdrawals.data.withdrawals.map((request) => (
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

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                        {payoutMethodLabel(request.method_type)}
                      </span>
                      {payoutSnapshotLines(request.payout_details_snapshot).map((line) => (
                        <span
                          key={line}
                          className="rounded-full bg-background-alt px-2 py-0.5 text-muted-foreground"
                        >
                          {line}
                        </span>
                      ))}
                      {request.hasDuplicateBinancePay && (
                        <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 font-semibold text-amber-900 dark:text-amber-100">
                          ⚠️ Duplicate Pay ID
                        </span>
                      )}
                    </div>

                    {request.status === "pending" && (
                      <div className="mt-2 space-y-2">
                        <Input
                          placeholder="Optional note for the user"
                          value={note(request.id)}
                          onChange={(event) => setNote(request.id, event.target.value)}
                          maxLength={300}
                        />
                        {isCryptoMethod(request.method_type) ? (
                          <>
                            <Input
                              placeholder="Transaction hash (required for crypto) *"
                              value={transactionHash(request.id)}
                              onChange={(event) => setTransactionHash(request.id, event.target.value)}
                              maxLength={200}
                              required
                              data-testid={`admin-withdrawal-txhash-${request.id}`}
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                              ⚠️ Transaction hash is required for crypto withdrawals
                            </p>
                          </>
                        ) : request.method_type === "binance_pay" ? (
                          <>
                            <Input
                              placeholder="Binance Pay order ID (required) *"
                              value={transactionHash(request.id)}
                              onChange={(event) => setTransactionHash(request.id, event.target.value)}
                              maxLength={200}
                              required
                              data-testid={`admin-withdrawal-txhash-${request.id}`}
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                              ⚠️ Binance Pay order/transaction ID is required
                            </p>
                          </>
                        ) : (
                          <Input
                            placeholder="Fulfilment reference (payout id / gift-card order)"
                            value={reference(request.id)}
                            onChange={(event) => setReference(request.id, event.target.value)}
                            maxLength={200}
                            data-testid={`admin-withdrawal-reference-${request.id}`}
                          />
                        )}
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
                                referenceId: reference(request.id),
                                transactionHash: transactionHash(request.id),
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
                    {request.reference_id && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ref: <span className="font-mono">{request.reference_id}</span>
                      </p>
                    )}
                    {request.transaction_hash && (
                      <div className="mt-1 text-xs">
                        <span className="text-muted-foreground">Txid: </span>
                        <span className="font-mono">{request.transaction_hash}</span>
                        {getExplorerUrl(request.method_type, request.transaction_hash) && (
                          <>
                            {" · "}
                            <a
                              href={getExplorerUrl(request.method_type, request.transaction_hash)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View on explorer ↗
                            </a>
                          </>
                        )}
                      </div>
                    )}
                    {request.network_fee && Number(request.network_fee) > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Network fee: {formatMoney(request.network_fee)} (User receives:{" "}
                        {formatMoney(request.amount - Number(request.network_fee))})
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Page {withdrawals.data.page} of {withdrawals.data.totalPages} ({withdrawals.data.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={withdrawalPage === 1}
                    onClick={() => setWithdrawalPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={withdrawalPage >= withdrawals.data.totalPages}
                    onClick={() => setWithdrawalPage(p => p + 1)}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "claims" && (
        <>
          <SectionTitle>Offer claims</SectionTitle>
          
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={claimStatus === "all" ? "jade" : "outline"}
              onClick={() => { setClaimStatus("all"); setClaimPage(1); }}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={claimStatus === "pending" ? "jade" : "outline"}
              onClick={() => { setClaimStatus("pending"); setClaimPage(1); }}
            >
              Pending
            </Button>
            <Button
              size="sm"
              variant={claimStatus === "approved" ? "jade" : "outline"}
              onClick={() => { setClaimStatus("approved"); setClaimPage(1); }}
            >
              Approved
            </Button>
            <Button
              size="sm"
              variant={claimStatus === "rejected" ? "jade" : "outline"}
              onClick={() => { setClaimStatus("rejected"); setClaimPage(1); }}
            >
              Rejected
            </Button>
          </div>

          {claims.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : !claims.data?.claims.length ? (
            <EmptyState
              icon={LifeBuoy}
              title="No offer claims"
              description="User offer submissions land here."
            />
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {claims.data.claims.map((claim) => (
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
                      <ClaimProofPreview path={(claim as { proof_url: string }).proof_url} />
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

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Page {claims.data.page} of {claims.data.totalPages} ({claims.data.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={claimPage === 1}
                    onClick={() => setClaimPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={claimPage >= claims.data.totalPages}
                    onClick={() => setClaimPage(p => p + 1)}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "tickets" && (
        <>
          <SectionTitle>Support tickets</SectionTitle>
          
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={ticketStatus === "all" ? "jade" : "outline"}
              onClick={() => { setTicketStatus("all"); setTicketPage(1); }}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={ticketStatus === "open" ? "jade" : "outline"}
              onClick={() => { setTicketStatus("open"); setTicketPage(1); }}
            >
              Open
            </Button>
            <Button
              size="sm"
              variant={ticketStatus === "resolved" ? "jade" : "outline"}
              onClick={() => { setTicketStatus("resolved"); setTicketPage(1); }}
            >
              Resolved
            </Button>
          </div>

          {tickets.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : !tickets.data?.tickets.length ? (
            <EmptyState
              icon={LifeBuoy}
              title="No tickets"
              description="User messages appear here."
            />
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {tickets.data.tickets.map((ticket) => (
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

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Page {tickets.data.page} of {tickets.data.totalPages} ({tickets.data.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ticketPage === 1}
                    onClick={() => setTicketPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ticketPage >= tickets.data.totalPages}
                    onClick={() => setTicketPage(p => p + 1)}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "users" && (
        <>
          <SectionTitle>Users</SectionTitle>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search email, name, referral code, device ID..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  className="pl-9"
                />
              </div>
              <Button
                size="sm"
                variant={userFlaggedOnly ? "destructive" : "outline"}
                onClick={() => { setUserFlaggedOnly(!userFlaggedOnly); setUserPage(1); }}
              >
                {userFlaggedOnly ? "Show all" : "Flagged only"}
              </Button>
            </div>
          </div>

          {users.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : !users.data?.users.length ? (
            <EmptyState
              icon={LifeBuoy}
              title="No users found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {users.data.users.map((user) => (
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
                      Balance {formatMoney(user.wallet_balance)} · Held {formatMoney(user.held_balance)}{" "}
                      · Earned {formatMoney(user.lifetime_earned)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          flagAction.mutate({ userId: user.id, flagged: !user.is_flagged })
                        }
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

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Page {users.data.page} of {users.data.totalPages} ({users.data.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userPage === 1}
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userPage >= users.data.totalPages}
                    onClick={() => setUserPage(p => p + 1)}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "sdk-offerwalls" && <SdkOfferwallManager />}

      {/* Marketplace preview tabs (★) — sample data, nothing is saved. */}
      {tab === "campaigns" && (
        <>
          <MarketplaceSettingsPanel />
          <div className="mt-6" />
          <FinancialOverview />
          <div className="mt-6" />
          <CampaignApprovals />
        </>
      )}
      {tab === "proof-reviews" && <ProofReviews />}
      {tab === "advertisers" && <AdvertisersList />}

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
