/**
 * Precise crop window into one of the uploaded landing images.
 *
 * The uploads arrive with the artwork letterboxed on a black background, and the
 * artwork is not always centred, so a plain `object-cover` can't isolate it.
 * These three numbers position the image so the artwork lands exactly on the
 * container box. Values are measured from the source pixels, not eyeballed.
 */
export type ImageCrop = {
  /** Image width, as a percentage of the container's width. */
  widthPct: number;
  /** Horizontal offset, as a percentage of the container's width. */
  leftPct: number;
  /** Vertical offset, as a percentage of the container's height. */
  topPct: number;
};

/**
 * Renders an uploaded landing image cropped to its artwork.
 *
 * The parent must be positioned and clipped (`relative overflow-hidden`) and set
 * the aspect ratio. `max-w-none` is required so the >100% width isn't clamped.
 *
 * @param blend Maps leftover black (and the artwork's own drop shadow) onto the
 *   dark panel behind it. Only valid on a dark surface, and only when no ancestor
 *   between the blend root and this image creates a stacking context.
 */
export function CroppedArt({
  src,
  alt,
  crop,
  blend = false,
  className = "",
}: {
  src: string;
  alt: string;
  crop: ImageCrop;
  blend?: boolean;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{
        width: `${crop.widthPct}%`,
        left: `${crop.leftPct}%`,
        top: `${crop.topPct}%`,
      }}
      className={`absolute h-auto max-w-none ${blend ? "mix-blend-lighten" : ""} ${className}`}
    />
  );
}
