"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ExternalLink, LogOut, Menu } from "lucide-react";

import { useAdminMobileNav } from "@/components/admin/AdminMobileNavContext";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { adminInitials } from "@/components/admin/AdminSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  href?: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Tableau de bord",
  products: "Produits",
  new: "Nouveau",
  categories: "Catégories",
  orders: "Commandes",
  customers: "Clients",
  statistics: "Statistiques",
  settings: "Configuration",
  banners: "Bannières",
  shipping: "Livraison",
};

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = "";
  segments.forEach((seg, index) => {
    acc += `/${seg}`;
    const label = SEGMENT_LABELS[seg] ?? decodeURIComponent(seg);
    const isLast = index === segments.length - 1;
    crumbs.push({ label, href: isLast ? undefined : acc });
  });
  return crumbs;
}

export function AdminTopbar() {
  const pathname = usePathname();
  const crumbs = React.useMemo(() => buildBreadcrumbs(pathname), [pathname]);
  const { setOpen } = useAdminMobileNav();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:gap-4 sm:px-6">
      {/* Hamburger — mobile only. The sidebar mounts as a drawer
          below md and the topbar drives its open state via
          AdminMobileNavContext. Hidden on md+ where the sidebar is
          already visible inline. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="-ml-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-xs text-zinc-500">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={crumb.label + i}>
                {i > 0 ? (
                  <ChevronRight
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-zinc-400"
                  />
                ) : null}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="truncate text-zinc-600 hover:text-zinc-900"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isLast ? "font-medium text-zinc-900" : "text-zinc-600"
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      {/* Global search (md+) */}
      <AdminSearch />

      {/* Right cluster */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notifications */}
        <AdminNotifications />
        {/* Admin avatar + dropdown — moved here from the sidebar
            footer so the logout and "Voir le site" shortcut sit next
            to the bell where they're easy to reach. */}
        <AdminUserMenu />
      </div>
    </header>
  );
}

function AdminUserMenu() {
  const { admin, logout: adminLogout } = useAdminAuth();
  const { logout: customerLogout } = useAuth();
  // Tear down BOTH guards so a single Déconnexion fully signs the
  // user out — leaving the customer session alive after an admin
  // logout would make them appear "still logged in" on the
  // storefront. Mirrors the same pattern the storefront header uses
  // for its own logout button.
  const logout = React.useCallback(async () => {
    await Promise.allSettled([adminLogout(), customerLogout()]);
  }, [adminLogout, customerLogout]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Compte admin"
        className="inline-flex size-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <Avatar className="size-8 border border-zinc-200">
          <AvatarFallback className="bg-blue-600 text-2xs text-zinc-50">
            {adminInitials(admin?.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-1.5">
          <p className="truncate text-xs font-semibold text-zinc-900">
            {admin?.name ?? "Chargement…"}
          </p>
          <p className="truncate text-2xs text-zinc-500">
            {admin?.email ?? ""}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          nativeButton={false}
          render={<Link href="/" />}
          className="cursor-pointer"
        >
          <ExternalLink className="size-3.5" />
          Voir le site
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void logout()}
          className="cursor-pointer text-red-700 focus:bg-red-50 focus:text-red-700"
        >
          <LogOut className="size-3.5" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
