import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  deleteQuest,
  listAdminQuests,
  saveQuest,
} from "@/lib/quests.functions";
import type { QuestRow, ShortlinkStep } from "@/lib/quests.server";
import { formatMoney } from "@/lib/coinquest";

type FormState = {
  id?: string;
  key: string;
  label: string;
  icon: string;
  questType: "ads" | "shortlink";
  adsRequired: string;
  rewardAmount: string;
  shortlinkSteps: ShortlinkStep[];
  minSecondsPerStep: string;
  isActive: boolean;
  sortOrder: string;
};

const emptyForm = (): FormState => ({
  key: "",
  label: "",
  icon: "gift",
  questType: "ads",
  adsRequired: "5",
  rewardAmount: "1",
  shortlinkSteps: [
    { network: "", url: "" },
    { network: "", url: "" },
    { network: "", url: "" },
  ],
  minSecondsPerStep: "15",
  isActive: true,
  sortOrder: "0",
});

export function QuestsManager() {
  const queryClient = useQueryClient();
  const fetchQuests = useServerFn(listAdminQuests);
  const save = useServerFn(saveQuest);
  const remove = useServerFn(deleteQuest);
  const [form, setForm] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QuestRow | null>(null);

  const quests = useQuery({
    queryKey: ["admin-quests"],
    queryFn: () => fetchQuests({}),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
    void queryClient.invalidateQueries({ queryKey: ["quests-active"] });
  };
  const onError = (error: Error) => toast.error(error.message);

  const saveAction = useMutation({
    mutationFn: (state: FormState) =>
      save({
        data: {
          ...(state.id ? { id: state.id } : {}),
          key: state.key.trim(),
          label: state.label.trim(),
          icon: state.icon.trim() || "gift",
          questType: state.questType,
          adsRequired: Number(state.adsRequired) || 0,
          rewardAmount: Number(state.rewardAmount) || 0,
          shortlinkSteps:
            state.questType === "shortlink"
              ? state.shortlinkSteps.map((s) => ({
                  network: s.network.trim(),
                  url: s.url.trim(),
                }))
              : [],
          minSecondsPerStep: Number(state.minSecondsPerStep) || 15,
          isActive: state.isActive,
          sortOrder: Number(state.sortOrder) || 0,
        },
      }),
    onSuccess: () => {
      toast.success("Quest saved.");
      setForm(null);
      refresh();
    },
    onError,
  });

  const deleteAction = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (result) => {
      toast.success(
        result.deleted ? "Quest deleted." : "Quest had sessions — deactivated instead.",
      );
      setPendingDelete(null);
      refresh();
    },
    onError,
  });

  const openEdit = (quest: QuestRow) =>
    setForm({
      id: quest.id,
      key: quest.key,
      label: quest.label,
      icon: quest.icon,
      questType: quest.quest_type,
      adsRequired: String(quest.ads_required ?? 0),
      rewardAmount: String(quest.reward_amount ?? 0),
      shortlinkSteps: (quest.shortlink_steps?.length
        ? [
            ...quest.shortlink_steps,
            ...Array.from({ length: 3 - quest.shortlink_steps.length }, () => ({
              network: "",
              url: "",
            })),
          ]
        : [
            { network: "", url: "" },
            { network: "", url: "" },
            { network: "", url: "" },
          ]
      ).slice(0, 3),
      minSecondsPerStep: String(quest.min_seconds_per_step ?? 15),
      isActive: quest.is_active,
      sortOrder: String(quest.sort_order ?? 0),
    });

  const canSave =
    form &&
    form.key.trim().length >= 2 &&
    form.label.trim().length >= 1 &&
    (form.questType === "ads"
      ? Number(form.adsRequired) > 0
      : form.shortlinkSteps.every((s) => s.network.trim() && s.url.trim()));

  const origin = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage the starter quest row shown on the home screen.
        </p>
        <Button
          size="sm"
          variant="gold"
          onClick={() => setForm(emptyForm())}
          data-testid="quest-new-btn"
        >
          <Plus className="mr-1 h-4 w-4" /> New quest
        </Button>
      </div>

      {quests.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading quests…</p>
      ) : !quests.data?.length ? (
        <EmptyState
          icon={Plus}
          title="No quests yet"
          description="Create a starter quest to get things going."
        />
      ) : (
        <ul className="space-y-2" data-testid="admin-quests-list">
          {quests.data.map((quest) => (
            <li key={quest.id} className="surface-card space-y-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{quest.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {quest.key} · {quest.quest_type}
                    {quest.quest_type === "ads"
                      ? ` · ${quest.ads_required} ads`
                      : ` · ${quest.shortlink_steps.length} shortlinks`}
                    · reward {formatMoney(quest.reward_amount)} · sort {quest.sort_order}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    quest.is_active
                      ? "bg-primary/15 text-primary"
                      : "bg-background-alt text-muted-foreground"
                  }`}
                >
                  {quest.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(quest)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingDelete(quest)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit quest" : "New quest"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Key (unique)">
                  <Input
                    value={form.key}
                    disabled={Boolean(form.id)}
                    placeholder="starter_5"
                    onChange={(event) => setForm({ ...form, key: event.target.value })}
                  />
                </Field>
                <Field label="Label">
                  <Input
                    value={form.label}
                    onChange={(event) => setForm({ ...form, label: event.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Icon (lucide name or URL)">
                  <Input
                    value={form.icon}
                    onChange={(event) => setForm({ ...form, icon: event.target.value })}
                  />
                </Field>
                <Field label="Reward ($)">
                  <Input
                    inputMode="decimal"
                    value={form.rewardAmount}
                    onChange={(event) => setForm({ ...form, rewardAmount: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Quest type">
                <div className="flex gap-2">
                  {(["ads", "shortlink"] as const).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={form.questType === type ? "jade" : "outline"}
                      onClick={() => setForm({ ...form, questType: type })}
                      className="capitalize"
                    >
                      {type === "ads" ? "Ads" : "Shortlink Chain"}
                    </Button>
                  ))}
                </div>
              </Field>

              {form.questType === "ads" ? (
                <Field label="Ads required">
                  <Input
                    inputMode="numeric"
                    value={form.adsRequired}
                    onChange={(event) => setForm({ ...form, adsRequired: event.target.value })}
                  />
                </Field>
              ) : (
                <div className="space-y-2">
                  {form.shortlinkSteps.map((step, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <Field label={`Step ${index + 1} network`}>
                        <Input
                          value={step.network}
                          placeholder="Network name"
                          onChange={(event) => {
                            const next = [...form.shortlinkSteps];
                            next[index] = { ...next[index], network: event.target.value };
                            setForm({ ...form, shortlinkSteps: next });
                          }}
                        />
                      </Field>
                      <Field label={`Step ${index + 1} shortlink URL`}>
                        <Input
                          value={step.url}
                          placeholder="https://…"
                          onChange={(event) => {
                            const next = [...form.shortlinkSteps];
                            next[index] = { ...next[index], url: event.target.value };
                            setForm({ ...form, shortlinkSteps: next });
                          }}
                        />
                      </Field>
                    </div>
                  ))}
                  <div className="rounded-xl border border-dashed border-primary/40 bg-background-alt p-3 text-xs">
                    <p className="font-semibold">Destinations to configure on each shortener:</p>
                    <ul className="mt-1 space-y-0.5 font-mono">
                      <li>
                        Step 1 → {origin}/go/{form.key || "{key}"}/1
                      </li>
                      <li>
                        Step 2 → {origin}/go/{form.key || "{key}"}/2
                      </li>
                      <li>
                        Step 3 → {origin}/go/{form.key || "{key}"}/3
                      </li>
                    </ul>
                  </div>
                  <Field label="Minimum seconds per step">
                    <Input
                      inputMode="numeric"
                      value={form.minSecondsPerStep}
                      onChange={(event) =>
                        setForm({ ...form, minSecondsPerStep: event.target.value })
                      }
                    />
                  </Field>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Sort order">
                  <Input
                    inputMode="numeric"
                    value={form.sortOrder}
                    onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(value) => setForm({ ...form, isActive: value })}
                  />
                  Active
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
              disabled={!canSave || saveAction.isPending}
              onClick={() => form && saveAction.mutate(form)}
              data-testid="quest-save-btn"
            >
              {saveAction.isPending ? "Saving…" : "Save quest"}
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
            <AlertDialogTitle>Delete “{pendingDelete?.label}”?</AlertDialogTitle>
            <AlertDialogDescription>
              If users already have sessions for this quest, it is deactivated instead of deleted
              so history is preserved.
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
