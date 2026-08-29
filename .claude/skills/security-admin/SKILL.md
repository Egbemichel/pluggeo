---
name: security-admin
description: Use when touching auth, Server Actions, or file uploads anywhere under src/app/pluggeo/** or src/lib/admin-auth.ts. Security checklist for the single-admin surface. Consult for any admin-facing or auth-adjacent code change.
---

# Admin security checklist

A small allowlist of Google accounts (2026-08-29: two admins) — small surface, but
still a real security boundary guarding the entire catalog. Don't treat it as low-risk
just because the allowlist is short; every allowed email gets identical, unrestricted
access.

## Rules

- Every mutating Server Action re-checks `requireAdmin()` (or equivalent) itself, even
  when only reachable from an already-gated `/pluggeo` page. Never rely solely on
  route-level middleware — Server Actions can be invoked directly.
- Validate all Server Action input server-side with zod, even though the only caller is
  the trusted admin — browser requests can still be malformed, replayed, or forged.
- Image uploads need server-side validation of type/size/dimensions, not just a client
  check (client-side checks are trivially bypassable).
- Never trust client-supplied values for anything with integrity implications (price,
  slug, status) without re-validating server-side against the schema, even in a
  single-admin app — a compromised browser session shouldn't be able to write arbitrary
  data.
- `ADMIN_EMAILS` is a server-only check (`src/lib/admin-auth.ts`) — never expose it via a
  `NEXT_PUBLIC_*` env var or leak it to the client bundle.
- Keep Clerk secrets and the `ADMIN_EMAILS` value in environment variables/Cloudflare
  secrets only — never hardcoded, never logged.
