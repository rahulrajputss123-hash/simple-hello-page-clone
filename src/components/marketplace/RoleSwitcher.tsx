import { Megaphone, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { BecomeAdvertiserDialog } from "@/components/marketplace/BecomeAdvertiserDialog";
import { clearAdvertiserIntent, hasAdvertiserIntent } from "@/lib/marketplace/intent";
import { useRole } from "@/lib/marketplace/role";

/** Segmented mode switcher shown at the top of the Home content. */
export function RoleSwitcher() {
  const { role, setRole, advertiserActivated, marketplaceAvailable, overviewLoading } = useRole();
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

  const handleAdvertise = () => {
    if (advertiserActivated) {
      setRole("advertiser");
    } else if (marketplaceAvailable && !overviewLoading) {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <div
        data-testid="role-switcher"
        role="radiogroup"
        aria-label="Switch mode"
        className="relative flex h-10 w-full rounded-full border border-border bg-background-alt p-1 shadow-none"
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full shadow-soft transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            isAdvertiser ? "translate-x-full bg-sky-600" : "bg-primary"
          }`}
        />
        <button
          type="button"
          role="radio"
          aria-checked={!isAdvertiser}
          data-testid="role-option-publisher"
          className={`relative z-10 flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold leading-none transition-colors active:scale-[0.99] ${
            isAdvertiser ? "text-muted-foreground" : "text-primary-foreground"
          }`}
          onClick={() => setRole("publisher")}
        >
          <Wallet aria-hidden="true" className="size-4" />
          Earn
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={isAdvertiser}
          aria-disabled={!advertiserActivated && !marketplaceAvailable}
          data-testid="role-option-advertiser"
          disabled={!advertiserActivated && !marketplaceAvailable}
          className={`relative z-10 flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold leading-none transition-colors active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
            isAdvertiser ? "text-white" : "text-muted-foreground"
          }`}
          onClick={handleAdvertise}
        >
          <Megaphone aria-hidden="true" className="size-4" />
          <span>Advertise</span>
          {!advertiserActivated && !marketplaceAvailable && (
            <span className="text-[10px] font-medium uppercase tracking-wide">Soon</span>
          )}
        </button>
      </div>
      {dialogOpen && <BecomeAdvertiserDialog open onOpenChange={setDialogOpen} />}
    </>
  );
}