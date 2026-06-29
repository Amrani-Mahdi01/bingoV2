import type { ApiBrand } from "@/lib/api/brands";
import { serverFetch } from "@/lib/server/server-fetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

interface ListResponse {
  data: ApiBrand[];
}

/** Server-safe public brand listing (active only). */
export async function brandsPublic(): Promise<ApiBrand[]> {
  try {
    const res = await serverFetch(`${API_URL}/api/brands`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60, tags: ["brands"] },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as ListResponse;
    return json.data ?? [];
  } catch {
    return [];
  }
}
