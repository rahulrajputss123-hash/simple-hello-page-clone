/**
 * NOWPayments IPN (Instant Payment Notification) webhook endpoint.
 * Public route. Verifies signature and processes payment status updates.
 * 
 * Mirrors razorpay-webhook.ts architecture: webhook is the ONLY place money is credited.
 * Safe for retries and duplicate deliveries.
 */

import { json } from "@tanstack/react-start";
import type { APIEvent } from "@tanstack/react-start/server";
import {
  type NowpaymentsIpnEvent,
  verifyNowpaymentsIpn,
} from "@/lib/marketplace/nowpayments.server";
import { mktDb, mktRpc } from "@/lib/marketplace/db.server";

export async function POST({ request }: APIEvent) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-nowpayments-sig");

    // Verify signature (timing-safe HMAC-SHA512 over sorted JSON)
    if (!verifyNowpaymentsIpn(rawBody, signature)) {
      console.error("[nowpayments-ipn] Invalid signature");
      return json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse event
    let event: NowpaymentsIpnEvent;
    try {
      event = JSON.parse(rawBody) as NowpaymentsIpnEvent;
    } catch {
      console.error("[nowpayments-ipn] Bad JSON");
      return json({ error: "Invalid JSON" }, { status: 400 });
    }

    const orderId = event.order_id;
    const paymentId = String(event.payment_id);
    const paymentStatus = event.payment_status;
    const priceAmount = event.price_amount;
    const priceCurrency = (event.price_currency || "").toLowerCase();

    console.log(`[nowpayments-ipn] ${paymentStatus} for order ${orderId}, payment ${paymentId}`);

    // Find deposit by order_id
    const { data: deposit, error: fetchErr } = await mktDb
      .from("advertiser_deposits")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchErr) {
      console.error("[nowpayments-ipn] DB error:", fetchErr);
      return json({ error: "Internal error" }, { status: 500 });
    }

    if (!deposit) {
      // Unknown order - acknowledge but don't process
      console.warn(`[nowpayments-ipn] Unknown order ${orderId}`);
      return json({ ok: true, message: "Unknown order" }, { status: 200 });
    }

    // Store last event
    const lastEvent = {
      payment_id: paymentId,
      payment_status: paymentStatus,
      price_amount: priceAmount,
      price_currency: priceCurrency,
      received_at: new Date().toISOString(),
    };

    // Handle payment status
    switch (paymentStatus) {
      case "waiting":
      case "confirming":
      case "confirmed":
      case "sending": {
        // Payment in progress - update last_event, stay pending
        await mktDb
          .from("advertiser_deposits")
          .update({ last_event: lastEvent })
          .eq("id", orderId);
        return json({ ok: true, message: "Status updated" }, { status: 200 });
      }

      case "finished": {
        // Payment complete - verify amount and credit
        if (priceCurrency !== "usd" || priceAmount !== deposit.amount_usd) {
          // Amount mismatch - hold for review
          console.error(
            `[nowpayments-ipn] Amount mismatch for ${orderId}: expected ${deposit.amount_usd} USD, got ${priceAmount} ${priceCurrency}`,
          );
          await mktDb
            .from("advertiser_deposits")
            .update({
              last_event: {
                ...lastEvent,
                mismatch: { expected_usd: deposit.amount_usd, got: priceAmount, currency: priceCurrency },
              },
            })
            .eq("id", orderId);
          return json({ ok: true, message: "Amount mismatch - held for review" }, { status: 200 });
        }

        // Credit the deposit (idempotent)
        try {
          const result = await mktRpc("mkt_credit_deposit", {
            p_deposit_id: orderId,
            p_gateway_payment_id: paymentId,
            p_event: lastEvent,
            p_confirmed_by: null,
          });

          console.log(
            `[nowpayments-ipn] Credit result for ${orderId}:`,
            result["credited"] ? "credited" : `noop_${String(result["reason"] ?? "")}`,
          );
          return json({ ok: true, message: "Credited" }, { status: 200 });
        } catch (err) {
          console.error(`[nowpayments-ipn] Credit error for ${orderId}:`, err);
          return json({ error: "Credit failed" }, { status: 500 });
        }
      }

      case "partially_paid": {
        // Partial payment - never auto-credit, mark for admin review
        console.warn(`[nowpayments-ipn] Partial payment for ${orderId}`);
        await mktDb
          .from("advertiser_deposits")
          .update({
            last_event: {
              ...lastEvent,
              note: "partial_payment_requires_review",
            },
          })
          .eq("id", orderId);
        return json({ ok: true, message: "Partial payment - held for review" }, { status: 200 });
      }

      case "failed":
      case "expired": {
        // Payment failed - only mark failed if still in created/pending
        if (["created", "pending"].includes(deposit.status)) {
          await mktDb
            .from("advertiser_deposits")
            .update({
              status: "failed",
              failure_reason: `payment_${paymentStatus}`,
              last_event: lastEvent,
            })
            .eq("id", orderId)
            .in("status", ["created", "pending"]);
          console.log(`[nowpayments-ipn] Marked ${orderId} as failed (${paymentStatus})`);
        }
        return json({ ok: true, message: "Payment failed" }, { status: 200 });
      }

      case "refunded": {
        // Refund - reverse if already credited
        if (deposit.status === "completed") {
          try {
            await mktRpc("mkt_reverse_deposit", {
              p_deposit_id: orderId,
              p_reversal_key: `nowpayments_refund_${paymentId}`,
              p_reason: "refunded",
              p_event: lastEvent,
            });
            console.log(`[nowpayments-ipn] Reversed ${orderId} due to refund`);
          } catch (err) {
            console.error(`[nowpayments-ipn] Reversal error for ${orderId}:`, err);
            return json({ error: "Reversal failed" }, { status: 500 });
          }
        }
        return json({ ok: true, message: "Refund processed" }, { status: 200 });
      }

      default: {
        // Unknown status - store and acknowledge
        console.warn(`[nowpayments-ipn] Unknown status ${paymentStatus} for ${orderId}`);
        await mktDb
          .from("advertiser_deposits")
          .update({ last_event: lastEvent })
          .eq("id", orderId);
        return json({ ok: true, message: "Status recorded" }, { status: 200 });
      }
    }
  } catch (err) {
    console.error("[nowpayments-ipn] Unexpected error:", err);
    return json({ error: "Internal error" }, { status: 500 });
  }
}
