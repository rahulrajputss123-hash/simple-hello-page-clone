import { useState } from "react";

import type { StoreKey } from "@/components/landing/landing-data";

/**
 * Owns which store popup is showing on the landing page.
 *
 * Keep one instance per page and pass `select` to every `StoreButtons` so only a
 * single `StoreDialog` is ever mounted.
 *
 * `store` is intentionally left set after closing so the copy doesn't blank out
 * mid close-animation; `open` is what drives visibility.
 */
export function useStoreDialog() {
  const [store, setStore] = useState<StoreKey | null>(null);
  const [open, setOpen] = useState(false);

  return {
    store,
    open,
    select: (next: StoreKey) => {
      setStore(next);
      setOpen(true);
    },
    setOpen,
  };
}
