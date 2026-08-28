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
// into it; the badge counter increments at the exact moment of arrival, not
// before. First React Context in the codebase — needed because the source
// (any Add-to-Bag button, anywhere in the tree) and the destination (NavBar,
// mounted once) have no other way to reach each other without a state
// library, which is out of the locked stack.
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
// This is a visual/local-only counter — no cart backend, no persistence,
// same scope boundary as QuantityStepper/ProductLineItemCard's Remove
// button (see CLAUDE.md: checkout/cart/orders are explicitly out of scope).

type TargetKey = "desktopBag" | "mobileMenu";

type Flight = {
  id: number;
  startX: number;
  startY: number;
  target: HTMLElement;
};

export type BagFlightContextValue = {
  registerTarget: (key: TargetKey, el: HTMLElement | null) => void;
  fly: (sourceEl: HTMLElement) => void;
  basketCount: number;
};

const BagFlightContext = createContext<BagFlightContextValue | null>(null);

export function useBagFlight() {
  const ctx = useContext(BagFlightContext);
  if (!ctx) throw new Error("useBagFlight must be used within BagFlightProvider");
  return ctx;
}

const ICON_HALF_SIZE = 14;

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
  const [basketCount, setBasketCount] = useState(0);
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextFlightId = useRef(0);

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
    (id: number, target: HTMLElement) => {
      setFlights((prev) => prev.filter((flight) => flight.id !== id));
      setBasketCount((count) => count + 1);
      pulseBadge(target);
    },
    [pulseBadge]
  );

  const fly = useCallback(
    (sourceEl: HTMLElement) => {
      const target = getVisibleTarget();
      const reducedMotion =
        typeof window !== "undefined" && window.matchMedia(MOTION_QUERY.reduced).matches;

      if (!target || reducedMotion) {
        setBasketCount((count) => count + 1);
        return;
      }

      const rect = sourceEl.getBoundingClientRect();
      const id = ++nextFlightId.current;
      setFlights((prev) => [
        ...prev,
        { id, startX: rect.left + rect.width / 2, startY: rect.top + rect.height / 2, target },
      ]);
    },
    [getVisibleTarget]
  );

  return (
    <BagFlightContext.Provider value={{ registerTarget, fly, basketCount }}>
      {children}
      {flights.map((flight) => (
        <FlightIcon key={flight.id} flight={flight} onComplete={() => completeFlight(flight.id, flight.target)} />
      ))}
    </BagFlightContext.Provider>
  );
}
