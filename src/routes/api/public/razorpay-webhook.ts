import { createFileRoute } from "@tanstack/react-router";

/**
 * Razorpay webhook receiver — the only place advertiser deposits get credited.
 *
 * Configure in the Razorpay dashboard: Settings → Webhooks →
 *   URL    https://<host>/api/public/razorpay-webhook
 *   Secret RAZORPAY_WEBHOOK_SECRET
 *   Events payment.captured, order.paid, payment.failed,
 *          refund.created, refund.processed, payment.dispute.lost
 *
 * Signature: X-Razorpay-Signature = HMAC-SHA256(raw body, secret). Verified over
 * the untouched body bytes in processRazorpayWebhook; a mismatch is a 401 and
 * nothing is touched. Crediting goes through mkt_credit_deposit, which is
 * idempotent per deposit — Razorpay retries and the duplicate order.paid /
 * payment.captured pair are safe.
 */
async function handle(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const { processRazorpayWebhook } = await import("@/lib/marketplace/advertiser.server");
  try {
    const { httpStatus, ...result } = await processRazorpayWebhook(rawBody, signature);
    if (!result.ok) console.warn("[razorpay-webhook]", result);
    return Response.json(result, { status: httpStatus });
  } catch (err) {
    // 500 → Razorpay retries (exponential backoff for up to 24h). Log the real cause.
    console.error("[razorpay-webhook] processing failed:", err);
    return Response.json({ ok: false, action: "error" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
    },
  },
});