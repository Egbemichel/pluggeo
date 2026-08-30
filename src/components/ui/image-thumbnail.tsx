"use client";

import { useState } from "react";
import { FullScreenIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { MediaFrame } from "@/components/ui/media-tile";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/media";

// Rebuilt against a real PDP screenshot (desktop + mobile) — no Figma node/
// link this time. One shared card frame (rounded-xl, thin
// border-border-default) holds the main image on top and the 3 thumbnails
// (aspect-[4/3]) in a row below, each individually rounded-md with tight
// gaps — a noticeably tighter, "photo mount" look than a plain
// image-plus-separate-thumbnail-row. The reference doesn't show any visible
// highlight on a selected thumbnail (a static screenshot can't capture a
// post-click state), so non-active thumbnails just dim slightly — the only
// real feedback that clicking one did something, without adding a
// border/ring the design doesn't show.
//
// Click-to-enlarge (2026-08-30, per the user): the main image isn't a
// navigation link to anywhere, so clicking it to open ImageLightbox has no
// competing behavior to conflict with (unlike ProductCard's image, which
// links to the PDP). Arrowing through the lightbox also moves this
// component's own `activeIndex`, so the thumbnail row reflects wherever the
// customer navigated to once they close it.
//
// Main image, uncropped (2026-08-30, per the user): was aspect-[8/5] +
// object-cover, which crops whatever doesn't fit that fixed landscape
// shape — real product photos aren't all 8:5, so a portrait or square photo
// lost real content off its edges. Switched to aspect-square (bigger than
// 8/5 was at the same width, ~60% more height) + object-contain, which
// always shows the complete photo — any mismatch between the photo's real
// ratio and this box just letterboxes instead of cropping, never cuts
// anything off.

export type ImageThumbnailProps = {
  images: MediaItem[];
  className?: string;
};

export function ImageThumbnail({ images, className }: ImageThumbnailProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const active = images[activeIndex];

  if (!active) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-4) rounded-xl border border-border-default bg-surface-primary p-(--space-4)",
        className
      )}
    >
      {/* A video gets real play/pause + mute/unmute controls (2026-08-30,
          per the user — a product video should play the same way
          CelebrityShowcase's videos do, not sit there as a silent image
          substitute), which can't live inside a button that also opens the
          lightbox on any click (a `<button>` in a `<button>` is invalid
          markup, and the click would fight the video's own controls
          anyway) — so only an image keeps the whole-tile "click to
          enlarge" button; a video gets its own explicit fullscreen button
          in the opposite corner instead. */}
      {active.type === "video" ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
          <MediaFrame key={active.src} media={active} className="object-contain" controls active />
          <button
            type="button"
            aria-label="View larger"
            onClick={() => setLightboxIndex(activeIndex)}
            className="absolute top-(--space-3) right-(--space-3) flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          >
            <Icon icon={FullScreenIcon} size={18} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="View larger image"
          onClick={() => setLightboxIndex(activeIndex)}
          className="relative aspect-square w-full overflow-hidden rounded-md bg-muted"
        >
          <MediaFrame media={active} className="object-contain" />
        </button>
      )}

      <ImageLightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(i) => {
          setLightboxIndex(i);
          setActiveIndex(i);
        }}
      />

      {images.length > 1 && (
        <div className="grid grid-cols-3 gap-(--space-4)">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show ${image.type === "video" ? "video" : "image"} ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-4/3 overflow-hidden rounded-md transition-opacity",
                index !== activeIndex && "opacity-60"
              )}
            >
              <MediaFrame media={image} className="object-cover" active={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
