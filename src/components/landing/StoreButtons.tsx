import { Download, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APK_DOWNLOAD_URL, STORE_COPY, type StoreKey } from "@/components/landing/landing-data";

/* -------------------------------------------------------------------------- */
/*  Store glyphs — monochrome so they inherit the design system's colours       */
/* -------------------------------------------------------------------------- */

function GooglePlayGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l10.885-10.87L1.337.924zm12.007 10.25l2.988-2.971L2.936.153a1.49 1.49 0 0 0-.755-.152l11.163 11.173zm0 1.649L2.193 23.994c.233-.014.469-.073.684-.199l13.469-7.674-3.002-2.998z" />
    </svg>
  );
}

function AppleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Store buttons                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The Google Play / App Store CTA pair. Neither button navigates — both hand the
 * chosen store up to the page-level dialog.
 *
 * @param tone "dark" for jade surfaces, "light" for cream/white surfaces.
 * @param compact Tighter sizing, and drops the two-line store labels.
 * @param primaryOnly Render just the gold CTA (used by the sticky mobile bar).
 */
export function StoreButtons({
  onSelect,
  tone = "dark",
  compact = false,
  primaryOnly = false,
  className = "",
}: {
  onSelect: (store: StoreKey) => void;
  tone?: "dark" | "light";
  compact?: boolean;
  primaryOnly?: boolean;
  className?: string;
}) {
  const size = compact ? "default" : "lg";

  const secondaryTone =
    tone === "dark"
      ? "border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground shadow-none backdrop-blur-sm hover:bg-primary-foreground/20"
      : "border border-border bg-card text-foreground shadow-soft hover:bg-background-alt";

  return (
    <div
      className={`flex gap-3 ${primaryOnly ? "" : "flex-col sm:flex-row sm:items-center"} ${className}`}
      data-testid="store-buttons"
    >
      {/* Primary — gold, wrapped in a softly pulsing glow halo. */}
      <span className={`relative inline-flex ${primaryOnly ? "" : "w-full sm:w-auto"}`}>
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1.5 rounded-3xl opacity-40 motion-reduce:opacity-30"
        >
          {/* Reuses the existing splash-halo-pulse keyframes; the parent's opacity
              keeps the glow subtle since the animation drives opacity 0.55 → 0.9. */}
          <span className="block size-full rounded-3xl bg-gold blur-lg animate-[splash-halo-pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none" />
        </span>
        <Button
          variant="gold"
          size={size}
          onClick={() => onSelect("play")}
          className={`relative w-full ${compact ? "" : "px-7"}`}
          data-testid="cta-google-play"
        >
          <GooglePlayGlyph className="size-4 shrink-0" />
          {compact ? (
            <span className="text-sm">Install Free</span>
          ) : (
            <span className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                Get it on
              </span>
              <span className="text-[15px]">Google Play</span>
            </span>
          )}
        </Button>
      </span>

      {!primaryOnly && (
        <Button
          size={size}
          onClick={() => onSelect("appstore")}
          className={`w-full sm:w-auto ${secondaryTone} ${compact ? "" : "px-7"}`}
          data-testid="cta-app-store"
        >
          <AppleGlyph className="size-4 shrink-0" />
          {compact ? (
            <span className="text-sm">App Store</span>
          ) : (
            <span className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                Download on
              </span>
              <span className="text-[15px]">App Store</span>
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Store unavailable dialog                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Friendly "listing is under review" popup with a direct APK fallback.
 * Controlled — drive it from {@link useStoreDialog}.
 */
export function StoreDialog({
  store,
  open,
  onOpenChange,
}: {
  store: StoreKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const copy = store ? STORE_COPY[store] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-sm overflow-y-auto rounded-[1.25rem]"
        data-testid="store-unavailable-dialog"
      >
        <DialogHeader>
          <span
            aria-hidden
            className="grid size-12 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground shadow-gold"
          >
            <ShieldCheck className="size-6" />
          </span>
          <DialogTitle
            className="pt-2 text-left font-display text-lg"
            data-testid="store-dialog-title"
          >
            {copy?.title ?? "Store listing unavailable"}
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed">
            {copy?.message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-1 gap-2 sm:flex-col sm:space-x-0">
          <Button asChild variant="jade" className="w-full" data-testid="store-dialog-apk">
            <a href={APK_DOWNLOAD_URL} download>
              <Download className="size-4" />
              Direct Download (APK)
            </a>
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full text-muted-foreground">
              Maybe later
            </Button>
          </DialogClose>
        </DialogFooter>

        <p className="text-center text-[11px] text-muted-foreground">
          Android 7.0+ · Free to install · No hidden charges
        </p>
      </DialogContent>
    </Dialog>
  );
}
