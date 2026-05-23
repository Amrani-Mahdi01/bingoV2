"use client";

import * as React from "react";

import type { Product } from "@/lib/products";

export type CartItem = { product: Product; qty: number };

type Ctx = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, qty?: number) => void;
  updateQty: (slug: string, delta: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "bingo.cart";

const CartContext = React.createContext<Ctx | null>(null);

/**
 * Cart state + actions, shared across the whole app via React Context.
 * Persists to localStorage so the cart survives reloads.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);

  // Hydrate from localStorage on mount (client-only).
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist on every change.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = React.useCallback(
    (product: Product, qty: number = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product.slug === product.slug);
        if (existing) {
          return prev.map((i) =>
            i.product.slug === product.slug ? { ...i, qty: i.qty + qty } : i
          );
        }
        return [...prev, { product, qty }];
      });
    },
    []
  );

  const updateQty = React.useCallback((slug: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product.slug === slug
            ? { ...i, qty: Math.max(0, i.qty + delta) }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }, []);

  const removeItem = React.useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.product.slug !== slug));
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.qty,
    0
  );

  const value = React.useMemo<Ctx>(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQty,
      removeItem,
      clear,
    }),
    [items, itemCount, subtotal, addItem, updateQty, removeItem, clear]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): Ctx {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    // Fallback for non-wrapped trees (server render, isolated previews).
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      addItem: () => {},
      updateQty: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
  return ctx;
}
