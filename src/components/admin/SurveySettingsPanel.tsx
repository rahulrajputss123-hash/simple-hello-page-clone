import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LineChart, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  getSurveyAdminSettings,
  updateSurveyAdminSettings,
} from "@/lib/surveys/admin-settings.server";

export function SurveySettingsPanel() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getSurveyAdminSettings);
  const updateSettings = useServerFn(updateSurveyAdminSettings);

  const settings = useQuery({
    queryKey: ["survey-admin-settings"],
    queryFn: () => fetchSettings(),
  });

  // Local state for switches
  const [localSectionEnabled, setLocalSectionEnabled] = useState<boolean | null>(null);
  const [localCpxEnabled, setLocalCpxEnabled] = useState<boolean | null>(null);
  const [localTheoremreachEnabled, setLocalTheoremreachEnabled] = useState<boolean | null>(null);
  const [localTimewallEnabled, setLocalTimewallEnabled] = useState<boolean | null>(null);

  const mutation = useMutation({
    mutationFn: (variables: {
      sectionEnabled: boolean;
      cpxEnabled: boolean;
      theoremreachEnabled: boolean;
      timewallEnabled: boolean;
    }) => updateSettings({ data: variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-admin-settings"] });
      toast.success("Survey settings updated");
      // Reset local state
      setLocalSectionEnabled(null);
      setLocalCpxEnabled(null);
      setLocalTheoremreachEnabled(null);
      setLocalTimewallEnabled(null);
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast.error(error.message || "Failed to update settings");
    },
  });

  if (settings.isLoading) {
    return (
      <div className="space-y-6">
        <SectionTitle icon={LineChart} title="Survey Settings" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (settings.isError || !settings.data) {
    return (
      <div className="space-y-6">
        <SectionTitle icon={LineChart} title="Survey Settings" />
        <div className="text-sm text-muted-foreground">Failed to load settings</div>
      </div>
    );
  }

  const data = settings.data;
  const sectionEnabled = localSectionEnabled ?? data.sectionEnabled;
  const cpxEnabled = localCpxEnabled ?? data.cpxEnabled;
  const theoremreachEnabled = localTheoremreachEnabled ?? data.theoremreachEnabled;
  const timewallEnabled = localTimewallEnabled ?? data.timewallEnabled;

  const hasChanges =
    localSectionEnabled !== null ||
    localCpxEnabled !== null ||
    localTheoremreachEnabled !== null ||
    localTimewallEnabled !== null;

  const handleSave = () => {
    const payload = {
      sectionEnabled: localSectionEnabled ?? data.sectionEnabled,
      cpxEnabled: localCpxEnabled ?? data.cpxEnabled,
      theoremreachEnabled: localTheoremreachEnabled ?? data.theoremreachEnabled,
      timewallEnabled: localTimewallEnabled ?? data.timewallEnabled,
    };
    
    console.log("Saving survey settings:", payload);
    mutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <SectionTitle icon={LineChart} title="Survey Settings" />

      <div className="rounded-lg border bg-card p-6 space-y-6">
        {/* Master Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Survey Section</Label>
            <div className="text-sm text-muted-foreground">
              Show/hide surveys section on home page
            </div>
          </div>
          <Switch
            checked={sectionEnabled}
            onCheckedChange={(checked) => setLocalSectionEnabled(checked)}
          />
        </div>

        <div className="border-t pt-6">
          <div className="text-sm font-medium mb-4">Survey Networks</div>
          
          {/* CPX Research */}
          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label>CPX Research</Label>
              <div className="text-xs text-muted-foreground">
                Affects: home surveys, quests, CPX wall
              </div>
            </div>
            <Switch
              checked={cpxEnabled}
              onCheckedChange={(checked) => setLocalCpxEnabled(checked)}
              disabled={!sectionEnabled}
            />
          </div>

          {/* TheoremReach */}
          <div className="flex items-center justify-between py-3 border-t">
            <div className="space-y-0.5">
              <Label>TheoremReach</Label>
              <div className="text-xs text-muted-foreground">
                Affects: home surveys, quests, TheoremReach wall
              </div>
            </div>
            <Switch
              checked={theoremreachEnabled}
              onCheckedChange={(checked) => setLocalTheoremreachEnabled(checked)}
              disabled={!sectionEnabled}
            />
          </div>

          {/* Timewall */}
          <div className="flex items-center justify-between py-3 border-t">
            <div className="space-y-0.5">
              <Label>Timewall</Label>
              <div className="text-xs text-muted-foreground">
                Affects: home surveys, Timewall wall card
              </div>
            </div>
            <Switch
              checked={timewallEnabled}
              onCheckedChange={(checked) => setLocalTimewallEnabled(checked)}
              disabled={!sectionEnabled}
            />
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="text-sm space-y-2">
          <div className="font-medium">Note:</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Disabling Survey Section hides the entire section on home page</li>
            <li>• Disabling a network removes it from home surveys AND quests</li>
            <li>• Networks require env vars (CPX_SECURE_HASH, THEOREMREACH_SECRET_KEY, etc.)</li>
            <li>• Changes take effect immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
