"use client";

import * as React from "react";

const STORAGE_KEY = "bingo.favorites";

type Ctx = {
  /** Slugs of favorited products. */
  slugs: string[];
  /** Total count — derived from `slugs.length`. */
  count: number;
  has: (slug: string) => boolean;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  toggle: (slug: string) => void;
  clear: () => void;
};

const FavoritesContext = React.createContext<Ctx | null>(null);

/**
 * Favorites state + actions, shared across the app via React Context.
 * Persists to localStorage so favorites survive reloads.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  // Use a Set internally for O(1) has/add/remove; expose as array.
  const [set, setSet] = React.useState<Set<string>>(() => new Set());

  // Hydrate from localStorage (client-only).
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) setSet(new Set(parsed));
    } catch {
      /* ignore */
    }
  }, []);

  // Persist on every change.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(set))
      );
    } catch {
      /* ignore */
    }
  }, [set]);

  const has = React.useCallback((slug: string) => set.has(slug), [set]);

  const add = React.useCallback((slug: string) => {
    setSet((prev) => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
  }, []);

  const remove = React.useCallback((slug: string) => {
    setSet((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  }, []);

  const toggle = React.useCallback((slug: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const clear = React.useCallback(() => setSet(new Set()), []);

  const slugs = React.useMemo(() => Array.from(set), [set]);

  const value = React.useMemo<Ctx>(
    () => ({
      slugs,
      count: slugs.length,
      has,
      add,
      remove,
      toggle,
      clear,
    }),
    [slugs, has, add, remove, toggle, clear]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): Ctx {
  const ctx = React.useContext(FavoritesContext);
  if (!ctx) {
    return {
      slugs: [],
      count: 0,
      has: () => false,
      add: () => {},
      remove: () => {},
      toggle: () => {},
      clear: () => {},
    };
  }
  return ctx;
}
