import type { ApiProduct } from "@/lib/api/products";
import { serverFetch } from "@/lib/server/server-fetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

interface ListResponse {
  data: ApiProduct[];
  meta?: { total: number; page: number; perPage: number; lastPage: number };
}
interface SingleResponse {
  data: ApiProduct;
}

interface ListParams {
  q?: string;
  category?: string;
  brand?: string;
  promoOnly?: boolean;
  inStockOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  flag?: "featured" | "new" | "bestseller" | "promo";
  sort?: "new" | "price-asc" | "price-desc" | "bestseller";
  page?: number;
  perPage?: number;
}

function buildQuery(params: ListParams): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.brand) qs.set("brand", params.brand);
  if (params.promoOnly) qs.set("promoOnly", "1");
  if (params.inStockOnly) qs.set("inStockOnly", "1");
  if (params.minPrice !== undefined) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set("maxPrice", String(params.maxPrice));
  if (params.flag) qs.set("flag", params.flag);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page) qs.set("page", String(params.page));
  if (params.perPage) qs.set("perPage", String(params.perPage));
  return qs.toString();
}

/**
 * Server-safe storefront product listing. Falls back to an empty list +
 * zero-meta on any error so callers can render an "aucun produit" state
 * without crashing the page.
 */
export async function listPublicProducts(
  params: ListParams = {},
): Promise<{ items: ApiProduct[]; total: number }> {
  try {
    const qs = buildQuery(params);
    const url = `${API_URL}/api/products${qs ? `?${qs}` : ""}`;
    const res = await serverFetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60, tags: ["products"] },
    });
    if (!res.ok) return { items: [], total: 0 };
    const json = (await res.json()) as ListResponse;
    return { items: json.data ?? [], total: json.meta?.total ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getPublicProductBySlug(
  slug: string,
): Promise<ApiProduct | null> {
  try {
    const res = await serverFetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      // No long cache on the detail page so view_count + edits propagate.
      next: { revalidate: 10, tags: ["products", `product:${slug}`] },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as SingleResponse;
    return json.data ?? null;
  } catch {
    return null;
  }
}
