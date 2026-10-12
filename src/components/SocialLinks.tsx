import { SOCIAL_LINKS } from "@/lib/social-links";

const ICONS = {
  x: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.24-8.28L2.8 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.9h1.73L8.27 3.98H6.41L17.8 19.9Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M5.2 3.5A2.2 2.2 0 1 1 5.2 7.9a2.2 2.2 0 0 1 0-4.4ZM3.3 9.6h3.8V21H3.3V9.6Zm6.2 0h3.6v1.56h.05c.5-.95 1.72-1.95 3.54-1.95 3.78 0 4.48 2.49 4.48 5.73V21h-3.78v-5.37c0-1.28-.02-2.92-1.78-2.92-1.79 0-2.06 1.4-2.06 2.83V21H9.5V9.6Z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 12 16.5a4.5 4.5 0 0 1 0-9Zm0 2A2.5 2.5 0 1 0 12 14.5a2.5 2.5 0 0 0 0-5Zm5-2.25a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M21.7 3.3 2.4 10.75c-1.32.53-1.31 1.27-.24 1.6l4.95 1.54 1.9 5.8c.23.64.12.9.8.9.53 0 .76-.24 1.05-.53l2.4-2.33 5 3.7c.92.51 1.58.25 1.81-.85l3.28-15.45c.34-1.36-.52-1.98-1.65-1.28ZM8.1 13.55l10.9-6.88c.54-.33 1.03-.15.63.2l-8.82 7.96-.34 3.63-2.37-4.91Z" />
    </svg>
  ),
} as const;

const LABELS = {
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  instagram: "Instagram",
  telegram: "Telegram",
} as const;

export function SocialLinks() {
  return (
    <nav aria-label="Social links" className="flex items-center justify-center gap-3">
      {(Object.keys(SOCIAL_LINKS) as Array<keyof typeof SOCIAL_LINKS>).map((network) => {
        const href = SOCIAL_LINKS[network];
        if (!href) return null;
        return (
          <a
            key={network}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={LABELS[network]}
            className="inline-flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors hover:bg-background-alt hover:text-foreground"
          >
            <span className="size-4">{ICONS[network]}</span>
          </a>
        );
      })}
    </nav>
  );
}
