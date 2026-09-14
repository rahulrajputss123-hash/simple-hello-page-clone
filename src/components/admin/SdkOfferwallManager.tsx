import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState, SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteSdkProvider,
  listAdminSdkProviders,
  requestOfferwallLogoUploadUrl,
  saveSdkProvider,
  updateSdkProviderControls,
} from "@/lib/sdk-offerwall.functions";
import type { SdkProviderInput } from "@/lib/sdk-offerwall/types";

const PLATFORMS = ["android", "ios", "web"] as const;
const INTEGRATION_TYPES = ["placeholder", "native_sdk", "web_sdk", "hybrid", "api"] as const;
const STATUSES = ["draft", "configured", "testing", "live", "disabled"] as const;
const ROUNDING = ["nearest", "floor", "ceil"] as const;
const IDENTITY_MODES = ["user_uuid", "hashed_uuid", "referral_code", "custom"] as const;
const DEDUPE = ["transaction_id", "transaction_id_and_user", "payload_hash"] as const;
const AUTH_MODES = ["none", "signature", "ip_allowlist", "signature_and_ip"] as const;

const EMPTY: SdkProviderInput = {
  slug: "",
  name: "",
  tagline: "",
  lockType: "none",
  unlockAt: null,
  requiredLifetimeEarned: null,
  logoUrl: "",
  enabled: false,
  displayOrder: 0,
  platforms: ["android"],
  integrationType: "placeholder",
  sdkVersion: "",
  appId: "",
  placementId: "",
  publisherId: "",
  extraConfig: {},
  secretRefs: {},
  currencyName: "coins",
  currencyPerUsd: 100,
  rewardMultiplier: 1,
  minReward: 0,
  maxReward: null,
  roundingMode: "nearest",
  postbackPath: "",
  postbackAuthMode: "none",
  postbackSignatureSecretRef: "",
  postbackIpAllowlist: [],
  transactionIdParam: "transaction_id",
  userIdParam: "sub_id",
  rewardParam: "amount",
  userIdentityMode: "user_uuid",
  userIdentitySaltRef: "",
  dedupeStrategy: "transaction_id",
  dedupeWindowHours: 720,
  status: "draft",
  notes: "",
  metadata: {},
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <select
      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function SdkOfferwallManager() {
  const queryClient = useQueryClient();
  const fetchProviders = useServerFn(listAdminSdkProviders);
  const save = useServerFn(saveSdkProvider);
  const setControls = useServerFn(updateSdkProviderControls);
  const remove = useServerFn(deleteSdkProvider);

  const [form, setForm] = useState<SdkProviderInput | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const requestUpload = useServerFn(requestOfferwallLogoUploadUrl);

  const handleLogoFile = async (file: File) => {
    if (!form) return;
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("File must be under 3 MB.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const { uploadUrl, token, publicUrl } = await requestUpload({
        data: { filename: file.name.slice(0, 120) },
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      patch({ logoUrl: publicUrl });
      toast.success("Logo uploaded.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const providers = useQuery({
    queryKey: ["sdk-offerwall-providers"],
    queryFn: () => fetchProviders({}),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["sdk-offerwall-providers"] });
    void queryClient.invalidateQueries({ queryKey: ["sdk-offerwall-public"] });
  };
  const onError = (error: Error) => toast.error(error.message);

  const saveMutation = useMutation({
    mutationFn: (input: SdkProviderInput) => save({ data: input }),
    onSuccess: () => {
      toast.success("SDK provider saved.");
      setForm(null);
      refresh();
    },
    onError,
  });

  const controlMutation = useMutation({
    mutationFn: (input: {
      id: string;
      enabled?: boolean;
      status?: string;
      displayOrder?: number;
    }) => setControls({ data: input }),
    onSuccess: refresh,
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("SDK provider removed.");
      refresh();
    },
    onError,
  });

  const patch = (values: Partial<SdkProviderInput>) =>
    setForm((current) => (current ? { ...current, ...values } : current));

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        <SectionTitle>SDK Offerwalls</SectionTitle>
        <Button size="sm" onClick={() => setForm({ ...EMPTY })}>
          New provider
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Provider-agnostic SDK offerwall configuration. Separate from the Offer Feed networks. No SDK
        is integrated yet — enabled providers show as configured slots in the app.
      </p>

      {form && (
        <div className="surface-card grid gap-3 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => patch({ slug: e.target.value })} />
            </Field>
            <Field label="Tagline">
              <Input value={form.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
            </Field>
            <Field label="Logo URL">
              <div className="flex items-center gap-2">
                <Input
                  value={form.logoUrl ?? ""}
                  placeholder="https://… or upload"
                  onChange={(e) => {
                    setUploadError(null);
                    patch({ logoUrl: e.target.value });
                  }}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleLogoFile(f);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? "…" : <Upload className="size-4" />}
                </Button>
              </div>
              {uploadError && <p className="mt-1 text-xs text-destructive">{uploadError}</p>}
            </Field>
            <Field label="Display order">
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => patch({ displayOrder: Number(e.target.value) })}
              />
            </Field>
            <Field label="Integration type">
              <Select
                value={form.integrationType}
                options={INTEGRATION_TYPES}
                onChange={(integrationType) => patch({ integrationType })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                options={STATUSES}
                onChange={(status) => patch({ status })}
              />
            </Field>
            <Field label="SDK version">
              <Input
                value={form.sdkVersion ?? ""}
                onChange={(e) => patch({ sdkVersion: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => patch({ enabled: e.target.checked })}
              />
              Enabled
            </label>
            {PLATFORMS.map((platform) => (
              <label key={platform} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.platforms.includes(platform)}
                  onChange={(e) =>
                    patch({
                      platforms: e.target.checked
                        ? [...form.platforms, platform]
                        : form.platforms.filter((p) => p !== platform),
                    })
                  }
                />
                {platform}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="App ID">
              <Input value={form.appId ?? ""} onChange={(e) => patch({ appId: e.target.value })} />
            </Field>
            <Field label="Placement ID">
              <Input
                value={form.placementId ?? ""}
                onChange={(e) => patch({ placementId: e.target.value })}
              />
            </Field>
            <Field label="Publisher ID">
              <Input
                value={form.publisherId ?? ""}
                onChange={(e) => patch({ publisherId: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Currency name">
              <Input
                value={form.currencyName}
                onChange={(e) => patch({ currencyName: e.target.value })}
              />
            </Field>
            <Field label="Currency per USD">
              <Input
                type="number"
                value={form.currencyPerUsd}
                onChange={(e) => patch({ currencyPerUsd: Number(e.target.value) })}
              />
            </Field>
            <Field label="Reward multiplier">
              <Input
                type="number"
                step="0.01"
                value={form.rewardMultiplier}
                onChange={(e) => patch({ rewardMultiplier: Number(e.target.value) })}
              />
            </Field>
            <Field label="Min reward">
              <Input
                type="number"
                step="0.01"
                value={form.minReward}
                onChange={(e) => patch({ minReward: Number(e.target.value) })}
              />
            </Field>
            <Field label="Max reward">
              <Input
                type="number"
                step="0.01"
                value={form.maxReward ?? ""}
                onChange={(e) =>
                  patch({ maxReward: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Rounding">
              <Select
                value={form.roundingMode}
                options={ROUNDING}
                onChange={(roundingMode) => patch({ roundingMode })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Postback path">
              <Input
                value={form.postbackPath ?? ""}
                onChange={(e) => patch({ postbackPath: e.target.value })}
              />
            </Field>
            <Field label="Postback auth mode">
              <Select
                value={form.postbackAuthMode}
                options={AUTH_MODES}
                onChange={(postbackAuthMode) => patch({ postbackAuthMode })}
              />
            </Field>
            <Field label="Signature secret name (reference only)">
              <Input
                value={form.postbackSignatureSecretRef ?? ""}
                onChange={(e) => patch({ postbackSignatureSecretRef: e.target.value })}
              />
            </Field>
            <Field label="IP allowlist (comma separated)">
              <Input
                value={form.postbackIpAllowlist.join(",")}
                onChange={(e) =>
                  patch({
                    postbackIpAllowlist: e.target.value
                      .split(",")
                      .map((ip) => ip.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Transaction ID param">
              <Input
                value={form.transactionIdParam}
                onChange={(e) => patch({ transactionIdParam: e.target.value })}
              />
            </Field>
            <Field label="User ID param">
              <Input
                value={form.userIdParam}
                onChange={(e) => patch({ userIdParam: e.target.value })}
              />
            </Field>
            <Field label="Reward param">
              <Input
                value={form.rewardParam}
                onChange={(e) => patch({ rewardParam: e.target.value })}
              />
            </Field>
            <Field label="User identity mode">
              <Select
                value={form.userIdentityMode}
                options={IDENTITY_MODES}
                onChange={(userIdentityMode) => patch({ userIdentityMode })}
              />
            </Field>
            <Field label="Identity salt secret name">
              <Input
                value={form.userIdentitySaltRef ?? ""}
                onChange={(e) => patch({ userIdentitySaltRef: e.target.value })}
              />
            </Field>
            <Field label="Dedupe strategy">
              <Select
                value={form.dedupeStrategy}
                options={DEDUPE}
                onChange={(dedupeStrategy) => patch({ dedupeStrategy })}
              />
            </Field>
            <Field label="Dedupe window (hours)">
              <Input
                type="number"
                value={form.dedupeWindowHours}
                onChange={(e) => patch({ dedupeWindowHours: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </Field>

          {/* Lock condition */}
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
            <p className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              🔒 Lock condition
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Lock type">
                <Select
                  value={form.lockType ?? "none"}
                  options={["none", "time", "earning"] as const}
                  onChange={(lockType) =>
                    patch({ lockType, unlockAt: null, requiredLifetimeEarned: null })
                  }
                />
              </Field>
              {form.lockType === "time" && (
                <Field label="Unlock at (UTC)">
                  <Input
                    type="datetime-local"
                    value={form.unlockAt ? new Date(form.unlockAt).toISOString().slice(0, 16) : ""}
                    onChange={(e) =>
                      patch({
                        unlockAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </Field>
              )}
              {form.lockType === "earning" && (
                <Field label="Required lifetime earned ($)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 5.00"
                    value={form.requiredLifetimeEarned ?? ""}
                    onChange={(e) =>
                      patch({
                        requiredLifetimeEarned:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}
            >
              Save provider
            </Button>
            <Button size="sm" variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {providers.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading SDK providers…</p>
      ) : !providers.data?.length ? (
        <EmptyState title="No SDK providers" description="Add your first SDK offerwall provider." />
      ) : (
        <div className="grid gap-2">
          {providers.data.map((provider) => (
            <article key={provider.id} className="surface-card grid gap-2 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {provider.name}{" "}
                    <span className="text-xs text-muted-foreground">({provider.slug})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {provider.tagline || "—"} · {provider.integration_type} ·{" "}
                    {provider.platforms.join("/")} · order {provider.display_order}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {provider.currency_name} @ {provider.currency_per_usd}/USD · dedupe{" "}
                    {provider.dedupe_strategy} · identity {provider.user_identity_mode} ·{" "}
                    {provider.hasAdapter ? "adapter registered" : "no adapter yet"}
                  </p>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(provider as any).lock_type !== "none" && (
                    <p className="text-xs text-amber-600">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      🔒{" "}
                      {(provider as any).lock_type === "time"
                        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          `Until ${new Date(String((provider as any).unlock_at)).toLocaleDateString()}`
                        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          `Earn $${Number((provider as any).required_lifetime_earned).toFixed(2)}`}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">{provider.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={provider.enabled ? "secondary" : "outline"}
                  onClick={() =>
                    controlMutation.mutate({ id: provider.id, enabled: !provider.enabled })
                  }
                >
                  {provider.enabled ? "Enabled" : "Disabled"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      id: provider.id,
                      slug: provider.slug,
                      name: provider.name,
                      tagline: provider.tagline,
                      logoUrl: provider.logo_url ?? "",
                      enabled: provider.enabled,
                      displayOrder: provider.display_order,
                      platforms: provider.platforms as SdkProviderInput["platforms"],
                      integrationType:
                        provider.integration_type as SdkProviderInput["integrationType"],
                      sdkVersion: provider.sdk_version ?? "",
                      appId: provider.app_id ?? "",
                      placementId: provider.placement_id ?? "",
                      publisherId: provider.publisher_id ?? "",
                      extraConfig: provider.extra_config,
                      secretRefs: provider.secret_refs,
                      currencyName: provider.currency_name,
                      currencyPerUsd: Number(provider.currency_per_usd),
                      rewardMultiplier: Number(provider.reward_multiplier),
                      minReward: Number(provider.min_reward),
                      maxReward: provider.max_reward == null ? null : Number(provider.max_reward),
                      roundingMode: provider.rounding_mode as SdkProviderInput["roundingMode"],
                      postbackPath: provider.postback_path ?? "",
                      postbackAuthMode:
                        provider.postback_auth_mode as SdkProviderInput["postbackAuthMode"],
                      postbackSignatureSecretRef: provider.postback_signature_secret_ref ?? "",
                      postbackIpAllowlist: provider.postback_ip_allowlist,
                      transactionIdParam: provider.transaction_id_param,
                      userIdParam: provider.user_id_param,
                      rewardParam: provider.reward_param,
                      userIdentityMode:
                        provider.user_identity_mode as SdkProviderInput["userIdentityMode"],
                      userIdentitySaltRef: provider.user_identity_salt_ref ?? "",
                      dedupeStrategy:
                        provider.dedupe_strategy as SdkProviderInput["dedupeStrategy"],
                      dedupeWindowHours: provider.dedupe_window_hours,
                      status: provider.status as SdkProviderInput["status"],
                      notes: provider.notes,
                      metadata: provider.metadata,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      lockType: ((provider as any).lock_type ?? "none") as
                        "none" | "time" | "earning",
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      unlockAt: ((provider as any).unlock_at as string | null) ?? null,
                      requiredLifetimeEarned:
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (provider as any).required_lifetime_earned != null
                          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            Number((provider as any).required_lifetime_earned)
                          : null,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteMutation.mutate(provider.id)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
