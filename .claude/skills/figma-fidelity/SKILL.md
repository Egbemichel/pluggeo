---
name: figma-fidelity
description: Use when building or updating any storefront screen (Home, Grillz, Category, Shop, PDP) from a Figma frame. The hybrid build-frame + Code Connect + screenshot-diff workflow, and mobile/desktop parity. Consult whenever implementing a page against a Figma design.
---

# Figma fidelity workflow

Per `docs/FIGMA_MAPPING.md`, the user wants a hybrid approach for pixel-accuracy — use
all three together, not just one:

1. **Build the frame** — implement layout, spacing, and structure from the Figma frame,
   using tokens from `design-tokens`, not eyeballed values.
2. **Code Connect** — where a Figma component has a Code Connect mapping, use it to
   verify the component/prop mapping is right.
3. **Screenshot diff** — compare the rendered build against a Figma export of the *same
   frame at the same breakpoint*. Don't compare a desktop render against a mobile export
   or vice versa.

## Mobile and desktop are both in scope

Every one of the 5 screens has a separate mobile frame and desktop frame in Figma. A
screen isn't done after only one breakpoint ships — build and verify both before
considering the page complete. Confirm the actual breakpoint cutoff from the Figma
frame width rather than assuming it lines up with Tailwind's default `sm`/`md`/`lg`.

## When something doesn't line up

If a frame implies a token that doesn't exist yet (a color, size, or spacing value not
in `docs/DESIGN_SYSTEM.md`), or a layout that doesn't match what's already documented in
`docs/PROJECT.md`, say so explicitly rather than quietly improvising — these get flagged
and confirmed, not guessed silently.
