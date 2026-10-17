/**
 * QroPay UPI gateway integration.
 * Architecture mirrors razorpay.server.ts: deposit creation, webhook crediting only.
 * 
 * Env vars (server-only):
 * - QROPAY_API_KEY (required, used as "key" parameter)
 * - QROPAY_WEBHOOK_SECRET (required for webhook validation)
 */

import crypto from "node:crypto";

const QROPAY_API_URL = "https://qropay.com/api/add_order.php";

/**
 * Check if QroPay is configured (API key and webhook secret present).
 */
export function qropayConfigured(): boolean {
  return Boolean(
    process.env["QROPAY_API_KEY"] && process.env["QROPAY_WEBHOOK_SECRET"]
  );
}

/**
 * Create a QroPay order for a deposit.
 * POST /api/add_order.php
 */
export async function createQropayOrder(params: {
  depositId: string;
  amountInr: number;
  customerEmail: string;
  redirectUrl: string;
}): Promise<{ qropayOrderId: string; paymentUrl: string }> {
  const apiKey = process.env["QROPAY_API_KEY"];
  if (!apiKey) {
    throw new Error("QROPAY_API_KEY not configured");
  }

  const body = {
    key: apiKey,
    order_id: params.depositId,
    amount: String(params.amountInr), // Must be string, INR
    purpose: `CashGPT Campaign Balance Deposit - ₹${params.amountInr}`,
    customer_email: params.customerEmail,
    redirect_url: params.redirectUrl,
  };

  const response = await fetch(QROPAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QroPay order creation failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    status: boolean;
    msg: string;
    order_id?: string;
    payment_url?: string;
  };

  if (!data.status || !data.order_id || !data.payment_url) {
    throw new Error(`QroPay order creation failed: ${data.msg || "Unknown error"}`);
  }

  return {
    qropayOrderId: data.order_id,
    paymentUrl: data.payment_url,
  };
}

/**
 * QroPay webhook event structure.
 * Can be form-encoded or JSON.
 */
export type QropayWebhookEvent = {
  order_id: string;
  amount: string | number;
  status: string;
  secretKey: string;
  paymentAmount?: string | number;
};

/**
 * Verify QroPay webhook secret.
 * Timing-safe comparison of secretKey.
 */
export function verifyQropayWebhook(secretKey: string | null | undefined): boolean {
  const expectedSecret = process.env["QROPAY_WEBHOOK_SECRET"];
  if (!expectedSecret) {
    console.error("[qropay] QROPAY_WEBHOOK_SECRET not configured");
    return false;
  }

  if (!secretKey) {
    return false;
  }

  try {
    // Timing-safe compare
    return crypto.timingSafeEqual(
      Buffer.from(secretKey),
      Buffer.from(expectedSecret)
    );
  } catch (err) {
    // Length mismatch or other error
    return false;
  }
}
