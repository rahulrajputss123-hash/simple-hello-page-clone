import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, CheckCircle2, ImagePlus, X } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackLink, VerificationBadge } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { getCampaignForEarner, submitProof } from "@/lib/marketplace.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/microtask-proof/$id")({
  head: () => ({ meta: [{ title: "Submit proof — CashGPT" }] }),
  component: ProofSubmissionPage,
});

function ProofSubmissionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: c, isLoading } = useQuery({
    queryKey: ["earner-campaign", id],
    queryFn: () => getCampaignForEarner({ data: { campaignId: id } }),
  });
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user.id || !c?.clickId)
        throw new Error("Start this task before submitting proof.");

      // Validate required images
      const minImages = c.proof_min_images ?? 1;
      const maxImages = c.proof_max_images ?? 3;
      if (maxImages > 0 && files.length < minImages) {
        throw new Error(`Please upload at least ${minImages} image${minImages === 1 ? "" : "s"}.`);
      }
      if (files.length > maxImages) {
        throw new Error(`Maximum ${maxImages} images allowed.`);
      }

      // Validate required fields
      const proofFields = (c.proof_fields as any[]) ?? [];
      for (const field of proofFields) {
        if (field.required && !fieldValues[field.key]?.trim()) {
          throw new Error(`${field.label} is required.`);
        }
        const value = fieldValues[field.key] || "";
        if (value.length > field.maxLen) {
          throw new Error(`${field.label} must be ${field.maxLen} characters or less.`);
        }
      }

      // Upload images
      const paths: string[] = [];
      for (const file of files) {
        const path = `${session.user.id}/${c.clickId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage
          .from("offer-proofs")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        paths.push(path);
      }

      // Submit proof with field values
      return submitProof({
        data: { clickId: c.clickId, proofPaths: paths, fieldValues, userNote: notes },
      });
    },
    onSuccess: () => navigate({ to: "/submissions" }),
    onError: (error) => {
      const msg = error instanceof Error ? error.message : "Could not submit proof";
      // Parse MKT_INVALID_PROOF error details
      if (msg.includes("MKT_INVALID_PROOF")) {
        const match = msg.match(/missing ([\w\s]+)/i);
        if (match) {
          setErrorMessage(`Please provide: ${match[1]}`);
          return;
        }
      }
      setErrorMessage(msg);
    },
  });

  if (isLoading)
    return (
      <AppShell subtitle="Tasks">
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading task…</p>
      </AppShell>
    );
  if (!c) {
    return (
      <AppShell subtitle="Tasks">
        <BackLink to="/task" label="Back to Microtasks" />
        <p className="mt-8 text-center text-sm text-muted-foreground">That task isn't available.</p>
      </AppShell>
    );
  }

  const backTo = { to: "/microtask/$id" as const, params: { id: c.id } };

  if (!c.clickId) {
    navigate({ to: "/microtask/$id", params: { id } });
    return null;
  }

  // Auto-verified tasks have no proof step — show a "task started" screen instead.
  if (c.verification_mode === "auto") {
    return (
      <AppShell subtitle="Tasks" mainClass="page-fade-in">
        <BackLink to={`/microtask/${c.id}`} label="Back to task" />
        <div className="surface-card mt-4 flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-mint/20">
            <CheckCircle2 className="success-pop size-8 text-primary" />
          </span>
          <h1 className="text-lg">Task started</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Complete <strong>{c.name}</strong> and your {formatMoney(Number(c.publisher_reward))}{" "}
            reward is credited automatically — nothing to upload.
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

      <div className="surface-card mt-3 p-4">
        <VerificationBadge verification="proof" />
        <p className="mt-1.5 font-semibold">{c.name}</p>
        <p className="text-amount text-sm text-gold-dark">
          {formatMoney(Number(c.publisher_reward))} on approval
        </p>
      </div>

      <SectionHeading
        variant="ribbon"
        icon={Camera}
        iconSrc="/icons/icon-cloud-upload.webp"
        title="Upload your proof"
      />
      <form
        className="surface-card space-y-4 p-4"
        data-testid="proof-form"
        onSubmit={(e) => {
          e.preventDefault();
          submitMutation.mutate();
        }}
      >
        {c.proof_description && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            {c.proof_description}
          </div>
        )}

        {/* @ts-ignore: campaign_options is loaded as left join */}
        {c.campaign_options?.[0]?.proof_example_url && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Example of a good proof:</Label>
            <div className="overflow-hidden rounded-xl border border-border">
              {/* @ts-ignore */}
              <img
                src={c.campaign_options[0].proof_example_url}
                alt="Proof example"
                className="w-full object-contain bg-background-alt"
              />
            </div>
          </div>
        )}

        {(c.proof_max_images ?? 3) > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="proof-file">
              Screenshot{(c.proof_min_images ?? 1) > 1 ? "s" : ""}{" "}
              {(c.proof_min_images ?? 1) > 0 &&
                `(${c.proof_min_images}-${c.proof_max_images} required)`}
            </Label>
            {preview ? (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img
                  src={preview}
                  alt="Proof preview"
                  className="max-h-72 w-full object-contain bg-background-alt"
                />
                <button
                  type="button"
                  aria-label="Remove screenshot"
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card shadow-soft"
                  onClick={() => {
                    setPreview(null);
                    setFiles([]);
                  }}
                >
                  <X className="size-4" />
                </button>
                {files.length > 1 && (
                  <div className="absolute bottom-2 right-2 rounded-full bg-card px-2 py-1 text-xs font-semibold">
                    +{files.length - 1} more
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor="proof-file"
                data-testid="proof-upload"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background-alt px-4 py-8 text-center"
              >
                <ImagePlus className="size-7 text-primary" />
                <span className="text-sm font-semibold">
                  Tap to add screenshot{(c.proof_max_images ?? 3) > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG or WebP · up to {c.proof_max_images} images, 5 MB each
                </span>
              </label>
            )}
            <input
              id="proof-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={(c.proof_max_images ?? 3) > 1}
              className="sr-only"
              onChange={(e) => {
                const selected = Array.from(e.target.files ?? []);
                const maxFiles = c.proof_max_images ?? 3;
                const valid = selected
                  .filter(
                    (file) =>
                      ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
                      file.size <= 5 * 1024 * 1024,
                  )
                  .slice(0, maxFiles);
                if (valid.length !== selected.length || selected.length > maxFiles) {
                  setErrorMessage(
                    `Use up to ${maxFiles} JPEG, PNG, or WebP images, each no larger than 5 MB.`,
                  );
                }
                setFiles(valid);
                setPreview(valid[0] ? URL.createObjectURL(valid[0]) : null);
              }}
            />
          </div>
        )}

        {((c.proof_fields as any[]) ?? []).length > 0 && (
          <div className="space-y-3">
            {((c.proof_fields as any[]) ?? []).map((field: any) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`field-${field.key}`}>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`field-${field.key}`}
                  maxLength={field.maxLen}
                  placeholder={field.label}
                  value={fieldValues[field.key] || ""}
                  onChange={(e) => setFieldValues({ ...fieldValues, [field.key]: e.target.value })}
                  required={field.required}
                />
                <p className="text-[11px] text-muted-foreground">Max {field.maxLen} characters</p>
              </div>
            ))}
          </div>
        )}

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

        {(errorMessage || submitMutation.isError) && (
          <p className="text-sm text-destructive">
            {errorMessage || "Could not submit proof. Please try again."}
          </p>
        )}
        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="w-full"
          disabled={submitMutation.isPending}
          data-testid="proof-submit"
        >
          Submit for review
        </Button>
      </form>
    </AppShell>
  );
}
