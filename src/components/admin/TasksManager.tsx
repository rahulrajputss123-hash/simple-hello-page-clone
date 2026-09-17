import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminSdkProviders } from "@/lib/sdk-offerwall.functions";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
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
import { formatMoney } from "@/lib/coinquest";
import {
  deleteAdminTask,
  listAdminTasks,
  requestTaskImageUploadUrl,
  saveAdminTask,
  setAdminTaskActive,
} from "@/lib/tasks.functions";
import {
  TASK_FREQUENCIES,
  TASK_FREQUENCY_LABELS,
  TASK_TYPE_LABELS,
  TASK_TYPES,
  type TaskFrequency,
  type TaskType,
} from "@/lib/tasks/types";

type AdminTask = Awaited<ReturnType<typeof listAdminTasks>>[number];

const emptyForm = {
  id: undefined as string | undefined,
  title: "",
  description: "",
  icon: "target",
  imageUrl: "",
  reward: "0",
  taskType: "referral_count" as TaskType,
  target: "1",
  frequency: "one_time" as TaskFrequency,
  windowDays: "",
  startsAt: "",
  endsAt: "",
  sortOrder: "0",
  isActive: true,
  isFeatured: false,
  // offerwall_earning-specific
  earningTarget: "",
  earningProviderId: "", // empty string = all providers (null on save)
};

type FormState = typeof emptyForm;

export function TasksManager() {
  const queryClient = useQueryClient();
  const fetchTasks = useServerFn(listAdminTasks);
  const saveTask = useServerFn(saveAdminTask);
  const toggleTask = useServerFn(setAdminTaskActive);
  const removeTask = useServerFn(deleteAdminTask);
  const fetchSdkProviders = useServerFn(listAdminSdkProviders);

  const sdkProviders = useQuery({
    queryKey: ["sdk-offerwall-providers-admin"],
    queryFn: () => fetchSdkProviders({}),
    staleTime: 60_000,
  });

  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [form, setForm] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminTask | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const requestUpload = useServerFn(requestTaskImageUploadUrl);

  /** Uploads to the task-assets bucket, then patches the resulting public URL into the form. */
  const handleImageFile = async (file: File) => {
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
      setForm((current) => (current ? { ...current, imageUrl: publicUrl } : current));
      toast.success("Image uploaded.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const tasks = useQuery({
    queryKey: ["admin-tasks", status, typeFilter],
    queryFn: () => fetchTasks({ data: { status, taskType: typeFilter } }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const save = useMutation({
    mutationFn: (state: FormState) =>
      saveTask({
        data: {
          ...(state.id ? { id: state.id } : {}),
          title: state.title.trim(),
          description: state.description.trim(),
          icon: state.icon.trim() || "target",
          imageUrl: state.imageUrl.trim() || null,
          reward: Number(state.reward) || 0,
          taskType: state.taskType,
          target: Math.max(1, Number(state.target) || 1),
          frequency: state.frequency,
          windowDays: state.windowDays ? Number(state.windowDays) : null,
          startsAt: state.startsAt ? new Date(state.startsAt).toISOString() : null,
          endsAt: state.endsAt ? new Date(state.endsAt).toISOString() : null,
          sortOrder: Number(state.sortOrder) || 0,
          isActive: state.isActive,
          isFeatured: state.isFeatured,
          earningTarget:
            state.taskType === "offerwall_earning" && state.earningTarget
              ? Number(state.earningTarget)
              : null,
          earningProviderId:
            state.taskType === "offerwall_earning" && state.earningProviderId
              ? state.earningProviderId
              : null,
        },
      }),
    onSuccess: () => {
      toast.success("Task saved");
      setForm(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => toggleTask({ data: vars }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => removeTask({ data: { id } }),
    onSuccess: (res) => {
      toast.success(
        res.deactivatedInstead ? "Task had paid rewards — deactivated instead" : "Task deleted",
      );
      setPendingDelete(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = tasks.data ?? [];

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["all", "active", "inactive"] as const).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={status === key ? "jade" : "outline"}
            onClick={() => setStatus(key)}
          >
            {key === "all" ? "All" : key === "active" ? "Active" : "Inactive"}
          </Button>
        ))}
        <select
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All types</option>
          {TASK_TYPES.map((type) => (
            <option key={type} value={type}>
              {TASK_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <Button size="sm" variant="gold" onClick={() => setForm({ ...emptyForm })}>
          <Plus className="mr-1 h-4 w-4" /> New task
        </Button>
      </div>

      {tasks.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!tasks.isLoading && rows.length === 0 && (
        <EmptyState title="No tasks yet" description="Create your first automated task." />
      )}

      <div className="space-y-2">
        {rows.map((task) => {
          const t = task as AdminTask & {
            task_type: TaskType;
            frequency: TaskFrequency;
            target: number;
            window_days: number | null;
          };
          return (
            <div key={task.id} className="surface-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {TASK_TYPE_LABELS[t.task_type] ?? t.task_type} ·{" "}
                    {TASK_FREQUENCY_LABELS[t.frequency] ?? t.frequency} · target {t.target}
                    {t.window_days ? ` in ${t.window_days}d` : ""} ·{" "}
                    {formatMoney(Number(task.reward))} · order {task.sort_order}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.stats.participants} in progress · {task.stats.completed} completed ·{" "}
                    {task.stats.paid} rewarded
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={task.is_active}
                    onCheckedChange={(value) => toggle.mutate({ id: task.id, isActive: value })}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const raw = task as any;
                      setForm({
                        id: task.id,
                        title: task.title,
                        description: task.description ?? "",
                        icon: raw.icon ?? "target",
                        imageUrl: raw.image_url ?? "",
                        reward: String(task.reward),
                        taskType: t.task_type,
                        target: String(t.target),
                        frequency: t.frequency,
                        windowDays: t.window_days ? String(t.window_days) : "",
                        startsAt: "",
                        endsAt: "",
                        sortOrder: String(task.sort_order),
                        isActive: task.is_active,
                        isFeatured: task.is_featured,
                        earningTarget: raw.earning_target != null ? String(raw.earning_target) : "",
                        earningProviderId: raw.earning_provider_id ?? "",
                      });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setPendingDelete(task)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit task" : "New task"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Icon name</Label>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={form.imageUrl}
                      placeholder="https://… or upload"
                      onChange={(e) => {
                        setUploadError(null);
                        setForm({ ...form, imageUrl: e.target.value });
                      }}
                    />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleImageFile(f);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploading ? "…" : <Upload className="size-4" />}
                    </Button>
                  </div>
                  {uploadError && <p className="mt-1 text-xs text-destructive">{uploadError}</p>}
                </div>
                <div>
                  <Label>Task type</Label>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                    value={form.taskType}
                    onChange={(e) => setForm({ ...form, taskType: e.target.value as TaskType })}
                  >
                    {TASK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {TASK_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                    value={form.frequency}
                    onChange={(e) =>
                      setForm({ ...form, frequency: e.target.value as TaskFrequency })
                    }
                  >
                    {TASK_FREQUENCIES.map((freq) => (
                      <option key={freq} value={freq}>
                        {TASK_FREQUENCY_LABELS[freq]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Target</Label>
                  <Input
                    type="number"
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Reward ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.reward}
                    onChange={(e) => setForm({ ...form, reward: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Window (days)</Label>
                  <Input
                    type="number"
                    placeholder="for period targets"
                    value={form.windowDays}
                    onChange={(e) => setForm({ ...form, windowDays: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Starts at</Label>
                  <Input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ends at</Label>
                  <Input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.isFeatured}
                    onCheckedChange={(v) => setForm({ ...form, isFeatured: v })}
                  />
                  Featured
                </label>
              </div>
              {form.taskType === "shortlink" || form.taskType === "content_locker" ? (
                <p className="text-xs text-muted-foreground">
                  Progress for this type starts counting once a provider sends completion events.
                </p>
              ) : null}

              {form.taskType === "offerwall_earning" && (
                <div className="space-y-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-3 dark:border-emerald-700 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    SDK Offerwall earning target
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Earning target ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 10.00"
                        value={form.earningTarget}
                        onChange={(e) => setForm({ ...form, earningTarget: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Scope</Label>
                      <select
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                        value={form.earningProviderId}
                        onChange={(e) => setForm({ ...form, earningProviderId: e.target.value })}
                      >
                        <option value="">All SDK offerwalls combined</option>
                        {(sdkProviders.data ?? []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Task completes when the user earns the target amount from SDK offerwall
                    conversions
                    {form.earningProviderId ? " from the selected provider" : " combined"}. The
                    bonus reward is paid on top of what they already earned from the offerwall.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              variant="jade"
              disabled={save.isPending || !form?.title.trim()}
              onClick={() => form && save.mutate(form)}
            >
              Save task
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
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.title} will be removed. Tasks that already paid rewards are
              deactivated instead so the payout history stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && del.mutate(pendingDelete.id)}
              disabled={del.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
