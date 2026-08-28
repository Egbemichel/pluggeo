"use client";

import { PointerIcon } from "@hugeicons/core-free-icons";
import { GlassIconButton } from "@/components/ui/glass-icon-button";

// Built from the real Figma node (557:4950, "backToTop") — glassmorphic circular
// button, Hugeicons PointerIcon matches the source "pointer" layer name exactly.
// Visual shell lives in GlassIconButton now, shared with BackButton.
//
// On mobile a plain `scrollTo({top:0, behavior:"smooth"})` was landing a little
// short of true 0 (per the user) — mobile browsers' dynamic address bar can
// shrink/grow the viewport mid-animation, throwing off a smooth scroll's target.
// Forcing an instant scroll to 0 right after guarantees it actually reaches the
// top even if the smooth animation undershoots.

export function BackToTopButton({ className }: { className?: string }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => window.scrollTo(0, 0), 500);
  };

  return (
    <GlassIconButton
      icon={PointerIcon}
      label="Back to top"
      onClick={scrollToTop}
      className={className}
    />
  );
}
