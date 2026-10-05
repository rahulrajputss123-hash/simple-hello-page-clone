import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BecomeAdvertiserDialog } from "@/components/marketplace/BecomeAdvertiserDialog";
import { useRole } from "@/lib/marketplace/role";

/** "🟢 Publisher ▾" chip in the Home header. */
export function RoleSwitcher() {
  const { role, setRole, advertiserActivated, marketplaceAvailable, overviewLoading } = useRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAdvertiser = role === "advertiser";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-testid="role-switcher"
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset transition-colors ${
            isAdvertiser
              ? "bg-sky-500/10 text-sky-700 ring-sky-500/30"
              : "bg-mint/15 text-primary ring-mint/30"
          }`}
        >
          <span aria-hidden>{isAdvertiser ? "🔵" : "🟢"}</span>
          {isAdvertiser ? "Advertiser" : "Publisher"}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 rounded-2xl p-1.5">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Switch mode
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="rounded-xl py-2.5"
            data-testid="role-option-publisher"
            onSelect={() => setRole("publisher")}
          >
            <span className="mr-2" aria-hidden>
              🟢
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">Publisher</span>
              <span className="text-xs text-muted-foreground">Earn & complete tasks</span>
            </span>
            {!isAdvertiser && <span className="ml-auto text-xs text-primary">Current</span>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {advertiserActivated ? (
            <DropdownMenuItem
              className="rounded-xl py-2.5"
              data-testid="role-option-advertiser"
              onSelect={() => setRole("advertiser")}
            >
              <span className="mr-2" aria-hidden>
                🔵
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">Advertiser</span>
                <span className="text-xs text-muted-foreground">Create & manage campaigns</span>
              </span>
              {isAdvertiser && <span className="ml-auto text-xs text-sky-700">Current</span>}
            </DropdownMenuItem>
          ) : (
            <div className="px-2 py-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden>🔵</span> Advertiser
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {marketplaceAvailable
                  ? "Create campaigns that CashGPT members complete for you."
                  : "Advertiser mode isn't available yet. Check back soon."}
              </p>
              <button
                type="button"
                data-testid="become-advertiser-btn"
                disabled={!marketplaceAvailable || overviewLoading}
                className="mt-2 w-full rounded-xl bg-jade-gradient px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft active:scale-[0.98] disabled:opacity-50"
                onClick={() => setDialogOpen(true)}
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