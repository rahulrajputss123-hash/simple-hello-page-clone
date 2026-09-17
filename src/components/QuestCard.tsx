import {
  Check,
  Clapperboard,
  Link2,
  Loader2,
  Lock,
  LockKeyhole,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { formatMoney } from "@/lib/coinquest";
import type { QuestRow } from "@/lib/quests.server";

export type QuestSessionView = {
  id: string;
  quest_key: string;
  status: string;
  ads_watched: number;
  current_step?: number;
};

export type QuestCardQuest = QuestRow & {
  is_locked?: boolean;
  unlock_reason?:
    | { type: "time"; unlocksAt: string }
    | { type: "earning"; required: number; current: number }
    | null;
};

type QuestCardProps = {
  quest: QuestCardQuest;
  active?: QuestSessionView | undefined;
  credited: boolean;
  busy: boolean;
  lockLabel: string | null;
  onAction: () => void;
  onLocked: () => void;
};

const CARD_W = 240;
const CARD_H = 340;

/** Display font already loaded in __root.tsx — geometric, not the rounded Baloo. */
const DISPLAY_FONT = '"Outfit", "Inter", ui-sans-serif, system-ui, sans-serif';

/* Neutral palette, warm-tinted to sit on the app's cream background. */
const INK = "#0B2B28"; // deep jade, primary text
const INK_SOFT = "#5F726F"; // secondary text
const INK_FAINT = "#94A4A1"; // tertiary / meta text
const HAIRLINE = "#EBE6DD";
const TRACK = "#EDF0EF";

/**
 * A quest category accent. Colour is deliberately confined to the icon tile,
 * the badge and the progress fill — never a full-card gradient, which is what
 * made the earlier revision read as candy.
 */
type QuestAccent = {
  label: string;
  icon: LucideIcon;
  /** Faint wash behind the card header. */
  wash: string;
  badgeBg: string;
  badgeInk: string;
  tile: string;
  tileShadow: string;
  bar: string;
};

const ACCENTS: Record<QuestRow["quest_type"], QuestAccent> = {
  ads: {
    label: "Easy",
    icon: Clapperboard,
    wash: "rgba(16,163,113,0.10)",
    badgeBg: "rgba(16,163,113,0.12)",
    badgeInk: "#0A6B4A",
    tile: "linear-gradient(145deg, #34D399 0%, #059669 100%)",
    tileShadow: "rgba(5,150,105,0.32)",
    bar: "linear-gradient(90deg, #34D399, #059669)",
  },
  shortlink: {
    label: "Challenge",
    icon: Link2,
    wash: "rgba(217,119,6,0.10)",
    badgeBg: "rgba(217,119,6,0.13)",
    badgeInk: "#92400E",
    tile: "linear-gradient(145deg, #FBBF24 0%, #D97706 100%)",
    tileShadow: "rgba(217,119,6,0.32)",
    bar: "linear-gradient(90deg, #FBBF24, #D97706)",
  },
  locker: {
    label: "Daily",
    // Padlock (not a gift) — this is a content-locker quest. The blue accent is
    // kept because colour signals the category, not the glyph.
    icon: Lock,
    wash: "rgba(2,132,199,0.10)",
    badgeBg: "rgba(2,132,199,0.12)",
    badgeInk: "#075985",
    tile: "linear-gradient(145deg, #38BDF8 0%, #0369A1 100%)",
    tileShadow: "rgba(3,105,161,0.32)",
    bar: "linear-gradient(90deg, #38BDF8, #0369A1)",
  },
};

const LOCKED_ACCENT: QuestAccent = {
  label: "Locked",
  icon: LockKeyhole,
  wash: "rgba(100,116,139,0.07)",
  badgeBg: "rgba(100,116,139,0.11)",
  badgeInk: "#52616F",
  tile: "linear-gradient(145deg, #CBD5E1 0%, #94A3B8 100%)",
  tileShadow: "rgba(100,116,139,0.26)",
  bar: "linear-gradient(90deg, #CBD5E1, #94A3B8)",
};

const CREDITED_ACCENT: QuestAccent = {
  ...ACCENTS.ads,
  label: "Completed",
  icon: ShieldCheck,
};

/** Small flat gold coin. Restrained on purpose — no fake specular highlight. */
function CoinMark({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="questCoin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3D274" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <circle cx="8" cy="8" r="7" fill="url(#questCoin)" />
      <circle cx="8" cy="8" r="4.6" fill="none" stroke="#B8912A" strokeOpacity="0.45" />
    </svg>
  );
}

export function QuestCard({
  quest,
  active,
  credited,
  busy,
  lockLabel,
  onAction,
  onLocked,
}: QuestCardProps) {
  const locked = Boolean(quest.is_locked);
  const accent = locked ? LOCKED_ACCENT : credited ? CREDITED_ACCENT : ACCENTS[quest.quest_type];
  const TileIcon = accent.icon;

  const total =
    quest.quest_type === "ads"
      ? Math.max(1, quest.ads_required)
      : quest.quest_type === "shortlink"
        ? Math.max(1, quest.shortlink_steps.length)
        : 1;
  const current = credited
    ? total
    : quest.quest_type === "ads"
      ? Number(active?.ads_watched ?? 0)
      : quest.quest_type === "shortlink"
        ? Number(active?.current_step ?? 0)
        : 0;
  const progress = Math.min(Math.max(0, current), total);
  const remaining = Math.max(0, total - progress);
  const nextStep = Math.min(progress + 1, total);
  const progressPercent = Math.min(100, Math.max(0, (progress / Math.max(1, total)) * 100));

  const description =
    quest.quest_type === "ads"
      ? `Watch ${total} ${total === 1 ? "video ad" : "video ads"} and get rewarded!`
      : quest.quest_type === "shortlink"
        ? `Visit ${total === 1 ? "the short link" : `${total} short links`} and get rewarded!`
        : "Complete the locker challenge and unlock your reward!";
  const detail = locked
    ? (lockLabel ?? "This quest is currently locked")
    : credited
      ? "Reward verified and added to your wallet"
      : quest.quest_type === "ads"
        ? `${remaining} ${remaining === 1 ? "ad" : "ads"} left to verify`
        : quest.quest_type === "shortlink"
          ? `Step ${nextStep} of ${total} · ${quest.min_seconds_per_step}s minimum`
          : "Secure locker completion required";
  const summary = locked
    ? (lockLabel ?? "Quest locked")
    : credited
      ? "Reward credited"
      : quest.quest_type === "ads"
        ? `Watch ${total} ${total === 1 ? "Ad" : "Ads"}`
        : quest.quest_type === "shortlink"
          ? `Visit ${total} ${total === 1 ? "Shortlink" : "Shortlinks"}`
          : "Complete Locker";
  const ctaText = locked
    ? "Locked"
    : credited
      ? "✓ Completed"
      : busy
        ? "Opening..."
        : quest.quest_type === "ads"
          ? "Watch Ads"
          : quest.quest_type === "shortlink"
            ? progress > 0
              ? "Continue"
              : "Start Quest"
            : "Complete Locker";
  const actionTestId =
    quest.quest_type === "ads"
      ? `quest-watch-${quest.key}`
      : quest.quest_type === "shortlink"
        ? `quest-open-${quest.key}`
        : `quest-locker-${quest.key}`;

  const inactive = locked || credited;

  return (
    <article
      className="group relative shrink-0 snap-start overflow-hidden transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1"
      style={{
        width: CARD_W,
        height: CARD_H,
        minWidth: CARD_W,
        borderRadius: 18,
        background: "#FFFFFF",
        border: `1px solid ${HAIRLINE}`,
        boxShadow: "0 1px 2px rgba(11,43,40,0.04), 0 12px 28px -12px rgba(11,43,40,0.16)",
      }}
      data-testid={`quest-card-${quest.key}`}
    >
      {/* faint category wash, top-anchored so the card stays predominantly white */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: 132,
          background: `linear-gradient(180deg, ${accent.wash} 0%, rgba(255,255,255,0) 100%)`,
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col px-4 pb-4 pt-4">
        {/* header: category + reward */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold uppercase leading-none tracking-[0.07em]"
            style={{ background: accent.badgeBg, color: accent.badgeInk }}
            data-testid={`quest-type-${quest.key}`}
          >
            {locked ? <LockKeyhole className="size-3" /> : null}
            {accent.label}
          </span>

          <span className="text-right" data-testid={`quest-reward-${quest.key}`}>
            <span
              className="block text-[9px] font-bold uppercase leading-none tracking-[0.11em]"
              style={{ color: INK_FAINT }}
            >
              Reward
            </span>
            <span className="mt-1 flex items-center justify-end gap-1.5">
              <CoinMark />
              <span
                className="text-[17px] font-bold leading-none [font-variant-numeric:tabular-nums]"
                style={{ color: INK, fontFamily: DISPLAY_FONT }}
              >
                {formatMoney(quest.reward_amount)}
              </span>
            </span>
          </span>
        </div>

        {/* icon tile — the single place category colour is fully saturated */}
        <div
          className="mt-4 grid place-items-center transition-transform duration-300 group-hover:scale-[1.04]"
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: accent.tile,
            boxShadow: `0 6px 14px -4px ${accent.tileShadow}, inset 0 1px 0 rgba(255,255,255,0.45)`,
          }}
          data-testid={`quest-icon-${quest.key}`}
        >
          <TileIcon className="size-5 text-white" strokeWidth={2} aria-hidden />
        </div>

        <h3
          className="mt-3.5 line-clamp-1 text-[17px] font-bold leading-tight tracking-[-0.01em]"
          style={{ color: INK, fontFamily: DISPLAY_FONT }}
          data-testid={`quest-title-${quest.key}`}
        >
          {quest.label}
        </h3>
        <p
          className="mt-1.5 line-clamp-2 text-[12px] leading-[1.45]"
          style={{ color: INK_SOFT }}
          data-testid={`quest-description-${quest.key}`}
        >
          {description}
        </p>

        <div className="min-h-3 flex-1" />

        {/* progress */}
        <div data-testid={`quest-progress-${quest.key}`}>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="text-[11px] font-semibold [font-variant-numeric:tabular-nums]"
              style={{ color: INK }}
              data-testid={`quest-progress-text-${quest.key}`}
            >
              {progress} / {total}
            </span>
            <span
              className="text-[11px] font-medium"
              style={{ color: INK_FAINT }}
              data-testid={`quest-remaining-${quest.key}`}
            >
              {credited ? "Completed" : `${remaining} more`}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: TRACK }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progressPercent}%`, background: accent.bar }}
            />
          </div>
        </div>

        <p
          className="mt-2 line-clamp-1 text-[10px] leading-none"
          style={{ color: INK_FAINT }}
          data-testid={`quest-detail-${quest.key}`}
        >
          {detail}
          <span className="sr-only"> — {summary}</span>
        </p>

        {/* CTA — jade for every category, so colour stays a category signal only */}
        <button
          type="button"
          className="mt-3.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[11px] text-[13px] font-semibold transition-[filter,background-color] duration-200 disabled:cursor-not-allowed enabled:hover:brightness-[1.12] [&_svg]:size-4"
          style={
            credited
              ? { background: "rgba(16,163,113,0.12)", color: "#0A6B4A" }
              : locked
                ? { background: "#F3F5F4", color: INK_FAINT }
                : {
                    background: INK,
                    color: "#FFFFFF",
                    boxShadow: "0 1px 2px rgba(11,43,40,0.18)",
                  }
          }
          disabled={busy || credited}
          onClick={locked ? onLocked : onAction}
          data-testid={actionTestId}
        >
          {busy ? (
            <Loader2 className="animate-spin" />
          ) : locked ? (
            <LockKeyhole />
          ) : credited ? (
            <Check />
          ) : null}
          {ctaText}
        </button>
      </div>

      {inactive ? null : (
        <span
          className="pointer-events-none absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px ${accent.badgeBg}` }}
          aria-hidden
        />
      )}
    </article>
  );
}
