"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Search,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { api } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import type { Customer, Order, Product } from "@/lib/types";

interface SearchData {
  orders: Order[];
  products: Product[];
  customers: Customer[];
}

export function AdminSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [data, setData] = React.useState<SearchData | null>(null);

  // Keyboard shortcut — Cmd+K / Ctrl+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lazy-load the search corpus the first time the dialog opens.
  React.useEffect(() => {
    if (!open || data) return;
    Promise.all([
      api.orders.list({ limit: 500 }),
      api.products.list({ limit: 500 }),
      api.customers.list({ limit: 500 }),
    ]).then(([o, p, c]) => {
      setData({ orders: o.items, products: p.items, customers: c.items });
    });
  }, [open, data]);

  const results = React.useMemo(() => {
    if (!data) return { orders: [], products: [], customers: [] };
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show 5 most recent of each when empty.
      return {
        orders: data.orders.slice(0, 5),
        products: data.products.slice(0, 5),
        customers: data.customers.slice(0, 5),
      };
    }
    const matchOrder = (o: Order) =>
      `${o.orderNumber} ${o.customer.firstName} ${o.customer.lastName} ${o.customer.phone}`
        .toLowerCase()
        .includes(q);
    const matchProduct = (p: Product) =>
      `${p.name} ${p.sku} ${p.brand.name}`.toLowerCase().includes(q);
    const matchCustomer = (c: Customer) =>
      `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`
        .toLowerCase()
        .includes(q);
    return {
      orders: data.orders.filter(matchOrder).slice(0, 8),
      products: data.products.filter(matchProduct).slice(0, 8),
      customers: data.customers.filter(matchCustomer).slice(0, 8),
    };
  }, [data, query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const noResults =
    data !== null &&
    results.orders.length === 0 &&
    results.products.length === 0 &&
    results.customers.length === 0;

  return (
    <>
      {/* Trigger button — visible in topbar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-10 flex-1 max-w-xs items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-500 hover:bg-zinc-100 md:inline-flex"
      >
        <Search className="size-3.5" />
        <span>Rechercher commandes, produits, clients…</span>
        <kbd className="ml-auto rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Recherche admin"
        description="Recherche globale dans les commandes, produits et clients."
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Rechercher par n°, nom, SKU, email, téléphone…"
        />
        <CommandList>
          {data === null ? (
            <div className="px-4 py-6 text-center text-xs text-zinc-500">
              Chargement…
            </div>
          ) : noResults ? (
            <CommandEmpty>Aucun résultat.</CommandEmpty>
          ) : null}

          {results.orders.length > 0 ? (
            <>
              <CommandGroup heading="Commandes">
                {results.orders.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={`order ${o.orderNumber} ${o.customer.firstName} ${o.customer.lastName} ${o.customer.phone}`}
                    onSelect={() => go(routes.admin.order(o.orderNumber))}
                  >
                    <ShoppingCart className="size-4 text-zinc-500" />
                    <div className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="font-mono text-xs font-medium">
                        {o.orderNumber}
                      </span>
                      <span className="truncate text-xs text-zinc-500">
                        {o.customer.firstName} {o.customer.lastName}
                      </span>
                    </div>
                    <span className="font-mono text-2xs text-zinc-500">
                      {o.shipping.wilayaName}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {(results.products.length > 0 || results.customers.length > 0) && (
                <CommandSeparator />
              )}
            </>
          ) : null}

          {results.products.length > 0 ? (
            <>
              <CommandGroup heading="Produits">
                {results.products.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`product ${p.name} ${p.sku} ${p.brand.name}`}
                    onSelect={() => go(routes.admin.product(p.id))}
                  >
                    <Box className="size-4 text-zinc-500" />
                    <div className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="line-clamp-1 text-xs font-medium">
                        {p.name}
                      </span>
                      <span className="shrink-0 font-mono text-2xs text-zinc-500">
                        {p.sku}
                      </span>
                    </div>
                    <span className="text-2xs text-zinc-500">
                      {p.brand.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {results.customers.length > 0 && <CommandSeparator />}
            </>
          ) : null}

          {results.customers.length > 0 ? (
            <CommandGroup heading="Clients">
              {results.customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`customer ${c.firstName} ${c.lastName} ${c.email} ${c.phone}`}
                  onSelect={() => go(routes.admin.customer(c.id))}
                >
                  <Users className="size-4 text-zinc-500" />
                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="text-xs font-medium">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="truncate text-2xs text-zinc-500">
                      {c.email}
                    </span>
                  </div>
                  <span className="font-mono text-2xs text-zinc-500">
                    {c.phone}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
