/**
 * QroPay webhook endpoint.
 * Public route. Validates secretKey and processes payment status updates.
 * 
 * Mirrors razorpay-webhook.ts architecture: webhook is the ONLY place money is credited.
 * Safe for retries and duplicate deliveries.
 * 
 * Security: No signature validation available, so we use strict checks:
 * - Timing-safe secretKey comparison
 * - Order must exist and be in pending status
 * - Order must not be expired (30 min window)
 * - Amount must match exactly
 * - Auto-credit ceiling for large amounts ($100 equivalent)
 */

import { json } from "@tanstack/react-start";
import type { APIEvent } from "@tanstack/react-start/server";
import {
  type QropayWebhookEvent,
  verifyQropayWebhook,
} from "@/lib/marketplace/qropay.server";
import { mktDb, mktRpc } from "@/lib/marketplace/db.server";

// Expiry window: deposits older than this are marked expired instead of credited
const EXPIRY_MINUTES = 30;

// Auto-credit ceiling: deposits above this USD equivalent are held for admin approval
const AUTO_CREDIT_CEILING_USD = 100;

export async function POST({ request }: APIEvent) {
  try {
    let event: QropayWebhookEvent;

    // QroPay can send form-encoded or JSON
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      event = (await request.json()) as QropayWebhookEvent;
    } else {
      // Parse form data
      const formData = await request.formData();
      event = {
        order_id: formData.get("order_id") as string,
        amount: formData.get("amount") as string,
        status: formData.get("status") as string,
        secretKey: formData.get("secretKey") as string,
        paymentAmount: formData.get("paymentAmount") as string | undefined,
      };
    }

    // 1. Verify secretKey (timing-safe)
    if (!verifyQropayWebhook(event.secretKey)) {
      console.error("[qropay-webhook] Invalid secretKey");
      return new Response("Unauthorized", { status: 401 });
    }

    const orderId = event.order_id;
    const status = event.status;
    const amount = typeof event.amount === "string" ? parseFloat(event.amount) : event.amount;
    const paymentAmount = event.paymentAmount
      ? typeof event.paymentAmount === "string"
        ? parseFloat(event.paymentAmount)
        : event.paymentAmount
      : null;

    console.log(`[qropay-webhook] ${status} for order ${orderId}, amount ${amount}`);

    // 2. Find deposit by our order_id (gateway = 'qropay')
    const { data: deposit, error: fetchErr } = await mktDb
      .from("advertiser_deposits")
      .select("*")
      .eq("id", orderId)
      .eq("gateway", "qropay")
      .maybeSingle();

    if (fetchErr) {
      console.error("[qropay-webhook] DB error:", fetchErr);
      return new Response("Internal error", { status: 500 });
    }

    if (!deposit) {
      // Unknown order - acknowledge but don't process
      console.warn(`[qropay-webhook] Unknown order ${orderId}`);
      return new Response("Unknown order", { status: 200 });
    }

    // Check expiry (30 minutes)
    const expiryThreshold = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);
    const depositCreated = new Date(deposit.created_at);
    const isExpired = depositCreated < expiryThreshold;

    // Store last event
    const lastEvent = {
      status,
      amount,
      paymentAmount,
      received_at: new Date().toISOString(),
    };

    // Handle payment status
    switch (status) {
      case "success": {
        // Payment complete - verify amount and credit

        // Check if deposit is expired
        if (isExpired) {
          console.warn(`[qropay-webhook] Order ${orderId} expired (older than ${EXPIRY_MINUTES} min)`);
          if (deposit.status === "pending") {
            await mktDb
              .from("advertiser_deposits")
              .update({
                status: "failed",
                failure_reason: "expired",
                last_event: lastEvent,
              })
              .eq("id", orderId)
              .eq("status", "pending");
          }
          return new Response("Order expired", { status: 200 });
        }

        // Check if deposit is already in terminal state
        if (deposit.status !== "pending") {
          console.log(`[qropay-webhook] Order ${orderId} already ${deposit.status}, ignoring`);
          return new Response("Already processed", { status: 200 });
        }

        // Amount validation: must match charge_amount exactly
        const expectedAmount = deposit.charge_amount;
        const receivedAmount = paymentAmount !== null ? paymentAmount : amount;

        if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
          // Amount mismatch - hold for admin review
          console.error(
            `[qropay-webhook] Amount mismatch for ${orderId}: expected ${expectedAmount} ${deposit.charge_currency}, got ${receivedAmount}`,
          );
          await mktDb
            .from("advertiser_deposits")
            .update({
              last_event: {
                ...lastEvent,
                mismatch: { expected: expectedAmount, received: receivedAmount, currency: deposit.charge_currency },
                note: "amount_mismatch_requires_admin_review",
              },
            })
            .eq("id", orderId);
          return new Response("Amount mismatch - held for review", { status: 200 });
        }

        // Check auto-credit ceiling
        if (deposit.amount_usd > AUTO_CREDIT_CEILING_USD) {
          console.warn(
            `[qropay-webhook] Order ${orderId} above auto-credit ceiling ($${deposit.amount_usd} > $${AUTO_CREDIT_CEILING_USD}) - held for admin review`,
          );
          await mktDb
            .from("advertiser_deposits")
            .update({
              last_event: {
                ...lastEvent,
                note: `above_auto_credit_ceiling_${AUTO_CREDIT_CEILING_USD}_usd`,
              },
            })
            .eq("id", orderId);
          return new Response("Above ceiling - held for review", { status: 200 });
        }

        // Credit the deposit (idempotent)
        try {
          const result = await mktRpc("mkt_credit_deposit", {
            p_deposit_id: orderId,
            p_gateway_payment_id: `qropay:${deposit.gateway_order_id || orderId}`,
            p_event: lastEvent,
            p_confirmed_by: null,
          });

          console.log(
            `[qropay-webhook] Credit result for ${orderId}:`,
            result["credited"] ? "credited" : `noop_${String(result["reason"] ?? "")}`,
          );
          return new Response("Credited", { status: 200 });
        } catch (err) {
          console.error(`[qropay-webhook] Credit error for ${orderId}:`, err);
          return new Response("Credit failed", { status: 500 });
        }
      }

      case "failure":
      case "failed": {
        // Payment failed - only mark failed if still in pending
        if (deposit.status === "pending" && !isExpired) {
          await mktDb
            .from("advertiser_deposits")
            .update({
              status: "failed",
              failure_reason: `payment_${status}`,
              last_event: lastEvent,
            })
            .eq("id", orderId)
            .eq("status", "pending");
          console.log(`[qropay-webhook] Marked ${orderId} as failed (${status})`);
        }
        return new Response("Payment failed", { status: 200 });
      }

      case "pending": {
        // Payment in progress - update last_event, stay pending
        if (deposit.status === "pending") {
          await mktDb
            .from("advertiser_deposits")
            .update({ last_event: lastEvent })
            .eq("id", orderId);
        }
        return new Response("Status updated", { status: 200 });
      }

      default: {
        // Unknown status - store and acknowledge
        console.warn(`[qropay-webhook] Unknown status ${status} for ${orderId}`);
        await mktDb
          .from("advertiser_deposits")
          .update({ last_event: lastEvent })
          .eq("id", orderId);
        return new Response("Status recorded", { status: 200 });
      }
    }
  } catch (err) {
    console.error("[qropay-webhook] Unexpected error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
