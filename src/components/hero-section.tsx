"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { HeroMobileCarousel } from "@/components/hero-mobile-carousel";
import { useViewportEnter } from "@/hooks/use-viewport-enter";
import { EASE, MOTION_QUERY } from "@/lib/motion";

// Built from the real Figma nodes: desktop 598:653, mobile 602:656. Desktop is a
// static 3-column photo collage (col1: hero image + text overlay, then the Button as
// a *separate block below* the image; col2/col3: two stacked images each, different
// height ratios). Mobile is swipeable, per the user: it's the same 5 photos as the
// desktop collage, one at a time, with the Indicator tracking the active slide (see
// HeroMobileCarousel) — not a cropped desktop layout. Real photography exported from
// Figma into public/hero/.
//
// Entrance (desktop only — mobile's "assembly" is the carousel itself, see
// HeroMobileCarousel): each of the 5 collage images fades in from a different
// direction, assembling the final static layout, per the user. The heading
// overlay settles in with its own image rather than a separate word-stagger
// (RevealText would read as busy layered on top of an already-animating
// photo); "Shop now" is the last element, sliding up from below into its
// final position. Staggered via timeline position offsets (each element
// starts 0.15s after the previous, not simultaneously) rather than all
// firing at once — a bigger gap than the app's default card-grid stagger
// since these are large, singular hero elements, not a repeated list.
// Above the fold, so this fires without any scroll needed (IntersectionObserver
// reports already-visible elements immediately on observe()). Runs once —
// useViewportEnter unobserves after the first fire, and a fresh route mount
// (real navigation) is what "page load" means here, not scroll position.

const MAIN_IMAGE = { src: "/hero/hero-main.png", alt: "pluggeo&co — best collection" };

const MOBILE_IMAGES = [
  MAIN_IMAGE,
  { src: "/hero/col2-top.png", alt: "" },
  { src: "/hero/col2-bottom.png", alt: "" },
  { src: "/hero/col3-top.png", alt: "" },
  { src: "/hero/col3-bottom.png", alt: "" },
];

const HERO_STAGGER = 0.15;
const ENTRANCE_DISTANCE = 48;

export function HeroSection() {
  const mainImageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const col2TopRef = useRef<HTMLDivElement>(null);
  const col2BottomRef = useRef<HTMLDivElement>(null);
  const col3TopRef = useRef<HTMLDivElement>(null);
  const col3BottomRef = useRef<HTMLDivElement>(null);

  const sectionRef = useViewportEnter<HTMLElement>(() => {
    const els = {
      main: mainImageRef.current,
      heading: headingRef.current,
      button: buttonRef.current,
      col2Top: col2TopRef.current,
      col2Bottom: col2BottomRef.current,
      col3Top: col3TopRef.current,
      col3Bottom: col3BottomRef.current,
    };
    if (Object.values(els).some((el) => el === null)) return;

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY.full, () => {
      const tl = gsap.timeline({ defaults: { ease: EASE.standard, duration: 0.7 } });
      tl.fromTo(els.main, { opacity: 0, x: -ENTRANCE_DISTANCE }, { opacity: 1, x: 0 });
      tl.fromTo(
        els.col2Top,
        { opacity: 0, y: -ENTRANCE_DISTANCE },
        { opacity: 1, y: 0 },
        `>-${0.7 - HERO_STAGGER}`
      );
      tl.fromTo(
        els.col3Top,
        { opacity: 0, x: ENTRANCE_DISTANCE },
        { opacity: 1, x: 0 },
        `>-${0.7 - HERO_STAGGER}`
      );
      tl.fromTo(
        els.col2Bottom,
        { opacity: 0, y: ENTRANCE_DISTANCE },
        { opacity: 1, y: 0 },
        `>-${0.7 - HERO_STAGGER}`
      );
      tl.fromTo(
        els.col3Bottom,
        { opacity: 0, y: ENTRANCE_DISTANCE },
        { opacity: 1, y: 0 },
        `>-${0.7 - HERO_STAGGER}`
      );
      tl.fromTo(
        els.heading,
        { opacity: 0, y: ENTRANCE_DISTANCE * 0.5 },
        { opacity: 1, y: 0, duration: 0.5 },
        `>-${0.7 - HERO_STAGGER}`
      );
      tl.fromTo(
        els.button,
        { opacity: 0, y: ENTRANCE_DISTANCE },
        { opacity: 1, y: 0 },
        `>-${0.5 - HERO_STAGGER}`
      );

      return () => {
        tl.kill();
      };
    });

    mm.add(MOTION_QUERY.reduced, () => {
      const targets = Object.values(els);
      const tween = gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.15 });
      return () => tween.kill();
    });

    return () => mm.revert();
  });

  return (
    <section ref={sectionRef}>
      {/* Mobile: swipeable carousel through all 5 collage photos */}
      <div className="md:hidden">
        <HeroMobileCarousel images={MOBILE_IMAGES} />
      </div>

      {/* Desktop: 3-column collage */}
      <div className="hidden md:grid md:grid-cols-[480fr_425fr_441fr] md:gap-(--space-5)">
        <div className="flex flex-col gap-(--space-2)">
          <div
            ref={mainImageRef}
            className="relative overflow-hidden rounded-md"
            style={{ aspectRatio: "460 / 575" }}
          >
            <Image
              src={MAIN_IMAGE.src}
              alt={MAIN_IMAGE.alt}
              fill
              className="object-cover"
              priority
            />
            <h2
              ref={headingRef}
              className="absolute bottom-8 left-6 text-[4.0625rem] leading-[1.4] font-heading font-bold text-white"
            >
              Best collection
            </h2>
          </div>
          {/* Real measured values for this exact node (557:3730/557:3731) — 458×110,
              70px text. Was using Button's generic small defaults instead, which is
              why this rendered thin/awkward instead of the thick Figma CTA. */}
          <div ref={buttonRef}>
            <Button
              render={
                <Link href="/shop" transitionTypes={["nav-forward"]}>
                  Shop now
                </Link>
              }
              height={110}
              textSize={70}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-(--space-6)">
          <div
            ref={col2TopRef}
            className="relative overflow-hidden rounded-md"
            style={{ aspectRatio: "425 / 374" }}
          >
            <Image src="/hero/col2-top.png" alt="" fill className="object-cover" />
          </div>
          <div
            ref={col2BottomRef}
            className="relative overflow-hidden rounded-md"
            style={{ aspectRatio: "425 / 311" }}
          >
            <Image src="/hero/col2-bottom.png" alt="" fill className="object-cover" />
          </div>
        </div>

        <div className="flex flex-col gap-(--space-6)">
          <div
            ref={col3TopRef}
            className="relative overflow-hidden rounded-md"
            style={{ aspectRatio: "441 / 307" }}
          >
            <Image src="/hero/col3-top.png" alt="" fill className="object-cover" />
          </div>
          <div
            ref={col3BottomRef}
            className="relative overflow-hidden rounded-md"
            style={{ aspectRatio: "441 / 382" }}
          >
            <Image src="/hero/col3-bottom.png" alt="" fill className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
