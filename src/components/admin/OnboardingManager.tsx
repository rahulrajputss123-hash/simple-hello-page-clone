import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/States";
import { OnboardingTourPreview } from "@/components/OnboardingTour";
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
import {
  deleteOnboardingStep,
  listAdminOnboardingSteps,
  reorderOnboardingSteps,
  saveOnboardingStep,
} from "@/lib/onboarding/functions";
import type { OnboardingStepRow } from "@/lib/onboarding/server";
import { ONBOARDING_TARGETS } from "@/lib/onboarding/targets";

type FormState = {
  id?: string;
  targetElementId: string;
  title: string;
  description: string;
  displayOrder: string;
  enabled: boolean;
};

const emptyForm = (nextOrder: number): FormState => ({
  targetElementId: ONBOARDING_TARGETS[0]?.id ?? "",
  title: "",
  description: "",
  displayOrder: String(nextOrder),
  enabled: true,
});

export function OnboardingManager() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listAdminOnboardingSteps);
  const save = useServerFn(saveOnboardingStep);
  const remove = useServerFn(deleteOnboardingStep);
  const reorder = useServerFn(reorderOnboardingSteps);

  const [form, setForm] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OnboardingStepRow | null>(null);
  const [previewSteps, setPreviewSteps] = useState<OnboardingStepRow[] | null>(null);

  const steps = useQuery({
    queryKey: ["admin-onboarding-steps"],
    queryFn: () => fetchAll({}),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-onboarding-steps"] });
    void queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
  };
  const onError = (e: Error) => toast.error(e.message);

  const saveAction = useMutation({
    mutationFn: (state: FormState) =>
      save({
        data: {
          ...(state.id ? { id: state.id } : {}),
          targetElementId: state.targetElementId,
          title: state.title.trim(),
          description: state.description.trim(),
          displayOrder: Number(state.displayOrder) || 0,
          enabled: state.enabled,
        },
      }),
    onSuccess: () => {
      toast.success("Step saved.");
      setForm(null);
      refresh();
    },
    onError,
  });

  const deleteAction = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Step deleted.");
      setPendingDelete(null);
      refresh();
    },
    onError,
  });

  const reorderAction = useMutation({
    mutationFn: (orderedIds: string[]) => reorder({ data: { orderedIds } }),
    onSuccess: () => {
      toast.success("Order updated.");
      refresh();
    },
    onError,
  });

  const move = (id: string, direction: -1 | 1) => {
    const list = (steps.data ?? []).slice().sort((a, b) => a.display_order - b.display_order);
    const idx = list.findIndex((s) => s.id === id);
    const next = idx + direction;
    if (idx < 0 || next < 0 || next >= list.length) return;
    const swapped = list.slice();
    [swapped[idx], swapped[next]] = [swapped[next], swapped[idx]];
    reorderAction.mutate(swapped.map((s) => s.id));
  };

  const openEdit = (s: OnboardingStepRow) =>
    setForm({
      id: s.id,
      targetElementId: s.target_element_id,
      title: s.title,
      description: s.description,
      displayOrder: String(s.display_order),
      enabled: s.enabled,
    });

  const nextOrder = ((steps.data ?? []).reduce((m, s) => Math.max(m, s.display_order), 0) || 0) + 1;
  const canSave =
    form &&
    form.targetElementId &&
    form.title.trim().length >= 2 &&
    ONBOARDING_TARGETS.some((t) => t.id === form.targetElementId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Coach-mark tour steps. The order below is the order users see them.
        </p>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPreviewSteps((steps.data ?? []).filter((s) => s.enabled))}
            disabled={!steps.data?.some((s) => s.enabled)}
            data-testid="onboarding-preview-btn"
          >
            <Eye className="mr-1 h-4 w-4" /> Preview tour
          </Button>
          <Button
            size="sm"
            variant="gold"
            onClick={() => setForm(emptyForm(nextOrder))}
            data-testid="onboarding-new-btn"
          >
            <Plus className="mr-1 h-4 w-4" /> New step
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-primary/40 bg-background-alt p-3 text-xs text-muted-foreground">
        <p className="font-semibold uppercase tracking-wide">Available spotlight targets</p>
        <ul className="mt-1 space-y-0.5">
          {ONBOARDING_TARGETS.map((t) => (
            <li key={t.id}>
              <code className="rounded bg-card px-1">{t.id}</code> — {t.label} ({t.location})
            </li>
          ))}
        </ul>
        <p className="mt-2">
          To add more, add the matching <code>id</code> attribute to a component and register it in{" "}
          <code>src/lib/onboarding/targets.ts</code>.
        </p>
      </div>

      {steps.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading steps…</p>
      ) : !steps.data?.length ? (
        <EmptyState
          icon={Plus}
          title="No steps yet"
          description="Create your first onboarding tour step."
        />
      ) : (
        <ul className="space-y-2" data-testid="onboarding-steps-list">
          {steps.data
            .slice()
            .sort((a, b) => a.display_order - b.display_order)
            .map((s, idx, arr) => (
              <li key={s.id} className="surface-card space-y-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {s.display_order}. {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target: <code>{s.target_element_id}</code>
                    </p>
                    {s.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      s.enabled
                        ? "bg-primary/15 text-primary"
                        : "bg-background-alt text-muted-foreground"
                    }`}
                  >
                    {s.enabled ? "Enabled" : "Hidden"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={idx === 0}
                    onClick={() => move(s.id, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={idx === arr.length - 1}
                    onClick={() => move(s.id, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingDelete(s)}>
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
            <DialogTitle>{form?.id ? "Edit step" : "New step"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Target element</Label>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-background px-2 text-sm"
                  data-testid="onboarding-form-target"
                  value={form.targetElementId}
                  onChange={(e) => setForm({ ...form, targetElementId: e.target.value })}
                >
                  {ONBOARDING_TARGETS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} — {t.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="onboarding-form-title"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  data-testid="onboarding-form-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Display order</Label>
                  <Input
                    inputMode="numeric"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                  />
                </div>
                <label className="flex items-end gap-2 text-sm">
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(v) => setForm({ ...form, enabled: v })}
                  />
                  Enabled
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
              data-testid="onboarding-save-btn"
            >
              {saveAction.isPending ? "Saving…" : "Save step"}
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
            <AlertDialogTitle>Delete "{pendingDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              New users will no longer see this step.
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

      {previewSteps && (
        <OnboardingTourPreview steps={previewSteps} onClose={() => setPreviewSteps(null)} />
      )}
    </div>
  );
}
