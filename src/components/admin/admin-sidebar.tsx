"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Package01Icon, Store01Icon, Home09Icon, Menu03Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Products", href: "/pluggeo/products", icon: Package01Icon, disabled: false },
  { label: "Categories", href: "/pluggeo/categories", icon: Store01Icon, disabled: false },
  { label: "Homepage", href: "/pluggeo/homepage", icon: Home09Icon, disabled: false },
] as const;

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
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
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <Icon icon={item.icon} size={18} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar px-3 py-4 md:flex md:flex-col">
      <div className="mb-6 px-2 font-heading text-lg text-sidebar-foreground">Plug Geo Admin</div>
      <nav aria-label="Admin" className="flex flex-col gap-1">
        <NavLinks pathname={pathname} />
      </nav>
    </aside>
  );
}

// Mobile equivalent of `AdminSidebar` — rendered in the admin header, since
// the sidebar itself is `hidden` below `md` with nothing replacing it (the
// bug this fixes: the 3 nav items had no way to be reached on mobile at
// all). Built on the same `@base-ui/react/dialog` primitive `dialog.tsx`
// already uses elsewhere in this project, just repositioned as a left-
// anchored full-height sheet instead of a centered popup, so it gets the
// same accessible-by-default behavior (focus trap, Escape to close, scroll
// lock) and the same `tw-animate-css` animation system for free.
export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        aria-label="Open admin menu"
        className="flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <Icon icon={Menu03Icon} size={22} />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex h-full w-64 max-w-[80vw] flex-col border-r border-border bg-sidebar px-3 py-4 outline-none duration-200 data-open:animate-in data-open:slide-in-from-left-full data-closed:animate-out data-closed:slide-out-to-left-full">
          <div className="mb-6 flex items-center justify-between px-2">
            <span className="font-heading text-lg text-sidebar-foreground">Plug Geo Admin</span>
            <DialogPrimitive.Close
              aria-label="Close admin menu"
              className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon={Cancel01Icon} size={18} />
            </DialogPrimitive.Close>
          </div>
          <nav aria-label="Admin" className="flex flex-col gap-1">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
