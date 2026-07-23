"use client";

/**
 * Minimal fetch wrapper for the Laravel backend.
 *
 * - Reads NEXT_PUBLIC_API_URL at build time (set in .env.local for dev,
 *   Vercel env vars in prod).
 * - Reads the admin Sanctum token from localStorage (`bingo-admin-token`)
 *   and attaches it as `Authorization: Bearer …` automatically when present.
 * - Always sends `Accept: application/json` so Laravel returns JSON errors
 *   rather than HTML stack traces.
 * - Throws `HttpError` on non-2xx so callers can branch on `.status` or
 *   read `.body` for validation errors.
 *
 * Customer-side auth lives separately under `bingo-customer-token` so the
 * two guards never share a token by accident.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

// Cloudflare-fronted backend — reachable on mobile, no Vercel-IP 429. Used for
// admin calls and uploads (see url resolution in `request`).
const ADMIN_API = (
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "https://api.bingo-camp.com"
).replace(/\/$/, "");

const ADMIN_TOKEN_KEY = "bingo-admin-token";
const CUSTOMER_TOKEN_KEY = "bingo-customer-token";

export class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

/** Storage helpers — guarded for SSR. */
export const adminToken = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const customerToken = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Multipart body — pass a ready FormData; we'll skip JSON serialization. */
  formData?: FormData;
  /** Which token to attach. Default = "admin". `none` for public endpoints. */
  auth?: "admin" | "customer" | "none";
  /** Extra headers, e.g. for CSRF flows. */
  headers?: Record<string, string>;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

/**
 * Resilience knobs — mirrors the customer wrapper (`api-client.ts`). The path
 * from the browser → Cloudflare edge → Hostinger LiteSpeed occasionally drops a
 * single connection, which the browser surfaces as a bare "Failed to fetch". A
 * lone `fetch()` turns that transient blip into a hard admin-panel error even
 * though a refresh works. So we give each attempt a hard timeout and retry the
 * transient failures — network drops, timeouts, and 502/503/504 gateway blips.
 * We never retry a real HTTP answer (401/403/404/422/429): those are decisions,
 * not glitches.
 */
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 15_000;
const RETRYABLE_STATUS = new Set([502, 503, 504]);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, formData, auth = "admin", headers = {}, signal: externalSignal } = options;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // ALL browser calls (customer + admin + uploads) → the Cloudflare backend
  // (api.bingo-camp.com): each visitor connects from their own IP (real IP
  // passed to Laravel) and it doesn't funnel through Vercel's few egress IPs,
  // so no Hostinger per-IP 429. SSR / no-window → the absolute backend host.
  const inBrowser = typeof window !== "undefined";
  const url = inBrowser
    ? `${ADMIN_API}${normalizedPath}`
    : `${API_URL}${normalizedPath}`;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (auth !== "none") {
    const token = auth === "admin" ? adminToken.get() : customerToken.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (formData) {
    // Let the browser set the multipart boundary itself.
    payload = formData;
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

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
      res = await fetch(url, {
        method,
        headers: finalHeaders,
        body: payload,
        signal: controller.signal,
      });
    } catch (err) {
      // The caller cancelled on purpose (navigated away) — don't retry.
      if (externalSignal?.aborted) throw err;
      // Network drop or our timeout fired: retry with backoff, else give up.
      if (attempt < MAX_ATTEMPTS) {
        await sleep(attempt * 500);
        continue;
      }
      throw new HttpError(
        0,
        null,
        "Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.",
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

    // Try to parse JSON, fall back to text for HTML/empty responses.
    let parsed: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      const message =
        (parsed as { message?: string } | null)?.message ?? `HTTP ${res.status}`;
      throw new HttpError(res.status, parsed, message);
    }

    return parsed as T;
  }

  // Unreachable: the final attempt always returns or throws above.
  throw new HttpError(0, null, "Le serveur est momentanément indisponible. Réessayez.");
}

export const http = {
  get: <T = unknown>(path: string, opts?: Omit<RequestOptions, "method" | "body" | "formData">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T = unknown>(path: string, opts?: Omit<RequestOptions, "method" | "body" | "formData">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
  /** Multipart helper for file uploads. */
  upload: <T = unknown>(
    path: string,
    formData: FormData,
    opts?: Omit<RequestOptions, "method" | "body" | "formData">,
  ) => request<T>(path, { ...opts, method: "POST", formData }),
};
