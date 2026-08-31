"use client";

import { useEffect, useRef } from "react";

// Session-only, not localStorage (2026-08-31, per the admin: a forced
// refresh after "Server Action ... was not found on the server" — see
// toast.tsx's `describeActionError` — was wiping out a half-filled product
// form every time). That reload can't be avoided: the stale action id is
// baked into the JS bundle the browser already loaded, which a soft
// `router.refresh()` can't swap out — only an actual reload picks up the
// new build. What *is* fixable is losing the admin's typed-but-unsaved work
// to that reload. `sessionStorage` (not `localStorage`) is deliberate: it
// survives a same-tab refresh but clears on tab close, so a leftover draft
// from a genuinely abandoned edit days ago can't silently resurface and
// confuse a later session.
export function useFormDraft<T>(key: string, value: T, onRestore: (value: T) => void) {
  const hasMounted = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) onRestore(JSON.parse(raw) as T);
    } catch {
      // Private browsing / storage disabled — restoring a draft is a
      // nice-to-have, not worth surfacing as an error to the admin.
    }
    // Deliberately mount-only — a `key` that changes after mount (it never
    // does today) shouldn't re-trigger a restore mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Skip the save that would otherwise fire on the very same commit as
    // the restore effect above, before its `onRestore` state updates have
    // actually re-rendered — without this guard, that first save would
    // overwrite the just-read draft with the still-pristine initial value.
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore — see above
    }
  }, [key, value]);
}

export function clearFormDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
