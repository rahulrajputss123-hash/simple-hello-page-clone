import { useCallback, useEffect, useRef, useState } from "react";

export type Banner = {
  id: string;
  title: string;
  eyebrow?: string;
  content?: React.ReactNode;
  image?: string;
  className?: string;
  cta?: { label: string; onClick: () => void };
};

export function BannerCarousel({
  banners,
  interval = 4500,
}: {
  banners: Banner[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [count, interval]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      className="relative overflow-hidden rounded-3xl shadow-lift"
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          if (start == null || end == null) return;
          const dx = end - start;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {banners.map((b, i) => (
          <div
            key={b.id}
            aria-hidden={i !== index}
            className={`w-full shrink-0 bg-jade-gradient p-5 text-primary-foreground ${b.className ?? ""}`}
            style={
              b.image
                ? {
                    backgroundImage: `url(${b.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {b.eyebrow ? <p className="text-sm opacity-80">{b.eyebrow}</p> : null}
            <h2 className="mt-1 text-2xl">{b.title}</h2>
            {b.content}
            {b.cta ? (
              <button
                type="button"
                onClick={b.cta.onClick}
                className="mt-4 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold"
              >
                {b.cta.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Go to banner ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-primary-foreground" : "w-1.5 bg-primary-foreground/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
