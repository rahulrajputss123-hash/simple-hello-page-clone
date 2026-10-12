import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Tracks which offer the user is currently looking at, so the AI assistant —
 * which lives on the Support tab — can answer questions about it.
 *
 * Only the offer id and title are held here. The assistant sends just the id to
 * the server, which loads the real offer data itself, so nothing here is ever
 * treated as a source of truth about the offer.
 */
type ViewedOffer = { id: string; title: string } | null;

type ViewedOfferValue = {
  viewedOffer: ViewedOffer;
  setViewedOffer: (offer: { id: string; title: string }) => void;
  clearViewedOffer: () => void;
  /**
   * Raised by an offer's "Ask the assistant" button. The chat panel lives on the
   * Support tab, so it is not mounted at the moment the button is tapped — the
   * request has to survive the navigation, which is why it is held here (in the
   * root provider) rather than in the chat's own state.
   */
  assistantOpenRequested: boolean;
  requestAssistantOpen: () => void;
  /** Called by the chat once it has acted on the request, so it fires once. */
  consumeAssistantOpen: () => void;
};

const ViewedOfferContext = createContext<ViewedOfferValue>({
  viewedOffer: null,
  setViewedOffer: () => {},
  clearViewedOffer: () => {},
  assistantOpenRequested: false,
  requestAssistantOpen: () => {},
  consumeAssistantOpen: () => {},
});

export function ViewedOfferProvider({ children }: { children: ReactNode }) {
  const [viewedOffer, setOffer] = useState<ViewedOffer>(null);
  const [assistantOpenRequested, setAssistantOpenRequested] = useState(false);

  const setViewedOffer = useCallback((offer: { id: string; title: string }) => setOffer(offer), []);
  const clearViewedOffer = useCallback(() => setOffer(null), []);
  const requestAssistantOpen = useCallback(() => setAssistantOpenRequested(true), []);
  const consumeAssistantOpen = useCallback(() => setAssistantOpenRequested(false), []);

  const value = useMemo(
    () => ({
      viewedOffer,
      setViewedOffer,
      clearViewedOffer,
      assistantOpenRequested,
      requestAssistantOpen,
      consumeAssistantOpen,
    }),
    [
      viewedOffer,
      setViewedOffer,
      clearViewedOffer,
      assistantOpenRequested,
      requestAssistantOpen,
      consumeAssistantOpen,
    ],
  );

  return <ViewedOfferContext.Provider value={value}>{children}</ViewedOfferContext.Provider>;
}

export function useViewedOffer(): ViewedOfferValue {
  return useContext(ViewedOfferContext);
}
