"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Rebuilt against a real PDP screenshot (desktop + mobile) — no Figma node/
// link this time. Not used anywhere else in the app yet, so free to redesign
// without regressing another page. One shared card frame (rounded-xl, thin
// border-border-default) holds a wide/landscape main image (aspect-[8/5], not
// square — a square main image read "far too big" against this reference) on
// top and the 3 thumbnails (aspect-[4/3]) in a row below, each individually
// rounded-md with tight gaps — a noticeably tighter, "photo mount" look than
// a plain image-plus-separate-thumbnail-row. The reference doesn't show any
// visible highlight on a selected thumbnail (a static screenshot can't
// capture a post-click state), so non-active thumbnails just dim slightly —
// the only real feedback that clicking one did something, without adding a
// border/ring the design doesn't show.

export type ImageThumbnailProps = {
  images: { src: string; alt: string }[];
  className?: string;
};

export function ImageThumbnail({ images, className }: ImageThumbnailProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!active) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-4) rounded-xl border border-border-default bg-surface-primary p-(--space-4)",
        className
      )}
    >
      <div className="relative aspect-8/5 w-full overflow-hidden rounded-md">
        <Image src={active.src} alt={active.alt} fill className="object-cover" />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-3 gap-(--space-4)">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-4/3 overflow-hidden rounded-md transition-opacity",
                index !== activeIndex && "opacity-60"
              )}
            >
              <Image src={image.src} alt={image.alt} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
