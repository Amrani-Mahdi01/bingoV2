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
const BASE_URL = `${HOST}/api`;

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

export async function apiFetch<T = unknown>(
  path: string,
  options: Options = {}
): Promise<T> {
  const { body, headers = {}, auth = true, ...rest } = options;
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

  const res = await fetch(`${BASE_URL}${path}`, init);

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
