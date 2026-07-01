/**
 * Thin fetch wrapper for the BINGO Laravel API.
 *
 * NEXT_PUBLIC_API_URL is the host only (e.g. `http://127.0.0.1:8000`).
 * `/api` is prepended here so callers can just pass `/auth/login` etc.
 * This convention matches the admin http.ts wrapper which also expects
 * the host-only form, so the two share a single env var.
 */

const HOST = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

/**
 * Where the browser sends API calls.
 *
 * In the browser we go through the same-origin `/bk` proxy (see next.config
 * rewrites): the device never contacts the backend host directly — which
 * fixes mobile networks that can reach Vercel but not the backend server —
 * and there's no cross-origin CORS. On the server (SSR / build) there is no
 * same-origin, so fall back to the absolute backend URL. apiFetch is
 * client-only in practice; this just keeps any stray SSR call working.
 */
const baseUrl = (): string =>
  typeof window !== "undefined" ? "/bk" : `${HOST}/api`;

/**
 * Master switch for the auth flow.
 *
 * - Set `NEXT_PUBLIC_AUTH_ENABLED=true` in `.env.local` (dev) or in the
 *   Vercel project env to turn login/register/account UI on and let the
 *   auth providers hit `/auth/me` on mount.
 * - Leave it unset / `false` for deployments without a backend — the
 *   header account icon hides, the /login + /register pages render a
 *   "coming soon" placeholder, and the providers skip their fetch so
 *   no failed network calls show up in the console.
 */
export const AUTH_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

// Match the keys used by src/lib/api/http.ts so the admin pages
// (which read these directly) and the auth contexts share storage.
const TOKEN_KEY = "bingo-customer-token";
const ADMIN_TOKEN_KEY = "bingo-admin-token";

export class ApiError extends Error {
  status: number;
  /** Laravel field-level errors: { email: ["already taken"], … } */
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

type Options = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * Which token to attach:
   * - `true` (default) = customer bearer token
   * - `"admin"` = admin bearer token
   * - `false` = no bearer at all
   */
  auth?: boolean | "admin";
};

/**
 * Resilience knobs. Mobile / flaky-Wi-Fi clients (esp. on Algerian ISPs
 * hitting Hostinger's LiteSpeed) regularly drop a single request, which the
 * browser surfaces as a bare "Failed to fetch" with no recovery. We give each
 * request a hard timeout so it can't hang forever, and transparently retry the
 * transient failures — network drops, timeouts, and 502/503/504 gateway blips.
 * We never retry a real HTTP answer (401 wrong password, 422 validation, 429
 * throttle): those are decisions, not glitches.
 */
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 15_000;
const RETRYABLE_STATUS = new Set([502, 503, 504]);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function apiFetch<T = unknown>(
  path: string,
  options: Options = {}
): Promise<T> {
  const { body, headers = {}, auth = true, signal: externalSignal, ...rest } = options;
  const token =
    auth === "admin" ? getAdminToken() : auth ? getToken() : null;

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Per-attempt abort: our own timeout, also chained to any caller signal.
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${baseUrl()}${path}`, { ...init, signal: controller.signal });
    } catch (err) {
      // The caller cancelled on purpose (navigated away) — don't retry.
      if (externalSignal?.aborted) throw err;
      // Network drop or our timeout fired: retry with backoff, else give up.
      if (attempt < MAX_ATTEMPTS) {
        await sleep(attempt * 500);
        continue;
      }
      throw new ApiError(
        "Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.",
        0
      );
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    }

    // Transient gateway error from LiteSpeed — retry rather than surface it.
    if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
      await sleep(attempt * 500);
      continue;
    }

    // Try to parse JSON either way — Laravel returns JSON for errors too.
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (res.status === 429) {
      // Rate-limited. Laravel's default message is English ("Too Many
      // Attempts.") — surface a clear French one, with the wait time when the
      // Retry-After header is present.
      const retry = Number(res.headers.get("Retry-After"));
      const wait =
        Number.isFinite(retry) && retry > 0
          ? ` Réessayez dans ${retry} seconde${retry > 1 ? "s" : ""}.`
          : " Patientez un instant et réessayez.";
      throw new ApiError(`Trop de tentatives.${wait}`, 429);
    }

    if (!res.ok) {
      const payload =
        typeof data === "object" && data !== null
          ? (data as { message?: string; errors?: Record<string, string[]> })
          : {};
      throw new ApiError(
        payload.message ?? `Request failed (${res.status})`,
        res.status,
        payload.errors
      );
    }

    return data as T;
  }

  // Unreachable: the final attempt always returns or throws above.
  throw new ApiError("Le serveur est momentanément indisponible. Réessayez.", 503);
}
