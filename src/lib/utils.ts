import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Plain `twMerge` doesn't know this project's custom `text-*` size scale (h1-h6,
// display, body-lg/md/sm, eyebrow, card-title, price, caption — see globals.css).
// Its default config only recognizes vanilla Tailwind's own font-size tokens
// (text-sm, text-lg, ...), so it silently treated e.g. `cn("text-h2", ...,
// "text-brand-primary")` as two conflicting "text-color" utilities and dropped
// the size class entirely — confirmed 2026-08-28 after a nav-link size bump
// appeared to do nothing (className, sans the size class, rendered as-is; the
// component wasn't ignoring the fix, `cn()` was silently eating it before the
// class ever reached the DOM). Any of these tokens combined with a text color
// class through `cn()` anywhere in the codebase was affected, not just nav.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display",
        "text-h1",
        "text-h2",
        "text-h3",
        "text-h4",
        "text-h5",
        "text-h6",
        "text-body-lg",
        "text-body-md",
        "text-body-sm",
        "text-caption",
        "text-eyebrow",
        "text-card-title",
        "text-price",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Number = px, string = passed through as-is (any CSS length). */
export function toCssLength(value: number | string | undefined) {
  if (value === undefined) return undefined
  return typeof value === "number" ? `${value}px` : value
}
