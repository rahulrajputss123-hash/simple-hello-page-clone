import { Check, ChevronDown, Megaphone, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BecomeAdvertiserDialog } from "@/components/marketplace/BecomeAdvertiserDialog";
import { clearAdvertiserIntent, hasAdvertiserIntent } from "@/lib/marketplace/intent";
import { useRole } from "@/lib/marketplace/role";

/** Compact mode chip and bottom-sheet mode switcher in the Home header. */
export function RoleSwitcher() {
  const { role, setRole, advertiserActivated, marketplaceAvailable, overviewLoading } = useRole();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAdvertiser = role === "advertiser";

  // Visitors who clicked "Start advertising" on the landing page land here after
  // signing in; open the activation dialog once, then forget the intent.
  useEffect(() => {
    if (overviewLoading || !hasAdvertiserIntent()) return;
    if (advertiserActivated) {
      clearAdvertiserIntent();
    } else if (marketplaceAvailable) {
      clearAdvertiserIntent();
      setDialogOpen(true);
    }
  }, [overviewLoading, advertiserActivated, marketplaceAvailable]);

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          data-testid="role-switcher"
          className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset transition-colors ${
            isAdvertiser
              ? "bg-sky-500/10 text-sky-700 ring-sky-500/30"
              : "bg-mint/15 text-primary ring-mint/30"
          }`}
          aria-label={isAdvertiser ? "Advertise mode" : "Earn mode"}
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${isAdvertiser ? "bg-sky-500" : "bg-jade"}`}
          />
          {isAdvertiser ? "Advertise" : "Earn"}
          <ChevronDown aria-hidden />
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-3xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="text-left">
            <SheetTitle>Switch mode</SheetTitle>
            <SheetDescription className="sr-only">
              Choose whether to earn or advertise.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              data-testid="role-option-publisher"
              className={`flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors ${
                !isAdvertiser ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
              onClick={() => {
                setRole("publisher");
                setSheetOpen(false);
              }}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint/20 text-primary">
                <Sparkles aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">Earn</span>
                <span className="text-xs text-muted-foreground">
                  Complete tasks, offers & withdraw
                </span>
              </span>
              {!isAdvertiser && <Check aria-label="Current mode" />}
            </button>
            {advertiserActivated ? (
              <button
                type="button"
                data-testid="role-option-advertiser"
                className={`flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors ${
                  isAdvertiser ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
                onClick={() => {
                  setRole("advertiser");
                  setSheetOpen(false);
                }}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-700">
                  <Megaphone aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">Advertise</span>
                  <span className="text-xs text-muted-foreground">Create & manage campaigns</span>
                </span>
                {isAdvertiser && <Check aria-label="Current mode" />}
              </button>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-700">
                    <Megaphone aria-hidden />
                  </span>
                  Advertise
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {marketplaceAvailable
                    ? "Create campaigns that CashGPT members complete for you."
                    : "Advertiser mode isn't available yet. Check back soon."}
                </p>
                <button
                  type="button"
                  data-testid="become-advertiser-btn"
                  disabled={!marketplaceAvailable || overviewLoading}
                  className="mt-3 w-full rounded-xl bg-jade-gradient px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft active:scale-[0.98] disabled:opacity-50"
                  onClick={() => {
                    setSheetOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  Become an Advertiser
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      {dialogOpen && <BecomeAdvertiserDialog open onOpenChange={setDialogOpen} />}
    </>
  );
}
