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

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, formData, auth = "admin", headers = {}, signal } = options;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Customer-facing calls go through the same-origin `/bk` proxy (next.config
  // rewrite) so they work on mobile networks that can't reach the backend host
  // directly. Admin calls (/api/admin/*) and uploads stay DIRECT: the admin
  // dashboard fires ~15 calls at once and that burst tripped the proxy's rate
  // limit, and admins are on good connections. SSR / no-window uses direct too.
  const isAdmin = normalizedPath.startsWith("/api/admin");
  const url =
    typeof window !== "undefined" && !formData && !isAdmin
      ? `/bk${normalizedPath.replace(/^\/api/, "")}`
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

  const res = await fetch(url, { method, headers: finalHeaders, body: payload, signal });

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
