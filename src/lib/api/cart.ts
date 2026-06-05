"use client";

import { apiFetch } from "@/lib/api-client";

/** Wire shape of a cart line as returned by /api/auth/cart. The
 *  storefront's CartProvider maps this to its local CartItem. */
export interface ApiCartItem {
  id: number;
  qty: number;
  product: {
    slug: string;
    nameFr: string;
    nameAr: string | null;
    brand: string | null;
    price: number;
    oldPrice: number | null;
    image: string | null;
    categorySlug: string | null;
  };
  variant: {
    id: number;
    colorNameFr: string | null;
    colorNameAr: string | null;
    colorHex: string | null;
    sizeLabel: string | null;
    priceDelta: number;
  } | null;
}

interface ListResponse {
  data: ApiCartItem[];
}

/** Single-item shape the storefront sends to PUT /api/auth/cart. */
export interface CartReplaceItem {
  productSlug: string;
  variantId?: number | null;
  qty: number;
}

export const cartApi = {
  /** GET the customer's current cart (requires customer auth). */
  list(): Promise<ApiCartItem[]> {
    return apiFetch<ListResponse>("/auth/cart", { auth: true }).then(
      (r) => r.data,
    );
  },

  /** PUT the full cart state — backend replaces all rows with `items`. */
  replace(items: CartReplaceItem[]): Promise<ApiCartItem[]> {
    return apiFetch<ListResponse>("/auth/cart", {
      method: "PUT",
      body: { items },
      auth: true,
    }).then((r) => r.data);
  },

  /** DELETE everything. */
  clear(): Promise<void> {
    return apiFetch("/auth/cart", { method: "DELETE", auth: true }).then(
      () => undefined,
    );
  },
};
