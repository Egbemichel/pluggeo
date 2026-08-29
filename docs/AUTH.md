# Auth

Clerk, Google sign-in only. No email/password, no other OAuth providers, no magic link.

## Model
- Single role: **admin**, shared by a small allowlist of Google accounts (2026-08-29:
  two admins) — not one-admin-only anymore, but still just an allowlist, not a
  roles/permissions table (every allowed email gets identical full access). There is no
  customer account system — the public storefront is fully unauthenticated (guest
  browsing, guest checkout).
- `/pluggeo/**` routes are gated by Clerk middleware; everything else is public.
- Don't build a roles/permissions table or invite flow — allowlist admin Google accounts
  via `ADMIN_EMAILS` (comma-separated, `src/lib/admin-auth.ts`), not a Clerk-dashboard
  invite flow or per-user roles.

## Implementation notes
- Use Clerk's Next.js middleware to protect the `/pluggeo` route group.
- Restrict sign-in to the accounts on `ADMIN_EMAILS`, not open sign-up — anyone
  authenticating with Google should not automatically get admin access.
