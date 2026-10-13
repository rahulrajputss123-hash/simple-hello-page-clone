import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { claimOffer, startOfferClaim, submitOfferProof } from "@/lib/coinquest.functions";
import { trackOfferClick } from "@/lib/offers.functions";
import { appendAffSub4 } from "@/lib/offers/click-url";
import { useAuth } from "@/lib/auth";

export type OfferActionData = {
  id: string;
  click_url?: string | null;
  provider_slug?: string | null;
  external_offer_id?: string | null;
  payout_mode?: "manual" | "manual_proof" | "auto_postback";
};

export function useOfferActions(
  onSuccess?: (offerId: string, type: "start" | "submit" | "claim") => void,
) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const claim = useServerFn(claimOffer);
  const startClaim = useServerFn(startOfferClaim);
  const submitProof = useServerFn(submitOfferProof);
  const trackClick = useServerFn(trackOfferClick);

  const startMutation = useMutation({
    mutationFn: async (offer: OfferActionData) => {
      const result = await startClaim({ data: { offerId: offer.id } });
      return { result, offer };
    },
    onSuccess: async ({ offer }) => {
      // Open URL in new tab
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
      }
      // Open URL if present
      if (input.clickUrl) {
        const clickUrl = appendAffSub4(
          input.clickUrl,
          input.provider_slug,
          session?.user.id,
          input.external_offer_id,
        );
        if (clickUrl) window.open(clickUrl, "_blank", "noopener,noreferrer");
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
