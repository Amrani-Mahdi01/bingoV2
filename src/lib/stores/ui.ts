"use client";

import { create } from "zustand";

interface UiState {
  mobileNavOpen: boolean;
  cartDrawerOpen: boolean;
  searchOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  toggleCartDrawer: () => void;
  toggleSearch: () => void;
}

export const useUi = create<UiState>((set) => ({
  mobileNavOpen: false,
  cartDrawerOpen: false,
  searchOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setCartDrawerOpen: (cartDrawerOpen) => set({ cartDrawerOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  toggleMobileNav: () =>
    set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  toggleCartDrawer: () =>
    set((s) => ({ cartDrawerOpen: !s.cartDrawerOpen })),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
}));
