import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePremiumOnboardingStep,
  listAdminPremiumOnboardingSteps,
  reorderPremiumOnboardingSteps,
  savePremiumOnboardingStep,
} from "@/lib/onboarding/functions";
import { type PremiumOnboardingStep, type PremiumStepType } from "@/lib/onboarding/premium";

type FormState = {
  id?: string;
  stepKey: string;
  title: string;
  subtitle: string;
  description: string;
  stepType: PremiumStepType;
  ctaText: string;
  displayOrder: string;
  enabled: boolean;
  accentStyle: "gold" | "jade";
  position: "center" | "bottom";
  illustration: string;
  icon: string;
};

const emptyForm = (order: number): FormState => ({ stepKey: `custom_${order}`, title: "", subtitle: "", description: "", stepType: "showcase", ctaText: "Next →", displayOrder: String(order), enabled: true, accentStyle: "gold", position: "bottom", illustration: "spark", icon: "sparkles" });
const toForm = (step: PremiumOnboardingStep): FormState => ({ id: step.id, stepKey: step.step_key, title: step.title, subtitle: step.subtitle, description: step.description, stepType: step.step_type, ctaText: step.cta_text, displayOrder: String(step.display_order), enabled: step.enabled, accentStyle: step.accent_style, position: step.position, illustration: step.illustration ?? "", icon: step.icon ?? "" });

export function PremiumOnboardingManager() {
  const queryClient = useQueryClient();
  const fetchSteps = useServerFn(listAdminPremiumOnboardingSteps);
  const save = useServerFn(savePremiumOnboardingStep);
  const remove = useServerFn(deletePremiumOnboardingStep);
  const reorder = useServerFn(reorderPremiumOnboardingSteps);
  const [form, setForm] = useState<FormState | null>(null);
  const [preview, setPreview] = useState<PremiumOnboardingStep | null>(null);

  const steps = useQuery({ queryKey: ["admin-premium-onboarding"], queryFn: () => fetchSteps({}) });
  const list = (steps.data ?? []).slice().sort((a, b) => a.display_order - b.display_order);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-premium-onboarding"] });
    void queryClient.invalidateQueries({ queryKey: ["premium-onboarding-steps"] });
  };
  const onError = (error: Error) => toast.error(error.message);
  const saveAction = useMutation({
    mutationFn: (state: FormState) => save({ data: { ...(state.id ? { id: state.id } : {}), stepKey: state.stepKey, title: state.title, subtitle: state.subtitle, description: state.description, stepType: state.stepType, ctaText: state.ctaText, displayOrder: Number(state.displayOrder) || 0, enabled: state.enabled, accentStyle: state.accentStyle, position: state.position, illustration: state.illustration || null, icon: state.icon || null } }),
    onSuccess: () => { toast.success("Premium step saved."); setForm(null); refresh(); },
    onError,
  });
  const deleteAction = useMutation({ mutationFn: (id: string) => remove({ data: { id } }), onSuccess: () => { toast.success("Step deleted."); refresh(); }, onError });
  const reorderAction = useMutation({ mutationFn: (ids: string[]) => reorder({ data: { orderedIds: ids } }), onSuccess: refresh, onError });
  const move = (id: string, direction: -1 | 1) => {
    const index = list.findIndex((step) => step.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= list.length) return;
    const reordered = list.slice();
    const first = reordered[index];
    const second = reordered[next];
    if (!first || !second) return;
    [reordered[index], reordered[next]] = [second, first];
    reorderAction.mutate(reordered.map((step) => step.id));
  };
  const toggle = (step: PremiumOnboardingStep) => saveAction.mutate(toForm({ ...step, enabled: !step.enabled }));
  const duplicate = (step: PremiumOnboardingStep) => {
    const duplicated = toForm({ ...step, step_key: `${step.step_key}_copy`, display_order: list.length + 1 });
    delete duplicated.id;
    saveAction.mutate(duplicated);
  };

  return (
    <div className="space-y-4" data-testid="premium-onboarding-manager">
      <div className="rounded-2xl bg-jade-gradient p-4 text-primary-foreground shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Premium flow</p><h3 className="mt-1 font-display text-xl">Shape the first impression</h3><p className="mt-1 max-w-md text-xs text-primary-foreground/70">Manage the nine-step earning introduction without touching the existing Home layout.</p></div>
          <Button size="sm" variant="gold" onClick={() => setForm(emptyForm(list.length + 1))} data-testid="onboarding-add-step-btn"><Plus className="mr-1 size-4" /> Add step</Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Enabled steps appear in the mobile onboarding experience. Static showcase steps never load live earning data.</p><Button size="sm" variant="outline" onClick={() => setPreview(list.find((step) => step.enabled) ?? null)} disabled={!list.length} data-testid="onboarding-preview-btn"><Eye className="mr-1 size-4" /> Preview</Button></div>
      {steps.isLoading ? <p className="text-sm text-muted-foreground">Loading premium steps…</p> : !list.length ? <EmptyState icon={Plus} title="No premium steps yet" description="Create a step or apply the preset flow." /> : <ul className="space-y-2" data-testid="premium-onboarding-steps-list">
        {list.map((step, index) => <li key={step.id} className="surface-card space-y-3 p-3" data-testid={`onboarding-step-row-${step.id}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-background-alt text-xs font-bold text-primary">{index + 1}</span><p className="font-semibold">{step.title}</p><span className="rounded-full bg-background-alt px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{step.step_type}</span></div><p className="mt-1 text-xs text-muted-foreground">{step.subtitle || step.step_key}</p></div><Switch checked={step.enabled} onCheckedChange={() => toggle(step)} data-testid={`onboarding-step-toggle-${step.id}`} /></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={index === 0} onClick={() => move(step.id, -1)} data-testid={`onboarding-step-up-${step.id}`}><ArrowUp className="size-3.5" /></Button><Button size="sm" variant="outline" disabled={index === list.length - 1} onClick={() => move(step.id, 1)} data-testid={`onboarding-step-down-${step.id}`}><ArrowDown className="size-3.5" /></Button><Button size="sm" variant="outline" onClick={() => setPreview(step)} data-testid={`onboarding-step-preview-${step.id}`}><Eye className="mr-1 size-3.5" /> Preview</Button><Button size="sm" variant="outline" onClick={() => setForm(toForm(step))} data-testid={`onboarding-step-edit-${step.id}`}><Pencil className="mr-1 size-3.5" /> Edit</Button><Button size="sm" variant="outline" onClick={() => duplicate(step)} data-testid={`onboarding-step-duplicate-${step.id}`}><Copy className="mr-1 size-3.5" /> Duplicate</Button><Button size="sm" variant="outline" onClick={() => deleteAction.mutate(step.id)} data-testid={`onboarding-step-delete-${step.id}`}><Trash2 className="mr-1 size-3.5" /> Delete</Button></div></li>)}
      </ul>}
      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}><DialogContent className="max-h-[88vh] overflow-y-auto"><DialogHeader><DialogTitle>{form?.id ? "Edit premium step" : "Add premium step"}</DialogTitle></DialogHeader>{form && <div className="space-y-3"><Field label="Step key"><Input value={form.stepKey} onChange={(event) => setForm({ ...form, stepKey: event.target.value })} data-testid="onboarding-form-step-key" /></Field><Field label="Title"><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} data-testid="onboarding-form-title" /></Field><Field label="Subtitle"><Input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} data-testid="onboarding-form-subtitle" /></Field><Field label="Description"><Textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} data-testid="onboarding-form-description" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Step type"><select value={form.stepType} onChange={(event) => setForm({ ...form, stepType: event.target.value as PremiumStepType })} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" data-testid="onboarding-form-step-type"><option value="welcome">Welcome</option><option value="avatar">Avatar picker</option><option value="profile">Profile form</option><option value="showcase">Static showcase</option><option value="celebration">Ready banner</option></select></Field><Field label="CTA text"><Input value={form.ctaText} onChange={(event) => setForm({ ...form, ctaText: event.target.value })} data-testid="onboarding-form-cta" /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Order"><Input inputMode="numeric" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} data-testid="onboarding-form-order" /></Field><label className="flex items-end gap-2 pb-2 text-sm"><Switch checked={form.enabled} onCheckedChange={(enabled) => setForm({ ...form, enabled })} data-testid="onboarding-form-enabled" /> Enabled</label></div></div>}<DialogFooter><Button variant="outline" onClick={() => setForm(null)} data-testid="onboarding-form-cancel">Cancel</Button><Button variant="jade" disabled={!form?.title.trim() || saveAction.isPending} onClick={() => form && saveAction.mutate(form)} data-testid="onboarding-form-save">{saveAction.isPending ? "Saving…" : "Save step"}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}><DialogContent><DialogHeader><DialogTitle>Step preview</DialogTitle></DialogHeader>{preview && <div className="premium-preview-card rounded-3xl bg-[#faf8f5] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#98751f]">{preview.step_type} · {preview.step_key}</p><div className="mt-5 rounded-3xl bg-[#0b2b28] p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f3d068]">CashGPT premium</p><h3 className="mt-3 font-display text-3xl">{preview.title}</h3><p className="mt-2 text-sm text-[#b9d2cb]">{preview.subtitle}</p><p className="mt-3 text-sm leading-relaxed text-[#b9d2cb]/80">{preview.description}</p><div className="mt-6 inline-flex rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-extrabold text-[#0b2b28]">{preview.cta_text}</div></div></div>}</DialogContent></Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>; }