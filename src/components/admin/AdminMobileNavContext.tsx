"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Shared open-state for the admin shell's mobile nav drawer. The
 * sidebar mounts in `AdminLayout` as a sibling of the topbar, but on
 * mobile (< md) it switches to a fixed overlay controlled by this
 * context — so the hamburger in the topbar can drive it without
 * lifting state into a parent client component.
 *
 * Closes automatically when the route changes so a tap on a nav item
 * doesn't leave the drawer hanging over the next page.
 */
interface Ctx {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AdminMobileNavContext = React.createContext<Ctx | null>(null);

export function AdminMobileNavProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open so the page underneath
  // doesn't jitter when the user scrolls a long nav list.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const value = React.useMemo(() => ({ open, setOpen }), [open]);

  return (
    <AdminMobileNavContext.Provider value={value}>
      {children}
    </AdminMobileNavContext.Provider>
  );
}

export function useAdminMobileNav(): Ctx {
  const ctx = React.useContext(AdminMobileNavContext);
  if (!ctx) {
    // Non-wrapped subtrees (e.g. isolated previews) get a no-op so
    // the hamburger + sidebar render without throwing.
    return { open: false, setOpen: () => {} };
  }
  return ctx;
}
