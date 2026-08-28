# Components

Base: shadcn/ui primitives, heavily restyled to match the Plug Geo design system —
not stock shadcn styling. Tokens driving the restyle come from
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

No Storybook/isolated component preview for v1 — the 5-day window doesn't leave room for
it, and with a single admin user and a fixed screen set, building directly against real
pages is faster than maintaining an isolated catalog. Revisit post-v1 if the component
set grows enough to need it.

## Build order

Building bottom-up (atoms → molecules → organisms) against real Figma node IDs, one
component at a time, before assembling full screen templates — see chat / CHANGELOG for
the running list of what's built vs. still pending.

## Icons — Hugeicons

`@hugeicons/react` (renderer) + `@hugeicons/core-free-icons` (icon data, free tier).
Usage:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon } from "@hugeicons/core-free-icons";

<HugeiconsIcon icon={Home01Icon} size={20} strokeWidth={1.5} />
```

`components.json`'s `iconLibrary` is set to `"hugeicons"`, but shadcn's CLI may not
have a built-in preset for it (its known presets are lucide/radix/phosphor/tabler) — if
`npx shadcn add <component>` pulls in a component that ships with baked-in `lucide-react`
icon imports (e.g. calendar, checkbox, select chevrons), swap those imports to the
Hugeicons equivalent manually rather than assuming the CLI substituted them.
`lucide-react` is not installed — don't reintroduce it.

## Fonts

- **Inter** (body) — loaded via `next/font/google` in `layout.tsx`, no local files
  needed.
- **Quinn** (heading) — a licensed/custom font, not on Google Fonts. Drop the `.ttf`
  file(s) in `src/fonts/` (created for this) and tell me the filename(s)/weight(s) so
  `next/font/local` can be wired up in `layout.tsx` — currently falls back to the
  system sans until that happens.

## Conventions

- `components/ui/` — restyled shadcn primitives (button, input, dialog, etc.)
- `components/` — Plug Geo-specific composed components (ProductCard, CollectionGrid,
  AdminProductForm, etc.)
- Prefer composing restyled primitives over one-off styled components where a primitive
  already covers the case
