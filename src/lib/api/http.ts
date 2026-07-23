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
 * Resilience knobs.
 *
 * The browser reaches the backend through the Cloudflare edge
 * (api.bingo-camp.com). That path is normally fast, but the connection to the
 * edge itself intermittently hangs or fails the TLS handshake (packet loss /
 * flaky IPv6 route to the nearest colo) — the classic "sometimes it works,
 * sometimes it doesn't". So instead of a single host we keep an ordered list
 * [Cloudflare, direct origin] and fail OVER to the origin when the edge drops:
 * both accept the same CORS, so either can serve the call. Each attempt also
 * gets a hard timeout so a hung connection can't stall the panel forever.
 *
 * Retry policy — we never retry a real HTTP answer (401/403/404/422/429: those
 * are decisions). We retry:
 *  - a gateway blip (502/503/504): the app didn't process it → safe for any method.
 *  - a network drop / timeout: AMBIGUOUS (the request may have landed), so we
 *    only repeat it for idempotent methods (GET/PUT/PATCH/DELETE). A POST fails
 *    fast to avoid a double-submit (e.g. creating a product twice); the admin
 *    retries manually.
 * Uploads (multipart) run ONCE with a long timeout — they're large and
 * non-idempotent, so auto-retrying would re-send the whole file.
 */
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;
const UPLOAD_TIMEOUT_MS = 120_000;
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(["GET", "PUT", "PATCH", "DELETE"]);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, formData, auth = "admin", headers = {}, signal: externalSignal } = options;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Host selection:
  //  - SSR / no-window → the origin directly (Vercel→Hostinger is fine).
  //  - Browser ADMIN → try Cloudflare first, then FAIL OVER to the direct
  //    origin when the edge drops (admins are usually on WiFi/desktop, which
  //    CAN reach the origin — so the fallback actually works).
  //  - Browser CUSTOMER / public → Cloudflare ONLY. Algerian mobile (Ooredoo/
  //    Djezzy/Mobilis) canNOT reach the Hostinger origin at all — that's the
  //    whole reason Cloudflare fronts it — so an origin fallback would just be
  //    a doomed ~10s timeout mid-checkout. Never route shoppers there.
  //    (Deduped: in dev both env vars point at the same local backend, so the
  //    admin list collapses to one host and failover is a harmless no-op.)
  const inBrowser = typeof window !== "undefined";
  let hosts: string[];
  if (!inBrowser) {
    hosts = [API_URL];
  } else if (auth === "admin") {
    hosts = Array.from(new Set([ADMIN_API, API_URL]));
  } else {
    hosts = [ADMIN_API];
  }

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

  const isUpload = !!formData;
  const idempotent = IDEMPOTENT_METHODS.has(method);
  const timeoutMs = isUpload ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  const maxAttempts = isUpload ? 1 : MAX_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Alternate hosts across attempts: Cloudflare → origin → Cloudflare. A
    // hung edge connection thus fails over to the direct origin next try.
    const url = `${hosts[(attempt - 1) % hosts.length]}${normalizedPath}`;

    // Per-attempt abort: our own timeout, also chained to any caller signal.
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
    const timer = setTimeout(() => controller.abort(), timeoutMs);

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
      // Network drop or our timeout fired. Only repeat when it's safe to (an
      // idempotent method); otherwise surface it so a POST can't double-submit.
      if (idempotent && attempt < maxAttempts) {
        await sleep(attempt * 400);
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

    // Transient gateway error (didn't reach the app) — retry, failing over.
    if (RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts) {
      await sleep(attempt * 400);
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
