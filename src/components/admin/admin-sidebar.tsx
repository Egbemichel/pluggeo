"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package01Icon, Store01Icon, Home09Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Products", href: "/pluggeo/products", icon: Package01Icon, disabled: false },
  { label: "Categories", href: "/pluggeo/categories", icon: Store01Icon, disabled: false },
  { label: "Homepage", href: "/pluggeo/homepage", icon: Home09Icon, disabled: false },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar px-3 py-4 md:flex md:flex-col">
      <div className="mb-6 px-2 font-heading text-lg text-sidebar-foreground">Plug Geo Admin</div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          if (item.disabled) {
            return (
              <span
                key={item.href}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/40"
                title="Coming soon"
              >
                <Icon icon={item.icon} size={18} />
                {item.label}
                <span className="ml-auto text-xs">soon</span>
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <Icon icon={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
