"use client";

import * as React from "react";

import { favoritesApi, type ApiFavorite } from "@/lib/api/favorites";
import { useAuth } from "@/lib/auth";
import { PRODUCTS, type Product } from "@/lib/products";

const STORAGE_KEY = "bingo.favorites";

/** Minimal info we cache per favorited slug so the /favoris page can
 *  render cards without re-looking up products. Anonymous flows fall
 *  back to the local PRODUCTS mock when the cache is empty. */
export interface FavoriteEntry {
  slug: string;
  product?: Product;
}

type Ctx = {
  /** Slugs of favorited products. */
  slugs: string[];
  /** Resolved product cards for the /favoris page. Server-fetched
   *  data is used when logged in; falls back to local PRODUCTS for
   *  anonymous users / slugs that aren't yet cached. */
  items: Product[];
  /** Total count — derived from `slugs.length`. */
  count: number;
  has: (slug: string) => boolean;
  /** Add a favorite. Pass a Product (preferred — caches the rich data
   *  for /favoris) or a bare slug (legacy — relies on PRODUCTS lookup). */
  add: (productOrSlug: Product | string) => void;
  remove: (slug: string) => void;
  toggle: (productOrSlug: Product | string) => void;
  clear: () => void;
};

function slugOf(productOrSlug: Product | string): string {
  return typeof productOrSlug === "string" ? productOrSlug : productOrSlug.slug;
}

function fromApi(row: ApiFavorite): Product {
  return {
    slug: row.slug,
    name: row.nameFr,
    nameAr: row.nameAr ?? undefined,
    brand: row.brand ?? "—",
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    image: row.image ?? "",
    categorySlug: row.categorySlug ?? undefined,
    description: "",
    features: [],
  };
}

const FavoritesContext = React.createContext<Ctx | null>(null);

/**
 * Favorites state + actions, shared across the app via React Context.
 *
 * Storage routing (same dual-mode policy as the cart):
 *   • Anonymous     → localStorage. Instant, survives reloads.
 *   • Logs in       → fetch server favorites, merge local slugs in,
 *                     PUT the union back. Local storage clears.
 *   • Authenticated → debounced PUT /api/auth/favorites on each change.
 *   • Logout        → revert to anonymous local-only.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { customer, loading: authLoading } = useAuth();
  // Use a Set internally for O(1) has/add/remove; expose as array.
  const [set, setSet] = React.useState<Set<string>>(() => new Set());
  // Per-slug rich product data — drives `items` for /favoris.
  const [cache, setCache] = React.useState<Map<string, Product>>(
    () => new Map(),
  );
  // Block PUT-on-change until either local hydration completes
  // (anonymous) or the server fetch + merge resolves (logged in).
  // Without this gate, the very first render with an empty Set would
  // wipe the server favorites for a logged-in user.
  const [hydrated, setHydrated] = React.useState(false);
  const lastPushedRef = React.useRef<string>("");

  const readLocal = React.useCallback(
    (): { slugs: string[]; entries: Map<string, Product> } => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { slugs: [], entries: new Map() };
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return { slugs: [], entries: new Map() };
        // Support both the legacy `string[]` shape and the new
        // `{slug, product?}[]` shape so existing local favorites
        // keep working after this code lands.
        const slugs: string[] = [];
        const entries = new Map<string, Product>();
        for (const item of parsed) {
          if (typeof item === "string" && item) {
            slugs.push(item);
          } else if (
            item != null &&
            typeof item === "object" &&
            typeof (item as { slug?: unknown }).slug === "string"
          ) {
            const e = item as FavoriteEntry;
            if (!e.slug) continue;
            slugs.push(e.slug);
            if (e.product) entries.set(e.slug, e.product);
          }
        }
        return { slugs, entries };
      } catch {
        return { slugs: [], entries: new Map() };
      }
    },
    [],
  );

  const writeLocal = React.useCallback(
    (slugs: string[], cache: Map<string, Product>) => {
      try {
        const payload: FavoriteEntry[] = slugs.map((s) => ({
          slug: s,
          product: cache.get(s),
        }));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  // ─── Hydration / auth transitions ───────────────────────────────
  React.useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const local = readLocal();

    if (!customer) {
      // Anonymous → drive from localStorage. Rich product entries
      // (when present) feed the items list; older string-only entries
      // fall back to PRODUCTS lookup at render time.
      if (!cancelled) {
        setSet(new Set(local.slugs));
        setCache(local.entries);
        lastPushedRef.current = JSON.stringify(local.slugs.slice().sort());
        setHydrated(true);
      }
      return;
    }

    // Logged in: fetch server favs (with full product data), union
    // with local slugs, push if merged. The server response always
    // wins for the cache so /favoris shows real DB names/prices.
    (async () => {
      try {
        const server = await favoritesApi.list();
        const serverSlugs = server.map((s) => s.slug);
        const union = Array.from(new Set([...serverSlugs, ...local.slugs]));

        const serverSerialised = JSON.stringify(serverSlugs.slice().sort());
        const unionSerialised = JSON.stringify(union.slice().sort());

        const after =
          unionSerialised !== serverSerialised
            ? await favoritesApi.replace(union)
            : server;
        if (cancelled) return;

        const finalSlugs = after.map((s) => s.slug);
        const finalCache = new Map<string, Product>();
        for (const row of after) finalCache.set(row.slug, fromApi(row));
        // Preserve any local-only rich entries that the server hasn't
        // re-returned (rare: a slug that exists locally but the server
        // refused). Saves a UX flash if the merge dropped one.
        for (const [slug, product] of local.entries) {
          if (!finalCache.has(slug)) finalCache.set(slug, product);
        }
        setSet(new Set(finalSlugs));
        setCache(finalCache);
        lastPushedRef.current = JSON.stringify(finalSlugs.slice().sort());
        writeLocal([], new Map()); // server is now source of truth
      } catch {
        // Network blip → fall back to whatever's local so the user
        // doesn't see "no favorites" by accident.
        if (cancelled) return;
        setSet(new Set(local.slugs));
        setCache(local.entries);
        lastPushedRef.current = JSON.stringify(local.slugs.slice().sort());
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, authLoading, readLocal, writeLocal]);

  // ─── Persistence on every mutation ──────────────────────────────
  React.useEffect(() => {
    if (!hydrated) return;
    const arr = Array.from(set);
    if (!customer) {
      writeLocal(arr, cache);
      return;
    }
    const t = setTimeout(() => {
      const sorted = arr.slice().sort();
      const serialised = JSON.stringify(sorted);
      if (serialised === lastPushedRef.current) return;
      lastPushedRef.current = serialised;
      favoritesApi
        .replace(arr)
        .then((res) => {
          // Reconcile in case the server dropped any disabled-product
          // slugs we tried to send. Also refresh the cache with the
          // server-returned rich product data.
          const reconciled = res.map((s) => s.slug);
          const reconciledSerialised = JSON.stringify(
            reconciled.slice().sort(),
          );
          setCache((prev) => {
            const next = new Map(prev);
            for (const row of res) next.set(row.slug, fromApi(row));
            return next;
          });
          if (reconciledSerialised !== serialised) {
            setSet(new Set(reconciled));
            lastPushedRef.current = reconciledSerialised;
          }
        })
        .catch(() => {
          /* swallow — keep optimistic local state */
        });
    }, 200);
    return () => clearTimeout(t);
  }, [set, cache, hydrated, customer, writeLocal]);

  const has = React.useCallback((slug: string) => set.has(slug), [set]);

  const add = React.useCallback((productOrSlug: Product | string) => {
    const slug = slugOf(productOrSlug);
    const product =
      typeof productOrSlug === "string" ? undefined : productOrSlug;
    setSet((prev) => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
    if (product) {
      setCache((prev) => {
        const next = new Map(prev);
        next.set(slug, product);
        return next;
      });
    }
  }, []);

  const remove = React.useCallback((slug: string) => {
    setSet((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
    setCache((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Map(prev);
      next.delete(slug);
      return next;
    });
  }, []);

  const toggle = React.useCallback(
    (productOrSlug: Product | string) => {
      const slug = slugOf(productOrSlug);
      if (set.has(slug)) {
        remove(slug);
      } else {
        add(productOrSlug);
      }
    },
    [set, add, remove],
  );

  const clear = React.useCallback(() => {
    setSet(new Set());
    setCache(new Map());
    if (customer) {
      favoritesApi.clear().catch(() => {
        /* ignore */
      });
      lastPushedRef.current = "[]";
    }
  }, [customer]);

  const slugs = React.useMemo(() => Array.from(set), [set]);

  /** Items the /favoris page renders — rich product data per slug.
   *  Order matches `slugs`. Sources, in priority:
   *    1. The per-slug cache (server fetch or rich `add(product)` call)
   *    2. The local PRODUCTS mock (back-compat for old anon entries)
   *  Slugs that resolve to neither are dropped — they can't render. */
  const items = React.useMemo<Product[]>(() => {
    return slugs
      .map((slug) => cache.get(slug) ?? PRODUCTS.find((p) => p.slug === slug))
      .filter((p): p is Product => Boolean(p));
  }, [slugs, cache]);

  const value = React.useMemo<Ctx>(
    () => ({
      slugs,
      items,
      count: slugs.length,
      has,
      add,
      remove,
      toggle,
      clear,
    }),
    [slugs, has, add, remove, toggle, clear],
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
    // Fallback when the hook runs outside a provider — keeps server
    // renders + isolated previews from throwing. The `items` field
    // was added later; the no-op shape needs it to match `Ctx`.
    return {
      slugs: [],
      items: [],
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
