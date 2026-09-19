// Server-only: builds the AI assistant's context for a specific offer.
// Never import this from a client component — load it dynamically inside a
// server function handler, like the rest of src/lib/**/*.server.ts.
//
// Everything here is read from real stored rows (offers, offer_providers,
// offer_claims). Absent fields are simply omitted so the model is never handed
// a placeholder it could turn into an invented requirement.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** The three values offer_claims.status can actually hold, plus "no row yet". */
export type OfferClaimState = "not_submitted" | "pending" | "approved" | "rejected";

/** How this specific offer is credited, derived only from stored config. */
export type OfferConversionMode = "auto_postback" | "manual_proof" | "manual";

export type OfferAssistantContext = {
  offerId: string;
  title: string;
  conversionMode: OfferConversionMode;
  /** Prompt-ready text block. Only contains fields that are actually present. */
  promptBlock: string;
};

type OfferRow = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  not_allowed: string;
  reward_amount: number;
  payout_mode: string;
  is_limited_deal: boolean;
  is_active: boolean;
  source: string;
  provider_id: string | null;
  click_url: string | null;
  expires_at: string | null;
  countries: string[];
  devices: string[];
  category: string | null;
  tags: string[];
};

type ClaimRow = {
  status: string;
  proof_url: string | null;
  postback_txn_id: string | null;
  reward_amount: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

function text(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function list(value: string[] | null | undefined): string | null {
  const items = (value ?? []).map((v) => v.trim()).filter(Boolean);
  return items.length ? items.join(", ") : null;
}

function money(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

/**
 * Proof is required when the offer is explicitly manual_proof, or when it is a
 * limited deal — this mirrors OfferDetailsDialog's own `proofRequired` rule so
 * the assistant and the UI can never describe different flows.
 */
function conversionMode(offer: OfferRow): OfferConversionMode {
  if (offer.payout_mode === "auto_postback") return "auto_postback";
  if (offer.payout_mode === "manual_proof" || offer.is_limited_deal) return "manual_proof";
  return "manual";
}

function claimState(claim: ClaimRow | null): OfferClaimState {
  if (!claim) return "not_submitted";
  if (claim.status === "approved") return "approved";
  if (claim.status === "rejected") return "rejected";
  return "pending";
}

/** Describes the conversion flow using only what this offer's config supports. */
function describeFlow(mode: OfferConversionMode, isLimitedDeal: boolean): string {
  if (mode === "auto_postback") {
    return [
      "CREDITING: automatic (auto_postback).",
      "- The user opens the offer from the app and completes it on the partner's site.",
      "- The partner network reports the conversion back to CashGPT via postback.",
      "- The reward is credited automatically when that postback is received and validated.",
      "- There is NO proof upload and NO manual admin review step in this flow. Do not mention either.",
    ].join("\n");
  }
  if (mode === "manual_proof") {
    return [
      `CREDITING: manual with proof required${isLimitedDeal ? " (limited deal)" : ""}.`,
      "- The user opens the offer from the app and completes it on the partner's site.",
      "- The user must upload proof (screenshot or receipt, max 5 MB) in the offer dialog before continuing.",
      "- The claim is then submitted with status 'pending' and an admin reviews it.",
      "- The reward is credited only after the admin approves the claim. If rejected, no reward is paid.",
    ].join("\n");
  }
  return [
    "CREDITING: manual submission (no proof upload required by this offer's configuration).",
    "- The user opens the offer from the app and completes it on the partner's site.",
    "- A claim is submitted with status 'pending' and an admin reviews it.",
    "- The reward is credited only after the admin approves the claim. If rejected, no reward is paid.",
    "- This offer does not require a proof upload. Do not tell the user to upload proof.",
  ].join("\n");
}

/** Describes exactly where this user stands, using only real claim fields. */
function describeClaim(state: OfferClaimState, claim: ClaimRow | null): string {
  switch (state) {
    case "not_submitted":
      return "THIS USER'S STATUS: no claim row exists for this offer yet — they have not started or submitted it. Nothing is pending and no reward is owed yet.";
    case "pending": {
      const proof = claim?.proof_url ? "Proof was uploaded." : "No proof file is attached.";
      return [
        "THIS USER'S STATUS: a claim exists with status 'pending' — it has been submitted and is awaiting admin review.",
        proof,
        "The reward is not credited while the claim is pending. Do not promise a review time — that is not stored anywhere.",
      ].join(" ");
    }
    case "approved":
      return [
        "THIS USER'S STATUS: the claim is 'approved' and the reward has been credited to their wallet",
        claim ? ` (${money(claim.reward_amount)})` : "",
        ". If they cannot see it, tell them to check Wallet > Transactions, and to open a support ticket if it is genuinely missing.",
      ].join("");
    case "rejected":
      return [
        "THIS USER'S STATUS: the claim is 'rejected' — no reward was paid.",
        claim?.admin_note ? ` The admin note on the rejection is: "${claim.admin_note}".` : "",
        " If they disagree, tell them to open a support ticket from the Support tab.",
      ].join("");
  }
}

/**
 * Title words too common to identify an offer on their own — matching on these
 * would attach the wrong offer's data to an unrelated question.
 */
const GENERIC_TITLE_WORDS = new Set([
  "offer",
  "offers",
  "cash",
  "cashback",
  "money",
  "reward",
  "rewards",
  "bonus",
  "free",
  "play",
  "game",
  "games",
  "gaming",
  "mobile",
  "desktop",
  "android",
  "iphone",
  "geos",
  "survey",
  "surveys",
  "install",
  "signup",
  "register",
  "download",
  "video",
  "editor",
  "browser",
  "prizes",
  "prize",
  "deal",
  "deals",
  "trial",
  "with",
  "your",
  "from",
  "only",
  "best",
  "life",
  "all",
  "get",
  "and",
  "the",
  "for",
  "web",
]);

/**
 * Resolves an offer from a plain chat message that names it, e.g. "how does
 * HostingTom work?". Used only when no offer is in context, so the assistant can
 * answer path (b) — asking by name — with the same real data as path (a).
 *
 * Deliberately conservative: it matches only distinctive title words of 6+
 * characters, and refuses to guess when two different offers tie. Attaching the
 * wrong offer's data would be worse than answering generically.
 */
export async function resolveOfferIdFromMessage(message: string): Promise<string | null> {
  const haystack = ` ${message.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;

  const result = await supabaseAdmin.from("offers").select("id, title").eq("is_active", true);
  if (!result.data?.length) return null;

  let bestId: string | null = null;
  let bestScore = 0;
  let ambiguous = false;

  for (const row of result.data as Array<{ id: string; title: string }>) {
    const words = new Set(row.title.toLowerCase().match(/[a-z0-9]+/g) ?? []);

    // Qualifying requires at least one distinctive word (6+ chars, not generic)
    // — that is what makes the match about *this* offer rather than a coincidence.
    let hasDistinctiveMatch = false;
    // Scoring then sums every matched word of 4+ chars, generic ones included,
    // so extra words the user typed can break a tie between offers that share a
    // brand name (e.g. two "PixelPointTV" offers separated by "gaming").
    let score = 0;

    for (const word of words) {
      if (word.length < 4) continue;
      if (!haystack.includes(` ${word} `)) continue;
      score += word.length;
      if (word.length >= 6 && !GENERIC_TITLE_WORDS.has(word)) hasDistinctiveMatch = true;
    }

    if (!hasDistinctiveMatch) continue;

    if (score > bestScore) {
      bestScore = score;
      bestId = row.id;
      ambiguous = false;
    } else if (score === bestScore && row.id !== bestId) {
      ambiguous = true;
    }
  }

  // Refuse to guess between two equally good matches — attaching the wrong
  // offer's data is worse than answering without offer context.
  if (ambiguous || !bestId) return null;
  return bestId;
}

/**
 * Loads the real data for one offer plus this user's own claim, and formats it
 * for the assistant's system instruction. Returns null when the offer does not
 * exist, so the assistant simply behaves as the normal FAQ helper.
 */
export async function buildOfferAssistantContext(
  offerId: string,
  userId: string,
): Promise<OfferAssistantContext | null> {
  const offerResult = await supabaseAdmin
    .from("offers")
    .select(
      "id, title, description, requirements, not_allowed, reward_amount, payout_mode, is_limited_deal, is_active, source, provider_id, click_url, expires_at, countries, devices, category, tags",
    )
    .eq("id", offerId)
    .maybeSingle();
  if (!offerResult.data) return null;
  const offer = offerResult.data as OfferRow;

  // Provider name is fetched separately rather than via a PostgREST embedded
  // join, matching how feed-cache.server.ts resolves provider metadata.
  let providerName: string | null = null;
  if (offer.provider_id) {
    const provider = await supabaseAdmin
      .from("offer_providers")
      .select("name")
      .eq("id", offer.provider_id)
      .maybeSingle();
    providerName = text(provider.data?.name);
  }

  // offer_claims is UNIQUE(user_id, offer_id), so at most one row exists.
  const claimResult = await supabaseAdmin
    .from("offer_claims")
    .select("status, proof_url, postback_txn_id, reward_amount, admin_note, created_at, updated_at")
    .eq("offer_id", offerId)
    .eq("user_id", userId)
    .maybeSingle();
  const claim = (claimResult.data as ClaimRow | null) ?? null;

  const mode = conversionMode(offer);
  const state = claimState(claim);

  // Only real, present values are emitted — no placeholders.
  const facts: string[] = [`Title: ${offer.title}`];
  if (providerName) facts.push(`Partner network: ${providerName}`);
  facts.push(`Reward: ${money(offer.reward_amount)}`);
  facts.push(`payout_mode: ${offer.payout_mode}`);
  facts.push(`Limited deal: ${offer.is_limited_deal ? "yes" : "no"}`);
  if (offer.is_limited_deal) {
    facts.push(
      "Note: for limited deals the final reward is recalculated from the offer's current configuration at approval time, so it may differ from the amount listed.",
    );
  }
  if (!offer.is_active) facts.push("This offer is currently INACTIVE / no longer available.");

  // Fields the user is most likely to ask about are stated even when empty.
  // Most network-synced offers ship with blank requirements/not_allowed, and
  // silently omitting them left the model unable to tell "absent" from "not
  // mentioned" — so it filled the gap with plausible-sounding boilerplate.
  // NOT ON FILE is an explicit instruction to say so instead.
  const NOT_ON_FILE = "NOT ON FILE — say plainly that this is not listed for this offer.";
  facts.push(`Description: ${text(offer.description) ?? NOT_ON_FILE}`);
  facts.push(`Requirements (how to complete): ${text(offer.requirements) ?? NOT_ON_FILE}`);
  facts.push(`Prohibited actions (not_allowed): ${text(offer.not_allowed) ?? NOT_ON_FILE}`);
  facts.push(
    `Available countries: ${list(offer.countries) ?? "not restricted by country on file (no list stored)"}`,
  );
  facts.push(
    `Supported devices: ${list(offer.devices) ?? "no device restriction stored for this offer"}`,
  );
  facts.push(`Expires at: ${offer.expires_at ?? "no expiry date on file"}`);
  const category = text(offer.category);
  if (category) facts.push(`Category: ${category}`);
  const tags = list(offer.tags);
  if (tags) facts.push(`Tags: ${tags}`);
  // The raw click_url is deliberately withheld: opening the offer outside the
  // app skips the tracking sub-ids appended by appendAffSub4, which would leave
  // the conversion unattributed and cost the user their reward.
  facts.push(
    offer.click_url
      ? "Offer link: configured. The user MUST open it using the app's own button in the offer dialog so their conversion is tracked. Never output a raw URL."
      : "Offer link: not configured — the user cannot start this offer right now.",
  );

  const promptBlock = [
    "## CURRENT OFFER IN VIEW — REAL STORED DATA",
    "The user is currently viewing this offer. Use ONLY the facts below when answering questions about it.",
    "",
    facts.join("\n"),
    "",
    describeFlow(mode, offer.is_limited_deal),
    "",
    describeClaim(state, claim),
  ].join("\n");

  return { offerId: offer.id, title: offer.title, conversionMode: mode, promptBlock };
}
