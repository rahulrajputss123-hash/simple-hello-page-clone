import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, Plus, Receipt, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/States";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MIN_WITHDRAWAL, formatDateTime, formatMoney } from "@/lib/coinquest";
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

const methodSchema = z.object({
  type: z.enum(["upi", "paypal", "bank"]),
  label: z.string().trim().min(2, "Add a short label").max(60),
  holderName: z.string().trim().min(2, "Enter the account holder name").max(80),
  details: z.string().trim().min(4, "Enter valid payout details").max(200),
});

function WalletPage() {
  const { session, profile } = useAuth();
  const queryClient = useQueryClient();
  const withdraw = useServerFn(createWithdrawal);
  const cancel = useServerFn(cancelWithdrawal);
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  const [methodOpen, setMethodOpen] = useState(false);

  const balance = Number(profile?.wallet_balance ?? 0);
  const pending = Number(profile?.held_balance ?? 0);
  const lifetime = Number(profile?.lifetime_earned ?? 0);

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
    mutationFn: async (values: z.infer<typeof methodSchema>) => {
      const { error } = await supabase.from("payout_methods").insert({
        user_id: session!.user.id,
        method_type: values.type,
        label: values.label,
        holder_name: values.holderName,
        upi_id: values.type === "upi" ? values.details : null,
        account_number: values.type === "upi" ? null : values.details,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout method saved.");
      setMethodOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["payout-methods"] });
    },
    onError: () => toast.error("Couldn't save that payout method."),
  });

  const requestWithdrawal = useMutation({
    mutationFn: () =>
      withdraw({ data: { amount: Number(amount), payoutMethodId: methodId } }),
    onSuccess: () => {
      toast.success("Withdrawal requested — we'll review it shortly.");
      setAmount("");
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
    <AppShell subtitle="Wallet">
      <section className="rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <p className="text-sm opacity-80">Available balance</p>
        <p className="text-amount mt-1 text-4xl">{formatMoney(balance)}</p>
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
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const parsed = methodSchema.safeParse({
                    type: String(form.get("type")),
                    label: String(form.get("label")),
                    holderName: String(form.get("holderName")),
                    details: String(form.get("details")),
                  });
                  if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? "Check your details.");
                    return;
                  }
                  addMethod.mutate(parsed.data);
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                  >
                    <option value="upi">UPI</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank">Bank transfer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" name="label" maxLength={60} placeholder="My UPI" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="holderName">Account holder</Label>
                  <Input id="holderName" name="holderName" maxLength={80} placeholder="Full name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="details">UPI ID / account number</Label>
                  <Input id="details" name="details" maxLength={200} placeholder="name@bank" />
                </div>
                <DialogFooter>
                  <Button type="submit" variant="jade" disabled={addMethod.isPending}>
                    Save method
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="surface-card space-y-3 p-4">
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
        <div className="space-y-1.5">
          <Label>Payout method</Label>
          <Select value={methodId} onValueChange={setMethodId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a method" />
            </SelectTrigger>
            <SelectContent>
              {(methods.data ?? []).map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.label} · {method.method_type.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="gold"
          className="w-full gap-2"
          disabled={!canWithdraw || requestWithdrawal.isPending}
          onClick={() => requestWithdrawal.mutate()}
        >
          <ArrowDownToLine className="size-4" /> Request withdrawal
        </Button>
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
                <p className="text-xs text-muted-foreground">{formatDateTime(request.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize">
                  {request.status}
                </span>
                {request.status === "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => cancelRequest.mutate(request.id)}>
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
        <ul className="space-y-2">
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
