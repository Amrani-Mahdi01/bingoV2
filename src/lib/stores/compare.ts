"use client";

import { create } from "zustand";
import type { Product } from "@/lib/types";

export const COMPARE_MAX = 4;

interface CompareState {
  items: Product[];
  /** Returns true if the product was added, false if rejected. */
  addItem: (product: Product) => boolean;
  removeItem: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clear: () => void;
}

export const useCompare = create<CompareState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const state = get();
    if (state.items.find((p) => p.id === product.id)) return false;
    if (state.items.length >= COMPARE_MAX) return false;
    set({ items: [...state.items, product] });
    return true;
  },

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((p) => p.id !== productId),
    })),

  isInCompare: (productId) => !!get().items.find((p) => p.id === productId),

  clear: () => set({ items: [] }),
}));
