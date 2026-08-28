"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { PlayCircleIcon } from "@hugeicons/core-free-icons";
import { CategoryDial, type CategoryDialItem } from "@/components/ui/category-dial";
import { Icon } from "@/components/ui/icon";
import { SectionHeader, SectionCarouselNav } from "@/components/section-header";
import { useViewportEnter } from "@/hooks/use-viewport-enter";
import { DURATION, EASE, MOTION_QUERY, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Built from screenshots the user pasted directly (no Figma node). Two independent
// controls: the CategoryDial (vertical on desktop, horizontal on mobile — same
// component, just `orientation`) picks which *celebrity* is shown; the chevron nav
// in SectionHeader pages through *that celebrity's media* (there can be more than
// the 2 slots shown at once). Each media slot can be an image or a video — video
// slots get a dimmed overlay + play icon. Placeholder image on every slot per the
// user; celebrity handles are placeholder labels too, not real handles.

export type CelebMedia = { type: "image" | "video"; src: string; alt: string };
export type Celebrity = { id: string; handle: string; media: CelebMedia[] };

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

const CELEBRITIES: Celebrity[] = [
  "Celebrity1",
  "Celebrity2",
  "Celebrity3",
  "Celebrity4",
  "Celebrity5",
  "Celebrity6",
  "Celebrity7",
].map((name, i) => ({
  id: name.toLowerCase(),
  handle: `@${name.toUpperCase()}`,
  media:
    i === 3
      ? [
          { type: "image", src: PLACEHOLDER_IMAGE, alt: name },
          { type: "video", src: PLACEHOLDER_IMAGE, alt: name },
          { type: "image", src: PLACEHOLDER_IMAGE, alt: name },
        ]
      : [
          { type: "image", src: PLACEHOLDER_IMAGE, alt: name },
          { type: "video", src: PLACEHOLDER_IMAGE, alt: name },
        ],
}));

function playMediaReveal(container: HTMLElement) {
  const mm = gsap.matchMedia();

  mm.add(MOTION_QUERY.full, () => {
    const targets = container.querySelectorAll<HTMLElement>("[data-media-tile]");
    const tween = gsap.fromTo(
      targets,
      { opacity: 0, x: 24 },
      {
        opacity: 1,
        x: 0,
        duration: DURATION.entranceSm,
        ease: EASE.standard,
        stagger: { each: STAGGER.tight, from: "end" },
      }
    );
    return () => tween.kill();
  });

  mm.add(MOTION_QUERY.reduced, () => {
    const targets = container.querySelectorAll<HTMLElement>("[data-media-tile]");
    const tween = gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.15 });
    return () => tween.kill();
  });

  return () => mm.revert();
}

function MediaTile({ media, className }: { media: CelebMedia; className?: string }) {
  return (
    <div data-media-tile className={cn("relative overflow-hidden rounded-md bg-black", className)}>
      <Image
        src={media.src}
        alt={media.alt}
        fill
        className={cn("object-cover", media.type === "video" && "opacity-60")}
      />
      {media.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon icon={PlayCircleIcon} size={40} className="text-white" />
        </div>
      )}
    </div>
  );
}

export type CelebrityShowcaseProps = {
  celebrities?: Celebrity[];
  className?: string;
};

export function CelebrityShowcase({
  celebrities = CELEBRITIES,
  className,
}: CelebrityShowcaseProps) {
  const [activeId, setActiveId] = useState(celebrities[0]?.id ?? "");
  const [mediaIndex, setMediaIndex] = useState(0);

  // First appearance is viewport-gated (run once, per the spec's Replay list);
  // every subsequent celebrity/media-page switch is an interaction, not a
  // scroll event, so it re-plays every time — same split as
  // TestimonialSection's Flip transition (`isFirstRender` skip) below.
  const mediaGridRef = useViewportEnter<HTMLDivElement>((container) => playMediaReveal(container));
  const isFirstMediaRender = useRef(true);

  useLayoutEffect(() => {
    if (isFirstMediaRender.current) {
      isFirstMediaRender.current = false;
      return;
    }
    const container = mediaGridRef.current;
    if (!container) return;
    return playMediaReveal(container);
  }, [activeId, mediaIndex, mediaGridRef]);

  const active = celebrities.find((c) => c.id === activeId) ?? celebrities[0];
  const items: CategoryDialItem[] = celebrities.map((c) => ({
    id: c.id,
    label: c.handle,
  }));

  const handleSelectCelebrity = (id: string) => {
    setActiveId(id);
    setMediaIndex(0);
  };

  if (!active) return null;

  const mediaCount = active.media.length;
  const visibleMedia = active.media.slice(mediaIndex, mediaIndex + 2);
  const canGoPrev = mediaIndex > 0;
  const canGoNext = mediaIndex + 2 < mediaCount;
  const goPrev = () => setMediaIndex((i) => Math.max(0, i - 2));
  const goNext = () => setMediaIndex((i) => Math.min(mediaCount - 2, i + 2));

  return (
    <div className={cn("flex flex-col gap-(--space-9)", className)}>
      <SectionHeader
        title="Worn by your favorite celebs"
        onPrev={canGoPrev ? goPrev : undefined}
        onNext={canGoNext ? goNext : undefined}
      />

      <div className="flex flex-col gap-(--space-6) md:flex-row md:items-stretch md:gap-(--space-9)">
        <CategoryDial
          items={items}
          activeId={activeId}
          onActiveChange={handleSelectCelebrity}
          orientation="vertical"
          className="hidden md:flex"
        />

        <div ref={mediaGridRef} className="grid grid-cols-2 gap-(--space-6) md:flex-1">
          {visibleMedia.map((media, i) => (
            <MediaTile key={mediaIndex + i} media={media} className="aspect-3/4" />
          ))}
        </div>
      </div>

      {/* forceVisible: this stays on screen under the media tiles even for a
          celebrity with only 2 media items (nothing to page) — per the user, it
          should read as a persistent control, not one that disappears depending
          on which celebrity is selected; the buttons themselves still disable
          correctly via onPrev/onNext being undefined. */}
      <SectionCarouselNav
        onPrev={canGoPrev ? goPrev : undefined}
        onNext={canGoNext ? goNext : undefined}
        forceVisible
        className="flex justify-center self-center md:hidden"
      />

      <CategoryDial
        items={items}
        activeId={activeId}
        onActiveChange={handleSelectCelebrity}
        orientation="horizontal"
        className="md:hidden"
      />
    </div>
  );
}
