"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { adminToast } from "@/components/admin/toast";

// A `create` Server Action redirects on success (see e.g. products/actions.ts)
// rather than resolving back to the client, so there's no "this just
// succeeded" moment on the create form itself to toast from. Mount this once
// on the page a create redirect lands on, keyed to whatever query param that
// redirect appended (`?created=1`) — fires the toast on landing, then strips
// the param via `router.replace` so refreshing the edit page doesn't re-fire
// it. Renders nothing.

export function CreatedToast({ param, message }: { param: string; message: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldToast = searchParams.get(param) != null;

  useEffect(() => {
    if (!shouldToast) return;
    adminToast.success(message);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on landing; re-running on every searchParams identity change would re-toast after the very replace() below changes it
  }, [shouldToast]);

  return null;
}
