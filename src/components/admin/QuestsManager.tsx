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
import { deleteQuest, listAdminQuests, saveQuest } from "@/lib/quests.functions";
import type { QuestRow, ShortlinkStep } from "@/lib/quests.server";
import {
  LOCKER_MAX_URLS,
  SHORTLINK_MAX_STEPS,
  SHORTLINK_MIN_STEPS,
} from "@/lib/coinquest";
import { formatReward } from "@/lib/format-reward";

type FormState = {
  id?: string;
  key: string;
  label: string;
  icon: string;
  questType: "ads" | "shortlink" | "locker" | "checkin";
  adsRequired: string;
  rewardAmount: string;
  stepReward: string;
  stepRewards: string;
  shortlinkSteps: ShortlinkStep[];
  minSecondsPerStep: string;
  /** 1-3 locker URLs, completed in order. Unlike shortlink's fixed 3, the
   *  admin chooses how many rows exist. */
  lockerUrls: string[];
  // Check-in quest fields
  totalDays: string;
  requiredActiveSeconds: string;
  streakMode: "consecutive" | "total";
  graceDays: string;
  day1AutoComplete: boolean;
  repeatable: boolean;
  defaultTimezone: string;
  isActive: boolean;
  sortOrder: string;
  lockType: "none" | "time" | "earning" | "first_withdrawal";
  unlockAt: string;
  requiredLifetimeEarned: string;
  appOnly: boolean;
};

/**
 * Usable links currently entered on the form.
 *
 * A link-driven quest with zero links is publishable on purpose: the Active
 * toggle is respected either way, and the user-facing start call returns a soft
 * "link coming soon" instead of an error. This only trims the values that get
 * sent (half-typed rows would fail the step schema) and drives the
 * "No links yet" hint.
 */
function linkInfo(state: FormState) {
  const filledLockerUrls = state.lockerUrls.map((url) => url.trim()).filter(Boolean);
  const filledShortlinkSteps = state.shortlinkSteps
    .filter((s) => s.network.trim() && s.url.trim())
    .map((s) => ({ network: s.network.trim(), url: s.url.trim() }));
  const linkDriven = state.questType === "locker" || state.questType === "shortlink";
  const availableLinks =
    state.questType === "locker" ? filledLockerUrls.length : filledShortlinkSteps.length;
  return {
    filledLockerUrls,
    filledShortlinkSteps,
    availableLinks,
    /** Publishable, but worth flagging so the admin remembers to fill it in. */
    noLinksYet: linkDriven && availableLinks === 0,
  };
}

/**
 * One-line lock summary for the admin list.
 *
 * Handles every lock_type explicitly — the previous inline ternary only covered
 * 'time' and 'earning', so a 'first_withdrawal' quest rendered "Earn $NaN".
 */
function lockSummary(quest: {
  lock_type?: string | null;
  unlock_at?: string | null;
  required_lifetime_earned?: number | null;
}): string {
  if (quest.lock_type === "time") {
    return `Until ${new Date(String(quest.unlock_at)).toLocaleDateString()}`;
  }
  if (quest.lock_type === "earning") {
    return `Earn $${Number(quest.required_lifetime_earned ?? 0).toFixed(2)}`;
  }
  if (quest.lock_type === "first_withdrawal") return "Until first withdrawal";
  return "Locked";
}

const emptyForm = (): FormState => ({
  key: "",
  label: "",
  icon: "gift",
  questType: "ads",
  adsRequired: "5",
  rewardAmount: "1",
  stepReward: "0",
  stepRewards: "",
  shortlinkSteps: [
    { network: "", url: "" },
    { network: "", url: "" },
    { network: "", url: "" },
  ],
  minSecondsPerStep: "15",
  lockerUrls: [""],
  // Check-in defaults
  totalDays: "3",
  requiredActiveSeconds: "300",
  streakMode: "consecutive",
  graceDays: "0",
  day1AutoComplete: true,
  repeatable: false,
  defaultTimezone: "Asia/Kolkata",
  isActive: true,
  sortOrder: "0",
  lockType: "none",
  unlockAt: "",
  requiredLifetimeEarned: "",
  appOnly: false,
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
          stepReward: Number(state.stepReward) || 0,
          stepRewards: state.stepRewards.trim()
            ? state.stepRewards
                .split(",")
                .map((s) => Number(s.trim()))
                .filter((n) => !isNaN(n))
            : null,
          // Only complete rows are sent: half-typed rows would fail the step
          // schema, and an empty array is now valid (it saves as a draft).
          ...(state.questType === "shortlink"
            ? { shortlinkSteps: linkInfo(state).filledShortlinkSteps }
            : {}),
          minSecondsPerStep: Number(state.minSecondsPerStep) || 15,
          ...(state.questType === "locker" ? { lockerUrls: linkInfo(state).filledLockerUrls } : {}),
          // Check-in fields
          totalDays: Number(state.totalDays) || 3,
          requiredActiveSeconds: Number(state.requiredActiveSeconds) || 300,
          streakMode: state.streakMode,
          graceDays: Number(state.graceDays) || 0,
          day1AutoComplete: state.day1AutoComplete,
          repeatable: state.repeatable,
          defaultTimezone: state.defaultTimezone || "Asia/Kolkata",
          // Mirrors the server rule so the optimistic UI matches what is stored.
          isActive: state.isActive,
          sortOrder: Number(state.sortOrder) || 0,
          lockType: state.lockType,
          unlockAt: state.lockType === "time" && state.unlockAt ? state.unlockAt : null,
          requiredLifetimeEarned:
            state.lockType === "earning" && state.requiredLifetimeEarned
              ? Number(state.requiredLifetimeEarned)
              : null,
          appOnly: state.appOnly,
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
      stepReward: String(quest.step_reward ?? 0),
      stepRewards: quest.step_rewards?.join(", ") ?? "",
      // Load exactly the steps that were saved (1-10). No padding to a fixed
      // count — the admin adds and removes rows explicitly.
      shortlinkSteps: quest.shortlink_steps?.length
        ? quest.shortlink_steps.slice(0, SHORTLINK_MAX_STEPS).map((s) => ({ ...s }))
        : [{ network: "", url: "" }],
      minSecondsPerStep: String(quest.min_seconds_per_step ?? 15),
      // A backfilled single-locker quest opens as one row; always keep >= 1 row
      // so the form is never empty.
      lockerUrls: quest.locker_urls?.length ? [...quest.locker_urls].slice(0, 3) : [""],
      // Check-in fields
      totalDays: String(quest.total_days ?? 3),
      requiredActiveSeconds: String(quest.required_active_seconds ?? 300),
      streakMode: quest.streak_mode ?? "consecutive",
      graceDays: String(quest.grace_days ?? 0),
      day1AutoComplete: quest.day1_auto_complete ?? true,
      repeatable: quest.repeatable ?? false,
      defaultTimezone: quest.default_timezone ?? "Asia/Kolkata",
      isActive: quest.is_active,
      sortOrder: String(quest.sort_order ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lockType: ((quest as any).lock_type ?? "none") as FormState["lockType"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unlockAt: String((quest as any).unlock_at ?? ""),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requiredLifetimeEarned: String((quest as any).required_lifetime_earned ?? ""),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      appOnly: Boolean((quest as any).app_only ?? false),
    });

  const { noLinksYet, filledLockerUrls } = form
    ? linkInfo(form)
    : { noLinksYet: false, filledLockerUrls: [] as string[] };

  const canSave =
    form &&
    form.key.trim().length >= 2 &&
    form.label.trim().length >= 1 &&
    (form.questType === "ads"
      ? Number(form.adsRequired) > 0
      : form.questType === "locker"
        ? // Zero URLs is a valid draft; only the upper bound is a real error.
          filledLockerUrls.length <= LOCKER_MAX_URLS
        : form.shortlinkSteps.length <= SHORTLINK_MAX_STEPS &&
          // Any row that has been started must be finished.
          form.shortlinkSteps.every(
            (s) => (!s.network.trim() && !s.url.trim()) || (s.network.trim() && s.url.trim()),
          ));

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
                      : quest.quest_type === "locker"
                        ? ` · ${quest.locker_urls.length} ${
                            quest.locker_urls.length === 1 ? "locker" : "lockers"
                          }`
                        : ` · ${quest.shortlink_steps.length} shortlinks`}
                    · reward {formatReward(quest.reward_amount)} · sort {quest.sort_order}
                  </p>
                  {/* A link-driven quest with nothing configured yet. It is still
                      publishable — users just see "link coming soon" — so this is
                      a reminder rather than a warning about breakage. */}
                  {(quest.quest_type === "locker" || quest.quest_type === "shortlink") &&
                    (quest.quest_type === "locker"
                      ? quest.locker_urls.length
                      : quest.shortlink_steps.length) === 0 && (
                      <span
                        className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                        data-testid={`quest-no-links-badge-${quest.key}`}
                      >
                        No links yet
                      </span>
                    )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(quest as any).lock_type !== "none" && (
                    <p className="text-xs text-amber-600">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      🔒 {lockSummary(quest as any)}
                    </p>
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(quest as any).app_only && (
                    <span
                      className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                      data-testid={`quest-app-only-badge-${quest.key}`}
                    >
                      App only
                    </span>
                  )}
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
                <Button size="sm" variant="outline" onClick={() => setPendingDelete(quest)}>
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
                <Field label="Final bonus (on completion) ($)">
                  <Input
                    inputMode="decimal"
                    value={form.rewardAmount}
                    onChange={(event) => setForm({ ...form, rewardAmount: event.target.value })}
                  />
                </Field>
              </div>
              {(form.questType === "shortlink" || form.questType === "locker") && (
                <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-background-alt p-3">
                  <p className="text-xs font-semibold text-primary">
                    💰 Per-step rewards (shortlink & locker only)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Reward per step ($)">
                      <Input
                        inputMode="decimal"
                        value={form.stepReward}
                        placeholder="0.50"
                        onChange={(event) => setForm({ ...form, stepReward: event.target.value })}
                      />
                    </Field>
                    <Field label="Custom reward per step (optional)">
                      <Input
                        inputMode="decimal"
                        value={form.stepRewards}
                        placeholder="0.50, 0.75, 1.00"
                        onChange={(event) => setForm({ ...form, stepRewards: event.target.value })}
                      />
                    </Field>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Custom rewards override the default per-step amount. Enter comma-separated
                    values, one per step. Steps without a custom value use the default.
                  </p>
                  {(() => {
                    const stepCount =
                      form.questType === "shortlink"
                        ? linkInfo(form).filledShortlinkSteps.length
                        : linkInfo(form).filledLockerUrls.length;
                    const baseReward = Number(form.stepReward) || 0;
                    const customRewards = form.stepRewards
                      .split(",")
                      .map((s) => Number(s.trim()))
                      .filter((n) => !isNaN(n));
                    const stepRewards = Array.from({ length: stepCount }, (_, i) =>
                      customRewards[i] !== undefined ? customRewards[i] : baseReward,
                    );
                    const totalStepRewards = stepRewards.reduce((sum, r) => sum + r, 0);
                    const completionBonus = Number(form.rewardAmount) || 0;
                    const totalPayout = totalStepRewards + completionBonus;

                    return (
                      <div className="rounded-lg bg-background p-2 text-xs">
                        <p className="font-semibold">Total payout breakdown:</p>
                        <ul className="mt-1 space-y-0.5 text-muted-foreground">
                          {stepRewards.map((r, i) => (
                            <li key={i}>
                              Step {i + 1}: {formatReward(r)}
                            </li>
                          ))}
                          {completionBonus > 0 && (
                            <li>Completion bonus: {formatReward(completionBonus)}</li>
                          )}
                          <li className="font-semibold text-primary">
                            Total: {formatReward(totalPayout)}
                          </li>
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              )}
              <Field label="Quest type">
                <div className="flex gap-2">
                  {(["ads", "shortlink", "locker", "checkin"] as const).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={form.questType === type ? "jade" : "outline"}
                      onClick={() => setForm({ ...form, questType: type })}
                      className="capitalize"
                    >
                      {type === "ads"
                        ? "Ads"
                        : type === "shortlink"
                          ? "Shortlink Chain"
                          : "Content Locker"}
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
              ) : form.questType === "checkin" ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Daily check-in quest with streak tracking. Each day = one step.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Total days">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={form.totalDays}
                        onChange={(event) => setForm({ ...form, totalDays: event.target.value })}
                      />
                    </Field>
                    
                    <Field label="Active seconds/day (0 = tap-only)">
                      <Input
                        type="number"
                        min="0"
                        max="86400"
                        value={form.requiredActiveSeconds}
                        placeholder="300"
                        onChange={(event) => setForm({ ...form, requiredActiveSeconds: event.target.value })}
                      />
                    </Field>
                  </div>

                  <Field label="Streak mode">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={form.streakMode === "consecutive" ? "jade" : "outline"}
                        onClick={() => setForm({ ...form, streakMode: "consecutive" })}
                      >
                        Consecutive
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={form.streakMode === "total" ? "jade" : "outline"}
                        onClick={() => setForm({ ...form, streakMode: "total" })}
                      >
                        Total (any N days)
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {form.streakMode === "consecutive" 
                        ? "Missing a day resets the streak (with grace period)" 
                        : "Any N distinct days complete it, gaps allowed"}
                    </p>
                  </Field>

                  {form.streakMode === "consecutive" && (
                    <Field label="Grace days (before reset)">
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={form.graceDays}
                        onChange={(event) => setForm({ ...form, graceDays: event.target.value })}
                      />
                    </Field>
                  )}

                  <Field label="Default timezone">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      value={form.defaultTimezone}
                      onChange={(event) => setForm({ ...form, defaultTimezone: event.target.value })}
                    >
                      <optgroup label="South Asia">
                        <option value="Asia/Kolkata">India (Asia/Kolkata) +5:30</option>
                        <option value="Asia/Kathmandu">Nepal (Asia/Kathmandu) +5:45</option>
                        <option value="Asia/Dhaka">Bangladesh (Asia/Dhaka) +6:00</option>
                        <option value="Asia/Karachi">Pakistan (Asia/Karachi) +5:00</option>
                        <option value="Asia/Colombo">Sri Lanka (Asia/Colombo) +5:30</option>
                      </optgroup>
                      <optgroup label="Southeast Asia">
                        <option value="Asia/Bangkok">Thailand (Asia/Bangkok) +7:00</option>
                        <option value="Asia/Singapore">Singapore +8:00</option>
                        <option value="Asia/Manila">Philippines (Asia/Manila) +8:00</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">US Eastern</option>
                        <option value="Europe/London">UK (Europe/London)</option>
                      </optgroup>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Used for users without a timezone set
                    </p>
                  </Field>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.day1AutoComplete}
                        onChange={(e) => setForm({ ...form, day1AutoComplete: e.target.checked })}
                        className="size-4 rounded"
                      />
                      <span className="text-sm">Day 1 auto-complete</span>
                    </label>
                    <p className="text-xs text-muted-foreground ml-6">
                      Automatically complete and pay Day 1 when quest starts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.repeatable}
                        onChange={(e) => setForm({ ...form, repeatable: e.target.checked })}
                        className="size-4 rounded"
                      />
                      <span className="text-sm">Repeatable</span>
                    </label>
                    <p className="text-xs text-muted-foreground ml-6">
                      Quest can be completed multiple times
                    </p>
                  </div>
                </div>
              ) : form.questType === "locker" ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Lockers are completed in order. The reward is credited only after the last one.
                    1 to 3 allowed.
                  </p>
                  {form.lockerUrls.map((url, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <Field
                          label={`Locker ${index + 1} URL (AdBlueMedia "Get Link" output URL)`}
                        >
                          <Input
                            value={url}
                            placeholder="https://adbluemedia.com/locker/…"
                            onChange={(event) => {
                              const next = [...form.lockerUrls];
                              next[index] = event.target.value;
                              setForm({ ...form, lockerUrls: next });
                            }}
                            data-testid={`quest-form-locker-url-${index}`}
                          />
                        </Field>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        // Minimum of 1 locker — the last row cannot be removed.
                        disabled={form.lockerUrls.length <= 1}
                        onClick={() =>
                          setForm({
                            ...form,
                            lockerUrls: form.lockerUrls.filter((_, i) => i !== index),
                          })
                        }
                        aria-label={`Remove locker ${index + 1}`}
                        data-testid={`quest-form-locker-remove-${index}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  {/* Maximum of 3 lockers. */}
                  {form.lockerUrls.length < LOCKER_MAX_URLS && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setForm({ ...form, lockerUrls: [...form.lockerUrls, ""] })}
                      data-testid="quest-form-locker-add"
                    >
                      <Plus className="mr-1 size-4" /> Add locker ({form.lockerUrls.length}/
                      {LOCKER_MAX_URLS})
                    </Button>
                  )}
                  <div className="rounded-xl border border-dashed border-primary/40 bg-background-alt p-3 text-xs">
                    <p className="font-semibold">
                      Set this as AdBlueMedia's "Redirect URL" (once, in their dashboard):
                    </p>
                    <p className="mt-1 break-all font-mono">
                      {origin}/go/locker/return?questKey={form.key || "{key}"}
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      ⚠️ AdBlueMedia's Redirect URL is static — it cannot carry a per-session token.
                      Crediting matches the user's most recent started session for this quest key.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Steps are completed in order. {SHORTLINK_MIN_STEPS} to {SHORTLINK_MAX_STEPS}{" "}
                    allowed.
                  </p>
                  {form.shortlinkSteps.map((step, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                        <Field label={`Step ${index + 1} network`}>
                          <Input
                            value={step.network}
                            placeholder="Network name"
                            onChange={(event) => {
                              const next = [...form.shortlinkSteps];
                              const current = next[index];
                              if (!current) return;
                              next[index] = { ...current, network: event.target.value };
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
                              const current = next[index];
                              if (!current) return;
                              next[index] = { ...current, url: event.target.value };
                              setForm({ ...form, shortlinkSteps: next });
                            }}
                          />
                        </Field>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        // Minimum of 1 step — the last row cannot be removed.
                        disabled={form.shortlinkSteps.length <= SHORTLINK_MIN_STEPS}
                        onClick={() =>
                          setForm({
                            ...form,
                            shortlinkSteps: form.shortlinkSteps.filter((_, i) => i !== index),
                          })
                        }
                        aria-label={`Remove step ${index + 1}`}
                        data-testid={`quest-form-shortlink-remove-${index}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={form.shortlinkSteps.length >= SHORTLINK_MAX_STEPS}
                    onClick={() =>
                      setForm({
                        ...form,
                        shortlinkSteps: [...form.shortlinkSteps, { network: "", url: "" }],
                      })
                    }
                    data-testid="quest-form-shortlink-add"
                  >
                    <Plus className="mr-1 size-4" /> Add step ({form.shortlinkSteps.length}/
                    {SHORTLINK_MAX_STEPS})
                  </Button>
                  <div className="rounded-xl border border-dashed border-primary/40 bg-background-alt p-3 text-xs">
                    <p className="font-semibold">Destinations to configure on each shortener:</p>
                    {/* One line per configured step, so this scales with the list. */}
                    <ul className="mt-1 space-y-0.5 font-mono">
                      {form.shortlinkSteps.map((_, index) => (
                        <li key={index}>
                          Step {index + 1} → {origin}/go/{form.key || "{key}"}/{index + 1}
                        </li>
                      ))}
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
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={form.isActive}
                        data-testid="quest-form-is-active"
                        onCheckedChange={(value) => setForm({ ...form, isActive: value })}
                      />
                      Active
                    </label>
                  {noLinksYet && (
                    <p className="text-[11px] text-amber-600" data-testid="quest-form-draft-note">
                      No links yet — this quest can go live, but users will see “link coming soon”
                      until you add one.
                    </p>
                  )}
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={form.appOnly}
                        data-testid="quest-form-app-only"
                        onCheckedChange={(value) => setForm({ ...form, appOnly: value })}
                      />
                      App only
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Hide on web, show only in native app
                    </p>
                  </div>
                </div>
              </div>

              {/* Lock condition */}
              <div className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700 dark:bg-amber-950/20">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  🔒 Lock condition
                </p>
                <Field label="Lock type">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["none", "No lock"],
                        ["time", "Until date"],
                        ["earning", "Until earned"],
                        ["first_withdrawal", "Until first withdrawal"],
                      ] as const
                    ).map(([t, label]) => (
                      <Button
                        key={t}
                        size="sm"
                        type="button"
                        variant={form.lockType === t ? "jade" : "outline"}
                        data-testid={`quest-lock-type-${t}`}
                        onClick={() =>
                          setForm({
                            ...form,
                            lockType: t,
                            unlockAt: "",
                            requiredLifetimeEarned: "",
                          })
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </Field>
                {form.lockType === "first_withdrawal" && (
                  <p
                    className="text-[11px] text-muted-foreground"
                    data-testid="quest-lock-first-withdrawal-note"
                  >
                    Unlocks as soon as the user has one approved withdrawal — no extra value needed.
                  </p>
                )}
                {form.lockType === "time" && (
                  <Field label="Unlock at (UTC date-time)">
                    <Input
                      type="datetime-local"
                      value={
                        form.unlockAt ? new Date(form.unlockAt).toISOString().slice(0, 16) : ""
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          unlockAt: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : "",
                        })
                      }
                    />
                  </Field>
                )}
                {form.lockType === "earning" && (
                  <Field label="Required lifetime earned ($)">
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 5.00"
                      value={form.requiredLifetimeEarned}
                      onChange={(event) =>
                        setForm({ ...form, requiredLifetimeEarned: event.target.value })
                      }
                    />
                  </Field>
                )}
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
              If users already have sessions for this quest, it is deactivated instead of deleted so
              history is preserved.
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
