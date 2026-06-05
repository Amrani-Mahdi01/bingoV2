"use client";

import { http } from "@/lib/api/http";
import type { ApiBrand } from "@/lib/api/brands";
import type { ApiCategory } from "@/lib/api/categories";

export interface ApiProductImage {
  id: string;
  url: string;
  altFr: string | null;
  altAr: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ApiProductVariant {
  id: string;
  colorNameFr: string | null;
  colorNameAr: string | null;
  colorHex: string | null;
  sizeLabel: string | null;
  skuSuffix: string | null;
  priceDelta: number;
  stock: number;
  displayOrder: number;
}

export interface ApiProduct {
  id: string;
  slug: string;
  sku: string;
  nameFr: string;
  nameAr: string;
  descriptionShortFr: string | null;
  descriptionShortAr: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
  /** Optional product video (absolute URL), max one per product. */
  video: string | null;
  categoryId: string | null;
  brandId: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  trackStock: boolean;
  allowBackorder: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isPromo: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  soldCount: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  images: ApiProductImage[];
  variants: ApiProductVariant[];
  /** Eager-loaded relations on /api/admin/products responses. */
  category?: ApiCategory;
  brand?: ApiBrand;
}

export interface ProductPayload {
  slug?: string | null;
  sku?: string | null;
  nameFr: string;
  nameAr: string;
  descriptionShortFr?: string | null;
  descriptionShortAr?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  video?: string | null;
  categoryId: number;
  brandId: number;
  price: number;
  oldPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  trackStock?: boolean;
  allowBackorder?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isPromo?: boolean;
  images?: Array<{ url: string; altFr?: string | null; altAr?: string | null }>;
  variants?: Array<{
    colorNameFr?: string | null;
    colorNameAr?: string | null;
    colorHex?: string | null;
    sizeLabel?: string | null;
    stock?: number;
    priceDelta?: number;
    skuSuffix?: string | null;
  }>;
}

interface ListResponse {
  data: ApiProduct[];
  meta: { total: number; page: number; perPage: number; lastPage: number };
}
interface SingleResponse {
  data: ApiProduct;
}

export const productsApi = {
  listAll(params: { page?: number; perPage?: number; q?: string; categoryId?: string; brandId?: string } = {}): Promise<ListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("perPage", String(params.perPage));
    if (params.q) query.set("q", params.q);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.brandId) query.set("brandId", params.brandId);
    const qs = query.toString();
    return http.get<ListResponse>(
      `/api/admin/products${qs ? `?${qs}` : ""}`,
      { auth: "admin" },
    );
  },

  /**
   * Public product search — hits `GET /api/products?q=…` (no auth).
   * Used by the storefront header's live search dropdown.
   * Server-side filters by `name_fr`, `name_ar`, `sku`, and brand name.
   */
  searchPublic(params: { q: string; perPage?: number; signal?: AbortSignal } = { q: "" }): Promise<ListResponse> {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    query.set("perPage", String(params.perPage ?? 8));
    return http.get<ListResponse>(
      `/api/products?${query.toString()}`,
      { auth: "none", signal: params.signal },
    );
  },

  /** Public catalogue list — hits `GET /api/products` (no auth) and
   *  pulls up to `perPage` active products. The storefront /catalogue
   *  page loads the whole list once and filters/sorts client-side. */
  listPublic(opts: { perPage?: number; signal?: AbortSignal } = {}): Promise<ListResponse> {
    const query = new URLSearchParams();
    query.set("perPage", String(opts.perPage ?? 100));
    return http.get<ListResponse>(
      `/api/products?${query.toString()}`,
      { auth: "none", signal: opts.signal },
    );
  },

  get(id: string): Promise<ApiProduct> {
    return http
      .get<SingleResponse>(`/api/admin/products/${id}`, { auth: "admin" })
      .then((r) => r.data);
  },

  create(payload: ProductPayload): Promise<ApiProduct> {
    return http
      .post<SingleResponse>("/api/admin/products", payload, { auth: "admin" })
      .then((r) => r.data);
  },

  update(id: string, payload: ProductPayload): Promise<ApiProduct> {
    return http
      .put<SingleResponse>(`/api/admin/products/${id}`, payload, { auth: "admin" })
      .then((r) => r.data);
  },

  destroy(id: string): Promise<void> {
    return http.delete(`/api/admin/products/${id}`, { auth: "admin" }) as Promise<void>;
  },

  uploadImage(file: File): Promise<{ path: string; url: string }> {
    const fd = new FormData();
    fd.append("file", file);
    return http.upload<{ path: string; url: string }>(
      "/api/admin/uploads/product-image",
      fd,
      { auth: "admin" },
    );
  },

  uploadVideo(file: File | Blob): Promise<{ path: string; url: string }> {
    const fd = new FormData();
    // The Blob comes from client-side compression; give it a filename so the
    // backend sees a proper .mp4 upload.
    fd.append("file", file, "video.mp4");
    return http.upload<{ path: string; url: string }>(
      "/api/admin/uploads/product-video",
      fd,
      { auth: "admin" },
    );
  },
};
