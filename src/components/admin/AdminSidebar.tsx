"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeft,
  PanelLeftClose,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePendingOrders } from "@/lib/hooks/usePendingOrders";
import { adminNav, routes, type AdminNavSection } from "@/lib/routes";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  FileText,
};

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = usePathname();
  // Mount the polling hook here (top of the admin shell) so it runs on
  // every admin page. The hook also writes (N) into document.title.
  const pendingOrders = usePendingOrders();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 text-zinc-100 transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
        className
      )}
      aria-label="Navigation administration"
    >
      {/* Top — wordmark + Admin badge */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-4">
        <Link
          href={routes.admin.dashboard}
          className="flex items-center gap-2"
          aria-label="BINGO Admin — Tableau de bord"
        >
          <span className="font-sans text-md font-semibold tracking-tight text-zinc-50">
            BINGO
          </span>
          {collapsed ? null : (
            <span className="inline-flex items-center rounded-sm bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-300">
              Admin
            </span>
          )}
        </Link>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {adminNav.map((section) => (
            <SidebarSection
              key={section.href}
              section={section}
              collapsed={collapsed}
              pathname={pathname}
              badge={
                section.href === routes.admin.orders && pendingOrders
                  ? pendingOrders
                  : null
              }
            />
          ))}
        </ul>
      </nav>

      {/* Bottom — collapse + user mini-card */}
      <div className="border-t border-zinc-800 p-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          aria-expanded={!collapsed}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
        >
          {collapsed ? (
            <PanelLeft className="size-4 shrink-0" />
          ) : (
            <PanelLeftClose className="size-4 shrink-0" />
          )}
          {collapsed ? null : <span>Replier</span>}
        </button>

        <div
          className={cn(
            "mt-2 flex items-center gap-3 rounded-md p-2",
            collapsed ? "justify-center" : "bg-zinc-800/60"
          )}
        >
          <Avatar className="size-8 shrink-0 border border-zinc-700">
            <AvatarFallback className="bg-blue-600 text-zinc-50 text-xs">
              AD
            </AvatarFallback>
          </Avatar>
          {collapsed ? null : (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium text-zinc-50">
                  Admin BINGO
                </span>
                <span className="truncate text-2xs text-zinc-400">
                  admin@bingo.dz
                </span>
              </div>
              <button
                type="button"
                aria-label="Déconnexion"
                className="inline-flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
              >
                <LogOut className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({
  section,
  collapsed,
  pathname,
  badge,
}: {
  section: AdminNavSection;
  collapsed: boolean;
  pathname: string;
  /** Optional unread counter rendered as a red pill. */
  badge?: number | null;
}) {
  const Icon = ICONS[section.icon] ?? LayoutDashboard;
  const hasChildren = !!section.children?.length;

  // Active when the current path matches the section href, or any child href.
  const isActive =
    pathname === section.href ||
    (section.href !== routes.admin.dashboard &&
      pathname.startsWith(section.href)) ||
    !!section.children?.some(
      (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
    );

  // The submenu auto-opens whenever the user is browsing inside it; user can
  // collapse it manually, which sets a one-shot override until they navigate
  // back to a sibling section.
  const [override, setOverride] = React.useState<boolean | null>(null);
  const open = override ?? isActive;
  const setOpen = (next: boolean) => setOverride(next);

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={section.href}
          className={cn(
            "group/sidebar-item relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "border-l-2 border-blue-500 bg-zinc-800 pl-[10px] text-zinc-50"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50",
            collapsed ? "justify-center" : ""
          )}
          title={collapsed ? section.label : undefined}
        >
          <Icon className="size-4 shrink-0" />
          {collapsed ? null : <span className="truncate">{section.label}</span>}
          {badge && badge > 0 ? (
            collapsed ? (
              <span
                aria-label={`${badge} en attente`}
                className="absolute right-1 top-1 inline-flex size-2 rounded-full bg-red-500 ring-2 ring-zinc-900"
              />
            ) : (
              <span className="ms-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "border-l-2 border-blue-500 bg-zinc-800 pl-[10px] text-zinc-50"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50",
          collapsed ? "justify-center" : ""
        )}
        title={collapsed ? section.label : undefined}
      >
        <Icon className="size-4 shrink-0" />
        {collapsed ? null : (
          <>
            <span className="flex-1 text-left truncate">{section.label}</span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                open ? "rotate-0" : "-rotate-90"
              )}
            />
          </>
        )}
      </button>
      {!collapsed && open ? (
        <ul className="mt-0.5 ml-7 space-y-0.5">
          {section.children?.map((child) => {
            const childActive =
              pathname === child.href || pathname.startsWith(`${child.href}/`);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-xs",
                    childActive
                      ? "bg-zinc-800 text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
                  )}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}
