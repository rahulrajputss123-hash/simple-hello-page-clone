import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Globe, RefreshCw, X } from "lucide-react";

import { SectionTitle, EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/coinquest";
import {
  adminRefreshFeed,
  getFeedAutomation,
  updateFeedSettings,
  updateNetworkFeedSettings,
} from "@/lib/offers.functions";

type FallbackBehavior = "none" | "default_country";

export function OfferFeedAutomationPanel() {
  const queryClient = useQueryClient();
  const fetchAutomation = useServerFn(getFeedAutomation);
  const saveSettings = useServerFn(updateFeedSettings);
  const saveNetwork = useServerFn(updateNetworkFeedSettings);
  const refreshNow = useServerFn(adminRefreshFeed);

  const automation = useQuery({
    queryKey: ["offer-feed-automation"],
    queryFn: () => fetchAutomation({}),
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["offer-feed-automation"] });

  // Global settings local form state
  const [refreshHours, setRefreshHours] = useState("5");
  const [defaultCountry, setDefaultCountry] = useState("US");
  const [fallback, setFallback] = useState<FallbackBehavior>("default_country");
  const [featuredSlots, setFeaturedSlots] = useState("3");

  useEffect(() => {
    const s = automation.data?.settings;
    if (!s) return;
    setRefreshHours(String(s.refreshIntervalHours));
    setDefaultCountry(s.defaultCountry);
    setFallback(s.fallbackBehavior);
    setFeaturedSlots(String(s.featuredSlots));
  }, [automation.data?.settings]);

  const settingsMutation = useMutation({
    mutationFn: () =>
      saveSettings({
        data: {
          refreshIntervalHours: Number(refreshHours),
          defaultCountry: defaultCountry.trim().toUpperCase(),
          fallbackBehavior: fallback,
          featuredSlots: Number(featuredSlots),
        },
      }),
    onSuccess: () => {
      toast.success("Feed automation settings saved.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const networkMutation = useMutation({
    mutationFn: (input: { providerId: string; enabled: boolean; maxOffers: number; weight: number }) =>
      saveNetwork({ data: input }),
    onSuccess: () => {
      toast.success("Network settings saved.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refreshMutation = useMutation({
    mutationFn: (providerId: string) => refreshNow({ data: { providerId } }),
    onSuccess: (r) => {
      toast.success(`Refreshed ${r.provider} (${r.country}): ${r.count} offers cached.`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4" data-testid="offer-feed-automation-panel">
      <SectionTitle>Global feed settings</SectionTitle>
      <div className="surface-card space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="refresh-hours">Refresh interval (hours)</Label>
            <Input
              id="refresh-hours"
              data-testid="feed-refresh-interval-input"
              type="number"
              min={1}
              max={168}
              value={refreshHours}
              onChange={(e) => setRefreshHours(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="default-country">Default country</Label>
            <Input
              id="default-country"
              data-testid="feed-default-country-input"
              maxLength={2}
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value.toUpperCase())}
              placeholder="US"
            />
          </div>
          <div>
            <Label htmlFor="featured-slots">Featured slots</Label>
            <Input
              id="featured-slots"
              data-testid="feed-featured-slots-input"
              type="number"
              min={1}
              max={24}
              value={featuredSlots}
              onChange={(e) => setFeaturedSlots(e.target.value)}
            />
          </div>
          <div>
            <Label>Zero-offer fallback</Label>
            <Select value={fallback} onValueChange={(v) => setFallback(v as FallbackBehavior)}>
              <SelectTrigger data-testid="feed-fallback-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Show nothing</SelectItem>
                <SelectItem value="default_country">Fall back to default country</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="jade"
          data-testid="feed-save-settings-button"
          disabled={settingsMutation.isPending}
          onClick={() => settingsMutation.mutate()}
        >
          {settingsMutation.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>

      <SectionTitle>Networks</SectionTitle>
      {automation.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !automation.data?.providers.length ? (
        <EmptyState
          icon={Globe}
          title="No networks connected"
          description="Connect a network under the Networks tab first."
        />
      ) : (
        <ul className="space-y-2">
          {automation.data.providers.map((p) => (
            <NetworkRow
              key={p.id}
              provider={p}
              onSave={(input) => networkMutation.mutate(input)}
              onRefresh={() => refreshMutation.mutate(p.id)}
              saving={networkMutation.isPending}
              refreshing={refreshMutation.isPending && refreshMutation.variables === p.id}
            />
          ))}
        </ul>
      )}

      <SectionTitle>Cached country feeds</SectionTitle>
      {!automation.data?.cache.length ? (
        <EmptyState
          title="No cached feeds yet"
          description="Feeds populate as users from a country browse, or after a manual refresh / cron run."
        />
      ) : (
        <ul className="space-y-2">
          {automation.data.cache.map((c) => {
            const providerName =
              automation.data?.providers.find((p) => p.id === c.providerId)?.name ?? "Network";
            const expired = new Date(c.expiresAt).getTime() <= Date.now();
            return (
              <li
                key={`${c.providerId}-${c.country}`}
                className="surface-card flex items-center justify-between p-3"
                data-testid={`feed-cache-row-${c.country}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {providerName} · {c.country}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.offerCount} offers · synced {formatDateTime(c.lastSyncedAt)}
                  </p>
                  {c.syncError && <p className="text-xs text-destructive">{c.syncError}</p>}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    expired ? "bg-background-alt text-muted-foreground" : "bg-background-alt text-primary"
                  }`}
                >
                  {expired ? "expired" : "fresh"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type ProviderRow = {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  maxOffers: number;
  weight: number;
  hasAdapter: boolean;
  lastSyncedAt: string | null;
};

function NetworkRow({
  provider,
  onSave,
  onRefresh,
  saving,
  refreshing,
}: {
  provider: ProviderRow;
  onSave: (input: { providerId: string; enabled: boolean; maxOffers: number; weight: number }) => void;
  onRefresh: () => void;
  saving: boolean;
  refreshing: boolean;
}) {
  const [enabled, setEnabled] = useState(provider.enabled);
  const [maxOffers, setMaxOffers] = useState(String(provider.maxOffers));
  const [weight, setWeight] = useState(String(provider.weight));

  useEffect(() => {
    setEnabled(provider.enabled);
    setMaxOffers(String(provider.maxOffers));
    setWeight(String(provider.weight));
  }, [provider.enabled, provider.maxOffers, provider.weight]);

  return (
    <li className="surface-card space-y-3 p-3" data-testid={`feed-network-${provider.slug}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{provider.name}</p>
          <p className="text-xs text-muted-foreground">
            {provider.slug} ·{" "}
            {provider.hasAdapter ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <Check className="size-3" /> adapter ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-destructive">
                <X className="size-3" /> no adapter
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`enable-${provider.id}`} className="text-xs">
            {enabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id={`enable-${provider.id}`}
            data-testid={`feed-network-enable-${provider.slug}`}
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`max-${provider.id}`}>Max offers</Label>
          <Input
            id={`max-${provider.id}`}
            data-testid={`feed-network-max-${provider.slug}`}
            type="number"
            min={1}
            max={50}
            value={maxOffers}
            onChange={(e) => setMaxOffers(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`weight-${provider.id}`}>Priority weight</Label>
          <Input
            id={`weight-${provider.id}`}
            data-testid={`feed-network-weight-${provider.slug}`}
            type="number"
            min={0.01}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="jade"
          data-testid={`feed-network-save-${provider.slug}`}
          disabled={saving}
          onClick={() =>
            onSave({
              providerId: provider.id,
              enabled,
              maxOffers: Number(maxOffers),
              weight: Number(weight),
            })
          }
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          data-testid={`feed-network-refresh-${provider.slug}`}
          disabled={refreshing || !provider.hasAdapter}
          onClick={onRefresh}
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh now"}
        </Button>
      </div>
    </li>
  );
}
