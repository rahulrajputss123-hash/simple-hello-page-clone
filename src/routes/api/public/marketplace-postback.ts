import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import { mktDb } from "@/lib/marketplace/db.server";

/**
 * Postback endpoint for auto-verified marketplace campaigns.
 * GET /api/public/marketplace-postback?click_id=ABC123&token=SECRET&txn_id=TXN123
 *
 * Security (enforced):
 * - Resolves campaign from click_id
 * - Reads campaign_secrets with service client
 * - auth_mode 'token': requires ?token=SECRET (compared with crypto.timingSafeEqual)
 * - auth_mode 'hmac': requires X-Signature header (HMAC-SHA256 of query string)
 * - Enforces ip_allowlist when non-empty
 * - Returns 401 with no credit unless verified
 * - Never logs or returns the secret
 */

const testRequests = new Map<string, number[]>();

function logPostback(campaignId: string, result: string, clickId: string | null, txnId: string | null, httpStatus: number) {
  void (async () => {
    try {
      await mktDb.from("campaign_postback_log").insert({ campaign_id: campaignId, result, click_id: clickId, txn_id: txnId, http_status: httpStatus });
      const { data: overflow } = await mktDb.from("campaign_postback_log").select("id").eq("campaign_id", campaignId).order("received_at", { ascending: false }).range(200, 1000);
      const overflowIds = (overflow ?? []).map((row) => row.id);
      if (overflowIds.length) await mktDb.from("campaign_postback_log").delete().in("id", overflowIds);
    } catch (error) {
      console.error("[postback] log write failed", error instanceof Error ? error.message : error);
    }
  })();
}

function clientIp(request: Request): string {
  const header =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for");
  if (!header) return "unknown";
  return header.split(",")[0]?.trim() ?? "unknown";
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const clickId = url.searchParams.get("click_id");
  const txnId = url.searchParams.get("txn_id");
  const isTest = url.searchParams.get("test") === "1";
  const campaignIdParam = url.searchParams.get("campaign_id");

  if (!clickId && !(isTest && campaignIdParam)) {
    return Response.json({ ok: false, error: "click_id required" }, { status: 400 });
  }

  if (!isTest && !txnId) {
    return Response.json({ ok: false, error: "txn_id required" }, { status: 400 });
  }

  try {
    // Step 1: Resolve campaign from click_id using service client
    const { data: click, error: clickErr } = clickId
      ? await mktDb.from("campaign_clicks").select("campaign_id").eq("click_id", clickId).maybeSingle()
      : { data: campaignIdParam ? { campaign_id: campaignIdParam } : null, error: null };

    if (clickErr) {
      console.error("[postback] campaign_clicks lookup failed", clickErr.message);
      return Response.json({ ok: false, error: "internal error" }, { status: 500 });
    }

    if (!click) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const campaignId = click.campaign_id;
    const logResult = (result: string, status: number) => logPostback(campaignId, result, clickId, txnId, status);

    // Step 2: Fetch campaign_secrets with service client
    const { data: secrets, error: secretErr } = await mktDb
      .from("campaign_secrets")
      .select("auth_mode, secret, ip_allowlist")
      .eq("campaign_id", campaignId)
      .maybeSingle();

    if (secretErr) {
      console.error("[postback] campaign_secrets lookup failed", secretErr.message);
      return Response.json({ ok: false, error: "internal error" }, { status: 500 });
    }

    if (!secrets) {
      logResult("unauthorized", 401);
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Step 3: Verify IP allowlist if configured
    if (secrets.ip_allowlist && Array.isArray(secrets.ip_allowlist) && secrets.ip_allowlist.length > 0) {
      const sourceIp = clientIp(request);
      
      if (!secrets.ip_allowlist.includes(sourceIp)) {
        logResult("unauthorized", 401);
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    }

    // Step 4: Verify authentication based on auth_mode
    let signatureValid = false;

    if (secrets.auth_mode === "token") {
      // Token mode: compare query param token with secret using timing-safe comparison
      const providedToken = url.searchParams.get("token");
      
      if (!providedToken) {
        logResult("unauthorized", 401);
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }

      if (providedToken.length !== secrets.secret.length) {
        logResult("unauthorized", 401);
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }

      try {
        signatureValid = crypto.timingSafeEqual(
          Buffer.from(providedToken),
          Buffer.from(secrets.secret)
        );
      } catch {
        signatureValid = false;
      }

      if (!signatureValid) {
        logResult("unauthorized", 401);
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    } else if (secrets.auth_mode === "hmac") {
      // HMAC mode: verify X-Signature header
      const signature = request.headers.get("x-signature");
      
      if (!signature) {
        logResult("unauthorized", 401);
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }

      // Build signature string from sorted query params (excluding token if present)
      const params: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        if (key !== "token") {
          params[key] = value;
        }
      });

      const sortedKeys = Object.keys(params).sort();
      const signatureString = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");

      // HMAC-SHA256
      const expectedSignature = crypto
        .createHmac("sha256", secrets.secret)
        .update(signatureString)
        .digest("hex");

      try {
        signatureValid = crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        );
      } catch {
        signatureValid = false;
      }

      if (!signatureValid) {
        logResult("unauthorized", 401);
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    } else {
      return Response.json({ ok: false, error: "internal error" }, { status: 500 });
    }

    if (isTest) {
      // Test requests can never credit anyone: this branch never calls mkt_record_conversion.
      const now = Date.now();
      const recent = (testRequests.get(campaignId) ?? []).filter((time) => now - time < 60_000);
      if (recent.length >= 30) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
      recent.push(now);
      testRequests.set(campaignId, recent);
      logResult("test_ok", 200);
      return Response.json({ ok: true, message: "test_ok" }, { status: 200 });
    }

    // Step 5: Record conversion (auth verified)
    const { recordConversionImpl } = await import("@/lib/marketplace/conversion.server");

    const sourceIp = clientIp(request);

    // Collect all query params as event data (excluding token)
    const eventData: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (key !== "token") {
        eventData[key] = value;
      }
    });

    const result = await recordConversionImpl(
      campaignId,
      clickId,
      txnId,
      sourceIp,
      eventData,
      signatureValid
    );

    if (!result.recorded) {
      const outcome = result.reason === "held" ? "held" : "duplicate";
      logResult(outcome, 200);
      return Response.json({ ok: true, message: result.reason || "already_credited" }, { status: 200 });
    }

    logResult("credited", 200);
    return Response.json(
      {
        ok: true,
        message: result.status === "credited" ? "credited" : result.status,
        conversion_id: result.conversionId,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[postback] error", { clickId, error: err instanceof Error ? err.message : String(err) });
    return Response.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/marketplace-postback")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
