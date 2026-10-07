import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { becomeAdvertiser } from "@/lib/marketplace.functions";
import { useRole } from "@/lib/marketplace/role";

/**
 * "Become an Advertiser" — creates the advertiser account (Phase 1
 * advertiser_accounts row) and switches the app into advertiser mode.
 */
export function BecomeAdvertiserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile, session } = useAuth();
  const { setRole, refreshOverview, overview } = useRole();
  const activate = useServerFn(becomeAdvertiser);

  const [displayName, setDisplayName] = useState(profile?.name ?? "");
  const [contactEmail, setContactEmail] = useState(session?.user.email ?? "");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [accepted, setAccepted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      activate({
        data: {
          displayName: displayName.trim(),
          contactEmail: contactEmail.trim() || null,
          websiteUrl: websiteUrl.trim() || null,
          acceptTerms: true,
        },
      }),
    onSuccess: async ({ created }) => {
      await refreshOverview();
      setRole("advertiser");
      onOpenChange(false);
      toast.success(created ? "You're an advertiser now" : "Advertiser mode on", {
        description: created ? "Add Campaign Funds to launch your first task." : undefined,
      });
    },
    onError: (err) => {
      toast.error("Couldn't activate advertiser mode", {
        description: err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : undefined,
      });
    },
  });

  const canSubmit = displayName.trim().length >= 2 && accepted && !mutation.isPending;
  const terms = overview?.settings.termsVersion ?? "v1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" data-testid="become-advertiser-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-sky-500/10">
              <Megaphone className="size-4 text-sky-700" />
            </span>
            Become an Advertiser
          </DialogTitle>
          <DialogDescription>
            Create campaigns that CashGPT members complete for you. You only pay when a
            task is completed.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="adv-name">Brand or business name</Label>
            <Input
              id="adv-name"
              value={displayName}
              maxLength={60}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Coin Rush Games"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-email">Contact email</Label>
            <Input
              id="adv-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-site">
              Website <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="adv-site"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
          <label className="flex items-start gap-2 rounded-xl bg-background-alt p-3 text-xs">
            <Checkbox
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              data-testid="adv-terms"
              className="mt-0.5"
            />
            <span>
              I accept the Advertiser Terms ({terms}). Campaign deposits are non-refundable once
              spent; unused balance stays in my Campaign Balance.
            </span>
          </label>
          <DialogFooter>
            <Button type="submit" variant="jade" size="lg" className="w-full" disabled={!canSubmit} data-testid="adv-activate">
              {mutation.isPending ? "Activating…" : "Activate advertiser mode"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}