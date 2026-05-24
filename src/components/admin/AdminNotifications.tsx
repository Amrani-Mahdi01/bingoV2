"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Package,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Order, Product } from "@/lib/types";

type Notif =
  | {
      kind: "order";
      id: string;
      order: Order;
    }
  | {
      kind: "stock";
      id: string;
      product: Product;
    };

const MAX_PER_GROUP = 5;

export function AdminNotifications() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      api.orders.list({ status: "pending", limit: 50 }),
      api.products.list({ limit: 500 }),
    ]).then(([o, p]) => {
      setOrders(o.items);
      setProducts(p.items);
      setLoaded(true);
    });
  }, []);

  const pendingOrders = React.useMemo(
    () =>
      orders
        .slice()
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, MAX_PER_GROUP),
    [orders]
  );

  const lowStock = React.useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.stockStatus === "low_stock" || p.stockStatus === "out_of_stock"
        )
        .sort((a, b) => a.stock - b.stock)
        .slice(0, MAX_PER_GROUP),
    [products]
  );

  const totalCount =
    (orders.length > 0 ? orders.length : 0) +
    products.filter(
      (p) =>
        p.stockStatus === "low_stock" || p.stockStatus === "out_of_stock"
    ).length;

  return (
    <Popover>
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
                >
                  {pendingOrders.map((o) => (
                    <NotifRow
                      key={o.id}
                      href={routes.admin.order(o.orderNumber)}
                      icon={
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <ShoppingCart className="size-3.5" />
                        </span>
                      }
                      title={`${o.customer.firstName} ${o.customer.lastName}`}
                      meta={`${o.orderNumber} · ${o.shipping.wilayaName}`}
                      time={formatDateTime(o.createdAt)}
                    />
                  ))}
                </NotifGroup>
              ) : null}

              {/* Low stock */}
              {lowStock.length > 0 ? (
                <>
                  {pendingOrders.length > 0 ? (
                    <div className="border-t border-zinc-200" />
                  ) : null}
                  <NotifGroup
                    title="Stock faible / Rupture"
                    total={
                      products.filter(
                        (p) =>
                          p.stockStatus === "low_stock" ||
                          p.stockStatus === "out_of_stock"
                      ).length
                    }
                    href={`${routes.admin.products}?status=low_stock`}
                  >
                    {lowStock.map((p) => (
                      <NotifRow
                        key={p.id}
                        href={routes.admin.product(p.id)}
                        icon={
                          <span
                            className={cn(
                              "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                              p.stockStatus === "out_of_stock"
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600"
                            )}
                          >
                            {p.stockStatus === "out_of_stock" ? (
                              <TriangleAlert className="size-3.5" />
                            ) : (
                              <Package className="size-3.5" />
                            )}
                          </span>
                        }
                        title={p.name}
                        meta={`${p.sku} · ${p.brand.name}`}
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
            </>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/60 px-4 py-2">
          <span className="text-2xs text-zinc-500">
            Mis à jour à l&apos;ouverture
          </span>
          <Link
            href={routes.admin.orders}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            Voir tout
          </Link>
        </footer>
      </PopoverContent>
    </Popover>
  );
}

function NotifGroup({
  title,
  total,
  href,
  children,
}: {
  title: string;
  total: number;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="flex items-center justify-between bg-zinc-50/60 px-4 py-2">
        <h4 className="text-2xs font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </h4>
        <Link
          href={href}
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
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  meta: string;
  time: string;
}) {
  return (
    <li>
      <Link
        href={href}
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
