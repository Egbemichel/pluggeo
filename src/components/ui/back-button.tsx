"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { GlassIconButton } from "@/components/ui/glass-icon-button";

// Same glassmorphic shell as BackToTopButton, per the user — only used on the
// Grillz page's navbar (see NavBar's own comment for where it's slotted in).
// Navigates via browser history (`router.back()`) rather than a fixed href,
// since "back" should return to wherever the visitor actually came from
// (the Grillz tile is reachable from Home's category collage, Shop, etc.).

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <GlassIconButton
      icon={ArrowLeft01Icon}
      label="Go back"
      onClick={() => router.back()}
      className={className}
    />
  );
}
