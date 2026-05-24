"use client";

import { create } from "zustand";
import type { CartItem, Product } from "@/lib/types";

interface CartState {
  items: CartItem[];
  addItem: (
    product: Product,
    options?: { variant?: string; quantity?: number }
  ) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (
    productId: string,
    variant: string | undefined,
    quantity: number
  ) => void;
  clear: () => void;
}

function sameLine(a: CartItem, productId: string, variant?: string): boolean {
  return a.productId === productId && (a.variant ?? "") === (variant ?? "");
}

export const useCart = create<CartState>((set) => ({
  items: [],

  addItem: (product, options) =>
    set((state) => {
      const quantity = Math.max(1, options?.quantity ?? 1);
      const variant = options?.variant;
      const existing = state.items.find((it) =>
        sameLine(it, product.id, variant)
      );
      if (existing) {
        return {
          items: state.items.map((it) =>
            sameLine(it, product.id, variant)
              ? { ...it, quantity: it.quantity + quantity }
              : it
          ),
        };
      }
      const newItem: CartItem = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url ?? "",
        price: product.price,
        variant,
        quantity,
      };
      return { items: [...state.items, newItem] };
    }),

  removeItem: (productId, variant) =>
    set((state) => ({
      items: state.items.filter((it) => !sameLine(it, productId, variant)),
    })),

  updateQuantity: (productId, variant, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((it) => !sameLine(it, productId, variant)),
        };
      }
      return {
        items: state.items.map((it) =>
          sameLine(it, productId, variant) ? { ...it, quantity } : it
        ),
      };
    }),

  clear: () => set({ items: [] }),
}));

/* ---- Derived selectors ---- */
export const selectSubtotal = (state: CartState) =>
  state.items.reduce((s, it) => s + it.price * it.quantity, 0);

export const selectItemCount = (state: CartState) =>
  state.items.reduce((s, it) => s + it.quantity, 0);
