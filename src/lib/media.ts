/**
 * Normalize any backend media URL to the Cloudflare-fronted host
 * (`api.bingo-camp.com/storage/...`).
 *
 * Product/category images arrive from the API in several shapes: absolute on
 * the direct Hostinger host (`https://bingo.symloop.com/storage/…`), relative
 * (`/storage/…`), or already on Cloudflare. Two problems that causes:
 *   - the direct Hostinger host is unreachable on Algerian mobile carriers
 *     (the image request just times out), and
 *   - routing images through the Vercel `/storage` rewrite trips Hostinger's
 *     per-IP 429 under a page's image burst (a catalogue fires ~20 at once).
 *
 * Serving them straight from Cloudflare fixes both: Cloudflare's edge is
 * reachable on mobile and caches + coalesces the burst, so the origin is hit
 * about once per file instead of once per request.
 *
 * External URLs (e.g. Unsplash) and local `/public` assets (no `/storage`
 * segment) are returned unchanged; `data:`/`blob:` URLs pass through too.
 */
const MEDIA_HOST = (
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "https://api.bingo-camp.com"
).replace(/\/$/, "");

export function mediaUrl(raw?: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
  const i = raw.indexOf("/storage/");
  if (i >= 0) return `${MEDIA_HOST}${raw.slice(i)}`;
  return raw;
}
