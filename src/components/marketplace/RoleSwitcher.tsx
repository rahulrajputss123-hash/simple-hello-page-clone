import { Check, ChevronDown, Megaphone, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BecomeAdvertiserDialog } from "@/components/marketplace/BecomeAdvertiserDialog";
import { clearAdvertiserIntent, hasAdvertiserIntent } from "@/lib/marketplace/intent";
import { useRole } from "@/lib/marketplace/role";

/** Compact mode chip and dropdown mode switcher in the Home header. */
export function RoleSwitcher() {
  const { role, setRole, advertiserActivated, marketplaceAvailable, overviewLoading } = useRole();
  const [menuOpen, setMenuOpen] = useState(false);
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
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          data-testid="role-switcher"
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold shadow-soft transition-colors active:scale-95 ${
            isAdvertiser
              ? "border-sky-500/30 bg-sky-500/10 text-sky-700"
              : "border-primary/25 bg-primary/10 text-primary"
          }`}
          aria-label={isAdvertiser ? "Advertise mode" : "Earn mode"}
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${isAdvertiser ? "bg-sky-500" : "bg-primary"}`}
          />
          {isAdvertiser ? "Advertise" : "Earn"}
          <ChevronDown
            aria-hidden
            className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-64 rounded-2xl border p-1.5 shadow-lift">
          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-medium text-muted-foreground">
            Switch mode
          </DropdownMenuLabel>
          <DropdownMenuItem
            data-testid="role-option-publisher"
            className={`rounded-xl p-2.5 ${!isAdvertiser ? "bg-primary/10" : ""}`}
            onSelect={() => setRole("publisher")}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Wallet aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold">Earn</span>
              <span className="text-xs text-muted-foreground">Complete tasks &amp; withdraw</span>
            </span>
            {!isAdvertiser && <Check aria-label="Current mode" />}
          </DropdownMenuItem>
          {advertiserActivated ? (
            <DropdownMenuItem
              data-testid="role-option-advertiser"
              className={`rounded-xl p-2.5 ${isAdvertiser ? "bg-sky-500/10" : ""}`}
              onSelect={() => setRole("advertiser")}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-700">
                <Megaphone aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">Advertise</span>
                <span className="text-xs text-muted-foreground">Create &amp; manage campaigns</span>
              </span>
              {isAdvertiser && <Check aria-label="Current mode" />}
            </DropdownMenuItem>
          ) : (
            <div className="rounded-xl p-2.5">
              <div className="flex items-center gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-700">
                  <Megaphone aria-hidden />
                </span>
                <span className="font-semibold">Advertise</span>
              </div>
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
                  setMenuOpen(false);
                  setDialogOpen(true);
                }}
              >
                Become an Advertiser
              </button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogOpen && <BecomeAdvertiserDialog open onOpenChange={setDialogOpen} />}
    </>
  );
}
