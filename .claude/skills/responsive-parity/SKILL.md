---
name: responsive-parity
description: Use when implementing or reviewing any storefront screen for completeness — every page has separate mobile and desktop Figma frames, and both must ship together. Consult whenever a storefront page/component is being built or marked done.
---

# Responsive parity

Every one of the 5 storefront screens (Home, Grillz, Category, Shop, PDP) has distinct
mobile and desktop frames in Figma — not one frame that reflows automatically. Treat
"done" as covering both, always.

## Rules

- Don't implement desktop only and call a screen finished — the mobile frame is an
  equally real deliverable, not a stretch goal to fit in "if there's time."
- Confirm the actual breakpoint cutoff from the Figma frame widths for that screen
  rather than assuming it lines up with Tailwind's default `sm`/`md`/`lg` scale — verify
  per `figma-fidelity` rather than guessing.
- Test interactive pieces (Shop grid/gallery toggle, nav, GSAP-driven reveals, any
  gallery/carousel) at both sizes — a pattern that works with a mouse at desktop width
  can break entirely on touch/mobile.
- When screenshot-diffing per `figma-fidelity`, diff both breakpoints — a desktop-only
  diff doesn't tell you anything about the mobile frame's fidelity.
