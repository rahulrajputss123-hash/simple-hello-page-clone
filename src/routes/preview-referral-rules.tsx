/**
 * TEMPORARY no-login preview of the REAL Referral Program Rules page.
 * Mounts the production component inside a mock AuthContext (AppShell's header
 * needs one). Safe to delete.
 */
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";

import { ReferralRulesPage } from "@/routes/_authenticated/referral-rules";
import { AuthContext } from "@/lib/auth";

export const Route = createFileRoute("/preview-referral-rules")({
  ssr: false,
  component: PreviewReferralRules,
});

const MOCK_AUTH = {
  session: {
    user: { id: "00000000-0000-4000-8000-000000000001", email: "preview@example.com" },
  } as unknown as Session,
  loading: false,
  profile: {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Preview User",
    referral_code: "PREVIEW7",
    wallet_balance: 12.5,
    held_balance: 0,
    avatar_url: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  profileLoading: false,
  isAdmin: false,
};

function PreviewReferralRules() {
  return (
    <AuthContext.Provider value={MOCK_AUTH}>
      <ReferralRulesPage />
    </AuthContext.Provider>
  );
}
