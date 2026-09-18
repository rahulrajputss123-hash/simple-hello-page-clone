import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const { session, loading, profile, profileLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (profileLoading) return;
    navigate({ to: profile && !profile.onboarded ? "/onboarding" : "/home", replace: true });
  }, [session, loading, profile, profileLoading, navigate]);

  return <AppLoadingScreen />;
}
