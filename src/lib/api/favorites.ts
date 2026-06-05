"use client";

import { apiFetch } from "@/lib/api-client";

/** Joined favorite row returned by GET /api/auth/favorites. The
 *  FavoritesProvider only stores the slug list for backwards compat
 *  with the rest of the storefront, but exposes this richer payload
 *  to the /favoris page so it doesn't have to look products up again. */
export interface ApiFavorite {
  slug: string;
  nameFr: string;
  nameAr: string | null;
  brand: string | null;
  price: number;
  oldPrice: number | null;
  image: string | null;
  categorySlug: string | null;
}

interface ListResponse {
  data: ApiFavorite[];
}

export const favoritesApi = {
  list(): Promise<ApiFavorite[]> {
    return apiFetch<ListResponse>("/auth/favorites", { auth: true }).then(
      (r) => r.data,
    );
  },
  /** Bulk replace — backend keeps only the slugs provided. */
  replace(slugs: string[]): Promise<ApiFavorite[]> {
    return apiFetch<ListResponse>("/auth/favorites", {
      method: "PUT",
      body: { slugs },
      auth: true,
    }).then((r) => r.data);
  },
  clear(): Promise<void> {
    return apiFetch("/auth/favorites", { method: "DELETE", auth: true }).then(
      () => undefined,
    );
  },
};
