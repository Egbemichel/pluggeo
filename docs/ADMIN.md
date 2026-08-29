# Admin CMS

A small allowlist of admins (2026-08-29: two — see `ADMIN_EMAILS` in `docs/AUTH.md`),
signed in via Google through Clerk. This is the only authenticated surface in the app.
Still no roles/permissions system — every allowed email gets identical full access.

## What the admin manages

- **Products** (built, 2026-08-29): create, edit, delete, publish/unpublish. Name, slug,
  description, price, compare-at price, category, featured flag, variants (label,
  price override, availability, and attributes picked from a fixed category list —
  Size/Width/Length/Gold Color/Gold Type/Material/Chain Length/Stone, see
  `src/lib/product-attributes.ts` — not free text, so the PDP's Customize section can
  group every variant's values into clean, consistent chip rows), media.
- **Media**: image *and* video upload via Cloudinary (`next-cloudinary`'s
  `CldUploadWidget`, signed upload — see below), reorder/remove per product.
- **Categories/collections** (built, 2026-08-29): name, slug, display order —
  create/edit/delete via `/pluggeo/categories`. Deleting a category that still has
  products assigned fails with a plain Postgres FK-violation error rather than
  silently orphaning those products (no cascade).
- **Homepage & page curation** (built, 2026-08-29): `/pluggeo/homepage` curates which
  published products are `featured` and in what order (`featuredOrder`) — this feeds
  the real storefront homepage's "Bestsellers" section directly. Full "choose which
  collections show where across every semi-dynamic page" scope is narrower than that
  in practice right now — just the one curated list — since that's the only section
  that needed admin-driven ordering; the Bracelet/Pendant Collection sections and
  Grillz's collection pull straight from their respective categories instead.

No order management — there's no checkout in scope (see [CLAUDE.md](../CLAUDE.md)).

## Implementation

- Shell (`src/app/pluggeo/layout.tsx` + `src/components/admin/admin-sidebar.tsx`) ported
  (pattern only, restyled to Plug Geo's dark tokens) from
  `Kiranism/next-shadcn-dashboard-starter` — see the sidebar+header shape, no auth/
  billing/kanban/chat pages from that template were pulled in.
- `src/app/pluggeo/products/actions.ts` — Server Actions (`createProduct`, `updateProduct`,
  `deleteProduct`, `setProductStatus`, `getProductWithRelations`), zod-validated, each
  re-checking `getAdminUser()` itself (belt-and-suspenders — `pluggeo/layout.tsx`'s
  `requireAdmin()` already gates the route, but Server Actions can in principle be
  invoked directly).
- **Media storage: Cloudinary, not Cloudflare R2** — R2's free tier requires a card on
  file, Cloudinary's doesn't, per the user. Signed direct upload: the browser's
  `CldUploadWidget` (`src/components/admin/media-upload.tsx`) posts to
  `src/app/api/cloudinary-sign/route.ts` (a Route Handler, not a Server Action — the
  widget's `signatureEndpoint` prop needs a fetchable URL per Cloudinary's own signing
  contract), which signs the params server-side via `src/lib/cloudinary.ts`
  (`CLOUDINARY_API_SECRET` never reaches the browser) and hands back a signature; the
  file then uploads directly to Cloudinary, bypassing the Worker entirely (videos are too
  large to comfortably proxy through a Cloudflare Worker request). The resulting
  `secure_url` is what gets stored in `product_media.url`.
- Product/category forms (`src/components/admin/product-form.tsx`,
  `category-form.tsx`) are plain HTML forms + Server Actions, not react-hook-form —
  the shadcn `form` primitive assumes it, which isn't part of this project's stack
  (see `CLAUDE.md`'s locked data-fetching rules). Media/variants are replace-in-place
  on every save (delete + re-insert), matching "send the whole current form state,"
  not incremental diffing — fine for a single-admin CMS with no concurrent editors.
  Both forms validate client-side with the *same* zod schema the Server Action
  validates with (`src/app/pluggeo/products/schema.ts`,
  `src/app/pluggeo/categories/schema.ts` — pulled out of the actions files since a
  `"use server"` module may only export async functions) — inline per-field errors,
  auto-generated slug from the name, required marks, and a save confirmation on edit.
- `src/app/pluggeo/categories/actions.ts` — same shape as products' actions file, simpler
  (name/slug/displayOrder only). `setFeatured`/`getPublishedProductsForHomepage` live in
  `src/app/pluggeo/products/actions.ts` alongside the rest of the product actions rather
  than a separate file, since they operate on the same `products` table.
- **Storefront reads real data now** (2026-08-29) — `src/lib/products.ts` is the one
  shared query module every public-facing page uses (Shop/Home/Grillz/category/product/
  related/search), all scoped to `status = "published"`. Every storefront route that
  reads it is `export const dynamic = "force-dynamic"` — without that, Next prerenders
  the page once at build time (it has no way to know a plain Drizzle call should ever go
  stale) and a product an admin publishes/edits never actually appears live until the
  next deploy. See PROGRESS.md's resolved-decision entry for how this was caught.

## UX notes

- This is a CMS for a couple of trusted power users, not a general multi-user admin
  panel — no need for activity logs, permission scopes, or approval workflows (both
  admins share identical access, there's no concept of "who changed what").
- Should feel fast for bulk/frequent catalog updates (the admin is expected to update
  products and homepage curation regularly).
