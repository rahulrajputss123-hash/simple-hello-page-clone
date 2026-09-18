import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, Check, Plus, Receipt, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/States";
import { SuccessBurst } from "@/components/SuccessBurst";
import { useCountUp } from "@/hooks/useCountUp";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MIN_WITHDRAWAL, formatDateTime, formatMoney } from "@/lib/coinquest";
import {
  maskPayoutMethod,
  PAYOUT_METHODS,
  payoutMethodLabel,
  payoutMethodSpec,
  type PayoutFieldName,
  type PayoutMethodType,
} from "@/lib/payout-methods";
import { cancelWithdrawal, createWithdrawal } from "@/lib/coinquest.functions";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — CashGPT" },
      { name: "description", content: "Track your balance, transactions and withdrawals." },
      { property: "og:title", content: "Wallet — CashGPT" },
      { property: "og:description", content: "Track your balance, transactions and withdrawals." },
    ],
  }),
  component: WalletPage,
});

/** Loose email check for the gift-card / PayPal fields. */
function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type DraftFields = Partial<Record<PayoutFieldName, string>>;

function WalletPage() {
  const { session, profile } = useAuth();
  const queryClient = useQueryClient();
  const withdraw = useServerFn(createWithdrawal);
  const cancel = useServerFn(cancelWithdrawal);
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  const [methodOpen, setMethodOpen] = useState(false);
  /** Bumped on a successful withdrawal to replay the one-shot burst. Display-only. */
  const [burstKey, setBurstKey] = useState(0);
  // Add-payout-method draft state.
  const [draftType, setDraftType] = useState<PayoutMethodType>("upi");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftFields, setDraftFields] = useState<DraftFields>({});

  const balance = Number(profile?.wallet_balance ?? 0);
  const pending = Number(profile?.held_balance ?? 0);
  const lifetime = Number(profile?.lifetime_earned ?? 0);
  // Display-only count-up for the headline balance.
  const shownBalance = useCountUp(balance);

  const transactions = useQuery({
    queryKey: ["transactions", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const methods = useQuery({
    queryKey: ["payout-methods", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase.from("payout_methods").select("*");
      return data ?? [];
    },
  });

  const withdrawals = useQuery({
    queryKey: ["withdrawals", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const addMethod = useMutation({
    mutationFn: async (values: { type: PayoutMethodType; label: string; fields: DraftFields }) => {
      const trimmed = (name: PayoutFieldName) => values.fields[name]?.trim() || null;
      const { error } = await supabase.from("payout_methods").insert({
        user_id: session!.user.id,
        method_type: values.type,
        label: values.label.trim() || payoutMethodLabel(values.type),
        holder_name: trimmed("holder_name"),
        upi_id: trimmed("upi_id"),
        paypal_email: trimmed("paypal_email"),
        account_number: trimmed("account_number"),
        country_bank_code: trimmed("country_bank_code"),
        bank_name: trimmed("bank_name"),
        country: trimmed("country"),
        gift_card_recipient_email: trimmed("gift_card_recipient_email"),
        wallet_address: trimmed("wallet_address"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout method saved.");
      setMethodOpen(false);
      setDraftFields({});
      setDraftLabel("");
      void queryClient.invalidateQueries({ queryKey: ["payout-methods"] });
    },
    onError: () => toast.error("Couldn't save that payout method."),
  });

  const requestWithdrawal = useMutation({
    mutationFn: () => withdraw({ data: { amount: Number(amount), payoutMethodId: methodId } }),
    onSuccess: () => {
      toast.success("Withdrawal requested — we'll review it shortly.");
      setAmount("");
      setBurstKey((key) => key + 1);
      window.setTimeout(() => setBurstKey(0), 900);
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Withdrawal failed."),
  });

  const cancelRequest = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => {
      toast.success("Request cancelled and funds returned.");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't cancel that request."),
  });

  const canWithdraw =
    Number(amount) >= MIN_WITHDRAWAL && Number(amount) <= balance - pending && Boolean(methodId);

  return (
    <AppShell subtitle="Wallet" mainClass="page-fade-in">
      <section className="wallet-balance-glow rounded-3xl bg-jade-gradient p-5 text-primary-foreground">
        <p className="text-sm opacity-80">Available balance</p>
        <p className="text-amount mt-1 text-4xl">{formatMoney(shownBalance)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-primary-foreground/10 px-3 py-2">
            <p className="opacity-75">Pending</p>
            <p className="text-amount">{formatMoney(pending)}</p>
          </div>
          <div className="rounded-2xl bg-primary-foreground/10 px-3 py-2">
            <p className="opacity-75">Lifetime</p>
            <p className="text-amount">{formatMoney(lifetime)}</p>
          </div>
        </div>
      </section>

      <div className="surface-card mt-4 flex items-start gap-3 p-4">
        <ShieldCheck className="mt-0.5 size-5 text-primary" />
        <div>
          <p className="font-semibold">Manual payout review</p>
          <p className="text-xs text-muted-foreground">
            Every withdrawal is reviewed by our team, usually within 48 hours.
          </p>
        </div>
      </div>

      <SectionHeading
        icon={Wallet}
        iconSrc="/icons/icon-wallet.png"
        title="Withdraw"
        action={
          <Dialog open={methodOpen} onOpenChange={setMethodOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="size-3.5" /> Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add payout method</DialogTitle>
                <DialogDescription>Where should we send your money?</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const spec = payoutMethodSpec(draftType);
                  if (!spec?.available) {
                    toast.error("Choose an available payout method.");
                    return;
                  }
                  const missing = spec.fields.find((f) => !(draftFields[f.name] ?? "").trim());
                  if (missing) {
                    toast.error(`${missing.label} is required.`);
                    return;
                  }
                  const emailField = spec.fields.find(
                    (f) => f.inputType === "email" && !isEmail(draftFields[f.name] ?? ""),
                  );
                  if (emailField) {
                    toast.error(`Enter a valid ${emailField.label.toLowerCase()}.`);
                    return;
                  }
                  addMethod.mutate({ type: spec.type, label: draftLabel, fields: draftFields });
                }}
              >
                {/* Card-based method picker (replaces the old dropdown). */}
                <div className="space-y-2">
                  <Label>Payout method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYOUT_METHODS.map((spec) => {
                      const selected = draftType === spec.type;
                      return (
                        <button
                          key={spec.type}
                          type="button"
                          aria-pressed={selected}
                          aria-disabled={!spec.available}
                          data-testid={`payout-method-${spec.type}`}
                          onClick={() => {
                            if (!spec.available) {
                              toast.info(spec.comingSoonMessage ?? `${spec.label} is coming soon.`);
                              return;
                            }
                            setDraftType(spec.type);
                            setDraftFields({});
                          }}
                          className={`relative flex items-start gap-2 rounded-2xl border p-2.5 text-left transition-all ${
                            !spec.available
                              ? "cursor-not-allowed border-border bg-background-alt opacity-70"
                              : selected
                                ? "border-primary bg-primary/5 shadow-soft"
                                : "border-border bg-card hover:border-primary/40"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${spec.iconClass}`}
                          >
                            {spec.monogram}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold leading-tight">
                              {spec.label}
                            </span>
                            <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">
                              {spec.tagline}
                            </span>
                          </span>
                          {selected && spec.available && (
                            <Check
                              className="absolute right-2 top-2 size-3.5 text-primary"
                              aria-hidden
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    maxLength={60}
                    placeholder="e.g. My main account"
                  />
                </div>

                {/* Type-specific fields. */}
                {(payoutMethodSpec(draftType)?.fields ?? []).map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={`field-${field.name}`}>{field.label}</Label>
                    <Input
                      id={`field-${field.name}`}
                      type={field.inputType ?? "text"}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      value={draftFields[field.name] ?? ""}
                      onChange={(e) =>
                        setDraftFields((current) => ({ ...current, [field.name]: e.target.value }))
                      }
                      data-testid={`payout-field-${field.name}`}
                    />
                  </div>
                ))}

                <DialogFooter>
                  <Button
                    type="submit"
                    variant="jade"
                    disabled={addMethod.isPending}
                    data-testid="payout-save-method"
                  >
                    Save method
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="surface-card relative space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (min {formatMoney(MIN_WITHDRAWAL)})</Label>
          <Input
            id="amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="5.00"
          />
        </div>

        {/* Saved methods first — pick one without re-entering details. */}
        {(methods.data ?? []).length > 0 && (
          <div className="space-y-1.5">
            <Label>Saved payout methods</Label>
            <ul className="grid gap-2" data-testid="wallet-saved-methods">
              {(methods.data ?? []).map((method) => {
                const spec = payoutMethodSpec(method.method_type);
                const selected = methodId === method.id;
                return (
                  <li key={method.id}>
                    <button
                      type="button"
                      onClick={() => setMethodId(method.id)}
                      aria-pressed={selected}
                      data-testid={`wallet-saved-method-${method.id}`}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-soft"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                          spec?.iconClass ?? "bg-background-alt text-muted-foreground"
                        }`}
                      >
                        {spec?.monogram ?? "?"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {method.label || payoutMethodLabel(method.method_type)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {payoutMethodLabel(method.method_type)} ·{" "}
                          {maskPayoutMethod(method) || "No details"}
                        </span>
                      </span>
                      {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Button
          variant="gold"
          className="w-full gap-2"
          disabled={!canWithdraw || requestWithdrawal.isPending}
          onClick={() => requestWithdrawal.mutate()}
          data-testid="wallet-request-withdrawal"
        >
          <ArrowDownToLine className="size-4" /> Request withdrawal
        </Button>
        {!methods.data?.length && (
          <p className="text-center text-xs text-muted-foreground">
            Add a payout method above to withdraw.
          </p>
        )}
        {burstKey > 0 && <SuccessBurst key={burstKey} />}
      </div>

      <SectionHeading icon={ArrowDownToLine} title="Withdrawals" />
      {!withdrawals.data?.length ? (
        <EmptyState
          icon={ArrowDownToLine}
          title="No withdrawals yet"
          description={`Reach ${formatMoney(MIN_WITHDRAWAL)} to make your first cash-out.`}
        />
      ) : (
        <ul className="space-y-2">
          {withdrawals.data.map((request) => (
            <li key={request.id} className="surface-card flex items-center justify-between p-3">
              <div>
                <p className="text-amount">{formatMoney(request.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(request.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize">
                  {request.status}
                </span>
                {request.status === "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelRequest.mutate(request.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <SectionHeading icon={Receipt} title="Transactions" />
      {transactions.isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : !transactions.data?.length ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Watch an ad or finish a task to see your first credit here."
        />
      ) : (
        <ul className="stagger-fade-children space-y-2">
          {transactions.data.map((tx) => (
            <li key={tx.id} className="surface-card flex items-center justify-between p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{tx.description || tx.kind}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</p>
              </div>
              <span
                className={
                  Number(tx.amount) >= 0
                    ? "text-amount text-accent-foreground"
                    : "text-amount text-destructive"
                }
              >
                {Number(tx.amount) >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(Number(tx.amount)))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
