"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import { Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { useLaggedMount } from "@/hooks/use-lagged-mount";
import { DURATION, EASE, MOTION_QUERY } from "@/lib/motion";

// Full-screen image preview, per the user: click a product image to bring it
// forward at its real proportions (object-contain, never cropped) over a
// near-black backdrop; tapping the backdrop (not the image itself) closes
// it. Shared by ProductSpotlight (Shop's list-layout swipeable gallery) and
// ImageThumbnail (PDP's main photo) — the two places an image sits with no
// competing click behavior of its own. Deliberately NOT wired into
// ProductCard: its image is the actual navigation Link to the PDP, and
// hijacking that click for a lightbox would remove the main way to reach a
// product from a grid/list — flag if a lightbox there is wanted too, since
// it'd need a separate zoom affordance rather than reusing the card's Link.
//
// Portaled to `document.body`, same reasoning as SearchOverlay's own file
// comment: a `fixed inset-0` overlay breaks if any ancestor ever gets a
// `transform`/`filter`/`view-transition-name` (this app has several that
// legitimately do), so it's structurally sidestepped rather than patched
// per ancestor.
//
// `index` doubles as the open/closed flag (`null` = closed) so a caller
// doesn't need separate `open`/`activeIndex` state. The last non-null index
// is remembered in a ref (same "read/write during render" pattern
// `useLaggedMount` already establishes and lint-exempts) purely so the image
// keeps rendering during the close animation, after the caller has already
// set `index` back to `null`.

export type ImageLightboxProps = {
  images: { src: string; alt: string }[];
  /** `null` closes the lightbox. */
  index: number | null;
  onClose: () => void;
  /** Omit to hide the prev/next arrows (a single-image gallery has nothing
   * to page through). */
  onIndexChange?: (index: number) => void;
};

export function ImageLightbox({ images, index, onClose, onIndexChange }: ImageLightboxProps) {
  const open = index !== null;
  const [mounted, setMounted] = useLaggedMount(open);
  const backdropRef = useRef<HTMLButtonElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const lastIndexRef = useRef(0);

  // Same read/write-during-render pattern useLaggedMount already establishes
  // and lint-exempts (see that file's own comment) — needed so the image
  // keeps rendering, at whichever index it was last open on, through the
  // close animation after the caller has already set `index` back to `null`.
  // eslint-disable-next-line react-hooks/refs -- see comment above
  if (index != null) lastIndexRef.current = index;
  // eslint-disable-next-line react-hooks/refs -- see comment above
  const activeIndex = index ?? lastIndexRef.current;
  const active = images[activeIndex];
  const canGoPrev = index != null && index > 0;
  const canGoNext = index != null && index < images.length - 1;

  useEffect(() => {
    if (!mounted) return;
    const backdrop = backdropRef.current;
    const frame = frameRef.current;
    if (!backdrop || !frame) return;

    const mm = gsap.matchMedia();

    if (open) {
      mm.add(MOTION_QUERY.full, () => {
        gsap.set(backdrop, { opacity: 0 });
        gsap.set(frame, { opacity: 0, scale: 0.94 });
        const tl = gsap.timeline();
        tl.to(backdrop, { opacity: 1, duration: DURATION.entranceSm, ease: EASE.standard });
        tl.to(
          frame,
          { opacity: 1, scale: 1, duration: DURATION.entranceMd, ease: EASE.standard },
          "<"
        );
        return () => tl.kill();
      });
      mm.add(MOTION_QUERY.reduced, () => {
        gsap.set(backdrop, { opacity: 1 });
        gsap.set(frame, { opacity: 1, scale: 1 });
      });
    } else {
      mm.add(MOTION_QUERY.full, () => {
        const tl = gsap.timeline({ onComplete: () => setMounted(false) });
        tl.to(frame, { opacity: 0, scale: 0.94, duration: DURATION.entranceSm, ease: EASE.standardIn });
        tl.to(backdrop, { opacity: 0, duration: DURATION.entranceSm, ease: EASE.standardIn }, "<");
        return () => tl.kill();
      });
      mm.add(MOTION_QUERY.reduced, () => {
        const tween = gsap.to([backdrop, frame], {
          opacity: 0,
          duration: 0.15,
          onComplete: () => setMounted(false),
        });
        return () => tween.kill();
      });
    }

    return () => mm.revert();
  }, [open, mounted, setMounted]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && canGoPrev) onIndexChange?.(index! - 1);
      else if (e.key === "ArrowRight" && canGoNext) onIndexChange?.(index! + 1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, index, canGoPrev, canGoNext, onIndexChange]);

  if (!mounted || !active) return null;

  return createPortal(
    <div className="fixed inset-0 z-999" role="dialog" aria-modal="true" aria-label={active.alt}>
      <button
        ref={backdropRef}
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0 bg-black/90"
      />

      <button
        type="button"
        autoFocus
        aria-label="Close preview"
        onClick={onClose}
        className="absolute top-(--space-6) right-(--space-6) z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <Icon icon={Cancel01Icon} size={24} />
      </button>

      {onIndexChange && canGoPrev && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={() => onIndexChange(index! - 1)}
          className="absolute top-1/2 left-(--space-6) z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <Icon icon={ArrowLeft01Icon} size={24} />
        </button>
      )}
      {onIndexChange && canGoNext && (
        <button
          type="button"
          aria-label="Next image"
          onClick={() => onIndexChange(index! + 1)}
          className="absolute top-1/2 right-(--space-6) z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <Icon icon={ArrowRight01Icon} size={24} />
        </button>
      )}

      {/* No onClick here — clicking anywhere in this box (the image itself,
          or the object-contain letterbox padding around it) is a no-op, not
          a close. Only the backdrop button behind it closes. Deliberately
          NOT pointer-events-none: since this sits later in the DOM (so it
          paints on top of the backdrop), making it non-interactive would let
          every click here fall through to the backdrop button underneath —
          the opposite of "the image itself doesn't close it." */}
      <div
        ref={frameRef}
        className="absolute inset-6 flex items-center justify-center md:inset-16"
      >
        <div className="relative h-full w-full">
          <Image src={active.src} alt={active.alt} fill className="object-contain" sizes="92vw" />
        </div>
      </div>
    </div>,
    document.body
  );
}
