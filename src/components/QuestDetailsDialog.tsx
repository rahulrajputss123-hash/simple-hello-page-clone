import { AlertTriangle, ArrowUpRight, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/coinquest";
import {
  deriveQuestView,
  QUEST_ACCENTS,
  type QuestCardQuest,
  type QuestSessionView,
} from "@/lib/quest-view";

/**
 * Pre-start confirmation dialog for Starter Quests.
 *
 * Quest cards used to fire the mutation (and open the external URL) straight
 * from the card tap. This gates that behind an explicit Continue, mirroring how
 * Featured Offers gate on OfferDetailsDialog. Nothing external happens until
 * `onContinue` runs.
 */
export function QuestDetailsDialog({
  quest,
  active,
  credited = false,
  open,
  onOpenChange,
  onContinue,
  isSubmitting,
}: {
  quest: QuestCardQuest | null;
  /** Active session for this quest, used to show existing progress. */
  active?: QuestSessionView | undefined;
  credited?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  isSubmitting?: boolean;
}) {
  const accent = quest ? QUEST_ACCENTS[quest.quest_type] : null;
  const view = quest ? deriveQuestView(quest, active, credited) : null;
  const started = Boolean(view && view.progress > 0);

  const ctaLabel = !quest
    ? "Start Quest"
    : isSubmitting
      ? "Opening…"
      : quest.quest_type === "ads"
        ? "Watch Ads"
        : quest.quest_type === "shortlink"
          ? started
            ? "Continue"
            : "Start Quest"
          : "Complete Locker";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="quest-details-dialog">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {accent && (
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
                style={{
                  background: accent.tile,
                  boxShadow: `0 6px 14px -4px ${accent.tileShadow}`,
                }}
              >
                <accent.icon className="size-5" strokeWidth={2} />
              </span>
            )}
            <div className="min-w-0 flex-1 text-left">
              <DialogTitle className="text-left text-base" data-testid="quest-details-title">
                {quest?.label ?? "Quest"}
              </DialogTitle>
              {quest && (
                <p
                  className="text-amount text-sm text-gold-dark"
                  data-testid="quest-details-reward"
                >
                  {formatMoney(quest.reward_amount)}
                </p>
              )}
              {accent && (
                <span
                  data-testid="quest-details-badge"
                  className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em]"
                  style={{ background: accent.badgeBg, color: accent.badgeInk }}
                >
                  {accent.label}
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {view && (
          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              About this quest
            </p>
            <p className="text-sm leading-relaxed" data-testid="quest-details-description">
              {view.description}
            </p>
          </section>
        )}

        {view && started && (
          <section className="space-y-1" data-testid="quest-details-progress">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your progress
            </p>
            <p className="text-sm leading-relaxed">
              <span className="font-semibold [font-variant-numeric:tabular-nums]">
                {view.progress} / {view.total}
              </span>{" "}
              <span className="text-muted-foreground">
                complete — {view.remaining} more to finish.
              </span>
            </p>
          </section>
        )}

        {quest?.quest_type === "shortlink" && view && (
          <section
            className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary"
            data-testid="quest-details-step"
          >
            <Info className="size-4 shrink-0" />
            <span>
              You&apos;re about to start <strong>step {view.nextStep}</strong> of {view.total}. Stay
              on the page for at least {quest.min_seconds_per_step} seconds, then you&apos;ll be
              sent back automatically.
            </span>
          </section>
        )}

        <section
          className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
          data-testid="quest-details-rules"
        >
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-destructive">
            <AlertTriangle className="size-3.5" />
            Before you start
          </p>
          <p className="text-sm leading-relaxed text-destructive">
            Complete the required action fully — closing early won&apos;t count. No VPN, no multiple
            accounts and no emulators, or the reward may be withheld.
          </p>
        </section>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="quest-details-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="jade"
            onClick={onContinue}
            disabled={isSubmitting || !quest}
            data-testid="quest-details-continue"
          >
            {ctaLabel}
            <ArrowUpRight className="ml-1 size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
