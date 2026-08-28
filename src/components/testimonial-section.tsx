"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { SectionHeader } from "@/components/section-header";
import { cn } from "@/lib/utils";

gsap.registerPlugin(Flip);

// Rebuilt 2026-08-28 against a real Figma screenshot the user provided — the
// previous version (one testimonial's hero + up to 4 *supporting* photos of the
// same person, bento-grid style) didn't match Figma at all. The real layout is a
// filmstrip of *different* testimonials' single photos: a sliver of the previous
// person peeking in from the left edge (cropped), the active person's photo large
// and central (the "hero"), their name/stars/quote immediately beside it, then the
// next one or two people's photos smaller on the right. Exact percentages are
// approximated from the screenshot, not measured — flag if still off.
//
// Animation (re-confirmed by the user after the first version only did an in-place
// scale-pulse, not what was actually asked for): clicking a chevron doesn't just
// change data — the photo that WAS the hero visibly shrinks and slides over to
// become a thumbnail, and the thumbnail on that side visibly grows and slides into
// the hero spot, at the same time. That's a genuine shared-element transition
// (different position *and* size, not just a resize), so this uses GSAP's Flip
// plugin: every visible photo keeps a stable `key`/`data-flip-id` by testimonial
// id, `Flip.getState` is captured right before the index changes, `Flip.from`
// animates the delta after React re-renders with the new roles. Text still does
// its own simple fade-up. Mobile only ever shows one photo (no neighbors to swap
// with), so it keeps the simpler in-place scale+fade tween from the first version.
// Both are gated behind `prefers-reduced-motion` and cleaned up on unmount.

export type Testimonial = {
  id: string;
  name: string;
  rating: number;
  quote: string;
  image: { src: string; alt: string };
};

// Real reviewer photos (public/assets/reviews/1-4.png) replaced the
// placeholder 2026-08-29 — static content, exactly 4 reviews to match the 4
// real photos provided (was 5 placeholder entries before).
const TESTIMONIALS: Testimonial[] = [
  {
    id: "testimonial-1",
    name: 'Deshawn "Trey" Coleman III',
    rating: 5,
    quote: "Custom pendant surprised me like nothing else.",
    image: { src: "/assets/reviews/1.png", alt: "Deshawn \"Trey\" Coleman III" },
  },
  {
    id: "testimonial-2",
    name: "Marcus Webb",
    rating: 5,
    quote: "The craftsmanship is unreal. Worth every penny.",
    image: { src: "/assets/reviews/2.png", alt: "Marcus Webb" },
  },
  {
    id: "testimonial-3",
    name: "Andre Lewis",
    rating: 4,
    quote: "Fast shipping and the chain looks even better in person.",
    image: { src: "/assets/reviews/3.png", alt: "Andre Lewis" },
  },
  {
    id: "testimonial-4",
    name: "Jaylen Brooks",
    rating: 5,
    quote: "Exactly what I designed, down to the last detail.",
    image: { src: "/assets/reviews/4.png", alt: "Jaylen Brooks" },
  },
];

// Hugeicons' free-tier StarIcon is stroke-only (no filled variant), which is why
// stars never looked "filled" before — recoloring a stroke-only icon just changes
// the outline color, it can't produce a solid star. Rendered inline here instead,
// reusing that exact path, so a filled star can actually set fill=currentColor.
const STAR_PATH =
  "M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z";

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-(--space-1)"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rating;
        return (
          <svg
            key={i}
            width={20}
            height={20}
            viewBox="0 0 24 24"
            className={filled ? "text-brand-primary" : "text-border-default"}
            aria-hidden
          >
            <path
              d={STAR_PATH}
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

function TestimonialPhoto({
  testimonial,
  className,
  imgClassName,
  flipRef,
}: {
  testimonial: Testimonial;
  className?: string;
  imgClassName?: string;
  flipRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      data-flip-id={testimonial.id}
      ref={flipRef}
      className={cn("overflow-hidden rounded-md", className)}
    >
      <div className="relative h-full w-full">
        <Image
          src={testimonial.image.src}
          alt={testimonial.image.alt}
          fill
          className={cn("object-cover", imgClassName)}
        />
      </div>
    </div>
  );
}

export type TestimonialSectionProps = {
  testimonials?: Testimonial[];
  className?: string;
};

export function TestimonialSection({
  testimonials = TESTIMONIALS,
  className,
}: TestimonialSectionProps) {
  const [index, setIndex] = useState(Math.min(1, testimonials.length - 1));
  const testimonial = testimonials[index];

  const collageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mobileHeroRef = useRef<HTMLDivElement>(null);
  const mobileTextRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const isFirstRender = useRef(true);

  const canGoPrev = index > 0;
  const canGoNext = index < testimonials.length - 1;

  const goTo = (newIndex: number) => {
    if (collageRef.current) {
      flipState.current = Flip.getState(collageRef.current.querySelectorAll("[data-flip-id]"));
    }
    setIndex(newIndex);
  };
  const goPrev = () => canGoPrev && goTo(index - 1);
  const goNext = () => canGoNext && goTo(index + 1);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      if (flipState.current) {
        Flip.from(flipState.current, {
          duration: 0.7,
          ease: "power3.out",
          scale: true,
          absolute: true,
          onEnter: (els) =>
            gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.25 }),
          onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.3 }),
        });
      }
      gsap.fromTo(
        textRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15, overwrite: true }
      );
    });

    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        mobileHeroRef.current,
        { scale: 0.82, opacity: 0.55 },
        { scale: 1, opacity: 1, duration: 0.7, ease: "power3.out", overwrite: true }
      );
      gsap.fromTo(
        mobileTextRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", overwrite: true }
      );
    });

    flipState.current = null;
    return () => mm.revert();
  }, [index]);

  if (!testimonial) return null;

  const prev = canGoPrev ? testimonials[index - 1] : null;
  const next1 = canGoNext ? testimonials[index + 1] : null;
  const next2 = index < testimonials.length - 2 ? testimonials[index + 2] : null;

  return (
    <section className={cn("flex flex-col gap-(--space-9)", className)}>
      <SectionHeader
        title="What our customers say"
        onPrev={canGoPrev ? goPrev : undefined}
        onNext={canGoNext ? goNext : undefined}
      />

      {/* Desktop: filmstrip collage, all photos absolutely positioned within one
          relative container so GSAP Flip can track each one moving/resizing
          between roles as the active index changes, regardless of how many
          neighbors exist on either side. `key={testimonial.id}` on each
          TestimonialPhoto below is load-bearing, not decorative: it's what makes
          React keep the *same* DOM node for a given person across a re-render
          even though that person moves from one absolutely-positioned slot
          (say, "next1") to a different one (say, "hero") — without it React would
          just swap props on whichever node happens to sit in each fixed slot,
          and Flip would have nothing real to animate between. */}
      <div
        ref={collageRef}
        className="relative hidden md:block"
        style={{ height: "26rem" }}
      >
        {prev && (
          <TestimonialPhoto
            key={prev.id}
            testimonial={prev}
            className="absolute top-0 left-0 h-full w-[6%]"
            imgClassName="object-right"
          />
        )}

        <TestimonialPhoto
          key={testimonial.id}
          testimonial={testimonial}
          flipRef={(el) => {
            heroRef.current = el;
          }}
          className="absolute top-0 left-[9%] h-full w-[32%]"
        />

        <div
          ref={textRef}
          className="absolute top-1/2 left-[44%] flex w-[22%] -translate-y-1/2 flex-col gap-(--space-3)"
        >
          <h3 className="text-h5 font-heading font-bold text-brand-primary">
            {testimonial.name}
          </h3>
          <StarRating rating={testimonial.rating} />
          <p className="text-body-md font-sans font-normal text-text-primary">
            {testimonial.quote}
          </p>
        </div>

        {next1 && (
          <TestimonialPhoto
            key={next1.id}
            testimonial={next1}
            className="absolute top-0 right-0 h-[47%] w-[18%]"
          />
        )}
        {next2 && (
          <TestimonialPhoto
            key={next2.id}
            testimonial={next2}
            className="absolute right-0 bottom-0 h-[47%] w-[18%]"
          />
        )}
      </div>

      {/* Mobile: single hero photo only (no neighbors to peek/swap), simple
          in-place scale+fade tween instead of Flip. */}
      <div className="flex flex-col gap-(--space-6) md:hidden">
        <div ref={mobileHeroRef} className="relative aspect-3/4 overflow-hidden rounded-md">
          <Image
            src={testimonial.image.src}
            alt={testimonial.image.alt}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div ref={mobileTextRef} className="flex flex-col gap-(--space-3)">
          <h3 className="text-h2 font-heading font-bold text-brand-primary">
            {testimonial.name}
          </h3>
          <StarRating rating={testimonial.rating} />
          <p className="text-body-lg font-sans font-normal text-text-primary">
            {testimonial.quote}
          </p>
        </div>
      </div>
    </section>
  );
}
