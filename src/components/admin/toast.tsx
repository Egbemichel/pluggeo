"use client";

import { gooeyToast, type GooeyToastOptions } from "goey-toast";
import { Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";

// Thin wrapper around goey-toast (2026-08-31, per the user: "click Save
// Changes... it finishes... no feedback" — every admin create/update/delete
// now reports through a real toast instead of silently finishing). Pinned
// to pluggeo&co's own tokens instead of the library's default green/red
// palette — CLAUDE.md locks this site to navy/black/white/gray with no
// standalone accent colors, and the admin's own inline banners already
// established the pattern this reuses: success = `--brand-primary` (navy,
// same as the old success banner's `text-primary`), error = `--destructive`
// (same red the error banner and every destructive button already use).
// Every admin mutation should call `adminToast.success`/`.error` here, not
// raw `gooeyToast`, so the theming only ever needs to change in one place.

const successTheme: Partial<GooeyToastOptions> = {
  fillColor: "var(--color-brand-primary)",
  borderColor: "var(--color-brand-primary)",
  classNames: { title: "text-white", description: "text-white/80" },
  icon: <Icon icon={Tick02Icon} size={16} className="text-white" />,
};

const errorTheme: Partial<GooeyToastOptions> = {
  fillColor: "var(--color-destructive)",
  borderColor: "var(--color-destructive)",
  classNames: { title: "text-white", description: "text-white/80" },
  icon: <Icon icon={Cancel01Icon} size={16} className="text-white" />,
};

export const adminToast = {
  success: (title: string, options?: GooeyToastOptions) =>
    gooeyToast.success(title, { ...successTheme, ...options }),
  error: (title: string, options?: GooeyToastOptions) =>
    gooeyToast.error(title, { ...errorTheme, ...options }),
};

// A Server Action's ID is only valid for the build that created it, so
// leaving an admin page open across a deploy (this project's own CI
// redeploys on every push) turns the *next* click into a raw framework
// error — "Server Action ... was not found on the server" — rather than a
// real failure. Every admin mutation's catch block should read the message
// through this instead of `err.message` directly, so that specific case
// surfaces as something an admin can actually act on.
export function describeActionError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : fallback;
  if (/Server Action .* was not found on the server/.test(message)) {
    return "This page is out of date — the site was updated while it was open. Refresh the page and try again.";
  }
  return message;
}
