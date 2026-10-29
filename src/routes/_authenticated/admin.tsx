import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState, SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  createAdjustmentRequest,
  listAdjustmentRequests,
  approveAdjustmentRequest,
  rejectAdjustmentRequest,
  adminListAuditLogs,
  getWithdrawalFraudSignals,
  getUsersWithSameDevice,
  assignRole,
  removeRole,
  listStaff,
  listQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  getDashboardSignups,
  getDashboardActiveUsers,
  getDashboardRevenuePayout,
  getDashboardTopOffers,
  getUserDetail,
  getUserAuditLog,
  sendBroadcastNotification,
  setMaintenanceMode,
  getMaintenanceStatus,
  exportUsersCsv,
  exportTransactionsCsv,
  exportPayoutsCsv,
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
import { LifeBuoy, Network, Search, ChevronLeft, ChevronRight, AlertTriangle, Shield, Users, FileText, CheckCircle, XCircle, Clock, Download, Edit, Trash2, Plus } from "lucide-react";
import {
  AdvertisersList,
  CampaignApprovals,
  FinancialOverview,
  ProofReviews,
} from "@/components/admin/MarketplaceManagers";
import { MarketplaceSettingsPanel } from "@/components/admin/MarketplaceSettingsPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
  | "advertisers"
  | "audit"
  | "staff";

type SectionKey = "operations" | "content" | "integrations" | "marketplace";

function AdminPage() {
  const { isAdmin, roles } = useAuth();
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
  const createAdjRequest = useServerFn(createAdjustmentRequest);
  const listAdjRequests = useServerFn(listAdjustmentRequests);
  const approveAdjRequest = useServerFn(approveAdjustmentRequest);
  const rejectAdjRequest = useServerFn(rejectAdjustmentRequest);
  const fetchAuditLogs = useServerFn(adminListAuditLogs);
  const fetchFraudSignals = useServerFn(getWithdrawalFraudSignals);
  const fetchSameDevice = useServerFn(getUsersWithSameDevice);
  const assignRoleFn = useServerFn(assignRole);
  const removeRoleFn = useServerFn(removeRole);
  const listStaffFn = useServerFn(listStaff);
  const fetchQuickReplies = useServerFn(listQuickReplies);
  const createQuickReplyFn = useServerFn(createQuickReply);
  const updateQuickReplyFn = useServerFn(updateQuickReply);
  const deleteQuickReplyFn = useServerFn(deleteQuickReply);
  const fetchDashboardSignups = useServerFn(getDashboardSignups);
  const fetchDashboardActiveUsers = useServerFn(getDashboardActiveUsers);
  const fetchDashboardRevenuePayout = useServerFn(getDashboardRevenuePayout);
  const fetchDashboardTopOffers = useServerFn(getDashboardTopOffers);
  const fetchUserDetail = useServerFn(getUserDetail);
  const fetchUserAuditLog = useServerFn(getUserAuditLog);
  const broadcastNotification = useServerFn(sendBroadcastNotification);
  const toggleMaintenanceMode = useServerFn(setMaintenanceMode);
  const fetchMaintenanceStatus = useServerFn(getMaintenanceStatus);
  const exportUsers = useServerFn(exportUsersCsv);
  const exportTransactions = useServerFn(exportTransactionsCsv);
  const exportPayouts = useServerFn(exportPayoutsCsv);

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [dashboardDays, setDashboardDays] = useState<7 | 30 | 90>(30);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailTab, setUserDetailTab] = useState<"profile" | "transactions" | "claims" | "referrals" | "payouts" | "devices" | "audit">("profile");
  
  // Broadcast notification state
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActiveOnly, setBroadcastActiveOnly] = useState(true);
  
  // Maintenance mode state
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [section, setSection] = useState<SectionKey>("operations");
  const [notes, setNotes] = useState<Record<string, string>>({});
  /** Admin-entered fulfilment reference, keyed by withdrawal id. */
  const [references, setReferences] = useState<Record<string, string>>({});
  /** Transaction hash for crypto withdrawals, keyed by withdrawal id. */
  const [transactionHashes, setTransactionHashes] = useState<Record<string, string>>({});

  // Bulk selection for withdrawals
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<Set<string>>(new Set());
  const [withdrawalMethodFilter, setWithdrawalMethodFilter] = useState<string>("all");
  const [withdrawalMinAmount, setWithdrawalMinAmount] = useState("");
  const [withdrawalMaxAmount, setWithdrawalMaxAmount] = useState("");

  // Quick replies for tickets
  const [quickReplies, setQuickReplies] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const [editingQuickReply, setEditingQuickReply] = useState<{ id: string; title: string; content: string } | null>(null);
  const [showQuickReplyDialog, setShowQuickReplyDialog] = useState(false);
  const [newQuickReplyTitle, setNewQuickReplyTitle] = useState("");
  const [newQuickReplyContent, setNewQuickReplyContent] = useState("");

  // Users tab state
  const [userSearch, setUserSearch] = useState("");
  const [userFlaggedOnly, setUserFlaggedOnly] = useState(false);
  const [userSuspiciousOnly, setUserSuspiciousOnly] = useState(false);
  const [userPage, setUserPage] = useState(1);

  // Withdrawals tab state
  const [withdrawalStatus, setWithdrawalStatus] = useState<"pending" | "approved" | "rejected" | "all">("all");
  const [withdrawalPage, setWithdrawalPage] = useState(1);

  // Claims tab state
  const [claimStatus, setClaimStatus] = useState<"pending" | "approved" | "rejected" | "all">("all");
  const [claimPage, setClaimPage] = useState(1);

  // Tickets tab state
  const [ticketStatus, setTicketStatus] = useState<"open" | "in_progress" | "resolved" | "all">("all");
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketReplyStatus, setTicketReplyStatus] = useState<Record<string, "open" | "in_progress" | "resolved">>({});

  // Wallet adjustment state
  const [adjustingUser, setAdjustingUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // Same device modal state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Adjustment requests state
  const [adjustmentRequestsPage, setAdjustmentRequestsPage] = useState(1);

  // Audit log state
  const [auditLogAdmin, setAuditLogAdmin] = useState("");
  const [auditLogAction, setAuditLogAction] = useState("");
  const [auditLogStartDate, setAuditLogStartDate] = useState("");
  const [auditLogEndDate, setAuditLogEndDate] = useState("");
  const [auditLogPage, setAuditLogPage] = useState(1);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Staff management state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<"admin" | "finance" | "support">("finance");

  const totals = useQuery({
    queryKey: ["admin-totals"],
    enabled: isAdmin,
    queryFn: () => overview({}),
  });

  const users = useQuery({
    queryKey: ["admin-users", userSearch, userFlaggedOnly, userSuspiciousOnly, userPage],
    enabled: isAdmin && tab === "users",
    queryFn: () => fetchUsers({ data: { search: userSearch, flaggedOnly: userFlaggedOnly, suspiciousOnly: userSuspiciousOnly, page: userPage } }),
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
    queryFn: () => fetchTickets({ data: { status: ticketStatus === "all" ? undefined : ticketStatus, page: ticketPage } }),
  });

  const adjustmentRequests = useQuery({
    queryKey: ["adjustment-requests", adjustmentRequestsPage],
    enabled: isAdmin && tab === "withdrawals",
    queryFn: () => listAdjRequests({ data: { page: adjustmentRequestsPage } }),
  });

  const auditLogs = useQuery({
    queryKey: ["audit-logs", auditLogAdmin, auditLogAction, auditLogStartDate, auditLogEndDate, auditLogPage],
    enabled: isAdmin && tab === "audit",
    queryFn: () => fetchAuditLogs({ data: { 
      adminFilter: auditLogAdmin || undefined, 
      actionFilter: auditLogAction || undefined, 
      startDate: auditLogStartDate || undefined,
      endDate: auditLogEndDate || undefined,
      page: auditLogPage 
    } }),
  });

  const sameDeviceUsers = useQuery({
    queryKey: ["same-device", selectedDeviceId],
    enabled: isAdmin && selectedDeviceId !== null,
    queryFn: () => fetchSameDevice({ data: { deviceId: selectedDeviceId! } }),
  });

  const staffList = useQuery({
    queryKey: ["staff-list"],
    enabled: isAdmin && tab === "staff",
    queryFn: () => listStaffFn({}),
  });

  const quickRepliesQuery = useQuery({
    queryKey: ["quick-replies"],
    enabled: isAdmin && tab === "tickets",
    queryFn: () => fetchQuickReplies({}),
  });

  const dashboardSignups = useQuery({
    queryKey: ["dashboard-signups", dashboardDays],
    enabled: isAdmin && tab === "dashboard",
    queryFn: () => fetchDashboardSignups({ data: { days: dashboardDays } }),
  });

  const dashboardActiveUsers = useQuery({
    queryKey: ["dashboard-active-users", dashboardDays],
    enabled: isAdmin && tab === "dashboard",
    queryFn: () => fetchDashboardActiveUsers({ data: { days: dashboardDays } }),
  });

  const dashboardRevenuePayout = useQuery({
    queryKey: ["dashboard-revenue-payout", dashboardDays],
    enabled: isAdmin && tab === "dashboard",
    queryFn: () => fetchDashboardRevenuePayout({ data: { days: dashboardDays } }),
  });

  const dashboardTopOffers = useQuery({
    queryKey: ["dashboard-top-offers", dashboardDays],
    enabled: isAdmin && tab === "dashboard",
    queryFn: () => fetchDashboardTopOffers({ data: { days: dashboardDays } }),
  });

  const userDetail = useQuery({
    queryKey: ["user-detail", selectedUserId],
    enabled: isAdmin && selectedUserId !== null,
    queryFn: () => fetchUserDetail({ data: { userId: selectedUserId! } }),
  });

  const userDetailAuditLog = useQuery({
    queryKey: ["user-detail-audit", selectedUserId],
    enabled: isAdmin && selectedUserId !== null && userDetailTab === "audit",
    queryFn: () => fetchUserAuditLog({ data: { userId: selectedUserId! } }),
  });

  const maintenanceStatus = useQuery({
    queryKey: ["maintenance-status"],
    enabled: isAdmin && tab === "dashboard",
    queryFn: () => fetchMaintenanceStatus({}),
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
    mutationFn: (input: { id: string; response: string; status?: "open" | "in_progress" | "resolved" }) =>
      respondTicket({ data: { id: input.id, response: input.response, status: input.status || "resolved" } }),
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

  const adjustRequestAction = useMutation({
    mutationFn: (input: { userId: string; amount: number; reason: string }) =>
      createAdjRequest({ data: input }),
    onSuccess: () => {
      toast.success("Adjustment request created and pending approval.");
      refresh();
    },
    onError,
  });

  const approveAdjustmentAction = useMutation({
    mutationFn: (requestId: string) => approveAdjRequest({ data: { requestId } }),
    onSuccess: () => {
      toast.success("Adjustment request approved and applied.");
      refresh();
    },
    onError,
  });

  const rejectAdjustmentAction = useMutation({
    mutationFn: (requestId: string) => rejectAdjRequest({ data: { requestId } }),
    onSuccess: () => {
      toast.success("Adjustment request rejected.");
      refresh();
    },
    onError,
  });

  const assignRoleAction = useMutation({
    mutationFn: (input: { email: string; role: "admin" | "finance" | "support" }) =>
      assignRoleFn({ data: input }),
    onSuccess: () => {
      toast.success("Role assigned successfully.");
      setStaffEmail("");
      refresh();
    },
    onError,
  });

  const removeRoleAction = useMutation({
    mutationFn: (input: { userId: string; role: "admin" | "finance" | "support" }) =>
      removeRoleFn({ data: input }),
    onSuccess: () => {
      toast.success("Role removed successfully.");
      refresh();
    },
    onError,
  });

  const createQuickReplyAction = useMutation({
    mutationFn: (input: { title: string; content: string }) =>
      createQuickReplyFn({ data: input }),
    onSuccess: () => {
      toast.success("Quick reply created.");
      setNewQuickReplyTitle("");
      setNewQuickReplyContent("");
      setShowQuickReplyDialog(false);
      refresh();
    },
    onError,
  });

  const updateQuickReplyAction = useMutation({
    mutationFn: (input: { id: string; title: string; content: string }) =>
      updateQuickReplyFn({ data: input }),
    onSuccess: () => {
      toast.success("Quick reply updated.");
      setEditingQuickReply(null);
      refresh();
    },
    onError,
  });

  const deleteQuickReplyAction = useMutation({
    mutationFn: (id: string) => deleteQuickReplyFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Quick reply deleted.");
      refresh();
    },
    onError,
  });

  const broadcastAction = useMutation({
    mutationFn: (data: { title: string; message: string; activeOnly: boolean }) =>
      broadcastNotification({ data }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Broadcast sent to ${result.sent_count} users`);
        setShowBroadcastDialog(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
        refresh();
      } else {
        toast.error(result.error || "Failed to send broadcast");
      }
    },
    onError,
  });

  const maintenanceModeAction = useMutation({
    mutationFn: (data: { enabled: boolean; message?: string }) =>
      toggleMaintenanceMode({ data }),
    onSuccess: (result) => {
      toast.success(`Maintenance mode ${result.enabled ? "enabled" : "disabled"}`);
      setShowMaintenanceDialog(false);
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

  // Check if user has any admin-like role
  const hasAdminAccess = roles.length > 0 && roles.some(r => r === "admin" || r === "finance" || r === "support");

  if (!hasAdminAccess) {
    return (
      <AppShell subtitle="Admin">
        <p className="mt-8 text-center text-sm text-muted-foreground">
          You don't have access to the admin panel.
        </p>
      </AppShell>
    );
  }

  // Determine which tabs the user can see based on their roles
  const canSeeTab = (tabKey: TabKey): boolean => {
    if (roles.includes("admin")) return true; // Admins see everything
    
    if (roles.includes("finance")) {
      // Finance sees: withdrawals, claims, tickets
      return ["withdrawals", "claims", "tickets"].includes(tabKey);
    }
    
    if (roles.includes("support")) {
      // Support sees: tickets only
      return tabKey === "tickets";
    }
    
    return false;
  };

  // Section-based tab organization
  const tabSections: Record<SectionKey, Array<[TabKey, string]>> = {
    operations: [
      ["withdrawals", "Payouts"],
      ["claims", "Claims"],
      ["tickets", "Tickets"],
      ["users", "Users"],
      ["audit", "Audit Log"],
      ["staff", "Staff"],
    ],
    content: [
      ["offers", "Offers"],
      ["quests", "Quests"],
      ["tasks", "Tasks"],
      ["banners", "Banners"],
      ["onboarding", "Onboarding"],
    ],
    integrations: [
      ["providers", "Networks"],
      ["sdk-offerwalls", "SDK Offerwalls"],
      ["automation", "Automation"],
      ["offer-feed", "Offer Feed"],
    ],
    marketplace: [
      ["campaigns", "Campaigns ★"],
      ["proof-reviews", "Proof Reviews ★"],
      ["advertisers", "Advertisers ★"],
    ],
  };

  // Calculate badge counts for tabs
  const tabBadges: Record<string, number> = useMemo(() => ({
    withdrawals: withdrawals.data?.pendingCount ?? 0,
    claims: claims.data?.pendingCount ?? 0,
    tickets: tickets.data?.openCount ?? 0,
  }), [withdrawals.data?.pendingCount, claims.data?.pendingCount, tickets.data?.openCount]);

  // Filter tabs in current section based on role
  const visibleTabsInSection = useMemo(() => {
    return tabSections[section].filter(([key]) => canSeeTab(key));
  }, [section, tabSections, canSeeTab]);

  // Get all visible sections (that have at least one visible tab)
  const visibleSections = useMemo(() => {
    return (["operations", "content", "integrations", "marketplace"] as SectionKey[]).filter(
      sectionKey => tabSections[sectionKey].some(([tabKey]) => canSeeTab(tabKey))
    );
  }, [tabSections, canSeeTab]);

  // Set initial tab to first visible tab if current tab is not visible
  if (visibleTabsInSection.length > 0 && !canSeeTab(tab)) {
    const firstVisibleTab = visibleTabsInSection[0][0];
    setTab(firstVisibleTab);
  }

  // Auto-switch section if current tab is not in current section
  const currentSectionTabs = tabSections[section].map(([key]) => key);
  if (!currentSectionTabs.includes(tab)) {
    // Find which section contains the current tab
    for (const [sectionKey, tabs] of Object.entries(tabSections)) {
      if (tabs.some(([key]) => key === tab)) {
        setSection(sectionKey as SectionKey);
        break;
      }
    }
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

      {/* Section Switcher */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {visibleSections.map((sectionKey) => (
          <Button
            key={sectionKey}
            size="sm"
            variant={section === sectionKey ? "default" : "outline"}
            onClick={() => {
              setSection(sectionKey);
              // Switch to first visible tab in the new section
              const firstTab = tabSections[sectionKey].find(([key]) => canSeeTab(key));
              if (firstTab) {
                setTab(firstTab[0]);
              }
            }}
          >
            {sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}
          </Button>
        ))}
      </div>

      {/* Sub-tabs for current section */}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {visibleTabsInSection.map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "jade" : "outline"}
            onClick={() => setTab(key)}
            data-testid={key === "onboarding" ? "admin-tab-onboarding" : `admin-tab-${key}`}
            className="relative"
          >
            {label}
            {tabBadges[key] > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">
                {tabBadges[key]}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          <SectionTitle>Overview</SectionTitle>
          
          {/* Admin Controls */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBroadcastDialog(true)}
            >
              📢 Send Broadcast
            </Button>
            <Button
              size="sm"
              variant={maintenanceStatus.data?.enabled ? "destructive" : "outline"}
              onClick={() => setShowMaintenanceDialog(true)}
            >
              {maintenanceStatus.data?.enabled ? "🔧 Maintenance ON" : "⚙️ Maintenance Mode"}
            </Button>
          </div>
          
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

          {/* Analytics Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <SectionTitle>Analytics</SectionTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={dashboardDays === 7 ? "jade" : "outline"}
                  onClick={() => setDashboardDays(7)}
                >
                  7 days
                </Button>
                <Button
                  size="sm"
                  variant={dashboardDays === 30 ? "jade" : "outline"}
                  onClick={() => setDashboardDays(30)}
                >
                  30 days
                </Button>
                <Button
                  size="sm"
                  variant={dashboardDays === 90 ? "jade" : "outline"}
                  onClick={() => setDashboardDays(90)}
                >
                  90 days
                </Button>
              </div>
            </div>

            {/* Daily Signups Chart */}
            <div className="mt-3 surface-card p-4">
              <h3 className="text-sm font-semibold">Daily Signups (Google vs Email)</h3>
              {dashboardSignups.isLoading ? (
                <p className="mt-2 text-xs text-muted-foreground">Loading...</p>
              ) : dashboardSignups.data && dashboardSignups.data.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="size-3 bg-blue-500 rounded" />
                      <span>Google</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="size-3 bg-green-500 rounded" />
                      <span>Email</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dashboardSignups.data.map((day: any) => {
                      const total = day.google_signups + day.email_signups;
                      const googlePct = total > 0 ? (day.google_signups / total) * 100 : 0;
                      const emailPct = total > 0 ? (day.email_signups / total) * 100 : 0;
                      return (
                        <div key={day.date} className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-muted-foreground">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex-1 flex h-6 bg-muted/20 rounded overflow-hidden">
                            {googlePct > 0 && (
                              <div 
                                className="bg-blue-500 flex items-center justify-center text-[10px] text-white font-medium"
                                style={{ width: `${googlePct}%` }}
                                title={`Google: ${day.google_signups}`}
                              >
                                {day.google_signups > 0 && day.google_signups}
                              </div>
                            )}
                            {emailPct > 0 && (
                              <div 
                                className="bg-green-500 flex items-center justify-center text-[10px] text-white font-medium"
                                style={{ width: `${emailPct}%` }}
                                title={`Email: ${day.email_signups}`}
                              >
                                {day.email_signups > 0 && day.email_signups}
                              </div>
                            )}
                          </div>
                          <span className="w-10 text-right font-medium">{total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No signup data available</p>
              )}
            </div>

            {/* Daily Active Users Chart */}
            <div className="mt-3 surface-card p-4">
              <h3 className="text-sm font-semibold">Active Earners</h3>
              {dashboardActiveUsers.isLoading ? (
                <p className="mt-2 text-xs text-muted-foreground">Loading...</p>
              ) : dashboardActiveUsers.data && dashboardActiveUsers.data.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {(() => {
                    const maxDau = Math.max(...dashboardActiveUsers.data.map((d: any) => d.dau));
                    return dashboardActiveUsers.data.map((day: any) => {
                      const widthPct = maxDau > 0 ? (day.dau / maxDau) * 100 : 0;
                      return (
                        <div key={day.date} className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-muted-foreground">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex-1 flex h-6 bg-muted/20 rounded overflow-hidden">
                            <div 
                              className="bg-purple-500 flex items-center justify-center text-[10px] text-white font-medium"
                              style={{ width: `${widthPct}%` }}
                            >
                              {day.dau > 0 && day.dau}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No activity data available</p>
              )}
            </div>

            {/* Revenue vs Payout Chart */}
            <div className="mt-3 surface-card p-4">
              <h3 className="text-sm font-semibold">User Earnings vs Withdrawals</h3>
              <p className="text-xs text-muted-foreground mt-1">Shows user rewards, not network revenue.</p>
              {dashboardRevenuePayout.isLoading ? (
                <p className="mt-2 text-xs text-muted-foreground">Loading...</p>
              ) : dashboardRevenuePayout.data && dashboardRevenuePayout.data.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="size-3 bg-emerald-500 rounded" />
                      <span>User earnings</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="size-3 bg-rose-500 rounded" />
                      <span>Withdrawals</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      const maxValue = Math.max(...dashboardRevenuePayout.data.flatMap((d: any) => [d.revenue || 0, d.payout || 0]));
                      return dashboardRevenuePayout.data.map((day: any) => {
                        const revenuePct = maxValue > 0 ? ((day.revenue || 0) / maxValue) * 100 : 0;
                        const payoutPct = maxValue > 0 ? ((day.payout || 0) / maxValue) * 100 : 0;
                        return (
                          <div key={day.date} className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-20 text-muted-foreground">
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <div className="flex-1 flex h-4 bg-muted/20 rounded overflow-hidden">
                                <div 
                                  className="bg-emerald-500"
                                  style={{ width: `${revenuePct}%` }}
                                  title={`User earnings: ${formatMoney(day.revenue || 0)}`}
                                />
                              </div>
                              <span className="w-16 text-right text-[10px] text-emerald-600 font-medium">
                                {formatMoney(day.revenue || 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-20" />
                              <div className="flex-1 flex h-4 bg-muted/20 rounded overflow-hidden">
                                <div 
                                  className="bg-rose-500"
                                  style={{ width: `${payoutPct}%` }}
                                  title={`Withdrawals: ${formatMoney(day.payout || 0)}`}
                                />
                              </div>
                              <span className="w-16 text-right text-[10px] text-rose-600 font-medium">
                                {formatMoney(day.payout || 0)}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No revenue/payout data available</p>
              )}
            </div>

            {/* Top Offers Table */}
            <div className="mt-3 surface-card p-4">
              <h3 className="text-sm font-semibold">Top 10 Offers by Completions</h3>
              {dashboardTopOffers.isLoading ? (
                <p className="mt-2 text-xs text-muted-foreground">Loading...</p>
              ) : dashboardTopOffers.data && dashboardTopOffers.data.length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Offer</th>
                        <th className="text-right p-2">Completions</th>
                        <th className="text-right p-2">Approval %</th>
                        <th className="text-right p-2">Total Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardTopOffers.data.map((offer: any, idx: number) => (
                        <tr key={offer.offer_id || idx} className="border-b border-muted/30">
                          <td className="p-2">{offer.offer_name || 'Unknown Offer'}</td>
                          <td className="text-right p-2 font-medium">{offer.completions}</td>
                          <td className="text-right p-2">
                            {offer.approved > 0 
                              ? `${Math.round((offer.approved / offer.completions) * 100)}%`
                              : '0%'
                            }
                          </td>
                          <td className="text-right p-2 font-medium text-emerald-600">
                            {formatMoney(offer.total_payout || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No offer data available</p>
              )}
            </div>
          </div>
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
          
          {/* Filters and Bulk Actions */}
          <div className="mt-3 space-y-3">
            {/* Status filters */}
            <div className="flex flex-wrap items-center gap-2">
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

            {/* Method and amount filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={withdrawalMethodFilter} onValueChange={setWithdrawalMethodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="binance_pay">Binance Pay</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="gift_card">Gift Card</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="Min amount"
                value={withdrawalMinAmount}
                onChange={(e) => setWithdrawalMinAmount(e.target.value)}
                className="w-[120px]"
              />
              <Input
                type="number"
                placeholder="Max amount"
                value={withdrawalMaxAmount}
                onChange={(e) => setWithdrawalMaxAmount(e.target.value)}
                className="w-[120px]"
              />

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setWithdrawalMethodFilter("all");
                  setWithdrawalMinAmount("");
                  setWithdrawalMaxAmount("");
                }}
              >
                Clear filters
              </Button>
            </div>

            {/* Bulk actions */}
            {selectedWithdrawals.size > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-2">
                <span className="text-sm font-semibold">
                  {selectedWithdrawals.size} selected
                </span>
                <Button
                  size="sm"
                  variant="jade"
                  onClick={() => {
                    // Bulk approve - only for items that don't require ref/hash
                    const items = withdrawals.data?.withdrawals.filter(w => 
                      selectedWithdrawals.has(w.id) && 
                      w.status === "pending" &&
                      !isCryptoMethod(w.method_type) &&
                      w.method_type !== "binance_pay"
                    ) || [];
                    
                    if (items.length === 0) {
                      toast.error("Selected items require transaction hash or reference");
                      return;
                    }
                    
                    Promise.all(items.map(item => 
                      withdrawalAction.mutateAsync({
                        id: item.id,
                        status: "approved",
                        note: note(item.id),
                        referenceId: reference(item.id),
                        transactionHash: transactionHash(item.id),
                      })
                    )).then(() => {
                      setSelectedWithdrawals(new Set());
                      toast.success(`Approved ${items.length} withdrawals`);
                    });
                  }}
                >
                  Bulk Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const items = withdrawals.data?.withdrawals.filter(w => 
                      selectedWithdrawals.has(w.id) && w.status === "pending"
                    ) || [];
                    
                    Promise.all(items.map(item => 
                      withdrawalAction.mutateAsync({
                        id: item.id,
                        status: "rejected",
                        note: note(item.id) || "Bulk rejection",
                      })
                    )).then(() => {
                      setSelectedWithdrawals(new Set());
                      toast.success(`Rejected ${items.length} withdrawals`);
                    });
                  }}
                >
                  Bulk Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedWithdrawals(new Set())}
                >
                  Clear selection
                </Button>
              </div>
            )}

            {/* CSV Export */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const result = await exportPayouts({ 
                      data: { 
                        status: withdrawalStatus === "all" ? undefined : withdrawalStatus,
                        days: 90
                      } 
                    });
                    downloadCsv(result, `payouts-export-${new Date().toISOString().split("T")[0]}.csv`);
                    toast.success("Payouts exported");
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                <Download className="mr-1 size-3" />
                Export CSV
              </Button>
            </div>
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
                {withdrawals.data.withdrawals
                  .filter(w => {
                    if (withdrawalMethodFilter !== "all" && w.method_type !== withdrawalMethodFilter) return false;
                    if (withdrawalMinAmount && w.amount < Number(withdrawalMinAmount)) return false;
                    if (withdrawalMaxAmount && w.amount > Number(withdrawalMaxAmount)) return false;
                    return true;
                  })
                  .map((request) => {
                    const isPending24h = request.status === "pending" && 
                      new Date().getTime() - new Date(request.created_at).getTime() > 24 * 60 * 60 * 1000;
                    
                    return (
                      <li 
                        key={request.id} 
                        className={`surface-card p-3 ${isPending24h ? "border-2 border-amber-500" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          {request.status === "pending" && (
                            <Checkbox
                              checked={selectedWithdrawals.has(request.id)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedWithdrawals);
                                if (checked) {
                                  newSet.add(request.id);
                                } else {
                                  newSet.delete(request.id);
                                }
                                setSelectedWithdrawals(newSet);
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="text-amount">{formatMoney(request.amount)}</p>
                                {isPending24h && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    <Clock className="mr-1 size-3" />
                                    24h+
                                  </Badge>
                                )}
                              </div>
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

                            {/* Fraud signals */}
                            <FraudSignals withdrawalId={request.id} />

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
                          </div>
                        </div>
                      </li>
                    );
                  })}
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

          {/* Adjustment Requests Section */}
          <div className="mt-8">
            <SectionTitle>Wallet Adjustment Requests</SectionTitle>
          {adjustmentRequests.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          ) : !adjustmentRequests.data?.requests.length ? (
            <p className="mt-4 text-sm text-muted-foreground">No pending adjustment requests.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {adjustmentRequests.data.requests.map((req: any) => (
                  <li key={req.id} className="surface-card p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-amount">{formatMoney(req.amount)}</p>
                      <span className="rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      User: {req.user?.name || req.user?.email || "Unknown"} · Requested by: {req.requester?.email || "Unknown admin"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reason: {req.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {formatDateTime(req.created_at)}
                    </p>
                    {req.status === "pending" && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="jade"
                          disabled={approveAdjustmentAction.isPending || rejectAdjustmentAction.isPending}
                          onClick={() => approveAdjustmentAction.mutate(req.id)}
                        >
                          <CheckCircle className="mr-1 size-3" />
                          Approve & Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={approveAdjustmentAction.isPending || rejectAdjustmentAction.isPending}
                          onClick={() => rejectAdjustmentAction.mutate(req.id)}
                        >
                          <XCircle className="mr-1 size-3" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {req.status === "approved" && req.approvedBy && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        ✓ Approved by: {req.approvedBy.email} at {formatDateTime(req.approvedAt!)}
                      </p>
                    )}
                    {req.status === "rejected" && req.approvedBy && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        ✗ Rejected by: {req.approvedBy.email} at {formatDateTime(req.approvedAt!)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Page {adjustmentRequests.data.page} of {adjustmentRequests.data.totalPages} ({adjustmentRequests.data.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={adjustmentRequestsPage === 1}
                    onClick={() => setAdjustmentRequestsPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={adjustmentRequestsPage >= adjustmentRequests.data.totalPages}
                    onClick={() => setAdjustmentRequestsPage(p => p + 1)}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
          </div>
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
          
          {/* Ticket Status Filters */}
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
              variant={ticketStatus === "in_progress" ? "jade" : "outline"}
              onClick={() => { setTicketStatus("in_progress"); setTicketPage(1); }}
            >
              In Progress
            </Button>
            <Button
              size="sm"
              variant={ticketStatus === "resolved" ? "jade" : "outline"}
              onClick={() => { setTicketStatus("resolved"); setTicketPage(1); }}
            >
              Resolved
            </Button>
          </div>

          {/* Quick Replies Management */}
          <div className="mt-4 rounded-lg bg-background-alt/50 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Quick Replies</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingQuickReply(null);
                  setNewQuickReplyTitle("");
                  setNewQuickReplyContent("");
                  setShowQuickReplyDialog(true);
                }}
              >
                <Plus className="mr-1 size-3" />
                New
              </Button>
            </div>
            
            {quickRepliesQuery.isLoading ? (
              <p className="mt-2 text-xs text-muted-foreground">Loading quick replies...</p>
            ) : !quickReplies.length ? (
              <p className="mt-2 text-xs text-muted-foreground">No quick replies yet. Create one to speed up responses.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickReplies.map((qr) => (
                  <div key={qr.id} className="group flex items-center gap-1 rounded-full bg-background px-2 py-1">
                    <span className="text-xs">{qr.title}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        setEditingQuickReply(qr);
                        setNewQuickReplyTitle(qr.title);
                        setNewQuickReplyContent(qr.content);
                        setShowQuickReplyDialog(true);
                      }}
                    >
                      <Edit className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        if (confirm(`Delete quick reply "${qr.title}"?`)) {
                          deleteQuickReplyAction.mutate(qr.id);
                        }
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
                        {/* Quick Reply Insertion */}
                        {quickReplies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">Quick:</span>
                            {quickReplies.map((qr) => (
                              <Button
                                key={qr.id}
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[11px]"
                                onClick={() => {
                                  const currentNote = note(ticket.id);
                                  setNote(ticket.id, currentNote ? `${currentNote}\n\n${qr.content}` : qr.content);
                                }}
                              >
                                {qr.title}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        <Textarea
                          rows={3}
                          maxLength={1000}
                          placeholder="Write a reply"
                          value={note(ticket.id)}
                          onChange={(event) => setNote(ticket.id, event.target.value)}
                        />
                        
                        {/* Status Selection */}
                        <div className="flex items-center gap-2">
                          <div className="min-w-[150px]">
                            <Select
                              value={ticketReplyStatus[ticket.id] || "open"}
                              onValueChange={(value) => setTicketReplyStatus(prev => ({ ...prev, [ticket.id]: value as "open" | "in_progress" | "resolved" }))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Keep Open</SelectItem>
                                <SelectItem value="in_progress">Mark In Progress</SelectItem>
                                <SelectItem value="resolved">Mark Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="jade"
                            disabled={note(ticket.id).trim().length < 2 || ticketAction.isPending}
                            onClick={() =>
                              ticketAction.mutate({ 
                                id: ticket.id, 
                                response: note(ticket.id).trim(),
                                status: ticketReplyStatus[ticket.id] || "open"
                              })
                            }
                          >
                            Send & Update Status
                          </Button>
                        </div>
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

      {/* Quick Reply Dialog */}
      {showQuickReplyDialog && (
        <Dialog open={showQuickReplyDialog} onOpenChange={setShowQuickReplyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuickReply ? "Edit Quick Reply" : "New Quick Reply"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Title (short name)</label>
                <Input
                  placeholder="e.g. 'Thanks', 'Investigating', 'Resolved'"
                  value={newQuickReplyTitle}
                  onChange={(e) => setNewQuickReplyTitle(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Reply Content</label>
                <Textarea
                  placeholder="The message that will be inserted..."
                  value={newQuickReplyContent}
                  onChange={(e) => setNewQuickReplyContent(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-muted-foreground">{newQuickReplyContent.length}/500 characters</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuickReplyDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="jade"
                onClick={() => {
                  if (editingQuickReply) {
                    updateQuickReplyAction.mutate({
                      id: editingQuickReply.id,
                      title: newQuickReplyTitle.trim(),
                      content: newQuickReplyContent.trim(),
                    });
                  } else {
                    createQuickReplyAction.mutate({
                      title: newQuickReplyTitle.trim(),
                      content: newQuickReplyContent.trim(),
                    });
                  }
                }}
                disabled={
                  newQuickReplyTitle.trim().length < 2 ||
                  newQuickReplyContent.trim().length < 5 ||
                  createQuickReplyAction.isPending ||
                  updateQuickReplyAction.isPending
                }
              >
                {editingQuickReply ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                onClick={() => { 
                  setUserFlaggedOnly(!userFlaggedOnly); 
                  if (!userFlaggedOnly) setUserSuspiciousOnly(false); // Disable suspicious when enabling flagged
                  setUserPage(1); 
                }}
              >
                {userFlaggedOnly ? "Show all" : "Flagged only"}
              </Button>
              <Button
                size="sm"
                variant={userSuspiciousOnly ? "amber" : "outline"}
                onClick={() => { 
                  setUserSuspiciousOnly(!userSuspiciousOnly); 
                  if (!userSuspiciousOnly) setUserFlaggedOnly(false); // Disable flagged when enabling suspicious
                  setUserPage(1); 
                }}
              >
                <AlertTriangle className="mr-1 size-3" />
                {userSuspiciousOnly ? "Show all" : "Suspicious"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const result = await exportUsers({ 
                      data: { 
                        flaggedOnly: userFlaggedOnly, 
                        activeOnly: userSuspiciousOnly 
                      } 
                    });
                    downloadCsv(result, `users-export-${new Date().toISOString().split("T")[0]}.csv`);
                    toast.success("Users exported");
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                <Download className="mr-1 size-3" />
                Export CSV
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
                      <button
                        onClick={() => setSelectedUserId(user.id)}
                        className="truncate font-semibold text-left hover:underline cursor-pointer"
                      >
                        {user.name || user.email || user.id}
                      </button>
                      {user.is_flagged && (
                        <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                          Flagged
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user.email} · {user.referral_code}
                      {user.device_id && user.device_id !== "" && user.device_id !== "server" && (
                        <span className="ml-2 text-[10px]">Device: {user.device_id.substring(0, 8)}...</span>
                      )}
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
                      {user.device_id && user.device_id !== "" && user.device_id !== "server" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDeviceId(user.device_id)}
                        >
                          <Users className="mr-1 size-3" />
                          Same device
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => setAdjustingUser({ id: user.id, name: user.name || "", email: user.email })}
                      >
                        Adjust wallet
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

      {/* Audit Log Tab */}
      {tab === "audit" && (
        <>
          <SectionTitle>Audit Log</SectionTitle>
          
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Filter by admin email..."
              value={auditLogAdmin}
              onChange={(e) => { setAuditLogAdmin(e.target.value); setAuditLogPage(1); }}
            />
            <Input
              placeholder="Filter by action (e.g. WALLET_ADJUST, WITHDRAWAL_APPROVE)..."
              value={auditLogAction}
              onChange={(e) => { setAuditLogAction(e.target.value); setAuditLogPage(1); }}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={auditLogStartDate}
                  onChange={(e) => { setAuditLogStartDate(e.target.value); setAuditLogPage(1); }}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  value={auditLogEndDate}
                  onChange={(e) => { setAuditLogEndDate(e.target.value); setAuditLogPage(1); }}
                />
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  // Export transactions for the date range or default 30 days
                  const days = auditLogStartDate && auditLogEndDate 
                    ? Math.ceil((new Date(auditLogEndDate).getTime() - new Date(auditLogStartDate).getTime()) / (1000 * 60 * 60 * 24))
                    : 30;
                  const result = await exportTransactions({ 
                    data: { 
                      userId: undefined,
                      days: Math.max(1, days)
                    } 
                  });
                  downloadCsv(result, `transactions-export-${new Date().toISOString().split("T")[0]}.csv`);
                  toast.success("Transactions exported");
                } catch (err: any) {
                  toast.error(err.message);
                }
              }}
            >
              <Download className="mr-1 size-3" />
              Export Transactions CSV
            </Button>
          </div>

          {auditLogs.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          ) : !auditLogs.data?.logs.length ? (
            <EmptyState
              icon={FileText}
              title="No audit logs"
              description="Admin actions will appear here."
            />
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {auditLogs.data.logs.map((log) => {
                  const isExpanded = expandedLogIds.has(log.id);
                  return (
                    <li key={log.id} className="surface-card p-3">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => {
                          setExpandedLogIds(prev => {
                            const next = new Set(prev);
                            if (isExpanded) {
                              next.delete(log.id);
                            } else {
                              next.add(log.id);
                            }
                            return next;
                          });
                        }}
                      >
                        <p className="text-sm font-semibold">{log.action}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                          <ChevronRight className={`size-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        By: {log.admin?.email || "Unknown admin"}
                        {log.targetUser && ` · Target: ${log.targetUser.email || log.targetUser.name || "Unknown"}`}
                      </p>
                      
                      {isExpanded && log.details && (
                        <div className="mt-2 space-y-2">
                          {log.details.before && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Before:</p>
                              <pre className="mt-1 overflow-x-auto rounded bg-background-alt p-2 text-xs text-muted-foreground">
                                {JSON.stringify(log.details.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.details.after && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">After:</p>
                              <pre className="mt-1 overflow-x-auto rounded bg-background-alt p-2 text-xs text-muted-foreground">
                                {JSON.stringify(log.details.after, null, 2)}
                              </pre>
                            </div>
                          )}
                          {!log.details.before && !log.details.after && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Details:</p>
                              <pre className="mt-1 overflow-x-auto rounded bg-background-alt p-2 text-xs text-muted-foreground">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Page {auditLogs.data.page} of {auditLogs.data.totalPages} ({auditLogs.data.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={auditLogPage === 1}
                    onClick={() => setAuditLogPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={auditLogPage >= auditLogs.data.totalPages}
                    onClick={() => setAuditLogPage(p => p + 1)}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Staff Management Tab */}
      {tab === "staff" && (
        <>
          <SectionTitle>Staff Management</SectionTitle>
          
          <div className="mt-3 surface-card p-3 space-y-3">
            <p className="text-sm font-semibold">Assign Role</p>
            <Input
              placeholder="User email..."
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={staffRole === "admin" ? "jade" : "outline"}
                onClick={() => setStaffRole("admin")}
              >
                Admin
              </Button>
              <Button
                size="sm"
                variant={staffRole === "finance" ? "jade" : "outline"}
                onClick={() => setStaffRole("finance")}
              >
                Finance
              </Button>
              <Button
                size="sm"
                variant={staffRole === "support" ? "jade" : "outline"}
                onClick={() => setStaffRole("support")}
              >
                Support
              </Button>
            </div>
            <Button
              variant="jade"
              disabled={!staffEmail.trim() || assignRoleAction.isPending}
              onClick={() => assignRoleAction.mutate({ email: staffEmail.trim(), role: staffRole })}
            >
              Assign {staffRole} role
            </Button>
          </div>

          {staffList.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          ) : !staffList.data?.staff.length ? (
            <p className="mt-4 text-sm text-muted-foreground">No staff members found.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {staffList.data.staff.map((member: any) => (
                  <li key={member.userId} className="surface-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{member.email}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {member.roles.map((roleObj: any) => (
                            <span
                              key={roleObj.role}
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize"
                            >
                              {roleObj.role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {member.roles.map((roleObj: any) => 
                          roleObj.role !== "admin" && (
                            <Button
                              key={roleObj.role}
                              size="sm"
                              variant="outline"
                              disabled={removeRoleAction.isPending}
                              onClick={() => removeRoleAction.mutate({ userId: member.userId, role: roleObj.role as "admin" | "finance" | "support" })}
                            >
                              Remove {roleObj.role}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* Wallet Adjustment Dialog */}
      {adjustingUser && (
        <WalletAdjustDialog
          user={adjustingUser}
          onConfirm={(amount, reason) => {
            if (Math.abs(amount) > 100) {
              adjustRequestAction.mutate({ userId: adjustingUser.id, amount, reason });
            } else {
              adjustAction.mutate({ userId: adjustingUser.id, amount, reason });
            }
            setAdjustingUser(null);
          }}
          onCancel={() => setAdjustingUser(null)}
        />
      )}

      {/* Same Device Modal */}
      {selectedDeviceId && (
        <Dialog open={true} onOpenChange={() => setSelectedDeviceId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Users with Same Device</DialogTitle>
              <DialogDescription>
                Device ID: {selectedDeviceId.substring(0, 16)}...
              </DialogDescription>
            </DialogHeader>

            {sameDeviceUsers.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !sameDeviceUsers.data?.users.length ? (
              <p className="text-sm text-muted-foreground">No other users found with this device.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {sameDeviceUsers.data.users.map((u) => (
                  <li key={u.id} className="surface-card p-2">
                    <p className="text-sm font-semibold">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · Balance: {formatMoney(u.walletBalance)} · Earned: {formatMoney(u.lifetimeEarned)}
                      {u.isFlagged && <span className="ml-2 text-destructive font-bold">FLAGGED</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDeviceId(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* User Detail Modal */}
      {selectedUserId && (
        <Dialog open={true} onOpenChange={() => setSelectedUserId(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              {userDetail.isLoading ? (
                <DialogDescription>Loading...</DialogDescription>
              ) : userDetail.data ? (
                <DialogDescription>
                  {userDetail.data.profile.name || userDetail.data.profile.email}
                </DialogDescription>
              ) : null}
            </DialogHeader>

            {userDetail.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading user details...</p>
            ) : !userDetail.data ? (
              <p className="text-sm text-muted-foreground">Failed to load user details</p>
            ) : (
              <div className="space-y-4">
                {/* Tab Switcher */}
                <div className="flex gap-2 overflow-x-auto border-b pb-2">
                  {[
                    ["profile", "Profile"],
                    ["transactions", "Transactions"],
                    ["claims", "Claims"],
                    ["referrals", "Referrals"],
                    ["payouts", "Payout Methods"],
                    ["devices", "Devices"],
                    ["audit", "Audit Log"],
                  ].map(([key, label]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={userDetailTab === key ? "jade" : "outline"}
                      onClick={() => setUserDetailTab(key as any)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {/* Profile Tab */}
                {userDetailTab === "profile" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-medium">{userDetail.data.profile.name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{userDetail.data.profile.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Referral Code</p>
                        <p className="text-sm font-medium">{userDetail.data.profile.referral_code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Referred By</p>
                        <p className="text-sm font-medium">{userDetail.data.profile.referred_by_code || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Wallet Balance</p>
                        <p className="text-sm font-medium text-emerald-600">
                          {formatMoney(userDetail.data.profile.wallet_balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Held Balance</p>
                        <p className="text-sm font-medium text-amber-600">
                          {formatMoney(userDetail.data.profile.held_balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lifetime Earned</p>
                        <p className="text-sm font-medium">{formatMoney(userDetail.data.profile.lifetime_earned)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lifetime Withdrawn</p>
                        <p className="text-sm font-medium">{formatMoney(userDetail.data.profile.lifetime_withdrawn)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Is Flagged</p>
                        <p className="text-sm font-medium">
                          {userDetail.data.profile.is_flagged ? (
                            <span className="text-destructive">Yes</span>
                          ) : (
                            "No"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Created At</p>
                        <p className="text-sm font-medium">
                          {formatDateTime(userDetail.data.profile.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transactions Tab */}
                {userDetailTab === "transactions" && (
                  <div className="space-y-2">
                    {userDetail.data.transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No transactions</p>
                    ) : (
                      <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {userDetail.data.transactions.map((tx: any) => (
                          <li key={tx.id} className="surface-card p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{tx.type}</span>
                              <span
                                className={`font-bold ${tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                              >
                                {tx.amount >= 0 ? "+" : ""}
                                {formatMoney(tx.amount)}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-1">{tx.description || "—"}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">
                              {formatDateTime(tx.created_at)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Claims Tab */}
                {userDetailTab === "claims" && (
                  <div className="space-y-2">
                    {userDetail.data.claims.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No claims</p>
                    ) : (
                      <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {userDetail.data.claims.map((claim: any) => (
                          <li key={claim.id} className="surface-card p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{claim.offer_title}</span>
                              <Badge
                                variant={
                                  claim.status === "approved"
                                    ? "default"
                                    : claim.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {claim.status}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">Payout: {formatMoney(claim.payout)}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">
                              {formatDateTime(claim.created_at)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Referrals Tab */}
                {userDetailTab === "referrals" && (
                  <div className="space-y-2">
                    {userDetail.data.referrals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No referrals</p>
                    ) : (
                      <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {userDetail.data.referrals.map((ref: any) => (
                          <li key={ref.id} className="surface-card p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{ref.referred_name || ref.referred_email}</span>
                              <span
                                className={`font-bold ${ref.is_credited ? "text-emerald-600" : "text-muted-foreground"}`}
                              >
                                {ref.is_credited ? `+${formatMoney(ref.bonus_amount)}` : "Pending"}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              Joined {formatDateTime(ref.created_at)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Payout Methods Tab */}
                {userDetailTab === "payouts" && (
                  <div className="space-y-2">
                    {userDetail.data.payout_methods.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No payout methods</p>
                    ) : (
                      <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {userDetail.data.payout_methods.map((method: any) => (
                          <li key={method.id} className="surface-card p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{method.method_type}</span>
                              {method.is_verified && (
                                <Badge variant="default">Verified</Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-1 font-mono">
                              {method.masked_identifier}
                            </p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">
                              Added {formatDateTime(method.created_at)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Devices Tab */}
                {userDetailTab === "devices" && (
                  <div className="space-y-2">
                    {userDetail.data.devices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No devices</p>
                    ) : (
                      <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {userDetail.data.devices.map((device: any, idx: number) => (
                          <li key={device.device_id || idx} className="surface-card p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium font-mono">{device.device_id}</span>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              {device.platform || "Unknown"} · {device.app_version || "Unknown version"}
                            </p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">
                              Last seen {formatDateTime(device.last_seen_at)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Audit Log Tab */}
                {userDetailTab === "audit" && (
                  <div className="space-y-2">
                    {userDetailAuditLog.isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading audit log...</p>
                    ) : !userDetailAuditLog.data || userDetailAuditLog.data.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No audit log entries</p>
                    ) : (
                      <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {userDetailAuditLog.data.map((entry: any) => (
                          <li key={entry.id} className="surface-card p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{entry.action}</span>
                              <span className="text-muted-foreground text-[10px]">
                                {formatDateTime(entry.created_at)}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              By: {entry.admin_email}
                            </p>
                            {entry.details && (
                              <p className="text-muted-foreground mt-1 text-[10px] font-mono">
                                {typeof entry.details === "string" 
                                  ? entry.details 
                                  : JSON.stringify(entry.details, null, 2)}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUserId(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Broadcast Notification Dialog */}
      {showBroadcastDialog && (
        <Dialog open={true} onOpenChange={() => setShowBroadcastDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Broadcast Notification</DialogTitle>
              <DialogDescription>
                Send a notification to all users or only those active in the last 30 days. Flagged users are excluded.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Title</label>
                <Input
                  placeholder="e.g., New Feature Available"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Message</label>
                <Textarea
                  placeholder="Write your message..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-muted-foreground">{broadcastMessage.length}/500 characters</p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="active-only"
                  checked={broadcastActiveOnly}
                  onCheckedChange={(checked) => setBroadcastActiveOnly(checked === true)}
                />
                <label htmlFor="active-only" className="text-sm cursor-pointer">
                  Send only to users active in last 30 days
                </label>
              </div>

              <div className="rounded-lg bg-amber-500/20 p-3 text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  ⚠️ Rate Limit: 3 broadcasts per hour
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Broadcasts are logged in the audit trail.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="jade"
                onClick={() => {
                  if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
                    toast.error("Title and message are required");
                    return;
                  }
                  broadcastAction.mutate({
                    title: broadcastTitle.trim(),
                    message: broadcastMessage.trim(),
                    activeOnly: broadcastActiveOnly,
                  });
                }}
                disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
              >
                Send Broadcast
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Maintenance Mode Dialog */}
      {showMaintenanceDialog && (
        <Dialog open={true} onOpenChange={() => setShowMaintenanceDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Maintenance Mode</DialogTitle>
              <DialogDescription>
                When enabled, non-admin users will see a maintenance screen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-lg bg-blue-500/20 p-3 text-sm">
                <p className="font-semibold">Current Status</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {maintenanceStatus.data?.enabled 
                    ? "🔧 Maintenance mode is ON" 
                    : "✅ App is running normally"}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold">Maintenance Message (Optional)</label>
                <Textarea
                  placeholder="We are currently performing maintenance..."
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
              </div>

              <div className="rounded-lg bg-amber-500/20 p-3 text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  ⚠️ Admins are never blocked
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You will still have full access during maintenance mode.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>
                Cancel
              </Button>
              {maintenanceStatus.data?.enabled ? (
                <Button
                  variant="jade"
                  onClick={() => {
                    maintenanceModeAction.mutate({
                      enabled: false,
                    });
                  }}
                >
                  Disable Maintenance Mode
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => {
                    maintenanceModeAction.mutate({
                      enabled: true,
                      message: maintenanceMessage.trim() || undefined,
                    });
                  }}
                >
                  Enable Maintenance Mode
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}

// Helper function to download CSV
function downloadCsv(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => 
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-amount text-lg">{value}</p>
    </div>
  );
}

// Fraud Signals Component
function FraudSignals({ withdrawalId }: { withdrawalId: string }) {
  const fetchSignals = useServerFn(getWithdrawalFraudSignals);
  const signals = useQuery({
    queryKey: ["fraud-signals", withdrawalId],
    queryFn: () => fetchSignals({ data: { withdrawalId } }),
  });

  if (signals.isLoading) {
    return <p className="mt-2 text-xs text-muted-foreground">Loading fraud check...</p>;
  }

  if (!signals.data) return null;

  const { riskLevel, accountAgeDays, lifetimeEarned, approvedWithdrawalsCount, isFlagged, deviceDuplicatesCount } = signals.data;

  const riskBadge = {
    high: { bg: "bg-red-500/20", text: "text-red-900 dark:text-red-100", label: "🔴 HIGH RISK" },
    medium: { bg: "bg-amber-500/20", text: "text-amber-900 dark:text-amber-100", label: "🟡 MEDIUM" },
    low: { bg: "bg-green-500/20", text: "text-green-900 dark:text-green-100", label: "🟢 LOW RISK" },
  }[riskLevel];

  return (
    <div className={`mt-2 rounded-lg ${riskBadge.bg} p-2`}>
      <p className={`text-xs font-bold ${riskBadge.text} mb-1`}>{riskBadge.label}</p>
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>• Account age: {accountAgeDays} days</p>
        <p>• Lifetime earned: {formatMoney(lifetimeEarned)}</p>
        <p>• Previous approved: {approvedWithdrawalsCount}</p>
        <p>• Flagged: {isFlagged ? "Yes" : "No"}</p>
        {deviceDuplicatesCount > 1 && <p>• Shared device: {deviceDuplicatesCount} accounts</p>}
      </div>
    </div>
  );
}

// Wallet Adjustment Dialog
function WalletAdjustDialog({
  user,
  onConfirm,
  onCancel,
}: {
  user: { id: string; name: string; email: string };
  onConfirm: (amount: number, reason: string) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(true);

  const handleConfirm = () => {
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount === 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (reason.trim().length < 5) {
      toast.error("Reason must be at least 5 characters");
      return;
    }
    onConfirm(numAmount, reason.trim());
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel();
  };

  const numAmount = Number(amount);
  const isLargeAdjustment = Math.abs(numAmount) > 100;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Wallet Balance</DialogTitle>
          <DialogDescription>
            Adjusting wallet for: {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold">Amount (+ or -)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 50 or -25"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Reason (min 5 characters)</label>
            <Textarea
              placeholder="Explain why this adjustment is needed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-muted-foreground">{reason.length}/200 characters</p>
          </div>

          {isLargeAdjustment && (
            <div className="rounded-lg bg-amber-500/20 p-3 text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                ⚠️ Large Adjustment (${Math.abs(numAmount).toFixed(2)})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This will create an adjustment request requiring approval from a different admin.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="jade"
            onClick={handleConfirm}
            disabled={!numAmount || reason.trim().length < 5}
          >
            {isLargeAdjustment ? "Create Request" : "Apply Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
