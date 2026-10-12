/**
 * Phase 2 live smoke test — runs the REAL server code (advertiser.server.ts) against
 * the live Supabase project where Phase 1 v2 was just applied. Razorpay's API is the
 * only thing stubbed (placeholder keys): fetch() to api.razorpay.com returns a fake order.
 * Webhooks are delivered over HTTP to the running dev server so the route is exercised too.
 *
 * NOT for CI. Run once: bun scripts/phase2-live-test.ts
 */
import { createHmac } from "node:crypto";

const QA_USER = "714900d6-8a7c-46e4-97fd-69ca96200473"; // qa.assistant@cashgpt.test
const DEV = "http://localhost:3000";
const WEBHOOK_SECRET = process.env["RAZORPAY_WEBHOOK_SECRET"]!;
const KEY_SECRET = process.env["RAZORPAY_KEY_SECRET"]!;

// --- stub Razorpay only -----------------------------------------------------
const realFetch = globalThis.fetch;
let orderSeq = 0;
globalThis.fetch = (async (input: any, init?: any) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.startsWith("https://api.razorpay.com/v1/orders") && init?.method === "POST") {
    const body = JSON.parse(init.body);
    orderSeq += 1;
    return new Response(
      JSON.stringify({ id: `order_TEST${Date.now()}${orderSeq}`, amount: body.amount, currency: body.currency, receipt: body.receipt, status: "created" }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }
  return realFetch(input, init);
}) as typeof fetch;

const A = await import("../src/lib/marketplace/advertiser.server");
const { mktDb, mktRpc } = await import("../src/lib/marketplace/db.server");

const log: string[] = [];
let fails = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  const mark = cond ? "PASS" : "FAIL";
  if (!cond) fails++;
  log.push(`${mark}  ${name}${detail !== undefined ? "  → " + JSON.stringify(detail) : ""}`);
}
async function webhook(payload: object, badSig = false) {
  const raw = JSON.stringify(payload);
  const sig = badSig ? "deadbeef" : createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
  const res = await realFetch(`${DEV}/api/public/razorpay-webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-razorpay-signature": sig },
    body: raw,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
const paymentEvt = (event: string, orderId: string, paymentId: string, amount: number, currency: string, status = "captured") => ({
  event,
  created_at: Math.floor(Date.now() / 1000),
  payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, currency, status } } },
});
async function balances() {
  const a = await A.getAccount(QA_USER);
  return a ? { deposit: Number(a.deposit_balance), locked: Number(a.bonus_locked), avail: Number(a.bonus_available), status: a.status } : null;
}

// --- settings: enable deposits for the test, restore after -----------------
const { data: s0 } = await mktDb.from("marketplace_settings").select("deposits_enabled").eq("id", true).single();
const depositsWere = (s0 as any).deposits_enabled as boolean;
await mktDb.from("marketplace_settings").update({ deposits_enabled: true }).eq("id", true);

try {
  // 1. activation
  const act1 = await A.becomeAdvertiserImpl(QA_USER, { displayName: "QA Advertiser", contactEmail: "qa.assistant@cashgpt.test", websiteUrl: "", acceptTerms: true });
  const act2 = await A.becomeAdvertiserImpl(QA_USER, { displayName: "dup", contactEmail: "", websiteUrl: "", acceptTerms: true });
  check("activation inserts account (or already existed)", act1.account.status === "active", { created: act1.created });
  check("activation is idempotent", act2.created === false);
  const ov0 = await A.getOverviewImpl(QA_USER);
  check("overview loads for activated advertiser", ov0.account !== null && ov0.settings.depositsEnabled === true);
  const b0 = (await balances())!;

  // 2. deposit range validation
  let rangeErr = "";
  try { await A.createDepositImpl(QA_USER, 5); } catch (e) { rangeErr = (e as any).code; }
  check("deposit below min rejected", rangeErr === "AMOUNT_OUT_OF_RANGE");

  // 3. create deposit (stubbed Razorpay order) → pending
  const dep = await A.createDepositImpl(QA_USER, 25);
  check("createDeposit returns order + key", dep.orderId.startsWith("order_TEST") && dep.currency === "USD" && dep.amountMinor === 2500, dep);
  const d1 = await A.getDepositImpl(QA_USER, dep.depositId);
  check("deposit row pending with order id", d1?.status === "pending");

  // 4. confirmCheckout BEFORE webhook: records payment id, no credit
  const payId = `pay_TEST${Date.now()}`;
  const badSig = await A.confirmCheckoutImpl(QA_USER, { depositId: dep.depositId, orderId: dep.orderId, paymentId: payId, signature: "nope" }).then(() => "ok").catch((e) => e.code);
  check("confirmCheckout rejects bad signature", badSig === "BAD_SIGNATURE");
  const goodSig = createHmac("sha256", KEY_SECRET).update(`${dep.orderId}|${payId}`).digest("hex");
  const cc = await A.confirmCheckoutImpl(QA_USER, { depositId: dep.depositId, orderId: dep.orderId, paymentId: payId, signature: goodSig });
  const bAfterCc = (await balances())!;
  check("confirmCheckout records payment id but does NOT credit", cc.status === "pending" && bAfterCc.deposit === b0.deposit, { status: cc.status });

  // 5. webhook: bad sig, amount mismatch, then real credit
  const w0 = await webhook(paymentEvt("payment.captured", dep.orderId, payId, 2500, "USD"), true);
  check("webhook bad signature → 401, nothing credited", w0.status === 401 && (await balances())!.deposit === b0.deposit);
  const w1 = await webhook(paymentEvt("payment.captured", dep.orderId, payId, 9999, "USD"));
  check("webhook amount mismatch → held, not credited", w1.body?.action === "held_amount_mismatch" && (await balances())!.deposit === b0.deposit, w1.body);
  const w2 = await webhook(paymentEvt("payment.captured", dep.orderId, payId, 2500, "USD"));
  const b1 = (await balances())!;
  check("webhook payment.captured → credited", w2.status === 200 && w2.body?.action === "credited", w2.body);
  check("deposit_balance +25", Math.abs(b1.deposit - b0.deposit - 25) < 0.005, b1);
  // Bonus only exists while a promo is running (settings.promo_ends_at in the future).
  const { data: sp } = await mktDb.from("marketplace_settings").select("promo_ends_at").eq("id", true).single();
  const promoLive = !!(sp as any).promo_ends_at && new Date((sp as any).promo_ends_at) > new Date();
  const bonus = w2.body?.detail?.bonus ?? {};
  check(
    promoLive ? "first-deposit bonus → bonus_locked +25 (100%)" : "no promo configured → no bonus granted (reason no_promo)",
    promoLive ? Math.abs(b1.locked - 25) < 0.005 : bonus.granted === false && bonus.reason === "no_promo" && b1.locked === 0,
    { locked: b1.locked, bonus },
  );
  const w3 = await webhook(paymentEvt("order.paid", dep.orderId, payId, 2500, "USD"));
  check("duplicate order.paid → idempotent noop", w3.body?.action === "noop_already_credited" && (await balances())!.deposit === b1.deposit, w3.body);
  const d2 = await A.getDepositImpl(QA_USER, dep.depositId);
  check("deposit status succeeded", d2?.status === "succeeded");
  const ccAfter = await A.confirmCheckoutImpl(QA_USER, { depositId: dep.depositId, orderId: dep.orderId, paymentId: payId, signature: goodSig });
  check("confirmCheckout after webhook is a read-only no-op", ccAfter.status === "succeeded");

  // 6. payment.failed path
  const dep2 = await A.createDepositImpl(QA_USER, 10);
  const wf = await webhook({ event: "payment.failed", payload: { payment: { entity: { id: `pay_FAIL${Date.now()}`, order_id: dep2.orderId, amount: 1000, currency: "USD", status: "failed", error_code: "BAD_REQUEST_ERROR", error_description: "test decline" } } } });
  const d3 = await A.getDepositImpl(QA_USER, dep2.depositId);
  check("payment.failed → deposit failed, no credit", wf.body?.action === "marked_failed" && d3?.status === "failed" && (await balances())!.deposit === b1.deposit, { status: d3?.status });

  // 7. second successful deposit (no bonus expected)
  const dep3 = await A.createDepositImpl(QA_USER, 10);
  const pay3 = `pay_TEST3${Date.now()}`;
  const w4 = await webhook(paymentEvt("payment.captured", dep3.orderId, pay3, 1000, "USD"));
  const b2 = (await balances())!;
  check("second deposit credited, no extra bonus", w4.body?.action === "credited" && Math.abs(b2.deposit - b1.deposit - 10) < 0.005 && Math.abs(b2.locked - b1.locked) < 0.005, b2);

  // 8. ledger + overview
  const tx = await A.listTransactionsImpl(QA_USER);
  check("ledger shows entries", tx.length >= 2, tx.slice(0, 4));
  const ov = await A.getOverviewImpl(QA_USER);
  check("overview spendable = deposit + bonus_available", Math.abs(ov.account!.spendable - (b2.deposit + b2.avail)) < 0.005, { spendable: ov.account!.spendable, recentDeposits: ov.recentDeposits.length });

  // 9. refunds → reverse both credited deposits (zero the test balance)
  const wr1 = await webhook({ event: "refund.processed", payload: { refund: { entity: { id: `rfnd_T1${Date.now()}`, payment_id: payId, amount: 2500, currency: "USD" } } } });
  const wr1dup = await webhook({ event: "refund.processed", payload: { refund: { entity: { id: `rfnd_T1${Date.now()}`, payment_id: payId, amount: 2500, currency: "USD" } } } });
  const wr2 = await webhook({ event: "refund.processed", payload: { refund: { entity: { id: `rfnd_T2${Date.now()}`, payment_id: pay3, amount: 1000, currency: "USD" } } } });
  const b3 = (await balances())!;
  check("refund → reversed (deposit 1)", wr1.body?.action === "reversed", wr1.body);
  check("second refund on same payment → noop/handled", wr1dup.body?.action?.startsWith("noop") || wr1dup.body?.action?.startsWith("reverse_failed") || wr1dup.body?.action === "ignored_never_credited", wr1dup.body);
  check("refund → reversed (deposit 2)", wr2.body?.action === "reversed", wr2.body);
  check("balances back to zero after reversals", Math.abs(b3.deposit) < 0.005, b3);

  // 10. campaign action on unknown id surfaces MKT error cleanly
  const ca = await A.campaignActionImpl(QA_USER, "00000000-0000-0000-0000-000000000000", "pause").then(() => "ok").catch((e) => (e instanceof Error ? e.message : String(e)));
  check("campaignAction on unknown campaign errors (no crash)", ca !== "ok", ca);

  // 11. reconciliation
  const rec = await mktRpc("mkt_reconciliation", {});
  check("mkt_reconciliation clean", Array.isArray(rec["campaigns"]) && rec["campaigns"].length === 0 && Array.isArray(rec["advertisers"]) && rec["advertisers"].length === 0, rec);
  const unexpectedEvents = await webhook({ event: "something.else", payload: {} });
  check("unknown event ignored", unexpectedEvents.body?.action === "ignored_event");
} finally {
  await mktDb.from("marketplace_settings").update({ deposits_enabled: depositsWere }).eq("id", true);
  log.push(`deposits_enabled restored to ${depositsWere}`);
}

const final = await balances();
console.log(log.join("\n"));
console.log(`\nfinal QA advertiser: ${JSON.stringify(final)}`);
console.log(`\n${fails === 0 ? "ALL PASSED" : fails + " FAILED"}`);
process.exit(fails === 0 ? 0 : 1);