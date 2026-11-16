/**
 * Vercel Serverless Function for Cron Job
 * 
 * This is a Vercel-native serverless function that can be triggered by Vercel Crons.
 * It calls the TanStack Start route handler internally.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Constant-time string compare */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.OFFER_FEED_CRON_SECRET;
  if (!secret) return false;
  
  const provided =
    req.headers['x-cron-secret'] as string ??
    (req.headers.authorization as string)?.replace(/^Bearer\s+/i, "") ??
    req.query.secret as string;
    
  if (!provided) return false;
  return safeEqual(provided, secret);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Authorize the request
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const force = req.query.force === "1";

  try {
    // Dynamically import the feed refresh function
    const { refreshAllFeedsImpl } = await import("../../src/lib/offers/feed-cache.server");
    const summary = await refreshAllFeedsImpl(force);
    
    return res.status(200).json({ ok: true, ...summary });
  } catch (err) {
    console.error("[offer-feed-cron] refresh failed:", err);
    return res.status(500).json({ ok: false, error: "refresh failed" });
  }
}
