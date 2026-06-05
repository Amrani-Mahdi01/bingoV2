"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Package,
  PanelLeft,
  PanelLeftClose,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAdminMobileNav } from "@/components/admin/AdminMobileNavContext";
import { usePendingOrders } from "@/lib/hooks/usePendingOrders";
import { adminNav, routes, type AdminNavSection } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** First letters of the admin's name → avatar fallback (max 2 chars). */
export function adminInitials(name?: string | null): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase().slice(0, 2) || "AD";
}

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  FileText,
  Truck,
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
  // Mobile drawer state (driven by the topbar hamburger). On md+ the
  // sidebar is always inline, so this only affects small screens.
  const { open: mobileOpen, setOpen: setMobileOpen } = useAdminMobileNav();

  return (
    <>
      {/* Backdrop — mobile only, click-to-close. Layered just below
          the drawer; the drawer itself sits at z-50 so taps on the
          sidebar's chrome don't dismiss it. */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden",
          mobileOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          // Mobile (< md): fixed overlay drawer, hidden off-canvas by
          // default, slides in when `mobileOpen`. Always w-64 on
          // mobile because the collapse toggle is desktop-only.
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 text-zinc-100 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // md+: revert to the sticky inline shell, width follows the
          // collapse state, transforms reset so the mobile state can't
          // leak across breakpoints.
          "md:sticky md:top-0 md:translate-x-0 md:transition-[width]",
          collapsed ? "md:w-16" : "md:w-64",
          className
        )}
        aria-label="Navigation administration"
      >
      {/* Top — wordmark + Admin badge + mobile close */}
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
        {/* Close button — drawer only, mobile only. */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
          className="ms-auto inline-flex size-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 md:hidden"
        >
          <X className="size-4" />
        </button>
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
        {/* Collapse toggle — desktop only. The mobile drawer is always
            full-width, so a collapse control would be confusing there. */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          aria-expanded={!collapsed}
          className="hidden w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 md:flex"
        >
          {collapsed ? (
            <PanelLeft className="size-4 shrink-0" />
          ) : (
            <PanelLeftClose className="size-4 shrink-0" />
          )}
          {collapsed ? null : <span>Replier</span>}
        </button>

      </div>
    </aside>
    </>
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
