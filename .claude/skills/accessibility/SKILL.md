---
name: accessibility
description: GLOBAL — use for any UI/component work on the public storefront or admin CMS. Baseline accessibility checklist (alt text, contrast, keyboard/focus, semantic HTML, reduced motion). Consult for any change that renders visible UI.
---

# Accessibility baseline

This is a real public storefront, not an internal tool — treat accessibility as part of
"done," not a follow-up pass.

## Checklist

- **Images**: every product/collection image needs real, descriptive alt text (e.g.
  "18k gold Cuban link chain, 20 inch" — not "product image" or the filename).
  Decorative images (backgrounds, dividers) get `alt=""`.
- **Contrast**: check any new text/background color pairing against the actual token
  values, not just visually — `text-secondary` (`#727272` gray) on `surface-dark`
  (`#141B34` navy) is close to WCAG AA for normal text; verify before using that
  pairing for anything smaller than large text, and flag it if a real pairing falls
  short rather than shipping it anyway.
- **Focus states**: every interactive element needs a visible focus state. The shadcn
  Button already has one (`focus-visible:ring-*`) — match that pattern for new
  interactive components, don't strip focus outlines for aesthetics.
- **Keyboard operability**: anything custom-built (the Shop grid/gallery toggle, PDP
  image gallery, any carousel) must be fully usable with keyboard alone, not just
  mouse/touch.
- **Semantic HTML**: use `nav`, `main`, `header`, `footer`, `article`/`section` for
  structural regions and product cards — not an unbroken stack of `div`s. Use real
  `button`/`a` elements for actions/links, not clickable `div`s.
- **Forms** (admin CMS): every input needs an associated `label`, and validation errors
  need to be announced/associated with their field, not just shown as floating color
  changes.
- **Motion**: GSAP animations must respect `prefers-reduced-motion` — see the
  `gsap-motion` skill.
