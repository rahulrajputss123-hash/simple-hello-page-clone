/**
 * RoleSwitcher — tactile spring-animated segmented toggle.
 * Used in the Hero to switch between Earner and Advertiser mode.
 */

export type Role = "earner" | "advertiser";

interface RoleSwitcherProps {
  role: Role;
  onChange: (role: Role) => void;
}

export function RoleSwitcher({ role, onChange }: RoleSwitcherProps) {
  return (
    <div
      className="inline-flex items-center rounded-2xl bg-slate-100 p-1 shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)]"
      role="tablist"
      aria-label="Choose your role"
    >
      <button
        role="tab"
        aria-selected={role === "earner"}
        onClick={() => onChange("earner")}
        className={[
          "relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
          role === "earner"
            ? "bg-white text-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.10)] border border-slate-200/80"
            : "text-slate-500 hover:text-slate-700",
        ].join(" ")}
        data-testid="role-earner"
      >
        <span aria-hidden>🎯</span>
        I Want to Earn
      </button>
      <button
        role="tab"
        aria-selected={role === "advertiser"}
        onClick={() => onChange("advertiser")}
        className={[
          "relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
          role === "advertiser"
            ? "bg-white text-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.10)] border border-slate-200/80"
            : "text-slate-500 hover:text-slate-700",
        ].join(" ")}
        data-testid="role-advertiser"
      >
        <span aria-hidden>🚀</span>
        I Want to Advertise
      </button>
    </div>
  );
}
