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
  const receivedAt = new Date().toISOString();
  
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

    const receivedOrderId = String(event.order_id);
    const status = event.status;
    const amount = typeof event.amount === "string" ? parseFloat(event.amount) : event.amount;
    const paymentAmount = event.paymentAmount
      ? typeof event.paymentAmount === "string"
        ? parseFloat(event.paymentAmount)
        : event.paymentAmount
      : null;

    // 1. Verify secretKey (timing-safe) - NEVER log the actual secret
    if (!verifyQropayWebhook(event.secretKey)) {
      console.error(
        `[qropay-webhook] Invalid secretKey | order_id=${receivedOrderId} status=${status} amount=${amount} matched=false decision=rejected_invalid_secret`,
      );
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Find deposit by order_id suffix matching
    // The order_id we send to QroPay is the last 20 hex chars of the deposit UUID (no dashes)
    // For backward compatibility, also match old 16-char format
    const { data: allDeposits, error: fetchErr } = await mktDb
      .from("advertiser_deposits")
      .select("*")
      .eq("gateway", "qropay")
      .eq("status", "pending");

    if (fetchErr) {
      console.error(
        `[qropay-webhook] DB error | order_id=${receivedOrderId} status=${status} amount=${amount} matched=false decision=rejected_db_error error=${fetchErr.message}`,
      );
      return new Response("Internal error", { status: 500 });
    }

    // Match deposits whose dashless UUID ends with the received order_id
    const matchingDeposits = (allDeposits || []).filter((d) => {
      const dashlessId = d.id.replace(/-/g, "");
      // Try 20-char match (new format)
      if (dashlessId.substring(12, 32) === receivedOrderId) return true;
      // Try 16-char prefix match (old format with random suffix)
      if (receivedOrderId.length >= 16 && dashlessId.substring(16, 32) === receivedOrderId.substring(0, 16)) return true;
      return false;
    });

    if (matchingDeposits.length === 0) {
      console.log(
        `[qropay-webhook] No deposit matched | order_id=${receivedOrderId} status=${status} amount=${amount} matched=false decision=ignored_unknown_order`,
      );
      return new Response("Unknown order", { status: 200 });
    }

    if (matchingDeposits.length > 1) {
      const depositIds = matchingDeposits.map((d) => d.id).join(", ");
      console.error(
        `[qropay-webhook] Multiple deposits matched | order_id=${receivedOrderId} status=${status} amount=${amount} matched=multiple deposits=[${depositIds}] decision=rejected_ambiguous_match`,
      );
      
      // Store rejection in ALL matching deposits
      const rejectionEvent = {
        rejected: "ambiguous_match_multiple_deposits",
        status,
        amount,
        at: receivedAt,
      };
      
      for (const d of matchingDeposits) {
        await mktDb
          .from("advertiser_deposits")
          .update({ last_event: rejectionEvent })
          .eq("id", d.id);
      }
      
      return new Response("Ambiguous match", { status: 200 });
    }

    const deposit = matchingDeposits[0];
    const depositId = deposit.id;

    // Check expiry (30 minutes)
    const expiryThreshold = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);
    const depositCreated = new Date(deposit.created_at);
    const isExpired = depositCreated < expiryThreshold;

    // Store last event
    const lastEvent = {
      status,
      amount,
      paymentAmount,
      received_at: receivedAt,
    };

    // Handle payment status
    switch (status) {
      case "success": {
        // Payment complete - verify amount and credit

        // Check if deposit is expired
        if (isExpired) {
          const rejectionEvent = {
            rejected: "expired_older_than_30min",
            status,
            amount,
            at: receivedAt,
          };
          
          console.error(
            `[qropay-webhook] Deposit expired | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=rejected_expired`,
          );
          
          if (deposit.status === "pending") {
            await mktDb
              .from("advertiser_deposits")
              .update({
                status: "failed",
                failure_reason: "expired",
                last_event: rejectionEvent,
              })
              .eq("id", depositId)
              .eq("status", "pending");
          }
          return new Response("Order expired", { status: 200 });
        }

        // Check if deposit is already in terminal state
        if (deposit.status !== "pending") {
          console.log(
            `[qropay-webhook] Already processed | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=ignored_already_${deposit.status}`,
          );
          return new Response("Already processed", { status: 200 });
        }

        // Amount validation: must match charge_amount exactly
        const expectedAmount = deposit.charge_amount;
        const receivedAmount = paymentAmount !== null ? paymentAmount : amount;

        if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
          // Amount mismatch - hold for admin review
          const rejectionEvent = {
            rejected: "amount_mismatch",
            status,
            amount,
            expected: expectedAmount,
            received: receivedAmount,
            at: receivedAt,
          };
          
          console.error(
            `[qropay-webhook] Amount mismatch | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=rejected_amount_mismatch expected=${expectedAmount} received=${receivedAmount}`,
          );
          
          await mktDb
            .from("advertiser_deposits")
            .update({ last_event: rejectionEvent })
            .eq("id", depositId);
          return new Response("Amount mismatch - held for review", { status: 200 });
        }

        // Check auto-credit ceiling
        if (deposit.amount_usd > AUTO_CREDIT_CEILING_USD) {
          console.log(
            `[qropay-webhook] Above ceiling | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=held_for_review amount_usd=${deposit.amount_usd} ceiling=${AUTO_CREDIT_CEILING_USD}`,
          );
          
          await mktDb
            .from("advertiser_deposits")
            .update({
              last_event: {
                ...lastEvent,
                note: `above_auto_credit_ceiling_${AUTO_CREDIT_CEILING_USD}_usd`,
              },
            })
            .eq("id", depositId);
          return new Response("Above ceiling - held for review", { status: 200 });
        }

        // Credit the deposit (idempotent)
        try {
          const result = await mktRpc("mkt_credit_deposit", {
            p_deposit_id: depositId,
            p_gateway_payment_id: `qropay:${receivedOrderId}`,
            p_event: lastEvent,
            p_confirmed_by: null,
          });

          console.log(
            `[qropay-webhook] Credit attempt | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=${result["credited"] ? "credited" : `noop_${String(result["reason"] ?? "unknown")}`}`,
          );
          return new Response("Credited", { status: 200 });
        } catch (err) {
          console.error(
            `[qropay-webhook] Credit error | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=rejected_credit_error error=${String(err)}`,
          );
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
            .eq("id", depositId)
            .eq("status", "pending");
          
          console.log(
            `[qropay-webhook] Payment failed | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=marked_failed`,
          );
        } else {
          console.log(
            `[qropay-webhook] Payment failed (noop) | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=ignored_already_${deposit.status}`,
          );
        }
        return new Response("Payment failed", { status: 200 });
      }

      case "pending": {
        // Payment in progress - update last_event, stay pending
        if (deposit.status === "pending") {
          await mktDb
            .from("advertiser_deposits")
            .update({ last_event: lastEvent })
            .eq("id", depositId);
        }
        
        console.log(
          `[qropay-webhook] Status updated | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=updated_pending`,
        );
        return new Response("Status updated", { status: 200 });
      }

      default: {
        // Unknown status - store and acknowledge
        console.log(
          `[qropay-webhook] Unknown status | order_id=${receivedOrderId} status=${status} amount=${amount} matched=true deposit_id=${depositId} decision=ignored_unknown_status`,
        );
        
        await mktDb
          .from("advertiser_deposits")
          .update({ last_event: lastEvent })
          .eq("id", depositId);
        return new Response("Status recorded", { status: 200 });
      }
    }
  } catch (err) {
    console.error("[qropay-webhook] Unexpected error:", String(err));
    return new Response("Internal error", { status: 500 });
  }
}
