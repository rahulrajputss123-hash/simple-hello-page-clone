import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownUp,
  Check,
  ChevronRight,
  Grid2X2,
  ListChecks,
  Phone,
  Plane,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/coinquest";
import { CAMPAIGNS, MY_SUBMISSIONS, type Campaign } from "@/lib/marketplace/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/task")({
  head: () => ({ meta: [{ title: "Microtasks — CashGPT" }, { name: "description", content: "Short tasks from advertisers that pay into your wallet." }] }),
  component: MicrotasksPage,
});

const SHOW_PREVIEW_NOTICE = false;
const categories = [...new Set(CAMPAIGNS.map((task) => task.category))];
const countries = [...new Set(CAMPAIGNS.flatMap((task) => task.countries))];
const devices = ["Any", "Android", "iOS", "Desktop"];

type Sort = "all" | "reward" | "featured";

type TaskCardProps = { campaign: Campaign };

function TaskCard({ campaign }: TaskCardProps) {
  const VerificationIcon = campaign.verification === "auto" ? ShieldCheck : Shield;
  return (
    <Link to="/microtask/$id" params={{ id: campaign.id }} data-testid={`microtask-card-${campaign.id}`} className="surface-card hover-lift press-feedback block p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold", campaign.verification === "auto" ? "bg-mint/20 text-primary" : "bg-gold/15 text-gold-dark")}><VerificationIcon className="size-3" />{campaign.verification === "auto" ? "Auto Verified" : "Proof Required"}</span>
          {campaign.featured && <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-1 text-[10px] font-bold text-white"><Star className="size-3 fill-current" /> Featured</span>}
        </div>
        <div className="shrink-0 text-right"><p className="text-amount text-xl leading-none text-gold-dark">{formatMoney(campaign.reward)}</p><p className="mt-1 text-[10px] text-muted-foreground">{campaign.estimatedTime}</p></div>
      </div>
      <div className="mt-4"><p className="font-bold">{campaign.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{campaign.description}</p></div>
      <div className="mt-4 flex items-center gap-3 text-xs"><span className="inline-flex min-w-0 items-center gap-1.5"><span aria-hidden="true">{campaign.countryFlag}</span><span className="truncate">{campaign.country}</span></span><span className="inline-flex min-w-0 items-center gap-1.5"><Phone className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{campaign.device}</span></span><span className="ml-auto shrink-0 rounded-full bg-background-alt px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{campaign.slotsLeft === null ? "Unlimited slots" : `${campaign.slotsLeft} slots left`}</span></div>
    </Link>
  );
}

function MicrotasksPage() {
  const listRef = useRef<HTMLOListElement>(null);
  const [sort, setSort] = useState<Sort>("all");
  const [open, setOpen] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [verification, setVerification] = useState<"auto" | "proof" | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const pending = MY_SUBMISSIONS.filter((s) => s.status === "pending").length;
  const statusCounts = { pending, approved: MY_SUBMISSIONS.filter((s) => s.status === "approved").length, rejected: MY_SUBMISSIONS.filter((s) => s.status === "rejected").length };
  const filtered = useMemo(() => { let result = CAMPAIGNS.filter((task) => (!featured || task.featured) && (!verification || task.verification === verification) && (!selectedCategories.length || selectedCategories.includes(task.category)) && (!selectedCountries.length || task.countries.some((country) => selectedCountries.includes(country))) && (!selectedDevices.length || selectedDevices.includes("Any") || selectedDevices.includes(task.device) || (selectedDevices.includes("Any") && task.device !== "iOS"))); return [...result].sort((a, b) => sort === "reward" ? b.reward - a.reward : sort === "featured" ? (b.featuredBidPerDay ?? 0) - (a.featuredBidPerDay ?? 0) : (b.featured ? (b.featuredBidPerDay ?? 0) : -1) - (a.featured ? (a.featuredBidPerDay ?? 0) : -1)); }, [sort, featured, verification, selectedCategories, selectedCountries, selectedDevices]);
  const activeFilters = Number(featured) + Number(Boolean(verification)) + selectedCategories.length + selectedCountries.length + selectedDevices.length;
  const toggle = (value: string, current: string[], setter: (next: string[]) => void) => setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const reset = () => { setFeatured(false); setVerification(null); setSelectedCategories([]); setSelectedCountries([]); setSelectedDevices([]); };
  return <AppShell subtitle="Tasks" mainClass="page-fade-in"><SectionHeading variant="ribbon" size="page" icon={Grid2X2} iconSrc="/icons/icon-your-task.png" title="Microtasks" subtitle="Complete simple tasks posted by advertisers and earn rewards." className="mb-2" />{SHOW_PREVIEW_NOTICE && null}
    <div className="surface-card mt-3 grid grid-cols-2 divide-x divide-border bg-mint/10"><button className="flex items-center gap-3 p-4 text-left" onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth" })}><span className="grid size-10 place-items-center rounded-full bg-mint/30 text-primary"><ListChecks className="size-5" /></span><span><b className="block text-sm">Available tasks</b><span className="text-lg font-extrabold">{filtered.length}</span></span><ChevronRight className="ml-auto size-4 text-muted-foreground" /></button><Link to="/my-submissions" className="flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-5" /></span><span><b className="block text-sm">My submissions</b><span className="text-lg font-extrabold">{pending} pending</span></span><ChevronRight className="ml-auto size-4 text-muted-foreground" /></Link></div>
    <div className="mt-3 flex items-center gap-2"><div className="flex min-w-0 flex-1 rounded-full bg-background-alt p-1">{([["all", Grid2X2, "All tasks"], ["reward", ArrowDownUp, "Highest reward"], ["featured", Star, "Featured"]] as const).map(([value, Icon, label]) => <button key={value} onClick={() => setSort(value)} className={cn("flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold", sort === value && "bg-primary text-primary-foreground")}><Icon className="size-3.5 shrink-0" /><span className="truncate">{label}</span></button>)}</div><button aria-label="Open filters" onClick={() => setOpen(true)} className="relative grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-card"><SlidersHorizontal className="size-4" />{activeFilters > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">{activeFilters}</span>}</button></div>
    <div ref={listRef} className="mt-5 flex items-end justify-between"><SectionHeading variant="ribbon" icon={ListChecks} title="Available Tasks" /><span className="mb-3 text-xs text-muted-foreground">{filtered.length} tasks</span></div>
    <ol className="stagger-children space-y-3" data-testid="microtask-list">{filtered.map((campaign) => <li key={campaign.id}><TaskCard campaign={campaign} /></li>)}</ol>
    <Link to="/my-submissions" className="surface-card mt-4 flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold-dark"><Plane className="size-4" /></span><span className="min-w-0"><b className="block">My Submissions</b><span className="text-xs text-muted-foreground">{statusCounts.pending} pending • {statusCounts.approved} approved • {statusCounts.rejected} rejected</span></span><ChevronRight className="ml-auto size-4 text-muted-foreground" /></Link>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>Filter tasks</SheetTitle><SheetDescription>Choose the opportunities you want to see.</SheetDescription></SheetHeader><div className="flex flex-col gap-5 py-5"><FilterRow label="Featured tasks"><Switch checked={featured} onCheckedChange={setFeatured} /></FilterRow><FilterRow label="Auto verified"><Switch checked={verification === "auto"} onCheckedChange={(checked) => setVerification(checked ? "auto" : null)} /></FilterRow><FilterRow label="Proof required"><Switch checked={verification === "proof"} onCheckedChange={(checked) => setVerification(checked ? "proof" : null)} /></FilterRow><ChipGroup label="Categories" options={categories} selected={selectedCategories} toggle={(v) => toggle(v, selectedCategories, setSelectedCategories)} /><ChipGroup label="Countries" options={countries} selected={selectedCountries} toggle={(v) => toggle(v, selectedCountries, setSelectedCountries)} /><ChipGroup label="Devices" options={devices} selected={selectedDevices} toggle={(v) => toggle(v, selectedDevices, setSelectedDevices)} /></div><SheetFooter className="gap-2"><Button variant="ghost" onClick={reset}>Reset</Button><Button variant="jade" className="flex-1" onClick={() => setOpen(false)}>Show {filtered.length} tasks</Button></SheetFooter></SheetContent></Sheet>
  </AppShell>;
}
function FilterRow({ label, children }: { label: string; children: ReactNode }) { return <div className="flex items-center justify-between"><span className="text-sm font-semibold">{label}</span>{children}</div>; }
function ChipGroup({ label, options, selected, toggle }: { label: string; options: string[]; selected: string[]; toggle: (value: string) => void }) { return <div><p className="mb-2 text-sm font-semibold">{label}</p><div className="flex flex-wrap gap-2">{options.map((option) => <button key={option} onClick={() => toggle(option)} className={cn("rounded-full border border-border px-3 py-1.5 text-xs", selected.includes(option) && "border-primary bg-primary text-primary-foreground")}>{option}</button>)}</div></div>; }
