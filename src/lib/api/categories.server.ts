import type { ApiCategory } from "@/lib/api/categories";
import { serverFetch } from "@/lib/server/server-fetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/**
 * Server-side public-categories fetch. Returns top-level rows with their
 * direct children. Falls back to empty list on any error so the storefront
 * never blows up.
 */
export async function listPublicCategories(): Promise<ApiCategory[]> {
  try {
    const res = await serverFetch(`${API_URL}/api/categories`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60, tags: ["categories"] },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: ApiCategory[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}
