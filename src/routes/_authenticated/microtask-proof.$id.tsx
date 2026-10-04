import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, CheckCircle2, ImagePlus, X } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BackLink,
  PreviewNotice,
  VerificationBadge,
  previewOnly,
} from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { campaignById } from "@/lib/marketplace/data";

export const Route = createFileRoute("/_authenticated/microtask-proof/$id")({
  head: () => ({ meta: [{ title: "Submit proof — CashGPT" }] }),
  component: ProofSubmissionPage,
});

function ProofSubmissionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const c = campaignById(id);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  if (!c) {
    return (
      <AppShell subtitle="Tasks">
        <BackLink to="/task" label="Back to Microtasks" />
        <p className="mt-8 text-center text-sm text-muted-foreground">That task isn't available.</p>
      </AppShell>
    );
  }

  const backTo = { to: "/microtask/$id" as const, params: { id: c.id } };

  // Auto-verified tasks have no proof step — show a "task started" screen instead.
  if (c.verification === "auto") {
    return (
      <AppShell subtitle="Tasks" mainClass="page-fade-in">
        <BackLink to={`/microtask/${c.id}`} label="Back to task" />
        <PreviewNotice className="mt-3" />
        <div className="surface-card mt-4 flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-mint/20">
            <CheckCircle2 className="success-pop size-8 text-primary" />
          </span>
          <h1 className="text-lg">Task started</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Complete <strong>{c.title}</strong> and your {formatMoney(c.reward)} reward is credited
            automatically — nothing to upload.
          </p>
          <Button variant="jade" className="mt-2 w-full" onClick={() => navigate(backTo)}>
            Got it
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="Tasks" mainClass="page-fade-in">
      <BackLink to={`/microtask/${c.id}`} label="Back to task" />
      <PreviewNotice className="mt-3" />

      <div className="surface-card mt-3 p-4">
        <VerificationBadge verification="proof" />
        <p className="mt-1.5 font-semibold">{c.title}</p>
        <p className="text-amount text-sm text-gold-dark">{formatMoney(c.reward)} on approval</p>
      </div>

      <SectionHeading variant="ribbon" icon={Camera} title="Upload your proof" />
      <form
        className="surface-card space-y-4 p-4"
        data-testid="proof-form"
        onSubmit={(e) => {
          e.preventDefault();
          previewOnly("Your proof would be sent for review here.");
          navigate(backTo);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="proof-file">Screenshot</Label>
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl border border-border">
              <img src={preview} alt="Proof preview" className="max-h-72 w-full object-contain bg-background-alt" />
              <button
                type="button"
                aria-label="Remove screenshot"
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card shadow-soft"
                onClick={() => setPreview(null)}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="proof-file"
              data-testid="proof-upload"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background-alt px-4 py-8 text-center"
            >
              <ImagePlus className="size-7 text-primary" />
              <span className="text-sm font-semibold">Tap to add a screenshot</span>
              <span className="text-xs text-muted-foreground">PNG or JPG · full screen, not cropped</span>
            </label>
          )}
          <input
            id="proof-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setPreview(URL.createObjectURL(file));
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="proof-notes">Notes (optional)</Label>
          <Textarea
            id="proof-notes"
            rows={3}
            maxLength={500}
            placeholder="Anything the reviewer should know?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <ul className="space-y-1 text-[11px] text-muted-foreground">
          {(c.proofRequirements ?? []).map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>

        <Button type="submit" variant="gold" size="lg" className="w-full" data-testid="proof-submit">
          Submit for review
        </Button>
      </form>
    </AppShell>
  );
}