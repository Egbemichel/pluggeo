"use client";

import { useRef, useState } from "react";

// `mounted` mirrors `open` on the way up (same render, no lag) but lags
// behind it on the way down — the caller is responsible for eventually
// calling `setMounted(false)` itself, once its own close animation actually
// finishes, not the instant `open` flips false. Shared by every
// open/close-animated overlay (MobileNavDrawer/MobileFilterDrawer via
// use-drawer-transition.ts, SearchOverlay) so the "adjust state when a prop
// changes" ref pattern — "Adjusting state when a prop changes," per React's
// own docs (react.dev/reference/react/useState#storing-information-from-previous-renders)
// — is written, and lint-exempted, in exactly one place rather than
// re-derived (and re-risked) per overlay. This project's react-hooks lint
// config is stricter than React's own documented pattern here (it flags any
// ref read/write during render, full stop) — disabled locally rather than
// working around a real design constraint with a fake one.
export function useLaggedMount(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const prevOpen = useRef(open);

  // eslint-disable-next-line react-hooks/refs -- read + write during render, see file comment
  if (open !== prevOpen.current) {
    // eslint-disable-next-line react-hooks/refs -- see file comment
    prevOpen.current = open;
    if (open) setMounted(true);
  }

  return [mounted, setMounted] as const;
}
