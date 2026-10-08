import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
    queryFn: () => fetchSettings({}),
  });

  const [localAutoApproveEnabled, setLocalAutoApproveEnabled] = useState<boolean | null>(null);
  const [localAutoApproveMinutes, setLocalAutoApproveMinutes] = useState<number | null>(null);
  const [localSkipFirstCampaign, setLocalSkipFirstCampaign] = useState<boolean | null>(null);

  const mutation = useMutation({
    mutationFn: (updates: {
      auto_approve_enabled?: boolean;
      auto_approve_after_minutes?: number;
      auto_approve_skip_first_campaign?: boolean;
    }) => updateSettings({ data: updates }),
    onSuccess: () => {
      toast.success("Settings updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["marketplace-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
      setLocalAutoApproveEnabled(null);
      setLocalAutoApproveMinutes(null);
      setLocalSkipFirstCampaign(null);
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
        <p className="surface-card p-4 text-sm text-destructive">Failed to load settings.</p>
      </div>
    );
  }

  const autoApproveEnabled =
    localAutoApproveEnabled ?? settings.data.auto_approve_enabled ?? false;
  const autoApproveMinutes =
    localAutoApproveMinutes ?? settings.data.auto_approve_after_minutes ?? 10;
  const skipFirstCampaign =
    localSkipFirstCampaign ?? settings.data.auto_approve_skip_first_campaign ?? true;

  const hasChanges =
    localAutoApproveEnabled !== null ||
    localAutoApproveMinutes !== null ||
    localSkipFirstCampaign !== null;

  return (
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

        {hasChanges && (
          <div className="flex gap-2 border-t border-border pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLocalAutoApproveEnabled(null);
                setLocalAutoApproveMinutes(null);
                setLocalSkipFirstCampaign(null);
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
                } = {};
                if (localAutoApproveEnabled !== null)
                  updates.auto_approve_enabled = localAutoApproveEnabled;
                if (localAutoApproveMinutes !== null)
                  updates.auto_approve_after_minutes = localAutoApproveMinutes;
                if (localSkipFirstCampaign !== null)
                  updates.auto_approve_skip_first_campaign = localSkipFirstCampaign;
                mutation.mutate(updates);
              }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
