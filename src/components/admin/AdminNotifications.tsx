"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Mail,
  Package,
  Phone,
  ShieldOff,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  blockedIpsApi,
  type BlockedIpEntry,
} from "@/lib/api/blocked-ips";
import {
  blockedPhonesApi,
  type BlockedPhoneEntry,
} from "@/lib/api/blocked-phones";
import {
  contactMessagesApi,
  type ApiContactMessage,
} from "@/lib/api/contact-messages";
import { ordersApi, type ApiOrderRow } from "@/lib/api/orders";
import { productsApi, type ApiProduct } from "@/lib/api/products";
import { formatDateTime } from "@/lib/format";
import {
  PENDING_ORDERS_BROADCAST,
  PENDING_ORDERS_REFRESH_EVENT,
} from "@/lib/hooks/usePendingOrders";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

// Auto-blocked rows are the only ones we surface in this panel. The
// backend tags them with a reason starting with "Auto-bloqué" — see
// OrderController::maybeAutoBlock. Manual blocks the admin made
// themselves shouldn't notify them about their own action.
const AUTO_BLOCK_PREFIX = "Auto-bloqué";

// Background poll cadence. The sidebar already gets push-style
// updates from the pending-orders SSE stream — we additionally
// listen to that event below so the bell reflects new orders the
// instant they land, even between polls.
const POLL_INTERVAL_MS = 30_000;

// Keep each section to a small head so the popover doesn't grow
// taller than the viewport. The footer link sends the admin to the
// full-list page for everything else.
const MAX_PER_GROUP = 5;

/** One entry in the blocked-clients group. Pairs (IP + phone from the
 *  same client) collapse to a single notification so the count matches
 *  the unified blacklist UI. */
type BlockedEntry =
  | { kind: "pair"; phone: BlockedPhoneEntry; ip: BlockedIpEntry }
  | { kind: "ip"; data: BlockedIpEntry }
  | { kind: "phone"; data: BlockedPhoneEntry };

export function AdminNotifications() {
  // Controlled open state — every Link inside the popover closes it
  // via this setter so a tap on "stock faible" / a new order / a
  // message takes the admin straight to the page without leaving an
  // open popover hovering above the next route.
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const [orders, setOrders] = React.useState<ApiOrderRow[]>([]);
  const [products, setProducts] = React.useState<ApiProduct[]>([]);
  const [blocked, setBlocked] = React.useState<BlockedEntry[]>([]);
  const [unreadMessages, setUnreadMessages] = React.useState<ApiContactMessage[]>(
    [],
  );
  const [loaded, setLoaded] = React.useState(false);

  // Keep refetch in a stable ref so the multiple effects below (mount,
  // poll, event listener, BroadcastChannel) all call the same function
  // and stay in sync.
  const refetch = React.useCallback(async () => {
    // Each promise has its own catch so one failure doesn't blank
    // the whole panel — the admin still sees the rest.
    const [ordersRes, productsRes, ips, phones, messagesRes] =
      await Promise.all([
        ordersApi.listAll({ perPage: 50, status: "pending" }).catch(() => null),
        productsApi.listAll({ perPage: 500 }).catch(() => null),
        blockedIpsApi.list().catch(() => [] as BlockedIpEntry[]),
        blockedPhonesApi.list().catch(() => [] as BlockedPhoneEntry[]),
        contactMessagesApi.list().catch(() => null),
      ]);
    setOrders(ordersRes?.data ?? []);
    setProducts(productsRes?.data ?? []);
    // Filter to auto-blocks only BEFORE pairing so a manually-blocked
    // half can't drag its auto-blocked partner into the panel.
    const autoIps = ips.filter((i) =>
      (i.reason ?? "").startsWith(AUTO_BLOCK_PREFIX),
    );
    const autoPhones = phones.filter((p) =>
      (p.reason ?? "").startsWith(AUTO_BLOCK_PREFIX),
    );
    setBlocked(pairBlocks(autoIps, autoPhones));
    // Unread messages only — once admin opens the message on /admin/
    // customers/messages it auto-marks as read and drops out of here.
    setUnreadMessages(
      (messagesRes?.data ?? []).filter((m) => !m.isRead),
    );
    setLoaded(true);
  }, []);

  // Initial fetch + background polling. The 30 s cadence is a compromise
  // between freshness and request volume — the bell shouldn't be silent
  // for minutes after a new pending order lands, but we also don't need
  // sub-second precision.
  React.useEffect(() => {
    void refetch();
    const id = setInterval(() => void refetch(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refetch]);

  // Real-time push: the sidebar's SSE pending-count stream broadcasts
  // a window event every time it sees a change, and same-browser tabs
  // (storefront placing an order, another admin tab changing a status)
  // broadcast via BroadcastChannel. Both paths force an immediate
  // refetch so the bell catches up before the next 30 s poll.
  React.useEffect(() => {
    const onRefresh = () => void refetch();
    window.addEventListener(PENDING_ORDERS_REFRESH_EVENT, onRefresh);
    let channel: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        channel = new BroadcastChannel(PENDING_ORDERS_BROADCAST);
        channel.onmessage = onRefresh;
      }
    } catch {
      /* ignore — polling above covers us */
    }
    return () => {
      window.removeEventListener(PENDING_ORDERS_REFRESH_EVENT, onRefresh);
      channel?.close();
    };
  }, [refetch]);

  const pendingOrders = React.useMemo(
    () =>
      orders
        .slice()
        .sort(
          (a, b) =>
            +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0),
        )
        .slice(0, MAX_PER_GROUP),
    [orders],
  );

  const lowStockAll = React.useMemo(
    () =>
      products.filter(
        (p) =>
          p.trackStock &&
          (p.stockStatus === "low_stock" ||
            p.stockStatus === "out_of_stock"),
      ),
    [products],
  );
  const lowStock = React.useMemo(
    () =>
      lowStockAll
        .slice()
        // Out-of-stock first, then ascending stock.
        .sort((a, b) => {
          if (a.stockStatus !== b.stockStatus) {
            return a.stockStatus === "out_of_stock" ? -1 : 1;
          }
          return a.stock - b.stock;
        })
        .slice(0, MAX_PER_GROUP),
    [lowStockAll],
  );

  const blockedHead = React.useMemo(
    () => blocked.slice(0, MAX_PER_GROUP),
    [blocked],
  );

  // Newest first (the backend already orders by created_at desc but
  // we resort to make the panel resilient against future changes).
  const messagesHead = React.useMemo(
    () =>
      unreadMessages
        .slice()
        .sort(
          (a, b) =>
            +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0),
        )
        .slice(0, MAX_PER_GROUP),
    [unreadMessages],
  );

  const totalCount =
    orders.length +
    lowStockAll.length +
    blocked.length +
    unreadMessages.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={
          totalCount > 0
            ? `Notifications (${totalCount} non lues)`
            : "Notifications"
        }
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "relative text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
        )}
      >
        <Bell className="size-5" />
        {totalCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[10px] text-white tabular-nums"
          >
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 max-w-[90vw] overflow-hidden p-0"
        sideOffset={6}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
          {totalCount > 0 ? (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-2xs font-medium text-zinc-600">
              {totalCount}
            </span>
          ) : null}
        </header>

        <div className="max-h-[28rem] overflow-y-auto">
          {!loaded ? (
            <p className="px-4 py-6 text-center text-xs text-zinc-500">
              Chargement…
            </p>
          ) : totalCount === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-zinc-500">
              Tout est à jour. Aucune notification.
            </p>
          ) : (
            <>
              {/* Pending orders */}
              {pendingOrders.length > 0 ? (
                <NotifGroup
                  title="Nouvelles commandes"
                  total={orders.length}
                  href={routes.admin.orders}
                  onItemClick={close}
                >
                  {pendingOrders.map((o) => (
                    <NotifRow
                      key={o.id}
                      href={routes.admin.order(o.id)}
                      onClick={close}
                      icon={
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <ShoppingCart className="size-3.5" />
                        </span>
                      }
                      title={`${o.customer.firstName} ${o.customer.lastName}`}
                      meta={`${o.orderNumber} · ${o.wilayaName}`}
                      time={o.createdAt ? formatDateTime(o.createdAt) : ""}
                    />
                  ))}
                </NotifGroup>
              ) : null}

              {/* Unread messages */}
              {messagesHead.length > 0 ? (
                <>
                  {pendingOrders.length > 0 ? (
                    <div className="border-t border-zinc-200" />
                  ) : null}
                  <NotifGroup
                    title="Messages"
                    total={unreadMessages.length}
                    href={routes.admin.contactMessages}
                    onItemClick={close}
                  >
                    {messagesHead.map((m) => (
                      <NotifRow
                        key={m.id}
                        href={routes.admin.contactMessages}
                        onClick={close}
                        icon={
                          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                            <Mail className="size-3.5" />
                          </span>
                        }
                        title={m.name}
                        meta={m.subject}
                        time={m.createdAt ? formatDateTime(m.createdAt) : ""}
                      />
                    ))}
                  </NotifGroup>
                </>
              ) : null}

              {/* Low stock */}
              {lowStock.length > 0 ? (
                <>
                  {(pendingOrders.length > 0 || messagesHead.length > 0) ? (
                    <div className="border-t border-zinc-200" />
                  ) : null}
                  <NotifGroup
                    title="Stock faible / Rupture"
                    total={lowStockAll.length}
                    href={`${routes.admin.products}?status=low_stock`}
                    onItemClick={close}
                  >
                    {lowStock.map((p) => (
                      <NotifRow
                        key={p.id}
                        href={routes.admin.product(p.id)}
                        onClick={close}
                        icon={
                          <span
                            className={cn(
                              "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                              p.stockStatus === "out_of_stock"
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600",
                            )}
                          >
                            {p.stockStatus === "out_of_stock" ? (
                              <TriangleAlert className="size-3.5" />
                            ) : (
                              <Package className="size-3.5" />
                            )}
                          </span>
                        }
                        title={p.nameFr}
                        meta={`${p.sku}${p.brand?.name ? ` · ${p.brand.name}` : ""}`}
                        time={
                          p.stockStatus === "out_of_stock"
                            ? "Rupture"
                            : `${p.stock} restant${p.stock > 1 ? "s" : ""}`
                        }
                      />
                    ))}
                  </NotifGroup>
                </>
              ) : null}

              {/* Blocked clients */}
              {blockedHead.length > 0 ? (
                <>
                  {(pendingOrders.length > 0 ||
                    messagesHead.length > 0 ||
                    lowStock.length > 0) ? (
                    <div className="border-t border-zinc-200" />
                  ) : null}
                  <NotifGroup
                    title="Clients bloqués"
                    total={blocked.length}
                    href={routes.admin.blockedIps}
                    onItemClick={close}
                  >
                    {blockedHead.map((b) => (
                      <BlockedNotifRow
                        key={blockedKey(b)}
                        entry={b}
                        onClick={close}
                      />
                    ))}
                  </NotifGroup>
                </>
              ) : null}
            </>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/60 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-2xs text-zinc-500">
            <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Mis à jour en direct
          </span>
          <Link
            href={routes.admin.orders}
            onClick={close}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            Voir tout
          </Link>
        </footer>
      </PopoverContent>
    </Popover>
  );
}

/* ───────────────────────── Blocked-row helpers ───────────────────────── */

/** Pair IP + phone blocks with matching `blockGroupId`. Mirrors the
 *  logic on /admin/blocked-ips so the notification counts match what
 *  the admin sees on the dedicated page. */
function pairBlocks(
  ips: BlockedIpEntry[],
  phones: BlockedPhoneEntry[],
): BlockedEntry[] {
  const phonesByGroup = new Map<string, BlockedPhoneEntry>();
  for (const p of phones) {
    if (p.blockGroupId) phonesByGroup.set(p.blockGroupId, p);
  }
  const claimed = new Set<number>();
  const out: BlockedEntry[] = [];

  for (const ip of ips) {
    const match = ip.blockGroupId
      ? phonesByGroup.get(ip.blockGroupId)
      : undefined;
    if (match) {
      out.push({ kind: "pair", ip, phone: match });
      claimed.add(match.id);
    } else {
      out.push({ kind: "ip", data: ip });
    }
  }
  for (const p of phones) {
    if (!claimed.has(p.id)) out.push({ kind: "phone", data: p });
  }

  // Newest first — most recent block is most actionable.
  out.sort((a, b) => {
    const aT =
      a.kind === "pair"
        ? Math.max(
            +new Date(a.ip.blockedAt ?? 0),
            +new Date(a.phone.blockedAt ?? 0),
          )
        : +new Date(a.data.blockedAt ?? 0);
    const bT =
      b.kind === "pair"
        ? Math.max(
            +new Date(b.ip.blockedAt ?? 0),
            +new Date(b.phone.blockedAt ?? 0),
          )
        : +new Date(b.data.blockedAt ?? 0);
    return bT - aT;
  });
  return out;
}

function blockedKey(b: BlockedEntry): string {
  if (b.kind === "pair") return `pair-${b.ip.id}-${b.phone.id}`;
  return `${b.kind}-${b.data.id}`;
}

function BlockedNotifRow({
  entry,
  onClick,
}: {
  entry: BlockedEntry;
  onClick?: () => void;
}) {
  // Title / meta switch per kind so the row reads naturally for both
  // single-signal blocks and full client blocks.
  let title: string;
  let meta: string;
  let blockedAt: string | null;
  let reason: string | null;

  if (entry.kind === "pair") {
    title = entry.phone.phoneNumber;
    meta = `IP ${entry.ip.ipAddress}`;
    blockedAt = entry.phone.blockedAt;
    reason = entry.phone.reason;
  } else if (entry.kind === "ip") {
    title = `IP ${entry.data.ipAddress}`;
    meta = "Adresse IP seule";
    blockedAt = entry.data.blockedAt;
    reason = entry.data.reason;
  } else {
    title = entry.data.phoneNumber;
    meta = "Numéro seul";
    blockedAt = entry.data.blockedAt;
    reason = entry.data.reason;
  }
  // All rows in this section are auto-blocks (the parent filters on
  // reason), so the meta line stays clean — no "Auto" suffix needed.
  void reason;

  return (
    <NotifRow
      href={routes.admin.blockedIps}
      onClick={onClick}
      icon={
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          {entry.kind === "phone" ? (
            <Phone className="size-3.5" />
          ) : (
            <ShieldOff className="size-3.5" />
          )}
        </span>
      }
      title={title}
      meta={meta}
      time={blockedAt ? formatDateTime(blockedAt) : ""}
    />
  );
}

function NotifGroup({
  title,
  total,
  href,
  children,
  onItemClick,
}: {
  title: string;
  total: number;
  href: string;
  children: React.ReactNode;
  /** Fires when the section's "N total" header link is tapped — used
   *  by the parent popover to close itself before the route change. */
  onItemClick?: () => void;
}) {
  return (
    <div>
      <header className="flex items-center justify-between bg-zinc-50/60 px-4 py-2">
        <h4 className="text-2xs font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </h4>
        <Link
          href={href}
          onClick={onItemClick}
          className="text-2xs font-medium text-zinc-600 hover:text-zinc-900"
        >
          {total} total
        </Link>
      </header>
      <ul className="divide-y divide-zinc-100">{children}</ul>
    </div>
  );
}

function NotifRow({
  href,
  icon,
  title,
  meta,
  time,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  meta: string;
  time: string;
  /** Fires on tap before the link navigates — wired up so the parent
   *  popover closes synchronously and doesn't linger across routes. */
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50"
      >
        {icon}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-xs font-medium text-zinc-900">
            {title}
          </p>
          <p className="line-clamp-1 font-mono text-2xs text-zinc-500">
            {meta}
          </p>
        </div>
        <span className="shrink-0 whitespace-nowrap font-mono text-2xs text-zinc-500">
          {time}
        </span>
      </Link>
    </li>
  );
}
