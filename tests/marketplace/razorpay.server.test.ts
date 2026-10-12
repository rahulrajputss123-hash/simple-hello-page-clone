import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";

import { signWebhookBody, verifyCheckoutSignature, verifyWebhookSignature } from "../../src/lib/marketplace/razorpay.server";

const WEBHOOK = "unit-test-webhook-secret";
const KEY_SECRET = "unit-test-key-secret";
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ["RAZORPAY_WEBHOOK_SECRET", "RAZORPAY_KEY_SECRET", "RAZORPAY_KEY_ID"]) saved[k] = process.env[k];
  process.env["RAZORPAY_WEBHOOK_SECRET"] = WEBHOOK;
  process.env["RAZORPAY_KEY_SECRET"] = KEY_SECRET;
  process.env["RAZORPAY_KEY_ID"] = "rzp_test_unit";
});
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("webhook signature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });

  test("accepts a correct HMAC over the raw body", () => {
    expect(verifyWebhookSignature(body, signWebhookBody(body, WEBHOOK))).toBe(true);
  });
  test("rejects missing, wrong, and wrong-secret signatures", () => {
    expect(verifyWebhookSignature(body, null)).toBe(false);
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false);
    expect(verifyWebhookSignature(body, signWebhookBody(body, "other-secret"))).toBe(false);
  });
  test("rejects when the body was altered after signing", () => {
    const sig = signWebhookBody(body, WEBHOOK);
    expect(verifyWebhookSignature(body.replace("pay_1", "pay_2"), sig)).toBe(false);
  });
  test("rejects when the webhook secret is not configured", () => {
    delete process.env["RAZORPAY_WEBHOOK_SECRET"];
    expect(verifyWebhookSignature(body, signWebhookBody(body, WEBHOOK))).toBe(false);
  });
});

describe("checkout signature", () => {
  const orderId = "order_abc";
  const paymentId = "pay_xyz";
  const good = createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");

  test("accepts HMAC(order_id|payment_id, key_secret)", () => {
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: good })).toBe(true);
  });
  test("rejects a signature for a different order/payment pair", () => {
    expect(verifyCheckoutSignature({ orderId: "order_other", paymentId, signature: good })).toBe(false);
    expect(verifyCheckoutSignature({ orderId, paymentId: "pay_other", signature: good })).toBe(false);
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: "" })).toBe(false);
  });
});