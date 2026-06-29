/**
 * Server-side fetch with a hard timeout.
 *
 * Storefront pages are server-rendered and pull their data from the Laravel
 * backend on Hostinger (LiteSpeed shared hosting). That backend can momentarily
 * *stall* — accept the TCP connection but never send a response. A bare fetch()
 * has no timeout, so a stall blocks the whole SSR render until Vercel's function
 * times out and returns a 504: from the visitor's side the page simply "won't
 * load" until they retry and hit a warm cache.
 *
 * This wrapper aborts a stalled request after `timeoutMs`. Every caller already
 * wraps its fetch in try/catch with a safe fallback (empty list / defaults), so
 * an aborted request just trips that fallback and the page renders with cached
 * or default data instead of hanging.
 *
 * Caching is preserved: Next opts a fetch out of its cache only for
 * `cache: "no-store" | "no-cache"`, never for the presence of a signal, and it
 * strips the signal during background revalidation — so the timeout applies to
 * the blocking (cold / stale-blocking) render path only, which is exactly the
 * slow path we need to protect.
 */
export function serverFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs = 6000,
): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
