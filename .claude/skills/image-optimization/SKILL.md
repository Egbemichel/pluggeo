---
name: image-optimization
description: Use for any work involving product photography — product cards, galleries, the Shop grid/gallery layouts, or the admin image-upload feature. next/image usage, Cloudflare-compatible hosting, aspect ratio consistency, and alt text. Consult whenever building anything that renders or uploads product images.
---

# Image optimization

This is a photography-led luxury catalog — image handling quality is a direct
business-viability concern, not just a performance nice-to-have.

## Rules

- Always use `next/image`, never a raw `<img>`, for product/collection photography.
- **Cloudflare caveat**: Next's default image optimizer needs `sharp`, which doesn't run
  on Cloudflare Workers (see `nextjs-architecture`). Don't assume automatic server-side
  resizing works out of the box on this deploy target — a Workers-compatible path
  (Cloudflare Images, an R2 + CDN loader, or a custom `next/image` loader) needs to be
  chosen before the image pipeline is built. Flag this as an open infra decision the
  first time it becomes blocking, rather than silently wiring up the default optimizer
  and having it fail at deploy time.
- Keep aspect ratios consistent per card type — the Shop page's grid and horizontal
  gallery layouts will look broken if product cards don't reflow predictably between
  them. Set explicit `width`/`height` (or `aspect-ratio`) to avoid layout shift.
- Alt text must describe the actual product (material, item type, distinguishing
  detail) — see `accessibility`.
- For the admin upload flow, validate real image dimensions/type/size before accepting
  an upload — see `admin-cms-forms` and `security-admin`.
