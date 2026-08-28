import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// Shared visual shell for the glassmorphic circular icon buttons (black/40 +
// backdrop-blur) — first built for BackToTopButton (Figma node 557:4950), reused
// as-is for the Grillz page's back button per the user ("same style as the back
// to top button"). Extracted here once a second consumer needed the identical
// look, rather than duplicating the classname string.

export type GlassIconButtonProps = {
  icon: IconSvgElement;
  label: string;
  onClick: () => void;
  className?: string;
};

export function GlassIconButton({ icon, label, onClick, className }: GlassIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-14 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md",
        className
      )}
    >
      <Icon icon={icon} size={24} strokeWidth={2} />
    </button>
  );
}
