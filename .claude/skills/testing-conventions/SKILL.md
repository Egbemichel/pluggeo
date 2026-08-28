---
name: testing-conventions
description: Use when writing Vitest unit tests or Playwright e2e tests. Concrete patterns and priorities building on docs/TESTING.md. Consult for any *.test.ts or e2e/*.spec.ts work.
---

# Testing conventions

`docs/TESTING.md` sets the priority order (admin CRUD, auth gating, storefront
rendering, layout toggle). This skill is about *how* to write those tests well.

## Rules

- **Vitest**: unit-test zod schemas, Server Action business logic, and pure utilities.
  Mock the `db` module (`db/index.ts`) rather than hitting real Neon — unit tests should
  be fast and not depend on network/credentials.
- **Playwright**: end-to-end test admin CRUD flows and storefront navigation against a
  real running dev server (already wired via `playwright.config.ts`'s `webServer`).
- Use `data-testid` attributes for Playwright selectors on elements without stable,
  unique text (the Shop layout toggle, admin form action buttons) — don't rely on CSS
  classes (they'll change with restyling) or brittle nth-child selectors.
- Don't write tests for third-party internals — Clerk's own sign-in UI, shadcn
  primitives' internal behavior. Test Plug Geo's own logic and the integration points
  (e.g. "admin route redirects to /sign-in when signed out," not "Clerk's SignIn
  component renders a form").
- A test that never fails is worth checking — make sure new tests actually exercise the
  failure path (e.g. invalid input rejected) once, not just the happy path.
