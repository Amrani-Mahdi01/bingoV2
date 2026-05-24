"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { routes } from "@/lib/routes";
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6">
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

        {/* Language switcher — placeholder until i18n wires up */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Langue"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-2 font-mono text-2xs uppercase text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            FR
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Français</DropdownMenuItem>
            <DropdownMenuItem disabled>العربية (à venir)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Compte administrateur"
            className="inline-flex items-center justify-center rounded-md"
          >
            <Avatar className="size-9 border border-zinc-200">
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                AD
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Admin BINGO</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href={routes.admin.settings} />}
            >
              Configuration
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem nativeButton={false} render={<Link href={routes.home} />}>
              Voir la boutique
            </DropdownMenuItem>
            <DropdownMenuItem>Déconnexion</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
