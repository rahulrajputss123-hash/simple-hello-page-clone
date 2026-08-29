import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, CalendarClock, ChevronRight, FileText, Info } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

/**
 * Shared visual shell for every /legal/* page.
 * Same cream + dark-green + gold palette as the rest of the app, same
 * rounded-card surfaces, same typography — no new design language.
 */

export type PolicySection = {
  id: string;
  title: string;
  body: ReactNode;
};

export type PolicySibling = {
  href: string;
  label: string;
};

export function PolicyLayout({
  title,
  subtitle,
  lastUpdated,
  sections,
  siblings,
  intro,
  footer,
}: {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: PolicySection[];
  /** Related-document links shown at the top and bottom. */
  siblings: PolicySibling[];
  intro?: ReactNode;
  footer?: ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="policy-page relative min-h-screen bg-background text-foreground">
      {/* Softly-tinted ambient background matches other AppShell surfaces. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 20% 0%, rgba(34,197,94,0.10), transparent 70%), radial-gradient(45% 35% at 90% 15%, rgba(244,180,0,0.12), transparent 75%)",
        }}
      />

      {/* Sticky top bar: title + "Last updated" pill. */}
      <div
        className={`sticky top-0 z-30 border-b transition-colors ${
          scrolled
            ? "border-border/70 bg-background/85 shadow-soft backdrop-blur-md"
            : "border-transparent bg-background/0"
        }`}
      >
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            to="/home"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-soft transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            data-testid="policy-back-btn"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm leading-tight">{title}</p>
            <p
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
              data-testid="policy-last-updated"
            >
              <CalendarClock className="size-3" />
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
            Legal
          </p>
          <h1 className="font-display text-3xl leading-tight text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </header>

        {/* Related-documents mini nav. */}
        {siblings.length > 0 && (
          <nav
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Related documents"
            data-testid="policy-siblings-nav"
          >
            {siblings.map((s) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Link
                key={s.href}
                to={s.href as any}
                className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-card px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10"
              >
                <FileText className="size-3" />
                {s.label}
              </Link>
            ))}
          </nav>
        )}

        {intro && (
          <div
            className="mt-6 flex items-start gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-sm leading-relaxed text-primary"
            data-testid="policy-intro"
          >
            <Info className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">{intro}</div>
          </div>
        )}

        {/* Jump-link TOC (only if the page has multiple sections). */}
        {sections.length > 1 && (
          <aside
            className="surface-card mt-6 p-4"
            aria-label="Table of contents"
            data-testid="policy-toc"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ol className="mt-2 space-y-1">
              {sections.map((s, idx) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="group flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-primary"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-snug">{s.title}</span>
                    <ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        )}

        <div className="mt-6 space-y-4">
          {sections.map((s, idx) => (
            <section
              key={s.id}
              id={s.id}
              className="surface-card scroll-mt-24 p-5"
              data-testid={`policy-section-${s.id}`}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm text-primary">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg leading-tight text-primary">
                    {s.title}
                  </h2>
                  <div className="policy-body mt-3 space-y-3 text-sm leading-[1.65] text-foreground/85">
                    {s.body}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {footer && (
          <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-background-alt p-4 text-xs text-muted-foreground">
            {footer}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-soft transition-colors hover:border-primary"
            data-testid="policy-back-to-top"
          >
            <ArrowUp className="size-3.5" />
            Back to top
          </button>
          <Link
            to="/home"
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            ← Return to CashGPT
          </Link>
        </div>
      </div>
    </main>
  );
}

/** Utility helpers for authoring section bodies without extra imports per file. */

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-1.5">{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

export function Callout({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn";
  children: ReactNode;
}) {
  const cls =
    tone === "warn"
      ? "border-gold/40 bg-gold/10 text-gold-dark"
      : "border-primary/30 bg-primary/5 text-primary";
  return (
    <div className={`rounded-xl border ${cls} p-3 text-[13px] leading-relaxed`}>
      {children}
    </div>
  );
}
