"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// Built from the real Figma node (596:597, "imageGallery"), broken down per the
// user's instruction — the huge parent frame (596:600) actually contained two
// separate things: this carousel, and a Shop gallery-mode product list (see
// ProductList). Side images are blurred + ~76% the height of the center one
// (measured: 278/366 and 277.9/366), with a soft blurred ellipse under each
// simulating a shadow/reflection. Chevron controls below the image, right-aligned,
// are the user's own addition (not in the source Figma).

export type ImageCarouselProps = {
  images: { src: string; alt: string }[];
  className?: string;
};

export function ImageCarousel({ images, className }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = images.length;

  if (count === 0) return null;

  const prevIndex = (activeIndex - 1 + count) % count;
  const nextIndex = (activeIndex + 1) % count;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-end justify-center gap-(--space-6)">
        {count > 1 && (
          <CarouselImage image={images[prevIndex]} active={false} />
        )}
        <CarouselImage image={images[activeIndex]} active />
        {count > 1 && (
          <CarouselImage image={images[nextIndex]} active={false} />
        )}
      </div>

      {count > 1 && (
        <div className="mt-(--space-6) flex justify-end gap-(--space-4)">
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => setActiveIndex(prevIndex)}
            className="flex size-10 items-center justify-center rounded-sm border border-black"
          >
            <Icon icon={ArrowLeft01Icon} size={20} className="text-brand-primary" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => setActiveIndex(nextIndex)}
            className="flex size-10 items-center justify-center rounded-sm border border-black"
          >
            <Icon icon={ArrowRight01Icon} size={20} className="text-brand-primary" />
          </button>
        </div>
      )}
    </div>
  );
}

function CarouselImage({
  image,
  active,
}: {
  image: { src: string; alt: string };
  active: boolean;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "relative overflow-hidden rounded-md transition-all",
          active ? "h-91.5 w-85.5" : "h-69.5 w-53.75 opacity-70 blur-sm"
        )}
      >
        <Image src={image.src} alt={image.alt} fill className="object-cover" />
      </div>
      <div
        aria-hidden
        className={cn(
          "mx-auto -mt-3 h-6 rounded-full bg-black/40 blur-md",
          active ? "w-42.5" : "w-30"
        )}
      />
    </div>
  );
}
