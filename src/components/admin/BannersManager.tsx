import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/States";
import { SectionBanner } from "@/components/SectionBanner";
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
  deleteBanner,
  listAdminBanners,
  requestBannerUploadUrl,
  saveBanner,
} from "@/lib/banners/functions";
import type { BannerCtaKind, BannerRow, BannerSection } from "@/lib/banners/server";
import { formatDateTime } from "@/lib/coinquest";

const SECTIONS: readonly [BannerSection, string][] = [
  ["home", "Home"],
  ["offers", "Offers"],
  ["tasks", "Tasks"],
  ["offerwall", "Offerwall"],
];

const CTA_KINDS: readonly [BannerCtaKind, string][] = [
  ["none", "No CTA"],
  ["offers", "Offers page"],
  ["tasks", "Tasks page"],
  ["offerwall", "Offerwall page"],
  ["offer", "Specific offer"],
  ["offerwall_provider", "Specific offerwall"],
  ["url", "External URL"],
];

type FormState = {
  id?: string;
  section: BannerSection;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaKind: BannerCtaKind;
  ctaTarget: string;
  priority: string;
  isActive: boolean;
  /** ISO string in the ADMIN's local timezone as datetime-local input value */
  startsAtLocal: string;
  endsAtLocal: string;
};

const emptyForm = (): FormState => ({
  section: "home",
  title: "",
  description: "",
  imageUrl: "",
  ctaLabel: "",
  ctaKind: "none",
  ctaTarget: "",
  priority: "0",
  isActive: true,
  startsAtLocal: "",
  endsAtLocal: "",
});

/** datetime-local (browser local) -> ISO UTC. Empty -> null. */
function localToUtcIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
/** ISO UTC -> datetime-local input value (local tz). */
function utcIsoToLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function BannersManager() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listAdminBanners);
  const save = useServerFn(saveBanner);
  const remove = useServerFn(deleteBanner);
  const requestUpload = useServerFn(requestBannerUploadUrl);

  const [form, setForm] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BannerRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewSection, setPreviewSection] = useState<BannerSection | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const banners = useQuery({ queryKey: ["admin-banners"], queryFn: () => fetchAll({}) });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    void queryClient.invalidateQueries({ queryKey: ["banners"] });
  };
  const onError = (error: Error) => toast.error(error.message);

  const saveAction = useMutation({
    mutationFn: (state: FormState) =>
      save({
        data: {
          ...(state.id ? { id: state.id } : {}),
          section: state.section,
          title: state.title.trim(),
          description: state.description.trim(),
          imageUrl: state.imageUrl.trim() || null,
          ctaLabel: state.ctaKind === "none" ? null : state.ctaLabel.trim() || null,
          ctaKind: state.ctaKind,
          ctaTarget: state.ctaTarget.trim() || null,
          priority: Number(state.priority) || 0,
          isActive: state.isActive,
          startsAt: localToUtcIso(state.startsAtLocal),
          endsAt: localToUtcIso(state.endsAtLocal),
        },
      }),
    onSuccess: () => {
      toast.success("Banner saved.");
      setForm(null);
      refresh();
    },
    onError,
  });

  const deleteAction = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Banner deleted.");
      setPendingDelete(null);
      refresh();
    },
    onError,
  });

  const openEdit = (b: BannerRow) =>
    setForm({
      id: b.id,
      section: b.section,
      title: b.title,
      description: b.description,
      imageUrl: b.image_url ?? "",
      ctaLabel: b.cta_label ?? "",
      ctaKind: b.cta_kind,
      ctaTarget: b.cta_target ?? "",
      priority: String(b.priority),
      isActive: b.is_active,
      startsAtLocal: utcIsoToLocal(b.starts_at),
      endsAtLocal: utcIsoToLocal(b.ends_at),
    });

  const handleFile = async (file: File) => {
    if (!form) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3 MB.");
      return;
    }
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
      setForm({ ...form, imageUrl: publicUrl });
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const canSave = form && form.title.trim().length >= 2;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Custom + scheduled banners. Smart banners are driven live by user data.
        </p>
        <Button
          size="sm"
          variant="gold"
          className="ml-auto"
          onClick={() => setForm(emptyForm())}
          data-testid="banner-new-btn"
        >
          <Plus className="mr-1 h-4 w-4" /> New banner
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={previewSection === key ? "jade" : "outline"}
            onClick={() => setPreviewSection(previewSection === key ? null : key)}
          >
            Preview {label}
          </Button>
        ))}
      </div>
      {previewSection && (
        <div className="rounded-2xl border border-dashed border-primary/40 p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Live preview using your own account data:
          </p>
          <SectionBanner section={previewSection} />
        </div>
      )}

      {banners.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading banners…</p>
      ) : !banners.data?.length ? (
        <EmptyState
          icon={Plus}
          title="No banners yet"
          description="Create a custom banner to promote something across a section."
        />
      ) : (
        <ul className="space-y-2" data-testid="admin-banners-list">
          {banners.data.map((b) => (
            <li key={b.id} className="surface-card space-y-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.section} · priority {b.priority} · cta {b.cta_kind}
                  </p>
                  {(b.starts_at || b.ends_at) && (
                    <p className="text-[11px] text-muted-foreground">
                      {b.starts_at ? `From ${formatDateTime(b.starts_at)}` : "No start"} ·{" "}
                      {b.ends_at ? `Until ${formatDateTime(b.ends_at)}` : "No end"}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    b.is_active
                      ? "bg-primary/15 text-primary"
                      : "bg-background-alt text-muted-foreground"
                  }`}
                >
                  {b.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {b.description && (
                <p className="text-xs text-muted-foreground">{b.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPendingDelete(b)}>
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
            <DialogTitle>{form?.id ? "Edit banner" : "New banner"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Section">
                  <select
                    className="h-9 w-full rounded-xl border border-input bg-background px-2 text-sm"
                    value={form.section}
                    onChange={(e) =>
                      setForm({ ...form, section: e.target.value as BannerSection })
                    }
                    data-testid="banner-form-section"
                  >
                    {SECTIONS.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority (higher first)">
                  <Input
                    inputMode="numeric"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    data-testid="banner-form-priority"
                  />
                </Field>
              </div>
              <Field label="Title">
                <Input
                  value={form.title}
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="banner-form-title"
                />
              </Field>
              <Field label="Short description">
                <Textarea
                  rows={2}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  data-testid="banner-form-description"
                />
              </Field>
              <Field label="Image / illustration">
                <div className="flex items-center gap-2">
                  <Input
                    value={form.imageUrl}
                    placeholder="https://… or upload"
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    data-testid="banner-form-image-url"
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                    }}
                    data-testid="banner-form-image-file"
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
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="mt-2 max-h-32 w-full rounded-xl object-cover"
                  />
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA kind">
                  <select
                    className="h-9 w-full rounded-xl border border-input bg-background px-2 text-sm"
                    value={form.ctaKind}
                    onChange={(e) =>
                      setForm({ ...form, ctaKind: e.target.value as BannerCtaKind })
                    }
                    data-testid="banner-form-cta-kind"
                  >
                    {CTA_KINDS.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="CTA label">
                  <Input
                    value={form.ctaLabel}
                    disabled={form.ctaKind === "none"}
                    onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                    placeholder="Learn more"
                    data-testid="banner-form-cta-label"
                  />
                </Field>
              </div>
              {(form.ctaKind === "offer" ||
                form.ctaKind === "offerwall_provider" ||
                form.ctaKind === "url") && (
                <Field
                  label={
                    form.ctaKind === "url"
                      ? "URL"
                      : form.ctaKind === "offer"
                        ? "Offer ID (uuid)"
                        : "Offerwall provider ID (uuid)"
                  }
                >
                  <Input
                    value={form.ctaTarget}
                    onChange={(e) => setForm({ ...form, ctaTarget: e.target.value })}
                    data-testid="banner-form-cta-target"
                  />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts (your local time)">
                  <Input
                    type="datetime-local"
                    value={form.startsAtLocal}
                    onChange={(e) => setForm({ ...form, startsAtLocal: e.target.value })}
                    data-testid="banner-form-starts"
                  />
                </Field>
                <Field label="Ends (your local time)">
                  <Input
                    type="datetime-local"
                    value={form.endsAtLocal}
                    onChange={(e) => setForm({ ...form, endsAtLocal: e.target.value })}
                    data-testid="banner-form-ends"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                Active
              </label>
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
              data-testid="banner-save-btn"
            >
              {saveAction.isPending ? "Saving…" : "Save banner"}
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
              This removes the banner immediately across the app.
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
