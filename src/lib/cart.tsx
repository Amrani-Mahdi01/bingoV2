"use client";

import * as React from "react";

import { cartApi, type ApiCartItem, type CartReplaceItem } from "@/lib/api/cart";
import { useAuth } from "@/lib/auth";
import { type Product } from "@/lib/products";

/** Snapshot of the variant chosen at "add to cart" time. Stored on the
 *  cart line so the merchant sees exactly which color/size the customer
 *  ordered, even if the product is later edited. */
export interface CartItemVariant {
  id: string;
  colorNameFr: string | null;
  colorNameAr: string | null;
  colorHex: string | null;
  sizeLabel: string | null;
  /** Adjusted vs base product.price — included in line total. */
  priceDelta: number;
}

export type CartItem = {
  product: Product;
  qty: number;
  variant?: CartItemVariant;
};

/** Composite line key — same product with different variants are
 *  treated as separate cart lines. */
function lineId(slug: string, variantId?: string | null): string {
  return variantId ? `${slug}::${variantId}` : slug;
}

type Ctx = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, qty?: number, variant?: CartItemVariant) => void;
  /** `lineId` = `<slug>` or `<slug>::<variantId>`. Use the helper or
   *  read it off the line you already have. */
  updateQty: (lineId: string, delta: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "bingo.cart";

/** BroadcastChannel name for cross-tab cart sync. We currently only
 *  broadcast on `clear()` (i.e. after a successful order) — the other
 *  mutations are local-only by design. Sibling tabs receive the
 *  "cleared" message and drop their in-memory cart so the customer
 *  doesn't see ghost lines on the page they had open during checkout. */
const CART_BROADCAST = "bingo:cart-events";

const CartContext = React.createContext<Ctx | null>(null);

export { lineId };

/** Translate the backend's ApiCartItem wire shape into the local
 *  CartItem the rest of the storefront already speaks. */
function fromApi(item: ApiCartItem): CartItem {
  return {
    product: {
      slug: item.product.slug,
      name: item.product.nameFr,
      nameAr: item.product.nameAr ?? undefined,
      brand: item.product.brand ?? "—",
      price: item.product.price,
      oldPrice: item.product.oldPrice ?? undefined,
      image: item.product.image ?? "",
      categorySlug: item.product.categorySlug ?? undefined,
      description: "",
      features: [],
    },
    qty: item.qty,
    variant: item.variant
      ? {
          id: String(item.variant.id),
          colorNameFr: item.variant.colorNameFr,
          colorNameAr: item.variant.colorNameAr,
          colorHex: item.variant.colorHex,
          sizeLabel: item.variant.sizeLabel,
          priceDelta: item.variant.priceDelta,
        }
      : undefined,
  };
}

/** Translate the storefront's CartItem back into the wire shape the
 *  backend's PUT /api/auth/cart endpoint accepts. */
function toReplaceItem(item: CartItem): CartReplaceItem {
  return {
    productSlug: item.product.slug,
    variantId: item.variant?.id ? Number(item.variant.id) : null,
    qty: item.qty,
  };
}

/**
 * Cart state + actions, shared across the whole app via React Context.
 *
 * Storage routing:
 *   • Anonymous (no customer) → localStorage. Instant, survives reloads,
 *     lost when the browser clears site data.
 *   • Authenticated → backend (PUT /api/auth/cart on every change). The
 *     cart follows the customer across devices.
 *   • Login transition (anonymous → authenticated) → the local cart is
 *     merged into whatever's on the server, then we switch to the
 *     server as the source of truth.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer, loading: authLoading } = useAuth();
  const [items, setItems] = React.useState<CartItem[]>([]);
  // Tracks whether the live `items` value came from a confirmed source
  // (local hydration or server fetch). Mutations only push to the
  // backend after hydration completes — otherwise the first paint with
  // an empty array would wipe the server cart for a logged-in user.
  const [hydrated, setHydrated] = React.useState(false);
  // What we last sent to the server, so we don't re-push identical
  // state on every render.
  const lastPushedRef = React.useRef<string>("");
  // Latest items, mirrored into a ref so the debounced push picks up
  // the current value without re-creating the effect every change.
  const itemsRef = React.useRef<CartItem[]>(items);
  itemsRef.current = items;
  // Synchronous lock held by the hydration effect for the entire
  // window between "auth state changed" and "merge complete". When
  // `customer` flips (login or logout), React re-runs both this
  // effect and the persistence effect in the same render. Without
  // this lock, the persistence effect would schedule a PUT of the
  // pre-merge items — and if its 200 ms debounce fires before
  // `cartApi.list()` resolves, the server cart gets overwritten with
  // local-only items, and the hydration's merge then sees those same
  // items as "server cart" and sums them with local, duplicating the
  // quantities. Setting this synchronously at the top of hydration
  // ensures the persistence effect skips during this window.
  const hydrationLockRef = React.useRef<boolean>(false);

  // Logout transition (logged-in customer → null) handled during
  // render. We detect the change via a ref, then call setItems([])
  // SYNCHRONOUSLY so the cart never paints the previous customer's
  // items. Calling a setter during render is explicitly supported by
  // React when deriving state from a changed input — it discards the
  // current render output and re-renders with the new state before
  // committing. Without this, the persistence effect that re-runs in
  // the same render captures the stale items closure and writes the
  // previous logged-in cart to localStorage (which then survives a
  // page refresh as an "anonymous" cart, even though the customer
  // just logged out). The persistence effect's `writeLocal([])` on
  // the re-render then keeps localStorage in sync.
  const prevCustomerRef = React.useRef(customer);
  if (prevCustomerRef.current && !customer) {
    setItems([]);
    lastPushedRef.current = "[]";
  }
  prevCustomerRef.current = customer;

  const readLocal = React.useCallback((): CartItem[] => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (i): i is CartItem =>
          i != null && typeof i === "object" && !!i.product?.slug && i.qty > 0,
      );
    } catch {
      return [];
    }
  }, []);

  const writeLocal = React.useCallback((next: CartItem[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  // ─── Cross-tab "cart cleared" listener ─────────────────────────
  // When ANY other tab in this browser finishes an order (and calls
  // clear()), this fires here and we drop our local cart too — so
  // every open tab matches the post-order state without the customer
  // having to refresh. We also pin lastPushedRef to "[]" so the
  // persistence effect below doesn't fire a redundant PUT against
  // the server cart that the originating tab already cleared.
  React.useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }
    const ch = new BroadcastChannel(CART_BROADCAST);
    ch.onmessage = (e: MessageEvent<{ type?: string }>) => {
      if (e.data?.type !== "cleared") return;
      lastPushedRef.current = "[]";
      setItems([]);
    };
    return () => ch.close();
  }, []);

  // ─── Hydration / auth transitions ───────────────────────────────
  // Runs whenever the customer changes (login, logout, refresh).
  React.useEffect(() => {
    if (authLoading) return;
    // Claim the lock synchronously so the persistence effect that
    // re-runs in this same render (because `customer` changed) skips
    // its PUT until the merge below has finished.
    hydrationLockRef.current = true;
    let cancelled = false;

    const local = readLocal();

    if (!customer) {
      // Anonymous → just use the local cart.
      if (!cancelled) {
        setItems(local);
        lastPushedRef.current = JSON.stringify(local.map(toReplaceItem));
        setHydrated(true);
      }
      hydrationLockRef.current = false;
      return;
    }

    // Logged in: fetch the server cart, merge any local items into it
    // (sum quantities for matching lines), then push the merged state
    // back so the server reflects it. Switch to the server as source
    // of truth — local storage stops driving the cart while logged in.
    (async () => {
      try {
        const serverRaw = await cartApi.list();
        const server = serverRaw.map(fromApi);

        // Merge: for each local line, add its qty into the server line
        // with the same product+variant. Otherwise append.
        const merged: CartItem[] = server.map((i) => ({ ...i }));
        for (const localItem of local) {
          const key = lineId(localItem.product.slug, localItem.variant?.id);
          const idx = merged.findIndex(
            (m) => lineId(m.product.slug, m.variant?.id) === key,
          );
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              qty: merged[idx].qty + localItem.qty,
            };
          } else {
            merged.push(localItem);
          }
        }

        // If the merge actually changed anything, push it.
        const mergedReplace = merged.map(toReplaceItem);
        const serverReplace = server.map(toReplaceItem);
        if (
          JSON.stringify(mergedReplace) !== JSON.stringify(serverReplace) &&
          mergedReplace.length > 0
        ) {
          const final = (await cartApi.replace(mergedReplace)).map(fromApi);
          if (cancelled) return;
          setItems(final);
          lastPushedRef.current = JSON.stringify(final.map(toReplaceItem));
        } else {
          if (cancelled) return;
          setItems(merged);
          lastPushedRef.current = JSON.stringify(merged.map(toReplaceItem));
        }
        // Clear local storage once it's safely on the server.
        writeLocal([]);
      } catch {
        // Server fetch failed — fall back to what's local so the user
        // doesn't see an empty cart they didn't ask for.
        if (cancelled) return;
        setItems(local);
        lastPushedRef.current = JSON.stringify(local.map(toReplaceItem));
      } finally {
        if (!cancelled) setHydrated(true);
        hydrationLockRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, authLoading, readLocal, writeLocal]);

  // ─── Persistence on every mutation ──────────────────────────────
  // Anonymous → write to localStorage. Authenticated → debounced PUT
  // to the backend (200 ms after the last change). The hydration gate
  // above prevents the very first paint from wiping the server cart;
  // the lock further blocks this effect during an in-flight
  // auth-transition merge so the same items never get PUT twice
  // (which would double quantities — see `hydrationLockRef`).
  React.useEffect(() => {
    if (!hydrated) return;
    if (hydrationLockRef.current) return;
    if (!customer) {
      writeLocal(items);
      return;
    }
    const t = setTimeout(() => {
      // Re-check at fire time: if hydration claimed the lock after the
      // effect scheduled this timeout (rare, but possible if the user
      // logs out and back in faster than 200 ms), drop the PUT.
      if (hydrationLockRef.current) return;
      const wire = items.map(toReplaceItem);
      const serialised = JSON.stringify(wire);
      if (serialised === lastPushedRef.current) return;
      lastPushedRef.current = serialised;
      cartApi
        .replace(wire)
        .then((res) => {
          // Reconcile with whatever the server actually wrote (some
          // rows may have been dropped if the product was disabled).
          const reconciled = res.map(fromApi);
          if (
            JSON.stringify(reconciled.map(toReplaceItem)) !== serialised
          ) {
            // Only update if the reconciled state differs — avoids a
            // re-render loop when everything matches.
            setItems(reconciled);
            lastPushedRef.current = JSON.stringify(
              reconciled.map(toReplaceItem),
            );
          }
        })
        .catch(() => {
          /* swallow — keep the local optimistic state for now */
        });
    }, 200);
    return () => clearTimeout(t);
  }, [items, hydrated, customer, writeLocal]);

  // ─── Mutations ──────────────────────────────────────────────────
  const addItem = React.useCallback(
    (product: Product, qty: number = 1, variant?: CartItemVariant) => {
      const key = lineId(product.slug, variant?.id);
      setItems((prev) => {
        const existing = prev.find(
          (i) => lineId(i.product.slug, i.variant?.id) === key,
        );
        if (existing) {
          return prev.map((i) =>
            lineId(i.product.slug, i.variant?.id) === key
              ? { ...i, qty: i.qty + qty }
              : i,
          );
        }
        return [...prev, { product, qty, variant }];
      });
    },
    [],
  );

  const updateQty = React.useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          lineId(i.product.slug, i.variant?.id) === id
            ? { ...i, qty: Math.max(0, i.qty + delta) }
            : i,
        )
        .filter((i) => i.qty > 0),
    );
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) =>
      prev.filter((i) => lineId(i.product.slug, i.variant?.id) !== id),
    );
  }, []);

  const clear = React.useCallback(() => {
    // Mark the wire state empty BEFORE flipping React state so the
    // persistence effect below sees no diff and skips its PUT.
    lastPushedRef.current = "[]";
    setItems([]);
    // When logged in we also need to hit DELETE so the server forgets
    // the cart immediately — the PUT-debounce above would do it too,
    // but DELETE is the right verb for "user just placed an order".
    if (customer) {
      cartApi.clear().catch(() => {
        /* ignore */
      });
    }
    // Cross-tab fan-out: every other tab in this browser empties its
    // cart immediately, so the customer doesn't have to refresh after
    // placing an order. Anonymous tabs also re-read [] from
    // localStorage on next mount via the storage event below.
    if (typeof window !== "undefined") {
      writeLocal([]);
      if ("BroadcastChannel" in window) {
        try {
          const ch = new BroadcastChannel(CART_BROADCAST);
          ch.postMessage({ type: "cleared" });
          ch.close();
        } catch {
          /* ignore — sibling tabs will pick up the change on next reload */
        }
      }
    }
  }, [customer, writeLocal]);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (i.product.price + (i.variant?.priceDelta ?? 0)) * i.qty,
    0,
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
    [items, itemCount, subtotal, addItem, updateQty, removeItem, clear],
  );
  // itemsRef silences the lint about being "set but never read" — it's
  // intentional: the debounced effect uses it without re-subscribing.
  void itemsRef;

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
