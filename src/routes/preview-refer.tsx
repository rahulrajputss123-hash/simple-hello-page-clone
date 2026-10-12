/**
 * TEMPORARY no-login preview of the REAL Refer & Earn screen.
 *
 * Mounts the actual ReferPage inside a mock AuthContext and seeds the real
 * ["referrals", userId] query cache, so what renders is the production component
 * with production logic — not a copy. Safe to delete.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { ReferPage } from "@/routes/_authenticated/refer";
import { AuthContext } from "@/lib/auth";

export const Route = createFileRoute("/preview-refer")({
  ssr: false,
  component: PreviewRefer,
});

const USER_ID = "00000000-0000-4000-8000-000000000001";
const DAY = 86_400_000;
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString();

/** Mock referrals covering every reward state the screen can render. */
const REFERRALS = [
  // 3/3 complete and released — the full $3 is in the main wallet.
  {
    id: "r1",
    referrer_id: USER_ID,
    referred_id: "f1",
    created_at: iso(120),
    signup_credited_at: iso(120),
    earning_credited_at: iso(118),
    withdrawal_credited_at: iso(90),
    reward_released_at: iso(90),
    bonus_amount: 3,
    status: "completed",
  },
  // 2/3 — $2 pending, nothing in the wallet yet.
  {
    id: "r2",
    referrer_id: USER_ID,
    referred_id: "f2",
    created_at: iso(40),
    signup_credited_at: iso(40),
    earning_credited_at: iso(38),
    withdrawal_credited_at: null,
    reward_released_at: null,
    bonus_amount: 0,
    status: "active",
  },
  // 1/3 — $1 pending.
  {
    id: "r3",
    referrer_id: USER_ID,
    referred_id: "f3",
    created_at: iso(10),
    signup_credited_at: iso(10),
    earning_credited_at: null,
    withdrawal_credited_at: null,
    reward_released_at: null,
    bonus_amount: 0,
    status: "active",
  },
  // Window elapsed before 3/3 — expired, nothing released.
  {
    id: "r4",
    referrer_id: USER_ID,
    referred_id: "f4",
    created_at: iso(400),
    signup_credited_at: iso(400),
    earning_credited_at: null,
    withdrawal_credited_at: null,
    reward_released_at: null,
    bonus_amount: 0,
    status: "expired",
  },
];

const MOCK_AUTH = {
  session: { user: { id: USER_ID, email: "preview@example.com" } } as unknown as Session,
  loading: false,
  profile: {
    id: USER_ID,
    name: "Preview User",
    email: "preview@example.com",
    referral_code: "PREVIEW7",
    wallet_balance: 12.5,
    held_balance: 0,
    lifetime_earned: 42,
    avatar_url: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  profileLoading: false,
  isAdmin: false,
};

function PreviewRefer() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queryClient.setQueryData(["referrals", USER_ID], REFERRALS);
    setReady(true);
  }, [queryClient]);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={MOCK_AUTH}>
      <ReferPage />
    </AuthContext.Provider>
  );
}
