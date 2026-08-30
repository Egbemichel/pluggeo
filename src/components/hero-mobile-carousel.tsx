"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Indicator } from "@/components/ui/indicator";
import { useViewportEnter } from "@/hooks/use-viewport-enter";
import { EASE, MOTION_QUERY } from "@/lib/motion";

// The mobile hero (Figma 602:656) shows the first image with a 3-dot Indicator —
// per the user, that means the other 4 images from the desktop collage are reachable
// by swiping here, with the indicator tracking whichever slide is active. Native
// scroll-snap does the swipe/momentum for free (no gesture library needed); scroll
// position drives the active index.
//
// Entrance: per the user, mobile images "swipe themselves in" on load rather than
// waiting for a user gesture — the track slides in from the right (echoing the swipe
// direction itself) while heading and the button/indicator row settle in afterward,
// staggered. Above the fold, so this fires without scrolling; run-once, same as the
// desktop collage build.

export type HeroMobileCarouselProps = {
  images: { src: string; alt: string }[];
};

export function HeroMobileCarousel({ images }: HeroMobileCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const containerRef = useViewportEnter<HTMLDivElement>(() => {
    const track = scrollRef.current;
    const heading = headingRef.current;
    const footer = footerRef.current;
    if (!track || !heading || !footer) return;

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY.full, () => {
      const tl = gsap.timeline({ defaults: { ease: EASE.standard } });
      tl.fromTo(track, { opacity: 0, x: "35%" }, { opacity: 1, x: "0%", duration: 0.6 });
      tl.fromTo(
        heading,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.45 },
        ">-0.15"
      );
      tl.fromTo(footer, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45 }, ">-0.15");

      return () => {
        tl.kill();
      };
    });

    mm.add(MOTION_QUERY.reduced, () => {
      const tween = gsap.fromTo(
        [track, heading, footer],
        { opacity: 0 },
        { opacity: 1, duration: 0.15 }
      );
      return () => tween.kill();
    });

    return () => mm.revert();
  });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-md"
      style={{ aspectRatio: "341 / 427" }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ scrollbarWidth: "none" }}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <div key={image.src} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              priority={index === 0}
              // See hero-section.tsx's comment on its own main image —
              // `priority` and `fetchPriority` are independent props.
              fetchPriority={index === 0 ? "high" : undefined}
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex flex-col gap-(--space-3) p-(--space-6)">
        <h2 ref={headingRef} className="text-4xl leading-[1.4] font-heading font-bold text-white">
          Best collection
        </h2>
        <div ref={footerRef} className="pointer-events-auto flex items-center justify-between">
          <Button
            render={
              <Link href="/shop" transitionTypes={["nav-forward"]}>
                Shop now
              </Link>
            }
            height={51}
            width={210}
            textSize={18}
          />
          <Indicator count={images.length} activeIndex={activeIndex} />
        </div>
      </div>
    </div>
  );
}
