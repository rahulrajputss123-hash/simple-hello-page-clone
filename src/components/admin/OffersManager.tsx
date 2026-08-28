import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/States";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatMoney } from "@/lib/coinquest";
import {
  deleteManualOffer,
  listAdminOffers,
  listOfferProviders,
  saveManualOffer,
  updateOfferControls,
} from "@/lib/offers.functions";

type SourceTab = "all" | "manual" | "network";
type StatusFilter = "all" | "active" | "inactive" | "featured" | "expired";

type AdminOffer = Awaited<ReturnType<typeof listAdminOffers>>[number];

const emptyForm = {
  id: undefined as string | undefined,
  title: "",
  description: "",
  requirements: "",
  notAllowed: "",
  icon: "gift",
  rewardAmount: "0",
  networkPayout: "",
  clickUrl: "",
  countries: "",
  devices: "",
  expiresAt: "",
  isActive: true,
  isFeatured: false,
  sortOrder: "0",
  adminPriority: "0",
  // Limited deal
  isLimitedDeal: false,
  dealGroupId: "",
  actualCost: "",
  payoutPercentage: "110",
  maxPayoutCap: "",
  // Payout mode
  payoutMode: "manual" as "manual" | "manual_proof" | "auto_postback",
  postbackSecretRef: "",
  postbackIpAllowlist: "",
};

type FormState = typeof emptyForm;

export function OffersManager() {
  const queryClient = useQueryClient();
  const fetchOffers = useServerFn(listAdminOffers);
  const fetchProviders = useServerFn(listOfferProviders);
  const saveOffer = useServerFn(saveManualOffer);
  const removeOffer = useServerFn(deleteManualOffer);
  const setControls = useServerFn(updateOfferControls);

  const [source, setSource] = useState<SourceTab>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [providerId, setProviderId] = useState<string>("");
  const [country, setCountry] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminOffer | null>(null);

  const providers = useQuery({
    queryKey: ["offer-providers"],
    queryFn: () => fetchProviders({}),
  });

  const offers = useQuery({
    queryKey: ["admin-offers", source, status, search, providerId, country],
    queryFn: () =>
      fetchOffers({
        data: {
          source,
          status,
          limit: 100,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(providerId ? { providerId } : {}),
          ...(country.trim() ? { country: country.trim() } : {}),
        },
      }),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
    void queryClient.invalidateQueries({ queryKey: ["offers"] });
  };
  const onError = (error: Error) => toast.error(error.message);

  const controlsAction = useMutation({
    mutationFn: (input: {
      id: string;
      isActive?: boolean;
      isFeatured?: boolean;
      adminPriority?: number;
      sortOrder?: number;
      rewardAmount?: number;
      revenueShare?: number;
      payoutMode?: "manual" | "manual_proof" | "auto_postback";
      postbackSecretRef?: string | null;
    }) => setControls({ data: input }),
    onSuccess: () => {
      toast.success("Offer updated.");
      refresh();
    },
    onError,
  });

  const saveAction = useMutation({
    mutationFn: (state: FormState) =>
      saveOffer({
        data: {
          ...(state.id ? { id: state.id } : {}),
          title: state.title.trim(),
          description: state.description.trim(),
          requirements: state.requirements.trim(),
          notAllowed: state.notAllowed.trim(),
          icon: state.icon.trim() || "gift",
          rewardAmount: Number(state.rewardAmount) || 0,
          networkPayout: state.networkPayout ? Number(state.networkPayout) : null,
          clickUrl: state.clickUrl.trim() ? state.clickUrl.trim() : null,
          countries: state.countries
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          devices: state.devices
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
          expiresAt: state.expiresAt ? new Date(state.expiresAt).toISOString() : null,
          isActive: state.isActive,
          isFeatured: state.isFeatured,
          sortOrder: Number(state.sortOrder) || 0,
          adminPriority: Number(state.adminPriority) || 0,
          isLimitedDeal: state.isLimitedDeal,
          dealGroupId: state.dealGroupId.trim() || null,
          actualCost: state.actualCost.trim() ? Number(state.actualCost) : null,
          payoutPercentage: Number(state.payoutPercentage) || 110,
          maxPayoutCap: state.maxPayoutCap.trim() ? Number(state.maxPayoutCap) : null,
          payoutMode: state.payoutMode,
          postbackSecretRef: state.postbackSecretRef.trim() || null,
          postbackIpAllowlist: state.postbackIpAllowlist
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Offer saved.");
      setForm(null);
      refresh();
    },
    onError,
  });

  const deleteAction = useMutation({
    mutationFn: (id: string) => removeOffer({ data: { id } }),
    onSuccess: (result) => {
      toast.success(
        result.deleted ? "Offer deleted." : "Offer had claims — deactivated instead of deleted.",
      );
      setPendingDelete(null);
      refresh();
    },
    onError,
  });

  const openEdit = (offer: AdminOffer) =>
    setForm({
      id: offer.id,
      title: offer.title,
      description: offer.description ?? "",
      requirements: offer.requirements ?? "",
      notAllowed: (offer as { not_allowed?: string | null }).not_allowed ?? "",
      icon: offer.icon ?? "gift",
      rewardAmount: String(offer.reward_amount ?? 0),
      networkPayout: offer.network_payout == null ? "" : String(offer.network_payout),
      clickUrl: offer.click_url ?? "",
      countries: (offer.countries ?? []).join(", "),
      devices: (offer.devices ?? []).join(", "),
      expiresAt: offer.expires_at ? offer.expires_at.slice(0, 16) : "",
      isActive: offer.is_active,
      isFeatured: offer.is_featured,
      sortOrder: String(offer.sort_order ?? 0),
      adminPriority: String(offer.admin_priority ?? 0),
      isLimitedDeal: Boolean(
        (offer as { is_limited_deal?: boolean }).is_limited_deal,
      ),
      dealGroupId: (offer as { deal_group_id?: string | null }).deal_group_id ?? "",
      actualCost:
        (offer as { actual_cost?: number | null }).actual_cost != null
          ? String((offer as { actual_cost?: number }).actual_cost)
          : "",
      payoutPercentage: String(
        (offer as { payout_percentage?: number }).payout_percentage ?? 110,
      ),
      maxPayoutCap:
        (offer as { max_payout_cap?: number | null }).max_payout_cap != null
          ? String((offer as { max_payout_cap?: number }).max_payout_cap)
          : "",
      payoutMode:
        ((offer as { payout_mode?: string }).payout_mode as
          | "manual"
          | "manual_proof"
          | "auto_postback"
          | undefined) ?? "manual",
      postbackSecretRef:
        (offer as { postback_secret_ref?: string | null }).postback_secret_ref ?? "",
      postbackIpAllowlist:
        ((offer as { postback_ip_allowlist?: string[] }).postback_ip_allowlist ?? []).join(
          ", ",
        ),
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "manual", "network"] as SourceTab[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={source === key ? "jade" : "outline"}
            onClick={() => setSource(key)}
            className="capitalize"
          >
            {key}
          </Button>
        ))}
        <Button size="sm" variant="gold" className="ml-auto" onClick={() => setForm({ ...emptyForm })}>
          <Plus className="mr-1 h-4 w-4" /> New manual offer
        </Button>
      </div>

      <div className="surface-card space-y-2 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search offer title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "inactive", "featured", "expired"] as StatusFilter[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={status === key ? "mint" : "outline"}
              onClick={() => setStatus(key)}
              className="capitalize"
            >
              {key}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 flex-1 rounded-xl border border-input bg-background px-2 text-sm"
            value={providerId}
            onChange={(event) => setProviderId(event.target.value)}
          >
            <option value="">All providers</option>
            {(providers.data ?? []).map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <Input
            className="h-9 w-28"
            placeholder="GEO (US)"
            value={country}
            maxLength={3}
            onChange={(event) => setCountry(event.target.value.toUpperCase())}
          />
        </div>
      </div>

      {offers.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading offers…</p>
      ) : !offers.data?.length ? (
        <EmptyState
          icon={Plus}
          title="No offers match"
          description="Adjust the filters or create a manual offer."
        />
      ) : (
        <ul className="space-y-2">
          {offers.data.map((offer) => {
            const isNetwork = offer.source === "network";
            const provider = offer.offer_providers as unknown as { name: string } | null;
            return (
              <li key={offer.id} className="surface-card space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{offer.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {isNetwork
                        ? `${provider?.name ?? "Network"} · ID ${offer.external_offer_id}`
                        : "Manual offer"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      isNetwork
                        ? "bg-primary/15 text-primary"
                        : "bg-background-alt text-muted-foreground"
                    }`}
                  >
                    {offer.source}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Reward {formatMoney(offer.reward_amount)}
                  {offer.network_payout != null && ` · payout ${formatMoney(offer.network_payout)}`}
                  {offer.revenue_share != null &&
                    ` · share ${Math.round(Number(offer.revenue_share) * 100)}%`}
                </p>
                <p className="text-xs text-muted-foreground">
                  GEO {offer.countries?.length ? offer.countries.join(", ") : "Any"} · Devices{" "}
                  {offer.devices?.length ? offer.devices.join(", ") : "Any"} · Priority{" "}
                  {offer.admin_priority} · Sort {offer.sort_order}
                </p>
                <p className="text-xs text-muted-foreground">
                  {offer.expires_at ? `Expires ${formatDateTime(offer.expires_at)}` : "No expiry"}
                  {isNetwork &&
                    ` · last synced ${offer.last_seen_at ? formatDateTime(offer.last_seen_at) : "never"}`}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={offer.is_active}
                      onCheckedChange={(value) =>
                        controlsAction.mutate({ id: offer.id, isActive: value })
                      }
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={offer.is_featured}
                      onCheckedChange={(value) =>
                        controlsAction.mutate({ id: offer.id, isFeatured: value })
                      }
                    />
                    Featured
                  </label>
                  <Input
                    className="h-8 w-20"
                    inputMode="numeric"
                    defaultValue={String(offer.admin_priority)}
                    onBlur={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isFinite(next) && next !== offer.admin_priority) {
                        controlsAction.mutate({ id: offer.id, adminPriority: Math.round(next) });
                      }
                    }}
                    aria-label="Priority"
                  />
                  {isNetwork ? (
                    <>
                      <Input
                        className="h-8 w-24"
                        inputMode="decimal"
                        defaultValue={String(offer.reward_amount)}
                        onBlur={(event) => {
                          const next = Number(event.target.value);
                          if (Number.isFinite(next) && next !== Number(offer.reward_amount)) {
                            controlsAction.mutate({ id: offer.id, rewardAmount: next });
                          }
                        }}
                        aria-label="User reward override"
                      />
                      <select
                        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                        data-testid={`network-offer-payout-mode-${offer.id}`}
                        value={
                          ((offer as { payout_mode?: string }).payout_mode as string) ??
                          "manual"
                        }
                        onChange={(event) =>
                          controlsAction.mutate({
                            id: offer.id,
                            payoutMode: event.target.value as
                              | "manual"
                              | "manual_proof"
                              | "auto_postback",
                          })
                        }
                      >
                        <option value="manual">Manual</option>
                        <option value="manual_proof">Manual + proof</option>
                        <option value="auto_postback">Auto postback</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(offer)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingDelete(offer)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit manual offer" : "New manual offer"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <Field label="Title">
                <Input
                  value={form.title}
                  maxLength={120}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </Field>
              <Field label="Task / instructions">
                <Textarea
                  rows={2}
                  value={form.requirements}
                  onChange={(event) => setForm({ ...form, requirements: event.target.value })}
                />
              </Field>
              <Field label="What not to do">
                <Textarea
                  rows={3}
                  placeholder="No VPN, no multiple accounts, no fake data, no emulators…"
                  data-testid="offer-form-not-allowed"
                  value={form.notAllowed}
                  onChange={(event) => setForm({ ...form, notAllowed: event.target.value })}
                />
              </Field>

              {/* --- Limited Deal ------------------------------------------- */}
              <div className="rounded-xl border border-gold/40 bg-gold-gradient/5 p-3">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Switch
                    checked={form.isLimitedDeal}
                    data-testid="offer-form-is-limited-deal"
                    onCheckedChange={(value) => setForm({ ...form, isLimitedDeal: value })}
                  />
                  Limited Deal (self-funded cashback)
                </label>
                {form.isLimitedDeal && (
                  <div className="mt-3 space-y-3">
                    <Field label="Deal group (offers sharing this key lock each other)">
                      <Input
                        placeholder="e.g. hosting-2026"
                        data-testid="offer-form-deal-group"
                        value={form.dealGroupId}
                        onChange={(event) =>
                          setForm({ ...form, dealGroupId: event.target.value })
                        }
                      />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Actual cost ($)">
                        <Input
                          inputMode="decimal"
                          data-testid="offer-form-actual-cost"
                          value={form.actualCost}
                          onChange={(event) =>
                            setForm({ ...form, actualCost: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Payout %">
                        <Input
                          inputMode="decimal"
                          data-testid="offer-form-payout-pct"
                          value={form.payoutPercentage}
                          onChange={(event) =>
                            setForm({ ...form, payoutPercentage: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Max cap ($)">
                        <Input
                          inputMode="decimal"
                          data-testid="offer-form-max-cap"
                          value={form.maxPayoutCap}
                          onChange={(event) =>
                            setForm({ ...form, maxPayoutCap: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <p
                      className="rounded-lg bg-background-alt px-3 py-2 text-xs"
                      data-testid="offer-form-effective-payout"
                    >
                      Effective payout:{" "}
                      <span className="text-amount text-gold-dark">
                        {formatMoney(
                          computeEffective(
                            form.actualCost,
                            form.payoutPercentage,
                            form.maxPayoutCap,
                          ),
                        )}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* --- Payout Mode ------------------------------------------- */}
              <div className="space-y-2 rounded-xl border border-border bg-card p-3">
                <Label className="text-xs text-muted-foreground">Payout mode</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["manual", "Manual review"],
                      ["manual_proof", "Manual + proof"],
                      ["auto_postback", "Auto postback"],
                    ] as const
                  ).map(([key, label]) => (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant={form.payoutMode === key ? "jade" : "outline"}
                      data-testid={`offer-form-payout-mode-${key}`}
                      onClick={() => setForm({ ...form, payoutMode: key })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                {form.payoutMode === "auto_postback" && (
                  <div className="mt-2 space-y-2">
                    <Field label="Signature secret env var name">
                      <Input
                        placeholder="OFFER_ABC_POSTBACK_SECRET"
                        data-testid="offer-form-postback-secret-ref"
                        value={form.postbackSecretRef}
                        onChange={(event) =>
                          setForm({ ...form, postbackSecretRef: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="IP allowlist (comma separated, optional)">
                      <Input
                        placeholder="1.2.3.4, 5.6.7.8"
                        data-testid="offer-form-postback-ip-allowlist"
                        value={form.postbackIpAllowlist}
                        onChange={(event) =>
                          setForm({ ...form, postbackIpAllowlist: event.target.value })
                        }
                      />
                    </Field>
                    <p className="text-[11px] text-muted-foreground">
                      Postback URL:{" "}
                      <code className="rounded bg-background-alt px-1">
                        {typeof window !== "undefined" ? window.location.origin : ""}/api/public/offer-postback/{form.id ?? "{offerId}"}
                      </code>{" "}
                      · signature = HMAC-SHA256(secret, "txn:uid:amount")
                    </p>
                  </div>
                )}
              </div>
              <Field label="Image URL or icon name">
                <Input
                  value={form.icon}
                  onChange={(event) => setForm({ ...form, icon: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="User reward ($)">
                  <Input
                    inputMode="decimal"
                    value={form.rewardAmount}
                    onChange={(event) => setForm({ ...form, rewardAmount: event.target.value })}
                  />
                </Field>
                <Field label="Offer payout ($)">
                  <Input
                    inputMode="decimal"
                    value={form.networkPayout}
                    onChange={(event) => setForm({ ...form, networkPayout: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Click URL">
                <Input
                  placeholder="https://…"
                  value={form.clickUrl}
                  onChange={(event) => setForm({ ...form, clickUrl: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Countries (comma separated)">
                  <Input
                    placeholder="US, IN"
                    value={form.countries}
                    onChange={(event) => setForm({ ...form, countries: event.target.value })}
                  />
                </Field>
                <Field label="Devices (comma separated)">
                  <Input
                    placeholder="android, ios, desktop"
                    value={form.devices}
                    onChange={(event) => setForm({ ...form, devices: event.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Priority">
                  <Input
                    inputMode="numeric"
                    value={form.adminPriority}
                    onChange={(event) => setForm({ ...form, adminPriority: event.target.value })}
                  />
                </Field>
                <Field label="Sort order">
                  <Input
                    inputMode="numeric"
                    value={form.sortOrder}
                    onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Expiry">
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
                />
              </Field>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(value) => setForm({ ...form, isActive: value })}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.isFeatured}
                    onCheckedChange={(value) => setForm({ ...form, isFeatured: value })}
                  />
                  Featured
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              variant="jade"
              disabled={!form || form.title.trim().length < 2 || saveAction.isPending}
              onClick={() => form && saveAction.mutate(form)}
            >
              {saveAction.isPending ? "Saving…" : "Save offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the manual offer. If users already claimed it, the offer is deactivated
              instead so claim history stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteAction.mutate(pendingDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Client-side preview only — the server enforces the real reward on save/approval. */
function computeEffective(cost: string, pct: string, cap: string): number {
  const c = Number(cost);
  const p = Number(pct);
  const k = cap.trim() === "" ? null : Number(cap);
  if (!Number.isFinite(c) || c <= 0) return 0;
  const raw = (c * (Number.isFinite(p) ? p : 110)) / 100;
  const capped = k != null && Number.isFinite(k) ? Math.min(raw, k) : raw;
  return Math.max(0, Math.round(capped * 100) / 100);
}
