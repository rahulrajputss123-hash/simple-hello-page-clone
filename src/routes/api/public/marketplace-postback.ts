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

  if (!clickId) {
    return Response.json({ ok: false, error: "click_id required" }, { status: 400 });
  }

  if (!txnId) {
    return Response.json({ ok: false, error: "txn_id required" }, { status: 400 });
  }

  try {
    // Step 1: Resolve campaign from click_id using service client
    const { data: click, error: clickErr } = await mktDb
      .from("campaign_clicks")
      .select("campaign_id")
      .eq("id", clickId)
      .maybeSingle();

    if (clickErr || !click) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const campaignId = click.campaign_id;

    // Step 2: Fetch campaign_secrets with service client
    const { data: secrets, error: secretErr } = await mktDb
      .from("campaign_secrets")
      .select("auth_mode, secret, ip_allowlist")
      .eq("campaign_id", campaignId)
      .maybeSingle();

    if (secretErr || !secrets) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Step 3: Verify IP allowlist if configured
    if (secrets.ip_allowlist && Array.isArray(secrets.ip_allowlist) && secrets.ip_allowlist.length > 0) {
      const sourceIp = clientIp(request);
      
      if (!secrets.ip_allowlist.includes(sourceIp)) {
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    }

    // Step 4: Verify authentication based on auth_mode
    let signatureValid = false;

    if (secrets.auth_mode === "token") {
      // Token mode: compare query param token with secret using timing-safe comparison
      const providedToken = url.searchParams.get("token");
      
      if (!providedToken) {
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }

      if (providedToken.length !== secrets.secret.length) {
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
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    } else if (secrets.auth_mode === "hmac") {
      // HMAC mode: verify X-Signature header
      const signature = request.headers.get("x-signature");
      
      if (!signature) {
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
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    } else {
      return Response.json({ ok: false, error: "internal error" }, { status: 500 });
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
      return Response.json({ ok: true, message: result.reason || "already_credited" }, { status: 200 });
    }

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
