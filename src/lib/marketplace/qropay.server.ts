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

  // Create short alphanumeric order_id (max 20 chars)
  // Use last 16 chars of UUID (remove dashes) + 4 random chars for uniqueness
  const uuidPart = params.depositId.replace(/-/g, "").substring(16, 32); // Last 16 chars
  const randomPart = Math.random().toString(36).substring(2, 6); // 4 random chars
  const shortOrderId = (uuidPart + randomPart).substring(0, 20);

  // Whole rupees as plain string
  const amountStr = String(Math.ceil(params.amountInr));

  // Plain ASCII purpose, no symbols
  const purpose = "CashGPT Deposit";

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmail = emailRegex.test(params.customerEmail) 
    ? params.customerEmail 
    : "support@cashgpt.in";

  // Simple redirect URL without query string
  const redirectUrl = "https://cashgpt.in/advertiser/funds";

  const body = {
    key: apiKey,
    order_id: shortOrderId,
    amount: amountStr,
    purpose: purpose,
    customer_email: validEmail,
    redirect_url: redirectUrl,
  };

  // Log request with masked key - this is what gets sent to QroPay
  const logBody = {
    ...body,
    key: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
  };
  console.log("[qropay] Sending request to QroPay:", {
    url: QROPAY_API_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: logBody,
    mapping: {
      shortOrderId,
      fullDepositId: params.depositId,
      originalAmount: params.amountInr,
      roundedAmount: amountStr,
    },
  });

  const response = await fetch(QROPAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "unknown";
  
  // Always read response body
  let responseText = "";
  try {
    responseText = await response.text();
  } catch (readErr) {
    responseText = `[Could not read response body: ${readErr}]`;
  }

  if (!response.ok) {
    const truncatedBody = responseText.substring(0, 500);
    const errorMessage = `QroPay ${response.status} (${contentType}): ${truncatedBody || "[empty body]"}`;
    
    console.error("[qropay] Order creation HTTP error:", {
      status: response.status,
      statusText: response.statusText,
      contentType,
      bodyLength: responseText.length,
      body: truncatedBody || "[empty]",
      requestBody: logBody,
    });
    
    throw new Error(errorMessage);
  }

  // Try to parse JSON response
  let data: {
    status: boolean;
    msg: string;
    order_id?: string | number; // QroPay returns numeric ID
    payment_url?: string;
  };
  
  try {
    data = JSON.parse(responseText);
  } catch (parseErr) {
    const truncatedBody = responseText.substring(0, 500);
    console.error("[qropay] Failed to parse response JSON:", {
      contentType,
      bodyLength: responseText.length,
      body: truncatedBody,
      requestBody: logBody,
    });
    throw new Error(`QroPay response not JSON (${contentType}): ${truncatedBody}`);
  }

  if (!data.status || !data.order_id || !data.payment_url) {
    const errorMessage = `QroPay order failed: ${data.msg || "Unknown error"}`;
    
    console.error("[qropay] Order creation response invalid:", {
      responseStatus: data.status,
      responseMsg: data.msg,
      responseOrderId: data.order_id,
      responsePaymentUrl: data.payment_url,
      requestBody: logBody,
    });
    
    throw new Error(errorMessage);
  }

  console.log("[qropay] Order created successfully:", {
    qropayOrderId: data.order_id,
    shortOrderId,
    fullDepositId: params.depositId,
    paymentUrl: data.payment_url,
  });

  return {
    qropayOrderId: String(data.order_id), // Convert numeric ID to string
    paymentUrl: data.payment_url,
  };
}

/**
 * QroPay webhook event structure.
 * Can be form-encoded or JSON.
 */
export type QropayWebhookEvent = {
  order_id: string | number; // QroPay sends numeric ID
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
