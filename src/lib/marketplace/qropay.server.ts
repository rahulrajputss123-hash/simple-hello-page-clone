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

  // Use a shorter, dashless order_id (QroPay may have length/format restrictions)
  // Keep original depositId in purpose for reference
  const shortOrderId = params.depositId.replace(/-/g, "").substring(0, 32);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmail = emailRegex.test(params.customerEmail) 
    ? params.customerEmail 
    : "support@cashgpt.in";

  // Ensure redirect URL is absolute https
  const validRedirectUrl = params.redirectUrl.startsWith("https://") 
    ? params.redirectUrl 
    : `https://cashgpt.in${params.redirectUrl}`;

  const body = {
    key: apiKey,
    order_id: shortOrderId,
    amount: String(params.amountInr), // Must be string, INR
    purpose: `CashGPT Campaign Balance Deposit - ₹${params.amountInr} (${params.depositId})`,
    customer_email: validEmail,
    redirect_url: validRedirectUrl,
  };

  // Log request (mask API key)
  console.log("[qropay] Creating order:", {
    order_id: body.order_id,
    amount: body.amount,
    purpose: body.purpose,
    customer_email: body.customer_email,
    redirect_url: body.redirect_url,
    key: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
  });

  const response = await fetch(QROPAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "unknown";
    const text = await response.text();
    const truncatedBody = text.substring(0, 500);
    const errorMessage = `QroPay ${response.status} (${contentType}): ${truncatedBody}`;
    
    console.error("[qropay] Order creation failed:", {
      status: response.status,
      contentType,
      body: truncatedBody,
      requestFields: {
        order_id: body.order_id,
        amount: body.amount,
        customer_email: body.customer_email,
        redirect_url: body.redirect_url,
      },
    });
    
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    status: boolean;
    msg: string;
    order_id?: string;
    payment_url?: string;
  };

  if (!data.status || !data.order_id || !data.payment_url) {
    const errorMessage = `QroPay order failed: ${data.msg || "Unknown error"}`;
    
    console.error("[qropay] Order creation response invalid:", {
      status: data.status,
      msg: data.msg,
      order_id: data.order_id,
      payment_url: data.payment_url,
      requestFields: {
        order_id: body.order_id,
        amount: body.amount,
        customer_email: body.customer_email,
        redirect_url: body.redirect_url,
      },
    });
    
    throw new Error(errorMessage);
  }

  console.log("[qropay] Order created successfully:", {
    qropayOrderId: data.order_id,
    depositId: params.depositId,
    shortOrderId,
  });

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
