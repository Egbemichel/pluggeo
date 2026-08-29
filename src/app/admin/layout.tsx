import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// Shell ported (pattern only, restyled to Plug Geo's dark/navy tokens, not a
// literal copy) from Kiranism/next-shadcn-dashboard-starter's sidebar+header
// layout — see the approved plan for why that template was picked. Single
// admin, no roles, so no per-item permission checks beyond the one
// `requireAdmin()` gate this layout already does for every /admin/* route.

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
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
  );
}
