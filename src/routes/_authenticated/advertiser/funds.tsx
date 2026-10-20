import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  ShieldCheck,
  Wallet,
  XCircle,
  Coins,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackLink, formatShortDate } from "@/components/marketplace/Preview";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import {
  abandonDeposit,
  confirmCheckout,
  createDeposit,
  createNowpaymentsDeposit,
  createQropayDeposit,
  getDepositStatus,
} from "@/lib/marketplace.functions";
import type { DepositView } from "@/lib/marketplace/advertiser.server";
import { loadRazorpayCheckout, openRazorpayCheckout } from "@/lib/marketplace/razorpay-checkout";
import { useRole } from "@/lib/marketplace/role";

export const Route = createFileRoute("/_authenticated/advertiser/funds")({
  head: () => ({ meta: [{ title: "Add Campaign Funds — CashGPT" }] }),
  component: FundsPage,
});

const PRESETS = [10, 25, 50, 100];

/**
 * Deposit flow (Phase 2):
 *   1. createDeposit → server inserts the deposit (status created → pending) and
 *      creates a Razorpay order. No money moves.
 *   2. Razorpay Checkout opens in the browser.
 *   3. On success the browser calls confirmCheckout → server verifies the
 *      checkout signature and records the payment id. Still no money moves.
 *   4. Razorpay's `payment.captured` webhook hits /api/public/razorpay-webhook →
 *      mkt_credit_deposit. THAT is the only step that credits the balance.
 *   5. This screen polls getDepositStatus until succeeded / failed.
 * 
 * NOWPayments flow:
 *   1. createNowpaymentsDeposit → server creates invoice, redirects to invoice_url
 *   2. User pays on NOWPayments site
 *   3. IPN webhook credits via mkt_credit_deposit
 *   4. Poll status when returning from invoice
 */
type Stage =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "checkout"; depositId: string }
  | { kind: "crypto_redirect"; depositId: string }
  | { kind: "confirming"; depositId: string; amountUsd: number }
  | { kind: "succeeded"; amountUsd: number }
  | { kind: "failed"; reason: string };

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/^[A-Z_]+: /, "");
}

function FundsPage() {
  const { session, profile, isAdmin } = useAuth();
  const { overview, refreshOverview, advertiserActivated, overviewLoading } = useRole();
  const settings = overview?.settings;
  const account = overview?.account;
  const router = useRouter();

  const create = useServerFn(createDeposit);
  const createCrypto = useServerFn(createNowpaymentsDeposit);
  const createQropay = useServerFn(createQropayDeposit);
  const confirm = useServerFn(confirmCheckout);
  const abandon = useServerFn(abandonDeposit);
  const status = useServerFn(getDepositStatus);

  const [amount, setAmount] = useState("50");
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStarted = useRef<number>(0);

  const recent = useQuery({
    queryKey: ["advertiser-deposits-recent", session?.user.id, overview?.recentDeposits.length],
    queryFn: async () => overview?.recentDeposits ?? [],
    enabled: Boolean(overview),
  });

  // Handle return from NOWPayments (deposit query param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const depositId = params.get("deposit");
    if (depositId && stage.kind === "idle") {
      setStage({ kind: "confirming", depositId, amountUsd: Number(amount) || 0 });
    }
  }, [amount, stage.kind]);

  // Poll for the webhook outcome while "confirming".
  useEffect(() => {
    if (stage.kind !== "confirming") return;
    pollStarted.current = Date.now();
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const d: DepositView | null = await status({ data: { depositId: stage.depositId } });
        if (d?.status === "succeeded") {
          await refreshOverview();
          setStage({ kind: "succeeded", amountUsd: d.amountUsd });
          toast.success(`${formatMoney(d.amountUsd)} added to your Campaign Balance`);
          return;
        }
        if (d?.status === "failed" || d?.status === "reversed") {
          setStage({ kind: "failed", reason: d.failureReason ?? "The payment didn't go through." });
          return;
        }
      } catch {
        /* keep polling */
      }
      // Give the webhook up to 3 minutes, then let the user leave; the balance
      // will update on its own when the webhook lands.
      const delay = Date.now() - pollStarted.current < 30_000 ? 2000 : 5000;
      if (Date.now() - pollStarted.current < 180_000) pollTimer.current = setTimeout(tick, delay);
    };
    void tick();
    return () => {
      cancelled = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [stage, status, refreshOverview]);

  const deposit = useMutation({
    mutationFn: async (amountUsd: number) => {
      setStage({ kind: "creating" });
      await loadRazorpayCheckout();
      const order = await create({ data: { amountUsd } });
      setStage({ kind: "checkout", depositId: order.depositId });
      return order;
    },
    onSuccess: (order) => {
      const instance = openRazorpayCheckout({
        key: order.keyId,
        amount: order.amountMinor,
        currency: order.currency,
        name: "CashGPT",
        description: `Campaign deposit ${formatMoney(order.amountUsd)}`,
        order_id: order.orderId,
        prefill: { name: profile?.name ?? undefined, email: session?.user.email ?? undefined },
        notes: { deposit_id: order.depositId },
        theme: { color: "#0f7a4f" },
        retry: { enabled: false },
        handler: (resp) => {
          setStage({ kind: "confirming", depositId: order.depositId, amountUsd: order.amountUsd });
          void confirm({
            data: {
              depositId: order.depositId,
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            },
          }).catch((err) => {
            // Signature mismatch etc. The webhook is still the source of truth,
            // so keep polling — but tell the user something looked off.
            toast.error("Couldn't verify the payment response", {
              description: friendlyError(err),
            });
          });
        },
        modal: {
          ondismiss: () => {
            setStage((s) => {
              if (s.kind !== "checkout") return s;
              void abandon({ data: { depositId: order.depositId, reason: "checkout_dismissed" } });
              return { kind: "idle" };
            });
          },
        },
      });
      instance.on("payment.failed", (resp) => {
        setStage({ kind: "failed", reason: resp.error?.description ?? "Payment failed" });
      });
    },
    onError: (err) => {
      setStage({ kind: "idle" });
      toast.error("Couldn't start the deposit", { description: friendlyError(err) });
    },
  });

  const depositCrypto = useMutation({
    mutationFn: async (amountUsd: number) => {
      setStage({ kind: "creating" });
      const result = await createCrypto({ data: { amountUsd } });
      setStage({ kind: "crypto_redirect", depositId: result.depositId });
      return result;
    },
    onSuccess: (result) => {
      // Redirect to NOWPayments invoice
      window.location.href = result.invoiceUrl;
    },
    onError: (err) => {
      setStage({ kind: "idle" });
      toast.error("Couldn't start the crypto deposit", { description: friendlyError(err) });
    },
  });

  const depositQropay = useMutation({
    mutationFn: async (amountUsd: number) => {
      setStage({ kind: "creating" });
      const result = await createQropay({ data: { amountUsd } });
      setStage({ kind: "crypto_redirect", depositId: result.depositId });
      return result;
    },
    onSuccess: (result) => {
      // Redirect to QroPay payment page
      window.location.href = result.paymentUrl;
    },
    onError: (err) => {
      setStage({ kind: "idle" });
      toast.error("Couldn't start the UPI deposit", { description: friendlyError(err) });
    },
  });

  const n = Number(amount) || 0;
  // Admin minimum is $0.10, others use marketplace setting
  const min = isAdmin ? 0.10 : (settings?.minDepositUsd ?? 10);
  const max = settings?.maxDepositUsd ?? 1000;
  const inRange = n >= min && n <= max;

  // Check which gateways are usable
  const hasInrRate = settings?.inrPerUsd != null && settings.inrPerUsd > 0;
  const razorpayUsable = settings?.depositsEnabled && settings?.razorpayConfigured && hasInrRate;
  const nowpaymentsUsable = settings?.depositsEnabled && settings?.nowpaymentsConfigured;
  const qropayUsable = settings?.depositsEnabled && settings?.qropayConfigured && hasInrRate;
  const anyGatewayUsable = razorpayUsable || nowpaymentsUsable || qropayUsable;

  // Generic disabled reason (applies when no gateway is available)
  const genericDisabledReason = !advertiserActivated
    ? "Activate advertiser mode first."
    : account && account.status !== "active"
      ? `Your account is ${account.status}.`
      : settings && !settings.depositsEnabled
        ? "Deposits are temporarily unavailable."
        : !anyGatewayUsable
          ? "No payment gateways are configured."
          : null;

  // Razorpay-specific disabled reason
  const razorpayDisabledReason = genericDisabledReason || !razorpayUsable
    ? genericDisabledReason || "Razorpay is not configured."
    : null;

  // NOWPayments-specific disabled reason
  const cryptoDisabledReason = genericDisabledReason || !nowpaymentsUsable
    ? genericDisabledReason || "Crypto payments aren't configured yet."
    : null;

  // QroPay-specific disabled reason
  const qropayDisabledReason = genericDisabledReason || !qropayUsable
    ? genericDisabledReason || "QroPay UPI is not configured."

    : null;

  const busy =
    stage.kind === "creating" ||
    stage.kind === "checkout" ||
    stage.kind === "crypto_redirect" ||
    stage.kind === "confirming";

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Wallet}
        iconSrc="/icons/icon-wallet.webp"
        title="Add Campaign Funds"
        subtitle="Top up the balance your campaigns spend from."
        className="mb-2"
      />

      <div className="surface-card mt-3 flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">Available Campaign Balance</p>
          <p className="text-amount text-2xl" data-testid="funds-balance">
            {overviewLoading ? "…" : formatMoney(account?.spendable ?? 0)}
          </p>
          {account && account.bonusLocked > 0 && (
            <p className="text-[11px] text-muted-foreground">
              + {formatMoney(account.bonusLocked)} bonus unlocks as you spend
            </p>
          )}
        </div>
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10">
          <CreditCard className="size-5 text-primary" />
        </span>
      </div>

      {stage.kind === "confirming" && (
        <div
          className="surface-card mt-3 flex items-center gap-3 p-4"
          data-testid="deposit-confirming"
        >
          <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
          <div className="text-sm">
            <p className="font-semibold">Payment received — confirming with Razorpay</p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(stage.amountUsd)} will appear in your balance as soon as the gateway
              confirms it (usually seconds). You can leave this page.
            </p>
          </div>
        </div>
      )}
      {stage.kind === "succeeded" && (
        <div
          className="mt-3 flex items-center gap-3 rounded-2xl bg-mint/15 p-4"
          data-testid="deposit-success"
        >
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
          <p className="text-sm font-semibold text-primary">
            {formatMoney(stage.amountUsd)} added to your Campaign Balance.
          </p>
        </div>
      )}
      {stage.kind === "failed" && (
        <div
          className="mt-3 flex items-center gap-3 rounded-2xl bg-destructive/10 p-4"
          data-testid="deposit-failed"
        >
          <XCircle className="size-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-semibold text-destructive">Payment didn't go through</p>
            <p className="text-xs text-muted-foreground">
              {stage.reason} You haven't been charged.
            </p>
          </div>
        </div>
      )}

      <form
        className="surface-card mt-3 space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (razorpayDisabledReason || !inRange || busy) return;
          deposit.mutate(Math.round(n * 100) / 100);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="fund-amount">Amount (USD)</Label>
          <Input
            id="fund-amount"
            type="number"
            min={min}
            max={max}
            step={1}
            inputMode="decimal"
            value={amount}
            disabled={busy}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Min {formatMoney(min)} · Max {formatMoney(max)}
            {settings?.inrPerUsd
              ? ` · Charged in INR at ₹${settings.inrPerUsd.toFixed(2)}/$ (${n > 0 ? `≈ ₹${(n * settings.inrPerUsd).toFixed(0)}` : ""})`
              : ""}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={busy}
              onClick={() => setAmount(String(p))}
              className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
                amount === String(p)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        {settings?.promoActive && account && account.lifetimeDeposited === 0 && (
          <p className="rounded-xl bg-gold/10 p-3 text-xs font-semibold text-gold-dark">
            🎁 Launch offer: your first deposit gets a{" "}
            {overview?.userBonusPercent ?? settings.firstDepositBonusPercent}% bonus that unlocks as
            you spend.
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Campaign Funds are spent only when a publisher completes your task. Unused funds stay in
          your Campaign Balance.
        </p>
        {genericDisabledReason && !anyGatewayUsable ? (
          <p className="text-xs font-semibold text-destructive">{genericDisabledReason}</p>
        ) : null}

        {razorpayUsable && (
          <>
            <Button
              type="submit"
              variant="jade"
              size="lg"
              className="w-full"
              disabled={Boolean(razorpayDisabledReason) || !inRange || busy}
              data-testid="add-funds-submit"
            >
              {stage.kind === "creating" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Preparing payment…
                </>
              ) : stage.kind === "checkout" ? (
                "Complete payment in the Razorpay window"
              ) : (
                `Pay ${formatMoney(n)} with Razorpay`
              )}
            </Button>
            <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="size-3" /> Secured by Razorpay · UPI, cards, net banking,
              wallets
            </p>
          </>
        )}

        {razorpayUsable && nowpaymentsUsable && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
        )}

        {nowpaymentsUsable && (
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={Boolean(cryptoDisabledReason) || !inRange || busy}
              onClick={() => {
                if (cryptoDisabledReason || !inRange || busy) return;
                depositCrypto.mutate(Math.round(n * 100) / 100);
              }}
            >
              {stage.kind === "crypto_redirect" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Redirecting to invoice…
                </>
              ) : (
                <>
                  <Coins className="size-4" /> Pay {formatMoney(n)} with crypto
                </>
              )}
            </Button>
            <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="size-3" /> Secured by NOWPayments · BTC, ETH, USDT, and 200+
              coins
            </p>
          </>
        )}

        {qropayUsable && (
          <>
            {(razorpayUsable || nowpaymentsUsable) && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={Boolean(qropayDisabledReason) || !inRange || busy}
              onClick={() => {
                if (qropayDisabledReason || !inRange || busy) return;
                depositQropay.mutate(Math.round(n * 100) / 100);
              }}
            >
              {stage.kind === "crypto_redirect" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Redirecting…
                </>
              ) : (
                <>
                  <Wallet className="size-4" /> Pay {formatMoney(n)} with UPI (QroPay)
                </>
              )}
            </Button>
            <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="size-3" /> Secured by QroPay · UPI payments in INR
            </p>
          </>
        )}
      </form>

      {(recent.data?.length ?? 0) > 0 && (
        <>
          <SectionHeading
            variant="ribbon"
            icon={Clock}
            iconSrc="/icons/icon-deposit-refund.webp"
            title="Recent deposits"
          />
          <ul className="surface-card divide-y divide-border" data-testid="recent-deposits">
            {recent.data!.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-3.5 text-sm">
                <div>
                  <p className="font-semibold">{formatMoney(d.amountUsd)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(d.createdAt)}
                    {d.chargeCurrency !== "USD"
                      ? ` · ${d.chargeCurrency} ${d.chargeAmount.toFixed(2)}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                    d.status === "succeeded"
                      ? "bg-mint/20 text-primary"
                      : d.status === "pending"
                        ? "bg-gold/15 text-gold-dark"
                        : "bg-background-alt text-muted-foreground"
                  }`}
                >
                  {d.status === "succeeded" ? "Credited" : d.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppShell>
  );
}
