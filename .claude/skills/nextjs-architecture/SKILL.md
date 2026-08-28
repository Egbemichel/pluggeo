---
name: nextjs-architecture
description: GLOBAL — use for any code touching app/, Server Components, Server Actions, Route Handlers, or the Cloudflare/OpenNext build. Enforces the rendering strategy and Workers-runtime compatibility rules from docs/ARCHITECTURE.md. Consult when writing or reviewing any route or component code.
---

# Next.js / Cloudflare architecture

This app deploys to **Cloudflare Workers** via OpenNext, not Node.js or Vercel — that
constrains what's safe to use.

## Rendering

- Server Components by default. Add `"use client"` only when a component genuinely
  needs state, effects, event handlers, or a client-only library (GSAP).
- Mutations go through Server Actions with zod-validated input, not ad-hoc `fetch` to a
  Route Handler.
- Route Handlers are reserved for the cases Server Actions can't cover (see
  `docs/API.md`) — don't default to them out of habit from a REST-API mindset.
- Don't make an entire page a Client Component to use one interactive widget — push
  `"use client"` down to the smallest subtree that needs it.

## Cloudflare Workers compatibility — check before adding a dependency

- No Node-only APIs: no `fs`, no `child_process`, no persistent TCP sockets. If a
  package needs any of these, it will build fine locally and fail (or silently
  misbehave) on Workers — check compatibility before relying on it.
- **Database**: use `drizzle-orm/neon-http` (already set up in `db/index.ts`) — never
  swap in `node-postgres` or a WebSocket/pooled driver; Workers can't hold the
  persistent connections those need.
- **Images**: Next's built-in image optimizer is `sharp`-based and does not run on
  Workers. Don't assume `next/image` gets free server-side optimization here — see the
  `image-optimization` skill before building anything that resizes/transforms images.
- Watch bundle size — Cloudflare Workers has a deploy size ceiling. A single heavy
  dependency pulled in for a small feature can be the difference between a clean deploy
  and a failed one.
- When genuinely unsure whether something works on Workers, say so rather than
  asserting it does — this is easy to get wrong and expensive to discover at deploy
  time on a 5-day clock.
