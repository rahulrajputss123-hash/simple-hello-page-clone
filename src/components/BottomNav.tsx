import { Link } from "@tanstack/react-router";

const TABS = [
  { to: "/home", label: "Home", iconSrc: "/icons/icon-home.png" },
  { to: "/offers", label: "Offers", iconSrc: "/icons/icon-offers.png" },
  { to: "/task", label: "Task", iconSrc: "/icons/icon-your-task.png" },
  { to: "/refer", label: "Refer", iconSrc: "/icons/icon-referral.png" },
  { to: "/support", label: "Support", iconSrc: "/icons/icon-support.png" },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <ul className="mx-auto flex w-full max-w-lg items-stretch justify-between px-2 py-1.5">
        {TABS.map(({ to, label, iconSrc }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="group flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-muted-foreground transition-colors data-[status=active]:text-primary"
              activeProps={{ className: "bg-background-alt" }}
            >
              <img
                src={iconSrc}
                alt=""
                aria-hidden
                data-testid={`bottom-nav-${label.toLowerCase()}-icon`}
                className="size-8 object-contain transition-transform group-data-[status=active]:scale-110"
                decoding="async"
              />
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
