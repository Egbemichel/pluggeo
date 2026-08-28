import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return <div className="min-h-screen">{children}</div>;
}
