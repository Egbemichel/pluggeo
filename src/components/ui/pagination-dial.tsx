"use client";

import {
  coverflowBlurForDistance,
  coverflowRadiusForDistance,
  coverflowSizeForDistance,
} from "@/lib/coverflow";
import { useDialWave } from "@/hooks/use-dial-wave";
import { cn } from "@/lib/utils";

// Built from the real Figma node (557:4754), but generalized — the source instance
// was one static frame (6 pages, active page "4" larger/sharp, others smaller). Size
// scaling is shared with CategoryDial via lib/coverflow.ts (see that file for the
// blur-asymmetry flag).

export type PaginationDialProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** How many neighboring pages to show on each side of the active page. */
  neighbors?: number;
  className?: string;
};

export function PaginationDial({
  currentPage,
  totalPages,
  onPageChange,
  neighbors = 3,
  className,
}: PaginationDialProps) {
  const start = Math.max(1, currentPage - neighbors);
  const end = Math.min(totalPages, currentPage + neighbors);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  // Same shared dial-wave interaction as CategoryDial — see its own file.
  const { itemRef, containerProps } = useDialWave({
    onSelectAtRelease: (index) => {
      const page = pages[index];
      if (page != null) onPageChange(page);
    },
  });

  return (
    <div
      className={cn("flex items-center justify-center gap-(--space-3)", className)}
      {...containerProps}
    >
      {pages.map((page, index) => {
        const distance = Math.abs(page - currentPage);
        const size = coverflowSizeForDistance(distance);

        return (
          <button
            key={page}
            ref={itemRef(index)}
            type="button"
            aria-label={`Page ${page}`}
            aria-current={distance === 0 ? "page" : undefined}
            onClick={() => onPageChange(page)}
            style={{
              width: size,
              height: size,
              borderRadius: coverflowRadiusForDistance(distance),
              filter: coverflowBlurForDistance(distance),
            }}
            className="flex shrink-0 items-center justify-center border border-black bg-white font-heading text-[3.75rem] leading-[1.4] font-bold text-text-primary transition-[filter]"
          >
            {page}
          </button>
        );
      })}
    </div>
  );
}
