# Testing

Vitest (unit/integration) + Playwright (e2e) — the stated defaults. Given the 5-day
build window, coverage should prioritize critical paths over exhaustive coverage:

## Priority order

1. Admin product CRUD (create/edit/delete/publish) — the admin's daily workflow
2. Auth gating — `/admin` routes reject unauthenticated/non-admin access
3. Storefront rendering — home/grillz/category/shop/PDP render correctly from real data
4. Shop page layout toggle (grid vs. gallery)

## Conventions

- Vitest for schema validation, Server Action logic, utility functions
- Playwright for admin CRUD and storefront navigation flows end-to-end
- Don't chase 100% coverage in a 5-day build — critical paths first, expand after v1
  ships if time allows
