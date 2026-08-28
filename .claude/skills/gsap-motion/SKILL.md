---
name: gsap-motion
description: Use when adding or editing GSAP animations. Cleanup, reduced-motion, and Server/Client Component boundary rules. Consult for any "use client" component that imports gsap.
---

# GSAP motion conventions

GSAP is the only heavy client-side dependency in this project (`docs/ARCHITECTURE.md`)
— keep its usage disciplined so it stays a performance/accessibility asset, not a
liability.

## Rules

- GSAP only runs in Client Components — any file using it needs `"use client"` at the
  top. Never import `gsap` into a Server Component.
- Always clean up animations and any `ScrollTrigger`/timeline instances in a `useEffect`
  cleanup function. Next's App Router doesn't full-reload between route changes, so
  uncleaned GSAP instances leak and can double-fire on revisit.
- Gate motion behind `prefers-reduced-motion` using `gsap.matchMedia()` — don't force
  animation on users who've asked their OS to reduce it (see `accessibility`).
- Prefer animating `transform`/`opacity` (GPU-friendly) over layout-triggering
  properties (`width`, `top`, `left`) to avoid jank, especially on product-heavy pages
  with lots of images already competing for paint time.
- Keep GSAP scoped to the component that needs it — don't wrap large sections of a page
  in a client boundary just to animate one element (see `nextjs-architecture`).
