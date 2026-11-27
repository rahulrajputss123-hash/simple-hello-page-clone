import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  isPushSupported,
  getNotificationPermission,
  injectPushScript,
  type PushNetwork,
} from "@/lib/push-networks";
import { PUSH_NETWORK_SCRIPTS } from "@/lib/push-networks";

const SKIP_STORAGE_KEY = "ptc-push-skip";
const SKIP_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

type PushOptInCardProps = {
  network: PushNetwork;
  onComplete: () => void;
};

/**
 * Push notification opt-in card for PTC landing pages
 * Shows before the sponsor button, allows Enable or Skip
 */
export function PushOptInCard({ network, onComplete }: PushOptInCardProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if should show the card
    const shouldShow = checkShouldShow(network);
    setVisible(shouldShow);
  }, [network]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      // Inject push script - this triggers browser permission prompt
      await injectPushScript(network);
      
      // Hide card after script injection
      setVisible(false);
      onComplete();
    } catch (error) {
      console.error("Failed to inject push script:", error);
      // Hide card even on error
      setVisible(false);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Remember skip for 3 days
    try {
      localStorage.setItem(
        SKIP_STORAGE_KEY,
        JSON.stringify({ timestamp: Date.now() })
      );
    } catch {
      // Ignore localStorage errors
    }
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <h3 className="text-base font-semibold">Alerts chalu karo</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Naye quests aur offers ka notification pao
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkip}
          disabled={loading}
          className="flex-1"
        >
          Skip
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleEnable}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Loading..." : "Enable"}
        </Button>
      </div>
    </div>
  );
}

function checkShouldShow(network: PushNetwork): boolean {
  // Don't show if no script URL
  const scriptSrc = PUSH_NETWORK_SCRIPTS[network];
  if (!scriptSrc) return false;

  // Don't show if push not supported
  if (!isPushSupported()) return false;

  // Don't show if permission already granted or denied
  const permission = getNotificationPermission();
  if (permission === "granted" || permission === "denied") return false;

  // Check if user skipped recently
  try {
    const skipData = localStorage.getItem(SKIP_STORAGE_KEY);
    if (skipData) {
      const { timestamp } = JSON.parse(skipData);
      if (Date.now() - timestamp < SKIP_DURATION) {
        return false;
      }
    }
  } catch {
    // Ignore parse errors
  }

  return true;
}
