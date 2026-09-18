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
};

const ViewedOfferContext = createContext<ViewedOfferValue>({
  viewedOffer: null,
  setViewedOffer: () => {},
  clearViewedOffer: () => {},
});

export function ViewedOfferProvider({ children }: { children: ReactNode }) {
  const [viewedOffer, setOffer] = useState<ViewedOffer>(null);

  const setViewedOffer = useCallback((offer: { id: string; title: string }) => setOffer(offer), []);
  const clearViewedOffer = useCallback(() => setOffer(null), []);

  const value = useMemo(
    () => ({ viewedOffer, setViewedOffer, clearViewedOffer }),
    [viewedOffer, setViewedOffer, clearViewedOffer],
  );

  return <ViewedOfferContext.Provider value={value}>{children}</ViewedOfferContext.Provider>;
}

export function useViewedOffer(): ViewedOfferValue {
  return useContext(ViewedOfferContext);
}
