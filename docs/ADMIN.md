# Admin CMS

One user (the admin), signed in via Google through Clerk. This is the only authenticated
surface in the app.

## What the admin manages

- **Products** (built, 2026-08-29): create, edit, delete, publish/unpublish. Name, slug,
  description, price, compare-at price, category, featured flag, variants (flexible
  label + key/value attributes, price override, availability), media.
- **Media**: image *and* video upload via Cloudinary (`next-cloudinary`'s
  `CldUploadWidget`, signed upload — see below), reorder/remove per product.
- **Categories/collections**: grillz, watches, sets, bracelets, chains (confirm full list
  against Figma) — create/edit, display order. *Not built yet* — stubbed as "coming soon"
  in the admin sidebar.
- **Homepage & page curation**: choose which products/collections are featured and where,
  across the homepage and other semi-dynamic pages. *Not built yet* — stubbed as "coming
  soon" in the admin sidebar.

No order management — there's no checkout in scope (see [CLAUDE.md](../CLAUDE.md)).

## Implementation

- Shell (`src/app/admin/layout.tsx` + `src/components/admin/admin-sidebar.tsx`) ported
  (pattern only, restyled to Plug Geo's dark tokens) from
  `Kiranism/next-shadcn-dashboard-starter` — see the sidebar+header shape, no auth/
  billing/kanban/chat pages from that template were pulled in.
- `src/app/admin/products/actions.ts` — Server Actions (`createProduct`, `updateProduct`,
  `deleteProduct`, `setProductStatus`, `getProductWithRelations`), zod-validated, each
  re-checking `getAdminUser()` itself (belt-and-suspenders — `admin/layout.tsx`'s
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
- Product form (`src/components/admin/product-form.tsx`) is a plain HTML form + Server
  Actions, not react-hook-form — the shadcn `form` primitive assumes it, which isn't part
  of this project's stack (see `CLAUDE.md`'s locked data-fetching rules). Media/variants
  are replace-in-place on every save (delete + re-insert), which matches "send the whole
  current form state," not incremental diffing — fine for a single-admin CMS with no
  concurrent editors.

## UX notes

- This is a CMS for one power user, not a multi-user admin panel — no need for activity
  logs, permission scopes, or approval workflows.
- Should feel fast for bulk/frequent catalog updates (the admin is expected to update
  products and homepage curation regularly).
