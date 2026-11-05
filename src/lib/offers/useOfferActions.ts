import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { claimOffer, startOfferClaim, submitOfferProof } from "@/lib/coinquest.functions";
import { trackOfferClick } from "@/lib/offers.functions";
import { getToroxClickUrl } from "@/lib/offers/torox.functions";
import { appendAffSub4 } from "@/lib/offers/click-url";
import { TOROX_CLICK_URL_SENTINEL } from "@/lib/offers/adapters/torox.server";
import { useAuth } from "@/lib/auth";
import { startActiveTimeGrace } from "@/lib/quests.functions";

export type OfferActionData = {
  id: string;
  click_url?: string | null;
  provider_slug?: string | null;
  external_offer_id?: string | null;
  payout_mode?: "manual" | "manual_proof" | "auto_postback";
};

export function useOfferActions(
  onSuccess?: (offerId: string, type: "start" | "submit" | "claim") => void,
  activeTimeQuestKey?: string | null,
) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const claim = useServerFn(claimOffer);
  const startClaim = useServerFn(startOfferClaim);
  const submitProof = useServerFn(submitOfferProof);
  const trackClick = useServerFn(trackOfferClick);
  const getToroxUrl = useServerFn(getToroxClickUrl);
  const startGrace = useServerFn(startActiveTimeGrace);

  const startMutation = useMutation({
    mutationFn: async (offer: OfferActionData) => {
      const result = await startClaim({ data: { offerId: offer.id } });
      
      // Start active time grace period if active time quest is running
      if (activeTimeQuestKey) {
        void startGrace({
          data: {
            questKey: activeTimeQuestKey,
            offerId: offer.id,
          },
        }).catch((err) => {
          console.warn("[active-time] Failed to start grace period:", err);
        });
      }
      
      return { result, offer };
    },
    onSuccess: async ({ offer }) => {
      // Special handling for Torox: open blank tab first to avoid popup blocker
      if (offer.provider_slug === "torox" && offer.click_url?.startsWith(TOROX_CLICK_URL_SENTINEL)) {
        const blankTab = window.open("about:blank", "_blank", "noopener,noreferrer");
        
        try {
          void trackClick({ data: { offerId: offer.id } }).catch(() => {});
          const { clickUrl } = await getToroxUrl({ data: { offerId: offer.id } });
          if (blankTab && clickUrl) {
            blankTab.location.href = clickUrl;
          } else {
            blankTab?.close();
            throw new Error("Could not generate tracking link.");
          }
        } catch (err) {
          blankTab?.close();
          toast.error(err instanceof Error ? err.message : "Could not open offer link.");
        }
      } else {
        // Normal offer flow
        if (offer.click_url) {
          void trackClick({ data: { offerId: offer.id } }).catch(() => {});
          const clickUrl = appendAffSub4(
            offer.click_url,
            offer.provider_slug,
            session?.user.id,
            offer.external_offer_id,
          );
          if (clickUrl) window.open(clickUrl, "_blank", "noopener,noreferrer");
        }
      }
      
      // Show toast
      toast.success("Complete the offer, then come back here and upload your proof.");
      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
      await queryClient.invalidateQueries({ queryKey: ["featured-feed"] });
      await queryClient.invalidateQueries({ queryKey: ["offer", offer.id] });
      onSuccess?.(offer.id, "start");
    },
    onError: (err: Error) => toast.error(err.message || "Could not start offer. Try again."),
  });

  const submitProofMutation = useMutation({
    mutationFn: async (input: { offerId: string; proofPath: string }) =>
      submitProof({ data: input }),
    onSuccess: async (_result, input) => {
      toast.success("Submitted for review. We'll notify you once it's approved.");
      await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["featured-feed"] });
      await queryClient.invalidateQueries({ queryKey: ["offer", input.offerId] });
      onSuccess?.(input.offerId, "submit");
    },
    onError: (err: Error) => toast.error(err.message || "Could not submit proof. Try again."),
  });

  const claimMutation = useMutation({
    mutationFn: async (input: {
      offerId: string;
      proofUrl: string | null;
      hasClickUrl: boolean;
      clickUrl?: string | null;
      provider_slug?: string | null;
      external_offer_id?: string | null;
    }) => {
      // Track click first
      if (input.hasClickUrl) {
        void trackClick({ data: { offerId: input.offerId } }).catch(() => {});
        
        // Start active time grace period if active time quest is running
        if (activeTimeQuestKey) {
          void startGrace({
            data: {
              questKey: activeTimeQuestKey,
              offerId: input.offerId,
            },
          }).catch((err) => {
            console.warn("[active-time] Failed to start grace period:", err);
          });
        }
      }
      
      // Special handling for Torox
      if (input.provider_slug === "torox" && input.clickUrl?.startsWith(TOROX_CLICK_URL_SENTINEL)) {
        const blankTab = window.open("about:blank", "_blank", "noopener,noreferrer");
        
        try {
          const { clickUrl } = await getToroxUrl({ data: { offerId: input.offerId } });
          if (blankTab && clickUrl) {
            blankTab.location.href = clickUrl;
          } else {
            blankTab?.close();
            throw new Error("Could not generate tracking link.");
          }
        } catch (err) {
          blankTab?.close();
          toast.error(err instanceof Error ? err.message : "Could not open offer link.");
        }
      } else {
        // Normal offer flow
        if (input.clickUrl) {
          const clickUrl = appendAffSub4(
            input.clickUrl,
            input.provider_slug,
            session?.user.id,
            input.external_offer_id,
          );
          if (clickUrl) window.open(clickUrl, "_blank", "noopener,noreferrer");
        }
      }
      
      // Submit claim
      return claim({
        data: {
          offerId: input.offerId,
          ...(input.proofUrl ? { proofUrl: input.proofUrl } : {}),
        },
      });
    },
    onSuccess: async (_result, input) => {
      // Show appropriate success message based on whether offer has click URL
      if (!input.hasClickUrl) {
        toast.success("Submitted for review. We'll notify you once it's approved.");
      }
      await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["featured-feed"] });
      await queryClient.invalidateQueries({ queryKey: ["offer", input.offerId] });
      onSuccess?.(input.offerId, "claim");
    },
    onError: (err: Error) => toast.error(err.message || "Could not submit that claim. Try again."),
  });

  return {
    startClaim: startMutation,
    submitProof: submitProofMutation,
    claimOffer: claimMutation,
    isSubmitting:
      startMutation.isPending || submitProofMutation.isPending || claimMutation.isPending,
  };
}
