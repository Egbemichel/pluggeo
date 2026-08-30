"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  PlayCircleIcon,
  PauseCircleIcon,
  VolumeHighIcon,
  VolumeMute02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { MOTION_QUERY } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/media";

export type { MediaItem } from "@/lib/media";

// Product videos were being silently dropped everywhere a product's photos
// render — cards, Shop's spotlight, the PDP gallery — because the media
// query feeding all of them filtered to `type === "image"` only (found
// 2026-08-30, per a user report that uploaded videos never showed up
// anywhere). This is the shared renderer that replaces every plain
// `<Image fill className="..." />` at those call sites: same drop-in shape
// (an absolutely-positioned box, assumes the caller's own wrapper is
// already `relative` — identical to what `fill` already required), but
// renders a real `<video>` with the exact same play/pause + mute/unmute
// controls CelebrityShowcase's own `VideoTile` already established
// (sound-first autoplay, muted fallback if the browser blocks it, no
// native `controls` UI) when the item is a video instead of quietly
// dropping it or forcing it into an `<Image>` that can't play it.

const controlButton =
  "flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm";

function VideoFrame({
  media,
  className,
  controls,
  active,
}: {
  media: MediaItem;
  className?: string;
  controls: boolean;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Driven entirely by the `<video>` element's own `onPlay`/`onPause`/
  // `onVolumeChange` events below, not set directly inside the effect —
  // React flags a setState call synchronously in an effect body as a
  // cascading-render risk, and the video element's real state is the
  // actual source of truth here anyway (native autoplay-block fallbacks,
  // the button handlers, and `loop` finishing all fire these events on
  // their own).
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(!controls);

  // Keyed on `media.src` (via the caller's own `key` prop) rather than
  // remounting logic here — switching which media is active (a Spotlight
  // swipe, a new PDP thumbnail) is expected to remount this component
  // fresh, the same way CelebrityShowcase's own media tiles already key on
  // index/media identity.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!active || window.matchMedia(MOTION_QUERY.reduced).matches) {
      video.pause();
      return;
    }

    if (controls) {
      // Full controls = the one focal item the visitor is actually looking
      // at (Spotlight's active tile, the PDP main image, the lightbox) —
      // attempt real sound first, same as CelebrityShowcase, only falling
      // back to muted if the browser's autoplay policy rejects it.
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    } else {
      // Preview-only context (a cycling card slide, a coverflow neighbor, a
      // gallery thumbnail) — always muted, no controls, just a "live photo".
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [active, controls]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div className="relative size-full bg-black">
      <video
        ref={videoRef}
        src={media.src}
        loop
        playsInline
        muted={!controls}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className={cn("size-full", className)}
      />
      {/* Not currently playing (a paused coverflow neighbor, a gallery
          thumbnail that isn't the active photo) — a bare `<video>` with no
          `poster` shows its first decoded frame on its own in every
          browser that matters here, so this is purely a "there's a video
          here" affordance, not a fallback for a blank frame. */}
      {!active && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Icon icon={PlayCircleIcon} size={28} className="text-white/90 drop-shadow-md" />
        </div>
      )}
      {controls && (
        <div className="absolute right-(--space-3) bottom-(--space-3) flex gap-(--space-2)">
          <button
            type="button"
            aria-label={isPlaying ? "Pause video" : "Play video"}
            onClick={togglePlay}
            className={controlButton}
          >
            <Icon icon={isPlaying ? PauseCircleIcon : PlayCircleIcon} size={20} />
          </button>
          <button
            type="button"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            onClick={toggleMute}
            className={controlButton}
          >
            <Icon icon={isMuted ? VolumeMute02Icon : VolumeHighIcon} size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export type MediaFrameProps = {
  media: MediaItem;
  /** Applied to the `<Image>`/`<video>` element itself — pass the same
   * object-fit class every existing `<Image fill className="..." />` call
   * site already used (`object-cover`, `object-contain`, etc.). */
  className?: string;
  /** Play/pause + mute/unmute buttons, matching CelebrityShowcase's video
   * tiles exactly. Only ever on for the one focal item a section is built
   * around (Spotlight's active coverflow tile, the PDP's main image, the
   * lightbox) — everywhere else a video autoplays muted on loop like a
   * live photo instead, same as an ordinary product photo would just sit
   * there. */
  controls?: boolean;
  /** Whether this item is the one actually being shown/played right now.
   * Cycling and coverflow contexts mount every item at once (for the
   * crossfade/blur transition) but only the active one should play — an
   * inactive video just shows its first frame with a small play-icon
   * affordance, the same way an inactive image tile already just sits
   * there doing nothing. Ignored for images. */
  active?: boolean;
};

export function MediaFrame({ media, className, controls = false, active = true }: MediaFrameProps) {
  return (
    <div className="absolute inset-0">
      {media.type === "video" ? (
        <VideoFrame media={media} className={className} controls={controls} active={active} />
      ) : (
        <Image src={media.src} alt={media.alt} fill className={className} />
      )}
    </div>
  );
}
