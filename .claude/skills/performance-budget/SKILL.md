---
name: performance-budget
description: Use when adding a heavy dependency, large images, or client-side JS, or reviewing above-the-fold content. Core Web Vitals discipline for a photography-heavy luxury storefront deployed to Cloudflare Workers. Consult when a change adds bundle weight.
---

# Performance budget

A luxury brand's site feeling slow or janky undercuts the brand itself — this is a
business-viability concern, not just a technical one.

## Rules

- Keep `"use client"` boundaries small (see `nextjs-architecture`) — every client
  component adds to the JS shipped to the browser.
- Lazy-load below-the-fold content: gallery images past the first viewport, GSAP
  triggers for sections not immediately visible.
- Product images are the single biggest performance risk on this site — always serve
  responsively sized images with explicit dimensions (see `image-optimization`) to
  avoid layout shift and oversized payloads.
- Watch bundle size before adding a new dependency — Cloudflare Workers has a deploy
  size ceiling (see `nextjs-architecture`), and a large library pulled in for a small
  feature can push a deploy over the edge without warning until it's built.
- Prefer CSS-driven interactions (Tailwind, `:hover`, `transition`) over JS-driven ones
  where the effect is simple enough — reserve GSAP for motion CSS genuinely can't do
  well.
