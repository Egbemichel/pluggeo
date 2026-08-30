# Project

## What it is

pluggeo&co is a luxury jewelry ecommerce brand — watches, grills, jewelry sets, bracelets,
and chains, with a streetwear/rapper-luxury aesthetic (diamonds, gold, high-shine product
photography). The site sells directly to consumers; there is no marketplace or
multi-seller component.

## Who runs it

One admin. No staff roles, no customer accounts. The admin manages the entire catalog —
products, images, pricing, and what's featured on the homepage and other pages — through
a CMS-style admin panel (see [ADMIN.md](ADMIN.md)).

## Scope

Full build, no MVP, nothing deferred to a later phase. Everything below ships in v1,
within the 5-day build window.

### Public site — screens (per Figma, mobile + desktop both designed)

- **Home** — admin-curated featured products/collections
- **Grillz** — dedicated bespoke page for the grillz category (not the generic
  per-category template, even though grillz is technically a category)
- **Per-category page** — one template for the other categories (watches, sets,
  bracelets, chains)
- **Shop** — full catalog, with two selectable layouts: grid and horizontal gallery
- **Product detail page (PDP)** — images, price, description, variant selection if
  applicable

This is a catalog/showcase site — no cart, no checkout, no orders. See "Out of scope"
in [CLAUDE.md](../CLAUDE.md).

### Admin CMS (Google sign-in, admin-only)

- Product CRUD: create/edit/delete products, upload/manage images, set price and variants
- Collection/category management
- Homepage/featured-content curation (choose what's displayed where)

## Explicitly out of scope for v1

- Checkout, cart, orders, payments — see [CLAUDE.md](../CLAUDE.md)

Otherwise: nothing else is deferred — everything above ships in the first pass. If
something can't fit in 5 days, that's a timeline call to raise with the user, not a
scope cut to make silently.

## Open questions

- Exact static page list (About/Contact/policies, if any) — confirm during build
- Full category list beyond grillz/watches/sets/bracelets/chains — confirm against Figma
