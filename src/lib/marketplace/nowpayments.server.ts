/**
 * NOWPayments crypto gateway integration.
 * Architecture mirrors razorpay.server.ts: deposit creation, webhook crediting only.
 * 
 * Env vars (server-only):
 * - NOWPAYMENTS_API_KEY (required)
 * - NOWPAYMENTS_IPN_SECRET (required for webhook verification)
 * - NOWPAYMENTS_BASE_URL (optional, defaults to production, set to sandbox for testing)
 */

import crypto from "node:crypto";

const NOWPAYMENTS_PROD_URL = "https://api.nowpayments.io";
const NOWPAYMENTS_SANDBOX_URL = "https://api-sandbox.nowpayments.io";

/**
 * Get NOWPayments base URL (production or sandbox).
 */
function getNowpaymentsBaseUrl(): string {
  return process.env["NOWPAYMENTS_BASE_URL"] || NOWPAYMENTS_PROD_URL;
}

/**
 * Check if NOWPayments is configured (API key present).
 */
export function nowpaymentsConfigured(): boolean {
  return Boolean(process.env["NOWPAYMENTS_API_KEY"]);
}

/**
 * Expose in settings for UI to check.
 */
export function nowpaymentsApiKey(): string | null {
  return process.env["NOWPAYMENTS_API_KEY"] || null;
}

/**
 * Create a NOWPayments invoice for a deposit.
 * POST /v1/invoice with x-api-key header.
 */
export async function createNowpaymentsInvoice(params: {
  depositId: string;
  amountUsd: number;
  successUrl: string;
  cancelUrl: string;
  ipnCallbackUrl: string;
}): Promise<{ invoiceId: string; invoiceUrl: string }> {
  const apiKey = process.env["NOWPAYMENTS_API_KEY"];
  if (!apiKey) {
    throw new Error("NOWPAYMENTS_API_KEY not configured");
  }

  const baseUrl = getNowpaymentsBaseUrl();
  const url = `${baseUrl}/v1/invoice`;

  const body = {
    price_amount: params.amountUsd,
    price_currency: "usd",
    order_id: params.depositId,
    order_description: `CashGPT Campaign Balance Deposit - $${params.amountUsd}`,
    ipn_callback_url: params.ipnCallbackUrl,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`NOWPayments invoice creation failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { id: string; invoice_url: string };
  return {
    invoiceId: data.id,
    invoiceUrl: data.invoice_url,
  };
}

/**
 * NOWPayments IPN (webhook) event structure.
 */
export type NowpaymentsIpnEvent = {
  payment_id: number | string;
  invoice_id?: string;
  payment_status: string;
  pay_address?: string;
  price_amount: number;
  price_currency: string;
  pay_amount?: number;
  actually_paid?: number;
  pay_currency?: string;
  order_id: string;
  order_description?: string;
  purchase_id?: string;
  outcome_amount?: number;
  outcome_currency?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

/**
 * Sort object keys recursively for HMAC verification.
 * NOWPayments requires alphabetical key sorting.
 */
function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce(
        (sorted, key) => {
          sorted[key] = sortObjectKeys(obj[key]);
          return sorted;
        },
        {} as Record<string, any>,
      );
  }
  return obj;
}

/**
 * Verify NOWPayments IPN signature.
 * x-nowpayments-sig = HMAC-SHA512(sorted JSON body, IPN_SECRET)
 */
export function verifyNowpaymentsIpn(rawBody: string, signature: string | null): boolean {
  const secret = process.env["NOWPAYMENTS_IPN_SECRET"];
  if (!secret) {
    console.error("[nowpayments] NOWPAYMENTS_IPN_SECRET not configured");
    return false;
  }

  if (!signature) {
    return false;
  }

  try {
    // Parse and sort keys alphabetically
    const parsed = JSON.parse(rawBody);
    const sorted = sortObjectKeys(parsed);
    const sortedBody = JSON.stringify(sorted);

    // Compute HMAC-SHA512
    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(sortedBody);
    const computed = hmac.digest("hex");

    // Timing-safe compare
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch (err) {
    console.error("[nowpayments] IPN signature verification error:", err);
    return false;
  }
}
