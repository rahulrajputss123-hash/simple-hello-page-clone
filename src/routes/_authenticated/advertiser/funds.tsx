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
  QrCode,
  ChevronRight,
  Lock,
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
  | { kind: "upi_redirect"; depositId: string }
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
      setStage({ kind: "upi_redirect", depositId: result.depositId });
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
    stage.kind === "upi_redirect" ||
    stage.kind === "confirming";

  // Detect if user is likely in India (client-side heuristic)
  const isLikelyIndia = (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const lang = navigator.language;
      return (
        tz === "Asia/Kolkata" ||
        tz === "Asia/Calcutta" ||
        lang.startsWith("en-IN") ||
        lang.startsWith("hi")
      );
    } catch {
      return false;
    }
  })();

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
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Choose payment method</p>
              {(() => {
                // Build payment methods array
                type PaymentMethod = {
                  id: string;
                  title: string;
                  subtitle: string;
                  badge?: string;
                  icon: React.ReactNode;
                  usable: boolean;
                  disabledReason: string | null;
                  loading: boolean;
                  loadingText: string;
                  onClick: () => void;
                  primary?: boolean;
                  recommended?: boolean;
                  testId?: string;
                  formSubmit?: boolean;
                };

                const inrAmount = settings?.inrPerUsd ? (n * settings.inrPerUsd).toFixed(0) : "0";

                let methods: PaymentMethod[] = [
                  {
                    id: "crypto",
                    title: `Pay ${formatMoney(n)} with Crypto`,
                    subtitle: "USDT · BTC · ETH · 200+ coins",
                    badge: "Worldwide",
                    icon: (
                      <div className="relative flex h-10 w-10 items-center justify-center">
                        {/* Overlapping coin icons */}
                        <div className="absolute left-0 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-[#26A17B]">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.84 0-2.27-1.72-2.96-3.65-3.35z"/>
                          </svg>
                        </div>
                        <div className="absolute left-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[#F7931A]">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
                            <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.065-.565-.13-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                          </svg>
                        </div>
                        <div className="absolute left-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#627EEA]">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
                            <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                          </svg>
                        </div>
                      </div>
                    ),
                    usable: nowpaymentsUsable,
                    disabledReason: cryptoDisabledReason,
                    loading: stage.kind === "crypto_redirect",
                    loadingText: "Redirecting to invoice…",
                    onClick: () => depositCrypto.mutate(Math.round(n * 100) / 100),
                    primary: true,
                  },
                  {
                    id: "upi",
                    title: `Pay ≈ ₹${inrAmount} with UPI`,
                    subtitle: "India only · GPay, PhonePe, Paytm",
                    badge: "🇮🇳 India",
                    icon: (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <QrCode className="h-5 w-5 text-primary" />
                      </div>
                    ),
                    usable: qropayUsable,
                    disabledReason: qropayDisabledReason,
                    loading: stage.kind === "upi_redirect",
                    loadingText: "Redirecting…",
                    onClick: () => depositQropay.mutate(Math.round(n * 100) / 100),
                    recommended: isLikelyIndia,
                  },
                  {
                    id: "razorpay",
                    title: `Pay ${formatMoney(n)} with Card / Netbanking`,
                    subtitle: "Cards · Netbanking · Wallets",
                    badge: undefined,
                    icon: (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                    ),
                    usable: razorpayUsable,
                    disabledReason: razorpayDisabledReason,
                    loading: stage.kind === "creating" || stage.kind === "checkout",
                    loadingText:
                      stage.kind === "creating"
                        ? "Preparing payment…"
                        : "Complete payment in the Razorpay window",
                    onClick: () => {},
                    testId: "add-funds-submit",
                    formSubmit: true,
                  },
                ];

                // Smart ordering: move UPI first if user is in India
                if (isLikelyIndia && methods.length >= 2) {
                  const [crypto, upi, ...rest] = methods;
                  methods = [upi, crypto, ...rest];
                }

                return methods.map((method) => {
                  const isDisabled =
                    Boolean(method.disabledReason) || !inRange || (busy && !method.loading);
                  const isPrimary = method.primary && !isLikelyIndia;

                  return (
                    <button
                      key={method.id}
                      type={method.formSubmit ? "submit" : "button"}
                      disabled={isDisabled}
                      onClick={method.formSubmit ? undefined : method.onClick}
                      data-testid={method.testId}
                      className={`group relative w-full min-h-[64px] rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                        isPrimary
                          ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20"
                          : "border-2 border-border bg-card shadow-sm hover:shadow-md"
                      } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="shrink-0">{method.icon}</div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`font-semibold leading-tight ${isPrimary ? "text-white" : "text-foreground"}`}
                            >
                              {method.loading ? method.loadingText : method.title}
                            </p>
                            {method.recommended && (
                              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gold-dark">
                                Recommended
                              </span>
                            )}
                            {method.badge && !method.recommended && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                                  isPrimary
                                    ? "bg-white/20 text-white"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {method.badge}
                              </span>
                            )}
                          </div>
                          {!method.loading && (
                            <p
                              className={`mt-0.5 text-xs leading-tight ${isPrimary ? "text-white/80" : "text-muted-foreground"}`}
                            >
                              {method.subtitle}
                            </p>
                          )}
                          {method.disabledReason && (
                            <p className="mt-1 text-xs text-destructive">
                              {method.disabledReason}
                            </p>
                          )}
                        </div>

                        {/* Right indicator */}
                        <div className="shrink-0">
                          {method.loading ? (
                            <Loader2
                              className={`h-5 w-5 animate-spin ${isPrimary ? "text-white" : "text-primary"}`}
                            />
                          ) : (
                            <ChevronRight
                              className={`h-5 w-5 ${isPrimary ? "text-white/60" : "text-muted-foreground"}`}
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>
                Secure payments · Powered by{" "}
                {[nowpaymentsUsable && "NOWPayments", qropayUsable && "QroPay"]
                  .filter(Boolean)
                  .join(" & ")}
              </span>
            </div>
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
