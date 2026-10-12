import { Flame, LayoutGrid, Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { EARN_WAYS, SHOWCASE_OFFERS } from "@/components/landing/landing-data";
import { AVATAR_OPTIONS } from "@/lib/onboarding/premium";

/** Transparent 3D art sliced from the generated sprite sheets (public/landing/phone). */
const ART = (name: string) => `/landing/phone/${name}.webp`;

/** Same order as EARN_WAYS: Ads, Shortlinks, Locker, Survey, App Install, Task, Deal, Games. */
const TILE_ART = [
  "cat-ads",
  "cat-shortlinks",
  "cat-locker",
  "cat-survey",
  "cat-install",
  "cat-task",
  "cat-deal",
  "cat-games",
] as const;

const TILES = EARN_WAYS.map((way, index) => ({
  key: way.number,
  src: ART(TILE_ART[index]!),
  label: way.title,
  sub: way.subtitle,
}));

/** Placeholder handles, paired with the real showcase offers and payouts. */
const TOAST_NAMES = ["Aar***", "Lea**", "Dan***"];

const CAROUSEL_MS = 2600;
const TOAST_MS = 5200;
const START_BALANCE = 12.4;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Eases a displayed number toward `target` — used for the wallet balance. */
function useTween(target: number, enabled: boolean, ms = 800) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    if (!enabled) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      fromRef.current = next;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, ms]);
  return value;
}

function Floater({
  src,
  className,
  depth,
  bob,
  size,
}: {
  src: string;
  className: string;
  /** Parallax strength in px at full mouse deflection. */
  depth: number;
  bob: "a" | "b" | "c";
  size: number;
}) {
  return (
    <div
      aria-hidden
      className={`hp-parallax pointer-events-none absolute ${className}`}
      style={{ "--depth": `${depth}px` } as CSSProperties}
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`hp-anim hp-bob-${bob} drop-shadow-[0_10px_14px_rgba(20,60,55,0.28)]`}
        style={{ width: size, height: size }}
      />
    </div>
  );
}

/**
 * Animated phone preview of the app.
 *
 * The phone and everything on its screen is real markup (crisp at any DPI, nothing
 * baked into a screenshot); only the glossy 3D icons are images. It is a labelled
 * sample, not live data — the figures are illustrative.
 *
 * Motion is transform/opacity only. It pauses while off-screen and is static when
 * the visitor prefers reduced motion. Mouse parallax is desktop-only.
 */
export function HeroPhone() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const running = visible && !reduced;

  const [active, setActive] = useState(0);
  const [toastIndex, setToastIndex] = useState(0);
  const [toastTick, setToastTick] = useState(0);
  const [balanceTarget, setBalanceTarget] = useState(START_BALANCE);
  const toastIndexRef = useRef(0);
  const balanceRef = useRef(START_BALANCE);
  balanceRef.current = balanceTarget;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setVisible(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % TILES.length), CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    // Index lives in a ref so the balance maths isn't run inside a state updater
    // (React may call updaters twice in dev, which would double-count a payout).
    const id = window.setInterval(() => {
      const next = (toastIndexRef.current + 1) % SHOWCASE_OFFERS.length;
      toastIndexRef.current = next;
      setToastIndex(next);
      setToastTick((t) => t + 1);
      setBalanceTarget(
        next === 0 ? START_BALANCE : balanceRef.current + SHOWCASE_OFFERS[next]!.rewardAmount,
      );
    }, TOAST_MS);
    return () => window.clearInterval(id);
  }, [running]);

  const balance = useTween(balanceTarget, running);
  const toast = SHOWCASE_OFFERS[toastIndex]!;
  const avatar = useMemo(() => AVATAR_OPTIONS[0]!, []);

  // Desktop-only parallax: write two CSS vars, let CSS do the moving.
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const node = rootRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    node.style.setProperty("--mx", x.toFixed(3));
    node.style.setProperty("--my", y.toFixed(3));
  };
  const onPointerLeave = () => {
    rootRef.current?.style.setProperty("--mx", "0");
    rootRef.current?.style.setProperty("--my", "0");
  };

  const activeTile = TILES[active]!;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Preview of the CashGPT app: eight ways to earn, daily streaks and a wallet"
      data-testid="hero-phone"
      data-running={running ? "true" : "false"}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="hp-root relative mx-auto w-full max-w-[24rem] select-none py-6"
    >
      {/* Soft glow behind the phone */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--color-mint), transparent)" }}
      />

      {/* ----------------------------- floating art ----------------------------- */}
      <Floater src={ART("coin")} size={68} depth={22} bob="a" className="right-1 top-4 z-20" />
      <Floater src={ART("gem-amber")} size={50} depth={30} bob="b" className="left-0 top-24 z-20" />
      <Floater
        src={ART("gem-emerald")}
        size={52}
        depth={26}
        bob="c"
        className="right-0 top-[44%] z-20"
      />
      <Floater src={ART("trophy")} size={70} depth={18} bob="b" className="bottom-6 left-0 z-20" />

      {/* Earnings mini-chart card */}
      <div
        aria-hidden
        className="hp-parallax pointer-events-none absolute bottom-16 right-0 z-20"
        style={{ "--depth": "14px" } as CSSProperties}
      >
        <div className="surface-card w-[7.25rem] p-2.5 shadow-lift">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
            Earnings
          </p>
          <div className="mt-1.5 flex h-12 items-end gap-1">
            {[38, 56, 44, 72, 52, 90].map((h, i) => (
              <span
                key={i}
                className="hp-anim hp-grow block flex-1 origin-bottom rounded-sm"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 140}ms`,
                  background: i === 5 ? "var(--color-gold)" : "var(--color-primary)",
                }}
              />
            ))}
          </div>
          <p className="mt-1 text-[9px] text-muted-foreground">Sample</p>
        </div>
      </div>

      {/* --------------------------------- phone -------------------------------- */}
      <div className="hp-tilt-wrap mx-auto w-[17rem]">
        <div
          aria-hidden
          className="hp-tilt relative rounded-[2.6rem] bg-[oklch(0.2_0.03_197)] p-[9px] shadow-lift ring-1 ring-black/10"
        >
          {/* side buttons */}
          <span className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-[oklch(0.28_0.03_197)]" />
          <span className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r bg-[oklch(0.28_0.03_197)]" />

          <div className="relative h-[34.5rem] overflow-hidden rounded-[2.1rem] bg-background">
            {/* dynamic island */}
            <span className="absolute left-1/2 top-2 z-10 h-[1.15rem] w-[4.6rem] -translate-x-1/2 rounded-full bg-[oklch(0.15_0.02_197)]" />

            <div className="space-y-3 px-3.5 pt-9">
              {/* header */}
              <div className="flex items-center gap-2">
                <img
                  src={avatar.imageUrl}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="size-8 rounded-full object-cover ring-1 ring-border"
                />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-[9px] text-muted-foreground">Hello</p>
                  <p className="text-[12px] font-bold text-foreground">Earner</p>
                </div>
                <span className="text-amount inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 text-[12px] text-gold-foreground shadow-gold">
                  <img src={ART("coin")} alt="" width={14} height={14} className="size-3.5" />$
                  {balance.toFixed(2)}
                </span>
              </div>

              {/* activity toast */}
              <div className="relative h-[2.9rem]">
                <div
                  key={toastTick}
                  className="hp-anim hp-toast surface-card absolute inset-0 flex items-center gap-2 px-2.5 shadow-soft"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-mint/20 text-[11px]">
                    ✓
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[10px] leading-tight text-foreground">
                    <span className="font-bold">{TOAST_NAMES[toastIndex]}</span> completed{" "}
                    {toast.title}
                  </p>
                  <span className="text-amount shrink-0 text-[11px] text-primary">
                    +${toast.rewardAmount}.00
                  </span>
                </div>
              </div>

              {/* category carousel */}
              <div>
                <div
                  className="relative h-[8.6rem] overflow-hidden rounded-2xl bg-background-alt"
                  style={{ perspective: "560px" }}
                >
                  <div
                    aria-hidden
                    className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/30 blur-2xl"
                  />
                  {TILES.map((tile, index) => {
                    const n = TILES.length;
                    const d = ((index - active + n + n / 2) % n) - n / 2;
                    const abs = Math.abs(d);
                    const isActive = d === 0;
                    return (
                      <img
                        key={tile.key}
                        src={tile.src}
                        alt=""
                        width={76}
                        height={76}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="absolute left-1/2 top-1/2 size-[4.7rem] -ml-[2.35rem] -mt-[2.35rem] transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          transform: `translate3d(${d * 3.9}rem, 0, ${-abs * 40}px) rotateY(${
                            d * -30
                          }deg) scale(${isActive ? 1.18 : 0.84})`,
                          opacity: abs > 2 ? 0 : 1 - abs * 0.28,
                          zIndex: 10 - Math.round(abs),
                          filter: isActive
                            ? "drop-shadow(0 8px 10px rgba(20,60,55,0.35))"
                            : "saturate(0.85)",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-1.5 flex items-center justify-between px-0.5">
                  <p className="text-[11px] font-bold leading-tight text-foreground">
                    {activeTile.label}
                    <span className="ml-1 font-medium text-muted-foreground">
                      · {activeTile.sub}
                    </span>
                  </p>
                  <span className="flex gap-1">
                    {TILES.map((tile, index) => (
                      <span
                        key={tile.key}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          index === active ? "w-3 bg-gold-dark" : "w-1 bg-border"
                        }`}
                      />
                    ))}
                  </span>
                </div>
              </div>

              {/* streak */}
              <div className="surface-card flex items-center gap-2.5 p-2.5 shadow-soft">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">
                    Daily streak
                  </p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background-alt">
                    <div className="hp-anim hp-fill h-full origin-left rounded-full bg-mint-gradient" />
                  </div>
                  <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
                    <span>Day 1</span>
                    <span>Day 3</span>
                    <span>Day 7</span>
                  </div>
                </div>
                <img
                  src={ART("badge-star")}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  className="hp-anim hp-pop size-10"
                />
              </div>

              {/* daily goals */}
              <div className="surface-card p-2.5 shadow-soft">
                <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">
                  Daily goals
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {[
                    { w: "100%", t: "Watch an ad" },
                    { w: "60%", t: "Finish a survey" },
                  ].map((goal) => (
                    <div key={goal.t} className="flex items-center gap-2">
                      <span className="w-[4.6rem] shrink-0 text-[9px] text-muted-foreground">
                        {goal.t}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-background-alt">
                        <span
                          className="block h-full rounded-full bg-gold-gradient"
                          style={{ width: goal.w }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Illustrative preview — not real user data.
      </p>
    </div>
  );
}

const POINTS = [
  {
    icon: LayoutGrid,
    title: "Eight ways to earn, one feed",
    text: "Ads, shortlinks, lockers, surveys, app installs, tasks, deals and games — switch between them in a tap.",
  },
  {
    icon: Flame,
    title: "Streaks and daily goals",
    text: "Come back each day to keep your streak going and tick off small goals for extra rewards.",
  },
  {
    icon: Wallet,
    title: "A wallet you can actually cash out",
    text: "Watch your balance grow and withdraw once you reach $5.",
  },
] as const;

/** "See what's inside the app" — the phone preview with three short selling points. */
export function AppPreviewSection() {
  return (
    <section
      data-testid="app-preview-section"
      aria-labelledby="app-preview-heading"
      className="relative isolate overflow-hidden rounded-[1.75rem] bg-background-alt px-4 py-9 sm:px-8 sm:py-12"
    >
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_1fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-inset ring-mint/25">
            Inside the app
          </span>
          <h2
            id="app-preview-heading"
            className="mt-3 font-display text-[1.7rem] leading-tight text-foreground sm:text-[2.2rem]"
          >
            Everything you need to <span className="text-gold-dark">earn, in one place</span>
          </h2>

          <ul className="mx-auto mt-6 max-w-md space-y-4 text-left lg:mx-0">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-jade-gradient text-primary-foreground shadow-soft">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <HeroPhone />
      </div>
    </section>
  );
}
