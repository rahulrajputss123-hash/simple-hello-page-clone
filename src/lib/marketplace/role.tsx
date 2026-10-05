import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Publisher ⇄ Advertiser mode for the marketplace preview.
 *
 * UI-ONLY: the selected role lives in React state for the current session.
 * Nothing is persisted and no backend check happens — every user is treated as
 * "not yet an advertiser" until they tap "Become an Advertiser", which simply
 * flips this local flag.
 */
export type MarketplaceRole = "publisher" | "advertiser";

type RoleValue = {
  role: MarketplaceRole;
  setRole: (role: MarketplaceRole) => void;
  /** Local-only "activated" flag — flips the first time advertiser mode is entered. */
  advertiserActivated: boolean;
};

const RoleContext = createContext<RoleValue>({
  role: "publisher",
  setRole: () => {},
  advertiserActivated: false,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<MarketplaceRole>("publisher");
  const [advertiserActivated, setActivated] = useState(false);

  const setRole = (next: MarketplaceRole) => {
    if (next === "advertiser") setActivated(true);
    setRoleState(next);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, advertiserActivated }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}