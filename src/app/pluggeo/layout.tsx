import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar";
import { AdminToaster } from "@/components/admin/admin-toaster";

// Shell ported (pattern only, restyled to pluggeo&co's dark/navy tokens, not a
// literal copy) from Kiranism/next-shadcn-dashboard-starter's sidebar+header
// layout — see the approved plan for why that template was picked. Single
// admin, no roles, so no per-item permission checks beyond the one
// `requireAdmin()` gate this layout already does for every /admin/* route.

// robots.ts already disallows `/pluggeo` entirely, and Clerk's auth gate
// blocks crawlers from ever rendering this anyway — this is defense-in-depth
// for the same reason as bag/layout.tsx and sign-in/page.tsx.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  // `ClerkProvider` lives here, not the root layout — see the root layout's
  // own comment for why: it's scoped to the one subtree that actually
  // renders Clerk components, so the public storefront never pays for it.
  return (
    <ClerkProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Mounted once, near the root — every admin create/update/delete
            reports through `adminToast` (src/components/admin/toast.tsx),
            themed to this site's own navy/destructive tokens rather than the
            library's default palette. See admin-toaster.tsx for why this is
            its own "use client" wrapper rather than importing goey-toast
            directly here. */}
        <AdminToaster />
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
            <div className="flex items-center gap-2">
              <AdminMobileNav />
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to site
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.primaryEmailAddress?.emailAddress}
              </span>
              <UserButton />
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ClerkProvider>
  );
}
