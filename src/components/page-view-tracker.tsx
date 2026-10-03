"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "pg_vid";

function getVisitorId(): string | null {
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Reports each storefront page view to /api/track for the daily analytics report.
// Renders nothing. The referrer is only sent on the first view of a page load —
// later client-side navigations would otherwise repeat the same external referrer.
export function PageViewTracker() {
  const pathname = usePathname();
  const sentReferrer = useRef(false);

  useEffect(() => {
    const visitorId = getVisitorId();
    if (!visitorId) return;

    const payload = JSON.stringify({
      visitorId,
      path: pathname,
      referrer: sentReferrer.current ? undefined : document.referrer || undefined,
    });
    sentReferrer.current = true;

    try {
      const blob = new Blob([payload], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/track", blob)) {
        void fetch("/api/track", { method: "POST", body: payload, keepalive: true });
      }
    } catch {
      // Analytics must never affect the page.
    }
  }, [pathname]);

  return null;
}
