/**
 * TEMPORARY preview-only route used to visually verify the QuestCard redesign
 * without requiring Supabase auth. Renders the real QuestCard component with
 * mock quest data covering all three quest types plus locked/credited states.
 * Safe to delete once the redesign has been visually confirmed.
 */
import { createFileRoute } from "@tanstack/react-router";

import { QuestCard, type QuestCardQuest } from "@/components/QuestCard";
import type { QuestRow } from "@/lib/quests.server";

export const Route = createFileRoute("/preview-quest-cards")({
  ssr: false,
  component: PreviewQuestCards,
});

function baseQuest(overrides: Partial<QuestCardQuest>): QuestCardQuest {
  return {
    id: "preview-id",
    key: "preview-key",
    label: "Preview",
    icon: "gift",
    quest_type: "ads",
    ads_required: 5,
    reward_amount: 1,
    shortlink_steps: [],
    min_seconds_per_step: 15,
    locker_url: null,
    is_active: true,
    sort_order: 0,
    lock_type: "none",
    unlock_at: null,
    required_lifetime_earned: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function PreviewQuestCards() {
  const adsQuest = baseQuest({
    key: "starter_5",
    label: "Watch Ads",
    quest_type: "ads",
    ads_required: 5,
    reward_amount: 1,
  });
  const shortlinkQuest = baseQuest({
    key: "starter_50",
    label: "Shortlink",
    quest_type: "shortlink",
    shortlink_steps: [
      { network: "a", url: "https://example.com/a" },
      { network: "b", url: "https://example.com/b" },
      { network: "c", url: "https://example.com/c" },
    ],
    reward_amount: 1,
  });
  const lockerQuest = baseQuest({
    key: "starter_locker",
    label: "Complete Locker",
    quest_type: "locker",
    reward_amount: 1.5,
    locker_url: "https://example.com/locker",
  });
  const lockedQuest = baseQuest({
    key: "starter_locked",
    label: "Locked Quest",
    quest_type: "ads",
    ads_required: 3,
    reward_amount: 2,
    is_locked: true,
    unlock_reason: { type: "time", unlocksAt: new Date(Date.now() + 86400000).toISOString() },
  });
  const creditedQuest = baseQuest({
    key: "starter_credited",
    label: "Completed Quest",
    quest_type: "ads",
    ads_required: 5,
    reward_amount: 1,
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-6">
      <h1 className="mb-4 text-2xl font-bold">Starter Quests</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Watch 5 video ads and get rewarded! (preview — not a real route)
      </p>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <QuestCard
          quest={adsQuest}
          active={{ id: "s1", quest_key: "starter_5", status: "started", ads_watched: 2 }}
          credited={false}
          busy={false}
          lockLabel={null}
          onOpenDetails={() => {}}
          onLocked={() => {}}
        />
        <QuestCard
          quest={shortlinkQuest}
          active={undefined}
          credited={false}
          busy={false}
          lockLabel={null}
          onOpenDetails={() => {}}
          onLocked={() => {}}
        />
        <QuestCard
          quest={lockerQuest}
          active={{ id: "s3", quest_key: "starter_locker", status: "started", ads_watched: 0 }}
          credited={false}
          busy={false}
          lockLabel={null}
          onOpenDetails={() => {}}
          onLocked={() => {}}
        />
        <QuestCard
          quest={lockedQuest}
          active={undefined}
          credited={false}
          busy={false}
          lockLabel="Unlocks in 1 day"
          onOpenDetails={() => {}}
          onLocked={() => {}}
        />
        <QuestCard
          quest={creditedQuest}
          active={{ id: "s5", quest_key: "starter_credited", status: "credited", ads_watched: 5 }}
          credited={true}
          busy={false}
          lockLabel={null}
          onOpenDetails={() => {}}
          onLocked={() => {}}
        />
      </div>
    </div>
  );
}
