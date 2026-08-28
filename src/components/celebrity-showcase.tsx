"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import {
  PlayCircleIcon,
  PauseCircleIcon,
  VolumeHighIcon,
  VolumeMute02Icon,
} from "@hugeicons/core-free-icons";
import { CategoryDial, type CategoryDialItem } from "@/components/ui/category-dial";
import { Icon } from "@/components/ui/icon";
import { SectionHeader, SectionCarouselNav } from "@/components/section-header";
import { useViewportEnter } from "@/hooks/use-viewport-enter";
import { DURATION, EASE, MOTION_QUERY, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Celebrity, CelebMedia } from "@/lib/celebrities";

export type { Celebrity, CelebMedia } from "@/lib/celebrities";

// Built from screenshots the user pasted directly (no Figma node). Two independent
// controls: the CategoryDial (vertical on desktop, horizontal on mobile — same
// component, just `orientation`) picks which *celebrity* is shown; the chevron nav
// in SectionHeader pages through *that celebrity's media* (there can be more than
// the 2 slots shown at once).
//
// Real data (2026-08-29): `celebrities` now comes from `getCelebrities()`
// (src/lib/celebrities.ts, a server-only `fs` scan of public/celebrity/) via
// Home's page.tsx, not a hardcoded placeholder list — see that file's own
// comment for the folder-structure contract. A celebrity may have only
// pictures, only videos, or both, in any count; `media` is one flat ordered
// list regardless of type mix, so the existing pagination logic below never
// needed to know which type it's paging through. `celebrities` stays an
// optional prop (defaults to `[]`, renders nothing) rather than required, so
// this component doesn't hard-fail if the folder is ever empty/missing.

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

const tileControlButton =
  "flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm";

// Real video, not a static placeholder-plus-play-icon — autoplay is gated
// behind this tile's own viewport visibility (via useViewportEnter, run
// once per mount) so a video below the fold never starts playing sound
// before the user has actually scrolled to it. Per the user: sound on,
// looping, with custom play/pause + mute/unmute controls (native `controls`
// stays off). Most browsers block unmuted autoplay outright — `play()` is
// attempted with sound first, and only falls back to starting muted if that
// promise rejects, so sound plays whenever the browser actually allows it
// rather than muting unconditionally by default.
function VideoTile({ media, className }: { media: CelebMedia; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const containerRef = useViewportEnter<HTMLDivElement>(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia(MOTION_QUERY.reduced).matches) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    video.play().catch(() => {
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => setIsPlaying(false));
    });
  });

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div
      data-media-tile
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-md bg-black", className)}
    >
      <video ref={videoRef} src={media.src} loop playsInline className="size-full object-cover" />
      <div className="absolute right-(--space-3) bottom-(--space-3) flex gap-(--space-2)">
        <button
          type="button"
          aria-label={isPlaying ? "Pause video" : "Play video"}
          onClick={togglePlay}
          className={tileControlButton}
        >
          <Icon icon={isPlaying ? PauseCircleIcon : PlayCircleIcon} size={20} />
        </button>
        <button
          type="button"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          onClick={toggleMute}
          className={tileControlButton}
        >
          <Icon icon={isMuted ? VolumeMute02Icon : VolumeHighIcon} size={20} />
        </button>
      </div>
    </div>
  );
}

function MediaTile({ media, className }: { media: CelebMedia; className?: string }) {
  if (media.type === "video") {
    return <VideoTile media={media} className={className} />;
  }

  return (
    <div data-media-tile className={cn("relative overflow-hidden rounded-md bg-black", className)}>
      <Image src={media.src} alt={media.alt} fill className="object-cover" />
    </div>
  );
}

export type CelebrityShowcaseProps = {
  celebrities?: Celebrity[];
  className?: string;
};

export function CelebrityShowcase({ celebrities = [], className }: CelebrityShowcaseProps) {
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

        {/* A celebrity with only 1 total media item (several here have just one
            video, no pictures) would otherwise sit lopsided in the grid's first
            column with an empty gap beside it — centered + width-capped instead
            of grid-cols-2's default placement, so a single item still reads as
            a deliberate layout, not a half-empty row. */}
        <div
          ref={mediaGridRef}
          className={cn(
            "grid gap-(--space-6) md:flex-1",
            visibleMedia.length === 1 ? "grid-cols-1 justify-items-center" : "grid-cols-2"
          )}
        >
          {visibleMedia.map((media, i) => (
            <MediaTile
              key={mediaIndex + i}
              media={media}
              className={cn("aspect-3/4", visibleMedia.length === 1 && "w-full max-w-[min(100%,20rem)]")}
            />
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
