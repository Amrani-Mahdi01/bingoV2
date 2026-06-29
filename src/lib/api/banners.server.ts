import type { Banner } from "@/lib/types";
import { serverFetch } from "@/lib/server/server-fetch";

/**
 * Server-side banner fetch. The homepage is an RSC, so the client-side
 * `http` wrapper (which references `localStorage`) is off-limits — use
 * plain `fetch` against the public Laravel endpoint instead.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function listPublicBanners(): Promise<Banner[]> {
  try {
    const res = await serverFetch(`${API_URL}/api/banners`, {
      headers: { Accept: "application/json" },
      // Re-fetch at most every 60s so admin edits propagate without an
      // explicit revalidation hook.
      next: { revalidate: 60, tags: ["banners"] },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Banner[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}
