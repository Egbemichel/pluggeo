// Shared easing/duration/stagger tokens for every animation site-wide — one
// tone across the app instead of inventing timing per component, per the
// user's explicit spec. Derived from (not invented independent of) the two
// values already shipped before this pass: TestimonialSection's Flip
// transition (power3.out / 0.7s) and Spinner's per-bar bounce stagger
// (0.09s) — new work reuses those numbers rather than picking new ones that
// would read as a different system.

export const EASE = {
  /** Entrances — fade/slide-ins, reveal-on-view. Matches TestimonialSection's Flip. */
  standard: "power3.out",
  /** Reverse of standard, for exits that aren't drawer slides. */
  standardIn: "power3.in",
  /** Micro-interactions: hover/click/toggle feedback. */
  snappy: "power2.out",
  /** Small "pop" — badge increment, icon merge-into-bag. */
  snappyBack: "back.out(1.7)",
  /** Physical drawer/panel slide-in — fast start, soft landing. */
  drawerOpen: "power4.out",
  /** Drawer/panel slide-out — accelerates away. */
  drawerClose: "power2.in",
} as const;

export const DURATION = {
  /** Large element fade/slide-in (Hero image, Categories card). */
  entranceLg: 0.7,
  /** Medium text block (matches TestimonialSection's text fromTo). */
  entranceMd: 0.5,
  /** Small text line/word group. */
  entranceSm: 0.4,
  /** Hover/click micro-interaction pulse. */
  micro: 0.25,
  /** Drawer/panel slide, either direction. */
  drawer: 0.45,
  /** Add-to-Bag flying icon travel time. */
  flight: 0.55,
  /** Bag badge increment pulse. */
  badgePulse: 0.35,
} as const;

export const STAGGER = {
  /** Per word/line in RevealText. */
  text: 0.05,
  /** Celebrity media tiles — spec calls for a "tight" interval. */
  tight: 0.06,
  /** Per card/tile in a collage build — matches Spinner's own bar stagger. */
  cards: 0.09,
  /** Search results, drawer items. */
  list: 0.08,
} as const;

/** Standard gsap.matchMedia query pair — real motion only when the visitor
 * hasn't asked for less of it. Every animation in the app is gated by one of
 * these two strings via gsap.matchMedia(), same convention as
 * TestimonialSection/Spinner. */
export const MOTION_QUERY = {
  full: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
} as const;

/** Shared props every storefront page.tsx spreads onto its top-level
 * <ViewTransition> wrapper — see globals.css for the matching
 * `.nav-forward`/`.nav-back`/`.pg-crossfade` CSS. Must live in the page file
 * itself, not a layout — layouts persist across navigation so enter/exit
 * never fire there. */
export const PAGE_TRANSITION = {
  enter: { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "pg-crossfade" },
  exit: { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "pg-crossfade" },
  default: "pg-crossfade",
} as const;
