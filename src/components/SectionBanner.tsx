import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Flame, Gift, ListChecks, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { listEligibleBanners, listSmartBannerSettings } from "@/lib/banners/functions";
import type { BannerSection, EligibleBanner } from "@/lib/banners/server";
import { buildSmartBanners, type SmartBanner } from "@/lib/banners/smart";

type UnifiedBanner =
  { kind: "custom"; data: EligibleBanner } | { kind: "smart"; data: SmartBanner };

const ROTATION_INTERVAL_MS = 6000;
/** Crossfade length. Must match the .banner-fade-out animation in styles.css. */
const BANNER_FADE_MS = 350;
const LAST_SHOWN_STORAGE_PREFIX = "cashgpt.banner_last:";

function unifiedId(b: UnifiedBanner): string {
  return b.kind === "custom" ? `db:${b.data.id}` : b.data.id;
}

function unifiedPriority(b: UnifiedBanner): number {
  return b.kind === "custom" ? b.data.priority : b.data.priority;
}

function pickStartIndex(section: BannerSection, sortedIds: string[]): number {
  if (sortedIds.length <= 1) return 0;
  if (typeof window === "undefined") return 0;
  const key = LAST_SHOWN_STORAGE_PREFIX + section;
  const last = window.localStorage.getItem(key);
  if (!last) return 0;
  const idx = sortedIds.indexOf(last);
  if (idx === -1) return 0;
  // Round-robin: start with the NEXT one relative to last-shown.
  return (idx + 1) % sortedIds.length;
}

/**
 * SectionBanner
 * - Loads DB-backed custom + scheduled banners for the section.
 * - Builds smart banners from live user/app data (never DB-cached).
 * - Merges by priority DESC, then round-robins visits within equal priority
 *   using localStorage so the same one doesn't repeat.
 */
export function SectionBanner({ section }: { section: BannerSection }) {
  const { session, profile } = useAuth();
  const fetchDb = useServerFn(listEligibleBanners);
  const fetchSmartSettings = useServerFn(listSmartBannerSettings);

  const dbQuery = useQuery({
    queryKey: ["banners", section],
    queryFn: () => fetchDb({ data: { section } }),
    staleTime: 60_000,
  });

  // Smart-banner on/off switches (admin-controlled). Not needed on Home, which
  // never renders smart banners.
  const smartSettingsQuery = useQuery({
    queryKey: ["smart-banner-settings"],
    enabled: Boolean(session) && section !== "home",
    queryFn: () => fetchSmartSettings({}),
    staleTime: 60_000,
  });

  // Live signals for the smart engine.
  const offersQ = useQuery({
    queryKey: ["banner-offers-count"],
    enabled: Boolean(session) && (section === "home" || section === "offers"),
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, reward_amount, is_active")
        .eq("is_active", true)
        .limit(200);
      const rows = data ?? [];
      return {
        count: rows.length,
        hasHighValue: rows.some((r) => Number(r.reward_amount) >= 1),
      };
    },
    staleTime: 60_000,
  });

  const tasksQ = useQuery({
    queryKey: ["banner-tasks-progress", session?.user.id],
    enabled: Boolean(session) && (section === "home" || section === "tasks"),
    queryFn: async () => {
      const { data } = await supabase.from("user_tasks").select("progress, target, status");
      const rows = data ?? [];
      const inProgress = rows.filter((r) => r.status !== "completed").length;
      const nearComplete = rows.filter(
        (r) =>
          r.status !== "completed" &&
          Number(r.target ?? 0) > 0 &&
          Number(r.progress ?? 0) / Number(r.target) >= 0.7,
      ).length;
      return { inProgress, nearComplete };
    },
    staleTime: 60_000,
  });

  const offerwallQ = useQuery({
    queryKey: ["banner-offerwall-count"],
    enabled: Boolean(session) && (section === "home" || section === "offerwall"),
    queryFn: async () => {
      const { data } = await supabase
        .from("sdk_offerwall_providers")
        .select("id, enabled, status")
        .eq("enabled", true);
      const rows = data ?? [];
      return rows.filter((r) => r.status !== "disabled").length;
    },
    staleTime: 60_000,
  });

  const smart: SmartBanner[] = useMemo(
    () =>
      buildSmartBanners(section, {
        profile: profile ?? null,
        offersCount: offersQ.data?.count ?? 0,
        hasHighValueOffer: offersQ.data?.hasHighValue ?? false,
        tasksInProgress: tasksQ.data?.inProgress ?? 0,
        tasksNearComplete: tasksQ.data?.nearComplete ?? 0,
        activeOfferwallCount: offerwallQ.data ?? 0,
      }),
    [section, profile, offersQ.data, tasksQ.data, offerwallQ.data],
  );

  // Home rotates CUSTOM banners only — smart banners are never eligible there.
  // Everywhere else, drop any template an admin has switched off.
  const smartEligible: SmartBanner[] = useMemo(() => {
    if (section === "home") return [];
    const disabled = new Set(
      (smartSettingsQuery.data ?? []).filter((s) => !s.enabled).map((s) => s.template_key),
    );
    return smart.filter((b) => !disabled.has(b.id));
  }, [section, smart, smartSettingsQuery.data]);

  const merged: UnifiedBanner[] = useMemo(() => {
    const list: UnifiedBanner[] = [
      ...(dbQuery.data ?? []).map((b) => ({ kind: "custom" as const, data: b })),
      ...smartEligible.map((b) => ({ kind: "smart" as const, data: b })),
    ];
    return list.sort((a, b) => {
      const pa = unifiedPriority(a);
      const pb = unifiedPriority(b);
      if (pa !== pb) return pb - pa;
      // Stable secondary sort by id so rotation index is deterministic.
      return unifiedId(a).localeCompare(unifiedId(b));
    });
  }, [dbQuery.data, smartEligible]);

  const [index, setIndex] = useState(0);

  // On banner-set change: pick the round-robin next-after-last-shown.
  useEffect(() => {
    if (!merged.length) {
      setIndex(0);
      return;
    }
    const ids = merged.map(unifiedId);
    setIndex(pickStartIndex(section, ids));
  }, [section, merged]);

  const current = merged.length ? merged[Math.min(index, merged.length - 1)] : undefined;
  const currentId = current ? unifiedId(current) : null;
  /** Identity of the banner SET, so a refetch/reorder isn't mistaken for a rotation. */
  const setSignature = useMemo(() => merged.map(unifiedId).join("|"), [merged]);

  /**
   * The banner that was on screen before the current one. Held as the banner
   * OBJECT rather than an index so a refetch that reorders or shortens the list
   * can never leave the overlay pointing at the wrong entry.
   */
  const [outgoing, setOutgoing] = useState<UnifiedBanner | null>(null);
  const shownRef = useRef<{ id: string; banner: UnifiedBanner } | null>(null);
  const setSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!current || !currentId) {
      shownRef.current = null;
      setOutgoing(null);
      return;
    }
    const previouslyShown = shownRef.current;
    shownRef.current = { id: currentId, banner: current };

    // A brand-new banner SET is not a rotation — don't fade out from a banner
    // the user was never shown in this list.
    if (setSignatureRef.current !== setSignature) {
      setSignatureRef.current = setSignature;
      setOutgoing(null);
      return;
    }
    if (!previouslyShown || previouslyShown.id === currentId) return;

    setOutgoing(previouslyShown.banner);
    // Rapid dot taps restart the fade instead of stacking overlays.
    const t = setTimeout(() => setOutgoing(null), BANNER_FADE_MS);
    return () => clearTimeout(t);
  }, [current, currentId, setSignature]);

  /**
   * Warm the browser cache for EVERY banner image as soon as the list is known,
   * so rotating to one paints instantly. Without this the next banner's image
   * only starts downloading when its element mounts, which is what produced the
   * blank frame mid-transition.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const banner of merged) {
      if (banner.kind !== "custom") continue;
      const url = banner.data.image_url;
      if (!url) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    }
  }, [merged]);

  // Persist "last shown" so the next visit rotates forward.
  useEffect(() => {
    if (!merged.length || typeof window === "undefined") return;
    const id = unifiedId(merged[index] ?? merged[0]);
    window.localStorage.setItem(LAST_SHOWN_STORAGE_PREFIX + section, id);
  }, [section, index, merged]);

  // In-view auto-advance if there's more than one.
  useEffect(() => {
    if (merged.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % merged.length);
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(t);
  }, [merged.length]);

  if (!merged.length) return null;

  return (
    <section
      className="mb-4 mt-3"
      aria-label={`${section} banner`}
      data-testid={`section-banner-${section}`}
    >
      {/* Crossfade: the incoming banner stays in normal flow (so it keeps
          defining the container height — banner kinds have different natural
          heights), and the outgoing one is overlaid on top and fades out. The
          incoming banner is never transparent, so there is no frame where
          neither banner is painted. */}
      <div className="relative">
        <BannerCard banner={current} />
        {outgoing && (
          <div
            aria-hidden
            className="banner-fade-out pointer-events-none absolute inset-0 [&>article]:h-full [&>article]:w-full"
            data-testid={`section-banner-outgoing-${section}`}
          >
            <BannerCard banner={outgoing} />
          </div>
        )}
      </div>
      {merged.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {merged.map((b, i) => (
            <button
              key={unifiedId(b)}
              type="button"
              aria-label={`Show banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-primary/30"
              }`}
              data-testid={`section-banner-dot-${section}-${i}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BannerCard({ banner }: { banner: UnifiedBanner }) {
  if (banner.kind === "custom") return <CustomBannerCard b={banner.data} />;
  return <SmartBannerCard b={banner.data} />;
}

function CustomBannerCard({ b }: { b: EligibleBanner }) {
  const cta = b.cta_resolved;
  const hasImage = Boolean(b.image_url);
  // A banner has "text content" if any of title / description / CTA is present.
  const hasText = Boolean(b.title) || Boolean(b.description) || Boolean(cta);
  // Pure-image: image present but no text at all — no overlay, no text layer.
  const pureImage = hasImage && !hasText;

  const bg = hasImage
    ? {
        backgroundImage: `url(${b.image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  // No-image (text-only) banners keep content-driven height via padding.
  // Image banners get a fixed 2:1 aspect-ratio container so the image is never
  // distorted by text length.
  const outerClass = hasImage
    ? `surface-card relative aspect-[2/1] w-full overflow-hidden text-center shadow-lift${
        hasImage ? "" : " bg-jade-gradient text-primary-foreground"
      }`
    : `surface-card relative overflow-hidden p-5 text-center shadow-lift bg-jade-gradient text-primary-foreground`;

  return (
    <article className={outerClass} style={bg} data-testid={`banner-custom-${b.id}`}>
      {/* Gradient overlay: only when image + text coexist (contrast needed). */}
      {hasImage && hasText && (
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/40 to-transparent"
        />
      )}

      {/* Text layer: skip entirely for pure-image banners. */}
      {!pureImage && (
        <div
          className={`relative flex h-full flex-col items-center justify-end gap-2 p-5 ${
            hasImage ? "text-primary-foreground" : ""
          }`}
        >
          {b.title && <h3 className="font-display text-xl leading-tight">{b.title}</h3>}
          {b.description && (
            <p className="max-w-xs text-sm leading-snug opacity-90">{b.description}</p>
          )}
          {cta && <BannerCta cta={cta} testid={`banner-custom-cta-${b.id}`} />}
        </div>
      )}
    </article>
  );
}

const VARIANT_ICON: Record<SmartBanner["variant"], typeof Gift> = {
  welcome: Sparkles,
  streak: Flame,
  progress: ListChecks,
  opportunity: Gift,
  info: Sparkles,
};

const VARIANT_ACCENT: Record<SmartBanner["variant"], string> = {
  welcome: "bg-jade-gradient text-primary-foreground",
  streak: "bg-gold-gradient text-gold-foreground",
  progress: "bg-mint-gradient text-primary-foreground",
  opportunity: "bg-jade-gradient text-primary-foreground",
  info: "bg-background-alt text-foreground",
};

function SmartBannerCard({ b }: { b: SmartBanner }) {
  const Icon = VARIANT_ICON[b.variant];
  const accent = VARIANT_ACCENT[b.variant];
  return (
    <article
      className={`surface-card overflow-hidden p-5 text-center shadow-lift ${accent}`}
      data-testid={`banner-smart-${b.id}`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur-sm">
          <Icon className="size-5" />
        </span>
        <h3 className="font-display text-xl leading-tight">{b.title}</h3>
        <p className="max-w-xs text-sm leading-snug opacity-90">{b.description}</p>
        {b.cta && (
          <BannerCta
            cta={{ route: b.cta.route, label: b.cta.label }}
            testid={`banner-smart-cta-${b.id}`}
          />
        )}
      </div>
    </article>
  );
}

function BannerCta({
  cta,
  testid,
}: {
  cta: { route?: string; url?: string; label: string };
  testid: string;
}) {
  const className =
    "mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-inherit shadow-soft backdrop-blur-sm transition-colors hover:bg-white/30";
  if (cta.url) {
    return (
      <a
        href={cta.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-testid={testid}
      >
        {cta.label}
        <ArrowRight className="size-4" />
      </a>
    );
  }
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link to={(cta.route ?? "/home") as any} className={className} data-testid={testid}>
      {cta.label}
      <ArrowRight className="size-4" />
    </Link>
  );
}
