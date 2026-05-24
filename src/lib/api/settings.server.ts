import type { SettingsMap } from "@/lib/api/settings";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/**
 * Server-side fetch for the public site settings (logo, etc).
 * Used by the public-layout to provide the logo URL to the Header.
 * Returns an empty object on failure so callers can fall back safely.
 */
export async function getPublicSettings(): Promise<SettingsMap> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60, tags: ["settings"] },
    });
    if (!res.ok) return {};
    const json = (await res.json()) as { data: SettingsMap };
    return json.data ?? {};
  } catch {
    return {};
  }
}
