import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DollarSign, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMarketplaceSettings,
  updateMarketplaceSettings,
} from "@/lib/marketplace/admin-settings.server";

export function MarketplaceSettingsPanel() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getMarketplaceSettings);
  const updateSettings = useServerFn(updateMarketplaceSettings);

  const settings = useQuery({
    queryKey: ["marketplace-settings"],
    queryFn: () => fetchSettings(),
  });

  const [localAutoApproveEnabled, setLocalAutoApproveEnabled] = useState<boolean | null>(null);
  const [localAutoApproveMinutes, setLocalAutoApproveMinutes] = useState<number | null>(null);
  const [localSkipFirstCampaign, setLocalSkipFirstCampaign] = useState<boolean | null>(null);

  // Fee settings local state
  const [localFeesEnabled, setLocalFeesEnabled] = useState<boolean | null>(null);
  const [localCampaignFeeUsd, setLocalCampaignFeeUsd] = useState<number | null>(null);
  const [localCampaignFeeType, setLocalCampaignFeeType] = useState<
    "per_campaign" | "per_slot" | null
  >(null);
  const [localFeaturedPricePerDay, setLocalFeaturedPricePerDay] = useState<number | null>(null);

  // Deposit settings local state
  const [localDepositsEnabled, setLocalDepositsEnabled] = useState<boolean | null>(null);
  const [localManualDepositsEnabled, setLocalManualDepositsEnabled] = useState<boolean | null>(
    null,
  );
  const [localInrPerUsd, setLocalInrPerUsd] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (updates: {
      auto_approve_enabled?: boolean;
      auto_approve_after_minutes?: number;
      auto_approve_skip_first_campaign?: boolean;
      fees_enabled?: boolean;
      campaign_fee_usd?: number;
      campaign_fee_type?: "per_campaign" | "per_slot";
      featured_price_per_day?: number;
      deposits_enabled?: boolean;
      manual_deposits_enabled?: boolean;
    }) => updateSettings({ data: updates }),
    onSuccess: () => {
      toast.success("Settings updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["marketplace-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["advertiser-overview"] });
      setLocalAutoApproveEnabled(null);
      setLocalAutoApproveMinutes(null);
      setLocalSkipFirstCampaign(null);
      setLocalFeesEnabled(null);
      setLocalCampaignFeeUsd(null);
      setLocalCampaignFeeType(null);
      setLocalFeaturedPricePerDay(null);
      setLocalDepositsEnabled(null);
      setLocalManualDepositsEnabled(null);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to update settings";
      toast.error("Update failed", { description: msg });
    },
  });

  if (settings.isPending) {
    return (
      <div className="space-y-3">
        <SectionTitle>
          <Settings className="size-5" />
          Auto-approval settings
        </SectionTitle>
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (settings.isError || !settings.data) {
    return (
      <div className="space-y-3">
        <SectionTitle>
          <Settings className="size-5" />
          Auto-approval settings
        </SectionTitle>
        <p className="surface-card p-4 text-sm text-destructive">
          Failed to load settings.
          {settings.error && (
            <>
              <br />
              {String(settings.error)}
            </>
          )}
        </p>
      </div>
    );
  }

  const autoApproveEnabled = localAutoApproveEnabled ?? settings.data.auto_approve_enabled ?? false;
  const autoApproveMinutes =
    localAutoApproveMinutes ?? settings.data.auto_approve_after_minutes ?? 10;
  const skipFirstCampaign =
    localSkipFirstCampaign ?? settings.data.auto_approve_skip_first_campaign ?? true;

  const feesEnabled = localFeesEnabled ?? settings.data.fees_enabled ?? false;
  const campaignFeeUsd = localCampaignFeeUsd ?? settings.data.campaign_fee_usd ?? 0.5;
  const campaignFeeType = localCampaignFeeType ?? settings.data.campaign_fee_type ?? "per_campaign";
  const featuredPricePerDay =
    localFeaturedPricePerDay ?? settings.data.featured_price_per_day ?? 2.0;

  const depositsEnabled = localDepositsEnabled ?? settings.data.deposits_enabled ?? false;
  const manualDepositsEnabled =
    localManualDepositsEnabled ?? settings.data.manual_deposits_enabled ?? false;
  const inrPerUsd = localInrPerUsd ?? settings.data.inr_per_usd ?? null;

  const hasChanges =
    localAutoApproveEnabled !== null ||
    localAutoApproveMinutes !== null ||
    localSkipFirstCampaign !== null ||
    localFeesEnabled !== null ||
    localCampaignFeeUsd !== null ||
    localCampaignFeeType !== null ||
    localFeaturedPricePerDay !== null ||
    localDepositsEnabled !== null ||
    localManualDepositsEnabled !== null ||
    localInrPerUsd !== null;

  return (
    <div className="space-y-6">
      {/* Auto-approval settings */}
      <div className="space-y-3">
        <SectionTitle>
          <Settings className="size-5" />
          Auto-approval settings
        </SectionTitle>

        <div className="surface-card space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="auto-approve-enabled" className="text-sm font-semibold">
                Auto-approve pending campaigns
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically approve campaigns that wait too long in the review queue
              </p>
            </div>
            <Switch
              id="auto-approve-enabled"
              checked={autoApproveEnabled}
              onCheckedChange={(checked) => setLocalAutoApproveEnabled(checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-approve-minutes" className="text-sm font-semibold">
              Auto-approve after (minutes)
            </Label>
            <Input
              id="auto-approve-minutes"
              type="number"
              min={1}
              max={120}
              value={autoApproveMinutes}
              onChange={(e) => setLocalAutoApproveMinutes(parseInt(e.target.value, 10))}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Range: 1-120 minutes. Default: 10 minutes.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="skip-first-campaign" className="text-sm font-semibold">
                Always review an advertiser's first campaign manually
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, first campaigns are never auto-approved
              </p>
            </div>
            <Switch
              id="skip-first-campaign"
              checked={skipFirstCampaign}
              onCheckedChange={(checked) => setLocalSkipFirstCampaign(checked)}
            />
          </div>
        </div>
      </div>

      {/* Fee settings */}
      <div className="space-y-3">
        <SectionTitle>
          <DollarSign className="size-5" />
          Campaign fee settings
        </SectionTitle>

        <div className="surface-card space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="fees-enabled" className="text-sm font-semibold">
                Enable campaign fees
              </Label>
              <p className="text-xs text-muted-foreground">
                Charge an additional fee when campaigns are submitted
              </p>
            </div>
            <Switch
              id="fees-enabled"
              checked={feesEnabled}
              onCheckedChange={(checked) => setLocalFeesEnabled(checked)}
            />
          </div>

          {feesEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="campaign-fee-usd" className="text-sm font-semibold">
                  Campaign fee (USD)
                </Label>
                <Input
                  id="campaign-fee-usd"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={campaignFeeUsd}
                  onChange={(e) => setLocalCampaignFeeUsd(parseFloat(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Range: $0.00-$100.00. Default: $0.50
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-fee-type" className="text-sm font-semibold">
                  Fee type
                </Label>
                <Select
                  value={campaignFeeType}
                  onValueChange={(value: "per_campaign" | "per_slot") =>
                    setLocalCampaignFeeType(value)
                  }
                >
                  <SelectTrigger id="campaign-fee-type" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_campaign">Per campaign</SelectItem>
                    <SelectItem value="per_slot">Per slot</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Per campaign: one-time fee. Per slot: fee × number of slots.
                </p>
              </div>
            </>
          )}

          <div className="space-y-2 border-t border-border pt-4">
            <Label htmlFor="featured-price-per-day" className="text-sm font-semibold">
              Featured placement price per day (USD)
            </Label>
            <Input
              id="featured-price-per-day"
              type="number"
              min={0}
              max={1000}
              step={0.01}
              value={featuredPricePerDay}
              onChange={(e) => setLocalFeaturedPricePerDay(parseFloat(e.target.value))}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">Range: $0.00-$1000.00. Default: $2.00</p>
          </div>
        </div>
      </div>

      {/* Deposit settings */}
      <div className="space-y-3">
        <SectionTitle>
          <DollarSign className="size-5" />
          Deposit gateway settings
        </SectionTitle>

        <div className="surface-card space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="deposits-enabled" className="text-sm font-semibold">
                Enable all deposits
              </Label>
              <p className="text-xs text-muted-foreground">
                Master switch for deposit functionality (all gateways)
              </p>
            </div>
            <Switch
              id="deposits-enabled"
              checked={depositsEnabled}
              onCheckedChange={(checked) => setLocalDepositsEnabled(checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="manual-deposits-enabled" className="text-sm font-semibold">
                Enable manual deposits
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow admins to manually credit advertiser deposits
              </p>
            </div>
            <Switch
              id="manual-deposits-enabled"
              checked={manualDepositsEnabled}
              onCheckedChange={(checked) => setLocalManualDepositsEnabled(checked)}
            />
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label htmlFor="inr-per-usd" className="text-sm font-semibold">
              INR per USD exchange rate
            </Label>
            <Input
              id="inr-per-usd"
              type="number"
              min={0}
              step={0.01}
              placeholder="Leave empty to disable INR"
              value={inrPerUsd ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setLocalInrPerUsd(value === "" ? null : parseFloat(value));
              }}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              When set, enables UPI (QroPay) and INR-based Razorpay. Leave empty to disable.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Gateway availability: Razorpay (configured via RAZORPAY_KEY_ID/SECRET), NOWPayments
            (configured via NOWPAYMENTS_API_KEY/IPN_SECRET). Buttons appear only when the gateway
            is configured and deposits_enabled is true.
          </p>
        </div>
      </div>

      {/* Save/Cancel buttons */}
      {hasChanges && (
        <div className="flex gap-2 border-t border-border pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLocalAutoApproveEnabled(null);
              setLocalAutoApproveMinutes(null);
              setLocalSkipFirstCampaign(null);
              setLocalFeesEnabled(null);
              setLocalCampaignFeeUsd(null);
              setLocalCampaignFeeType(null);
              setLocalFeaturedPricePerDay(null);
              setLocalDepositsEnabled(null);
              setLocalManualDepositsEnabled(null);
              setLocalInrPerUsd(null);
            }}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              const updates: {
                auto_approve_enabled?: boolean;
                auto_approve_after_minutes?: number;
                auto_approve_skip_first_campaign?: boolean;
                fees_enabled?: boolean;
                campaign_fee_usd?: number;
                campaign_fee_type?: "per_campaign" | "per_slot";
                featured_price_per_day?: number;
                deposits_enabled?: boolean;
                manual_deposits_enabled?: boolean;
                inr_per_usd?: number | null;
              } = {};
              if (localAutoApproveEnabled !== null)
                updates.auto_approve_enabled = localAutoApproveEnabled;
              if (localAutoApproveMinutes !== null)
                updates.auto_approve_after_minutes = localAutoApproveMinutes;
              if (localSkipFirstCampaign !== null)
                updates.auto_approve_skip_first_campaign = localSkipFirstCampaign;
              if (localFeesEnabled !== null) updates.fees_enabled = localFeesEnabled;
              if (localCampaignFeeUsd !== null) updates.campaign_fee_usd = localCampaignFeeUsd;
              if (localCampaignFeeType !== null) updates.campaign_fee_type = localCampaignFeeType;
              if (localFeaturedPricePerDay !== null)
                updates.featured_price_per_day = localFeaturedPricePerDay;
              if (localDepositsEnabled !== null) updates.deposits_enabled = localDepositsEnabled;
              if (localManualDepositsEnabled !== null)
                updates.manual_deposits_enabled = localManualDepositsEnabled;
              if (localInrPerUsd !== null) updates.inr_per_usd = localInrPerUsd;
              mutation.mutate(updates);
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
