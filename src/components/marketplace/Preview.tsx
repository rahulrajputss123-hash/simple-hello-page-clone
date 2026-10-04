import { ArrowLeft, BadgeCheck, Camera, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { VERIFICATION_LABEL, type Verification } from "@/lib/marketplace/data";

/** Small notice shown at the top of every marketplace preview screen. */
export function PreviewNotice({ className = "" }: { className?: string }) {
  return (
    <p
      data-testid="preview-notice"
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-gold-dark ${className}`}
    >
      <Eye className="size-3.5" /> Preview — sample data
    </p>
  );
}

/** Replaces any save/submit action in this UI-only pass. */
export function previewOnly(description?: string) {
  toast("Preview only — not saved", {
    description: description ?? "This is a sample screen. Nothing was changed.",
  });
}

/** Auto Verified / Proof Required pill. Publisher-facing language only. */
export function VerificationBadge({
  verification,
  size = "sm",
}: {
  verification: Verification;
  size?: "sm" | "md";
}) {
  const auto = verification === "auto";
  const Icon = auto ? BadgeCheck : Camera;
  return (
    <span
      data-testid={`verification-badge-${verification}`}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
      } ${auto ? "bg-mint/20 text-primary" : "bg-gold/15 text-gold-dark"}`}
    >
      <span aria-hidden>{auto ? "🟢" : "🟡"}</span>
      <Icon className="size-3" />
      {VERIFICATION_LABEL[verification]}
    </span>
  );
}

/** Compact back link used on nested marketplace screens. */
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
    >
      <ArrowLeft className="size-3.5" /> {label}
    </Link>
  );
}

/** Advertiser-style KPI tile. */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "gold" | "mint";
}) {
  const toneClass =
    tone === "gold"
      ? "bg-gold/10 text-gold-dark"
      : tone === "mint"
        ? "bg-mint/15 text-primary"
        : "surface-card";
  return (
    <div className={`rounded-2xl p-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-amount mt-1 text-lg leading-none">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}