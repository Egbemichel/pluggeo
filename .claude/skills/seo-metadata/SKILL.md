---
name: seo-metadata
description: Use when creating or editing any storefront page/route — per-page metadata, OpenGraph tags, and Product structured data for organic discovery. Consult for any app/(storefront)/** page work.
---

# SEO & metadata

There's no checkout and (as far as scope currently states) no ad budget assumed — organic
and social discovery carry real weight for this brand's business viability. Treat SEO as
a real requirement, not an afterthought.

## Rules

- Every storefront page (`app/(storefront)/**`) needs a real `metadata` /
  `generateMetadata` export with a page-specific title and description — don't leave
  the root layout's generic "Plug Geo" title/description as the effective title on
  every page.
- Product Detail Pages need OpenGraph product tags (title, image, description) and
  JSON-LD `Product` structured data (name, image, description, and price/availability
  if/when those are displayed) so products can surface in rich search results and social
  shares.
- If the Shop page's grid/gallery layout toggle is implemented via a query param, make
  sure it doesn't create duplicate-content issues (e.g. a canonical URL pointing at the
  non-parameterized version) — the same catalog shouldn't get indexed twice under two
  URLs.
- Once real routes are stable, add `sitemap.xml` and `robots.txt` (Next's built-in
  `app/sitemap.ts` / `app/robots.ts` conventions) rather than static files.
