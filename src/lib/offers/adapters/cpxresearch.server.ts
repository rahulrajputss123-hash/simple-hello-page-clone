import { createHash } from "crypto";

import type {
  NormalizedOffer,
  OfferFetchContext,
  OfferProvider,
  OfferProviderAdapter,
} from "../provider-types";

/**
 * CPX Research (survey wall) adapter — LIVE, PER-USER only.
 *
 * Unlike the catalogue adapters (AdBlueMedia/OGAds/Affike/AdswedMedia), CPX must
 * be fetched live at request time with the *actual* requesting user's id, ip and
 * user agent. CPX docs forbid caching survey results for longer than 120s and the
 * returned `href` is personalized per user — so these surveys must NOT be written
 * into the shared, country-cached `offers` catalogue by the cron sync.
 *
 * Therefore this adapter is intentionally NOT registered in registry.server.ts,
 * and its `fetchOffers` returns [] when no user id is supplied (i.e. when the
 * generic country-wide sync calls it). Live results come from `fetchCpxSurveys`.
 *
 * Endpoint: https://live-api.cpx-research.com/api/get-surveys.php
 *   app_id, ext_user_id, output_method=api, ip_user, user_agent, limit,
 *   secure_hash = md5(ext_user_id + "-" + CPX_SECURE_HASH)
 */
const SURVEYS_URL = "https://live-api.cpx-research.com/api/get-surveys.php";
const LIMIT = 20;

export type CpxLiveContext = {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
};

type CpxSurvey = {
  id?: string | number;
  loi?: string | number;
  payout?: string | number;
  conversion_rate?: string | number;
  statistics_rating_avg?: string | number;
  type?: string;
  top?: boolean;
  payout_publisher_usd?: string | number;
  href?: string;
};

type CpxResponse = {
  status?: string;
  count_available_surveys?: number;
  count_returned_surveys?: number;
  surveys?: CpxSurvey[];
};

function secureHash(extUserId: string, secret: string): string {
  return createHash("md5").update(`${extUserId}-${secret}`).digest("hex");
}

/**
 * Live, per-user survey fetch. Call this at request time with the logged-in
 * user's id, ip and user agent. Never cache the result beyond ~120s.
 */
export async function fetchCpxSurveys(ctx: CpxLiveContext): Promise<NormalizedOffer[]> {
  const appId = process.env["CPX_APP_ID"];
  const secret = process.env["CPX_SECURE_HASH"];
  if (!appId || !secret) {
    throw new Error("CPX_APP_ID and CPX_SECURE_HASH must be configured on the server.");
  }
  if (!ctx.userId) {
    throw new Error("CPX Research requires a logged-in user id (ext_user_id).");
  }

  const url = new URL(SURVEYS_URL);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("ext_user_id", ctx.userId);
  url.searchParams.set("output_method", "api");
  if (ctx.ip) url.searchParams.set("ip_user", ctx.ip);
  if (ctx.userAgent) url.searchParams.set("user_agent", ctx.userAgent);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("secure_hash", secureHash(ctx.userId, secret));

  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`CPX Research surveys error (${response.status}): ${text.slice(0, 200)}`);
  }

  let parsed: CpxResponse;
  try {
    parsed = JSON.parse(text) as CpxResponse;
  } catch {
    throw new Error(`CPX Research returned non-JSON: ${text.slice(0, 200)}`);
  }

  const surveys = Array.isArray(parsed.surveys) ? parsed.surveys : [];
  const seen = new Set<string>();
  const offers: NormalizedOffer[] = [];

  for (const s of surveys) {
    const externalOfferId = String(s.id ?? "").trim();
    const href = String(s.href ?? "").trim();
    if (!externalOfferId || !href) continue;
    if (seen.has(externalOfferId)) continue;
    seen.add(externalOfferId);

    offers.push({
      externalOfferId,
      title: `Survey (~${s.loi} min)`,
      description: `Estimated payout: $${s.payout_publisher_usd}, conversion rate ${s.conversion_rate}%`,
      // `href` is already the final, personalized survey URL — no click-time substitution.
      clickUrl: href,
      networkPayout: Number.parseFloat(String(s.payout_publisher_usd ?? "")) || 0,
      countries: ["all"],
      devices: ["all"],
      category: "Survey",
      raw: s,
    });
  }

  return offers;
}

export const cpxResearchAdapter: OfferProviderAdapter = {
  slug: "cpxresearch",
  providerType: "survey",

  validateConfig() {
    if (!process.env["CPX_APP_ID"] || !process.env["CPX_SECURE_HASH"]) {
      return "CPX_APP_ID and CPX_SECURE_HASH must be configured on the server.";
    }
    return null;
  },

  // Conforms to the adapter contract, but is LIVE/per-user only: the country-wide
  // cron sync (no user id) must never import CPX surveys, so we return [] there.
  async fetchOffers(_provider: OfferProvider, context?: OfferFetchContext) {
    const ctx = context as (OfferFetchContext & { userId?: string; userAgent?: string }) | undefined;
    if (!ctx?.userId) return [];
    return fetchCpxSurveys({ userId: ctx.userId, ip: ctx.ip ?? null, userAgent: ctx.userAgent ?? null });
  },
};
