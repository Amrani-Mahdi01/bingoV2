"use client";

import { http } from "@/lib/api/http";

/** API-shape Category (camelCase, bilingual). */
export interface ApiCategory {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  parentId: string | null;
  icon: string;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  /** Only present on top-level rows. */
  children?: ApiCategory[];
}

interface CategoryPayload {
  slug?: string | null;
  nameFr: string;
  nameAr: string;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  parentId?: number | null;
  icon?: string | null;
  image?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

interface ListResponse {
  data: ApiCategory[];
}
interface SingleResponse {
  data: ApiCategory;
}

export const categoriesApi = {
  /** Admin — full tree, includes inactive. */
  listAll(): Promise<ApiCategory[]> {
    return http
      .get<ListResponse>("/api/admin/categories", { auth: "admin" })
      .then((r) => r.data);
  },

  /** Public — top-level categories with their direct children, active only. */
  listPublic(opts: { signal?: AbortSignal } = {}): Promise<ApiCategory[]> {
    return http
      .get<ListResponse>("/api/categories", { auth: "none", signal: opts.signal })
      .then((r) => r.data);
  },

  create(payload: CategoryPayload): Promise<ApiCategory> {
    return http
      .post<SingleResponse>("/api/admin/categories", payload, { auth: "admin" })
      .then((r) => r.data);
  },

  update(id: string, payload: CategoryPayload): Promise<ApiCategory> {
    return http
      .put<SingleResponse>(`/api/admin/categories/${id}`, payload, { auth: "admin" })
      .then((r) => r.data);
  },

  destroy(id: string, opts: { cascade?: boolean } = {}): Promise<void> {
    const qs = opts.cascade ? "?cascade=1" : "";
    return http.delete(`/api/admin/categories/${id}${qs}`, {
      auth: "admin",
    }) as Promise<void>;
  },

  move(id: string, direction: "up" | "down"): Promise<void> {
    return http.post(
      `/api/admin/categories/${id}/move`,
      { direction },
      { auth: "admin" },
    ) as Promise<void>;
  },

  /** Bulk reorder a sibling group (top-level or one parent's children). */
  reorder(ids: string[]): Promise<void> {
    return http.post(
      "/api/admin/categories/reorder",
      { ids: ids.map((s) => Number(s)) },
      { auth: "admin" },
    ) as Promise<void>;
  },

  uploadImage(file: File): Promise<{ path: string; url: string }> {
    const fd = new FormData();
    fd.append("file", file);
    return http.upload<{ path: string; url: string }>(
      "/api/admin/uploads/category-image",
      fd,
      { auth: "admin" },
    );
  },
};
