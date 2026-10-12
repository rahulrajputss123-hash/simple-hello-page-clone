import { createHmac, timingSafeEqual } from "crypto";

/**
 * Razorpay HTTP client — Orders API + signature checks. No SDK: three
 * endpoints and two HMACs don't justify a dependency (see bunfig.toml's
 * supply-chain guard).
 *
 * Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (server-side only; the key id is
 * also handed to the browser to open Checkout), RAZORPAY_WEBHOOK_SECRET.
 *
 * Trust model (hard rule, see advertiser.server.ts): a deposit is credited ONLY
 * from a webhook event whose signature verifies against RAZORPAY_WEBHOOK_SECRET
 * and whose payment is in `captured` state. The checkout-success callback that
 * the browser sends us is verified too, but it only records the payment id —
 * it never credits money.
 */

const BASE = "https://api.razorpay.com/v1";

export class RazorpayConfigError extends Error {
  constructor(missing: string[]) {
    super(`Razorpay is not configured: missing ${missing.join(", ")}`);
    this.name = "RazorpayConfigError";
  }
}

export class RazorpayApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = "RazorpayApiError";
    this.status = status;
    this.code = code;
  }
}

function keys(): { keyId: string; keySecret: string } {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  const missing = [...(!keyId ? ["RAZORPAY_KEY_ID"] : []), ...(!keySecret ? ["RAZORPAY_KEY_SECRET"] : [])];
  if (missing.length) throw new RazorpayConfigError(missing);
  return { keyId: keyId!, keySecret: keySecret! };
}

export function razorpayKeyId(): string {
  return keys().keyId;
}

export function razorpayConfigured(): boolean {
  return Boolean(
    process.env["RAZORPAY_KEY_ID"] &&
      process.env["RAZORPAY_KEY_SECRET"] &&
      process.env["RAZORPAY_WEBHOOK_SECRET"],
  );
}

async function rzpFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = keys();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const err = (body as { error?: { code?: string; description?: string } } | null)?.error;
    throw new RazorpayApiError(
      res.status,
      err?.code ?? null,
      err?.description ?? `Razorpay ${path} failed (${res.status})`,
    );
  }
  return body as T;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  notes: Record<string, string>;
};

/** amountMinor: paise for INR, cents for USD. receipt: our deposit id. */
export async function createRazorpayOrder(input: {
  amountMinor: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder> {
  return rzpFetch<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
      payment_capture: 1,
    }),
  });
}

export type RazorpayPayment = {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string | null;
  email: string | null;
  contact: string | null;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
};

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  return rzpFetch<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

function hmacHex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b) || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/** Checkout success callback: razorpay_signature = HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = keys();
  const expected = hmacHex(keySecret, `${input.orderId}|${input.paymentId}`);
  return safeEqualHex(expected, input.signature);
}

/** Webhook: X-Razorpay-Signature = HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!secret || !signature) return false;
  return safeEqualHex(hmacHex(secret, rawBody), signature.trim());
}

/** Test helper / local tooling: sign a body the way Razorpay does. */
export function signWebhookBody(rawBody: string, secret: string): string {
  return hmacHex(secret, rawBody);
}

export type RazorpayWebhookEvent = {
  event: string;
  created_at?: number;
  payload: {
    payment?: { entity: RazorpayPayment & { notes?: Record<string, string> } };
    order?: { entity: RazorpayOrder };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        currency: string;
        status: string;
        notes?: Record<string, string>;
      };
    };
    dispute?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        currency: string;
        status: string;
        phase?: string;
      };
    };
  };
};