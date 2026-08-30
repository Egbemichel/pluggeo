"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ShoppingBagAddIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { EASE, DURATION, MOTION_QUERY } from "@/lib/motion";

gsap.registerPlugin(MotionPathPlugin);

// The Chrome-download-style Add-to-Bag animation, per the user: an icon
// floats from wherever it was clicked up to the navbar bag icon and merges
// into it; the badge counter increments (and the item lands in the real
// cart) at the exact moment of arrival, not before. First React Context in
// the codebase — needed because the source (any Add-to-Bag button, anywhere
// in the tree) and the destination (NavBar, mounted once) have no other way
// to reach each other without a state library, which is out of the locked
// stack.
//
// NavBar registers BOTH its desktop basket link and its mobile hamburger as
// targets (both are always in the DOM, just responsively hidden via
// `hidden md:grid` / `grid md:hidden` — never conditionally rendered), and
// `fly()` picks whichever one is actually visible (`offsetParent !== null`)
// at call time. On mobile there's no persistent basket icon (the real one
// lives inside the closed-by-default MobileNavDrawer) — flying to the
// hamburger keeps "travels to its destination icon" true everywhere instead
// of silently skipping the animation on mobile.
//
// The flying icon is a real React-rendered `<Icon>` (not a hand-built SVG
// string), animated via a ref-callback effect once it mounts — keeps it
// visually identical to every other icon on the site and avoids duplicating
// SVG path data. `MotionPathPlugin` (bundled in plain `gsap`, no separate
// license) draws a 3-point arc (start -> a point above the midpoint -> end)
// for the "lift then land" feel rather than a straight line.
//
// Real cart state (2026-08-30, per the user): this now also owns the actual
// `/bag` line items, not just a decorative counter — every "Add to bag"
// click site-wide (`AddToBagButton`, `SearchOverlay`'s result rows) passes
// its real product/variant data through `fly()`, which lands it in `items`
// once the flight animation completes. Persisted to `localStorage` (no
// customer accounts exist to key a server-side cart to — see CLAUDE.md,
// Auth is admin-only — so this intentionally stays device-local rather than
// a DB cart table). Checkout/orders/payments are still explicitly out of
// scope (CLAUDE.md) — only the bag itself is real now, "Checkout" on /bag
// stays a plain, inert button.

type TargetKey = "desktopBag" | "mobileMenu";

export type CartLineItem = {
  /** Stable per-line key — the product's `href` (unique per product), plus
   * the selected variant's label when one applies, so two different
   * variants of the same product land as separate lines. */
  id: string;
  href: string;
  image: { src: string; alt: string };
  title: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  isFromPrice?: boolean;
  variantLabel?: string;
};

export type CartLine = CartLineItem & { quantity: number };

type Flight = {
  id: number;
  startX: number;
  startY: number;
  target: HTMLElement;
  item: CartLineItem;
  quantity: number;
};

export type BagFlightContextValue = {
  registerTarget: (key: TargetKey, el: HTMLElement | null) => void;
  fly: (sourceEl: HTMLElement, item: CartLineItem, quantity?: number) => void;
  basketCount: number;
  items: CartLine[];
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
};

const BagFlightContext = createContext<BagFlightContextValue | null>(null);

export function useBagFlight() {
  const ctx = useContext(BagFlightContext);
  if (!ctx) throw new Error("useBagFlight must be used within BagFlightProvider");
  return ctx;
}

const ICON_HALF_SIZE = 14;
const CART_STORAGE_KEY = "pluggeo-cart";

function FlightIcon({ flight, onComplete }: { flight: Flight; onComplete: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targetRect = flight.target.getBoundingClientRect();
    const startX = flight.startX - ICON_HALF_SIZE;
    const startY = flight.startY - ICON_HALF_SIZE;
    const endX = targetRect.left + targetRect.width / 2 - ICON_HALF_SIZE;
    const endY = targetRect.top + targetRect.height / 2 - ICON_HALF_SIZE;
    const midX = (startX + endX) / 2;
    const midY = Math.min(startY, endY) - 80;

    gsap.set(el, { x: startX, y: startY, scale: 1, opacity: 1 });
    const tween = gsap.to(el, {
      motionPath: {
        path: [
          { x: startX, y: startY },
          { x: midX, y: midY },
          { x: endX, y: endY },
        ],
        curviness: 1.25,
      },
      scale: 0.4,
      duration: DURATION.flight,
      ease: EASE.snappy,
      onComplete,
    });

    return () => {
      tween.kill();
    };
    // `onComplete` intentionally excluded — it's a fresh closure per render
    // from the parent's map(), re-running this effect for that reason alone
    // would restart the flight mid-air.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight]);

  return (
    <div ref={ref} className="pointer-events-none fixed top-0 left-0 z-999 text-brand-primary">
      <Icon icon={ShoppingBagAddIcon} size={ICON_HALF_SIZE * 2} />
    </div>
  );
}

export function BagFlightProvider({ children }: { children: ReactNode }) {
  const targets = useRef<Partial<Record<TargetKey, HTMLElement>>>({});
  const [items, setItems] = useState<CartLine[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextFlightId = useRef(0);
  // Guards the persist effect below from firing (and overwriting a real
  // stored cart with `[]`) before the one-time load effect has actually run.
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      // Deliberately loaded in an effect rather than a `useState` lazy
      // initializer: this provider wraps the whole app server-side too, so
      // reading localStorage during render (client or server) would return
      // a different `items`/`basketCount` than the server-rendered HTML and
      // trigger a hydration mismatch on the navbar's badge count. Loading
      // post-mount means the badge briefly shows 0 then updates, which is
      // the correct trade-off here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt/inaccessible storage (private browsing, quota) — start empty.
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable/full — the cart still works for this page load.
    }
  }, [items]);

  const addItem = useCallback((item: CartLineItem, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((line) => line.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.id === item.id ? { ...line, quantity: line.quantity + quantity } : line
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((line) => line.id !== id));
      return;
    }
    setItems((prev) => prev.map((line) => (line.id === id ? { ...line, quantity } : line)));
  }, []);

  const registerTarget = useCallback((key: TargetKey, el: HTMLElement | null) => {
    if (el) targets.current[key] = el;
    else delete targets.current[key];
  }, []);

  const getVisibleTarget = useCallback((): HTMLElement | null => {
    for (const el of Object.values(targets.current)) {
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }, []);

  const pulseBadge = useCallback((target: HTMLElement) => {
    const badge = target.querySelector<HTMLElement>("[data-bag-badge]");
    if (!badge) return;
    gsap.fromTo(
      badge,
      { scale: 1 },
      { scale: 1.3, duration: DURATION.badgePulse / 2, ease: EASE.snappyBack, yoyo: true, repeat: 1 }
    );
  }, []);

  const completeFlight = useCallback(
    (flight: Flight) => {
      setFlights((prev) => prev.filter((f) => f.id !== flight.id));
      addItem(flight.item, flight.quantity);
      pulseBadge(flight.target);
    },
    [addItem, pulseBadge]
  );

  const fly = useCallback(
    (sourceEl: HTMLElement, item: CartLineItem, quantity = 1) => {
      const target = getVisibleTarget();
      const reducedMotion =
        typeof window !== "undefined" && window.matchMedia(MOTION_QUERY.reduced).matches;

      if (!target || reducedMotion) {
        addItem(item, quantity);
        return;
      }

      const rect = sourceEl.getBoundingClientRect();
      const id = ++nextFlightId.current;
      setFlights((prev) => [
        ...prev,
        {
          id,
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
          target,
          item,
          quantity,
        },
      ]);
    },
    [getVisibleTarget, addItem]
  );

  const basketCount = items.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <BagFlightContext.Provider
      value={{ registerTarget, fly, basketCount, items, removeItem, setQuantity }}
    >
      {children}
      {flights.map((flight) => (
        <FlightIcon key={flight.id} flight={flight} onComplete={() => completeFlight(flight)} />
      ))}
    </BagFlightContext.Provider>
  );
}
