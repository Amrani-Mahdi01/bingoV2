"use client";

import * as React from "react";

import {
  AUTH_ENABLED,
  apiFetch,
  getToken,
  setAdminToken,
  setToken,
} from "@/lib/api-client";

export type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  wilayaId: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

/** Window event the AdminAuthProvider listens for so it can re-pull
 *  /admin/me after the customer login response hands us an admin
 *  token. Keeps the two providers loosely coupled. */
const ADMIN_TOKEN_REFRESHED = "bingo:admin-token-refreshed";

type AdminPayload = {
  admin_token?: string;
  admin?: {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive?: boolean;
    lastSeenAt?: string | null;
  };
};

type AuthResponse = {
  token: string;
  customer: Customer;
} & AdminPayload;

/** Response shape for /auth/me. Same optional admin payload as the
 *  login/register response — emitted by the backend when this session
 *  is paired to an active admin (typically because the customer was
 *  promoted from /admin/customers after their original login). */
type MeResponse = { customer: Customer } & AdminPayload;

/** When the backend handed us an admin token alongside the customer
 *  one, drop it into the admin localStorage slot and nudge the
 *  AdminAuthProvider to refetch /admin/me so the topbar/sidebar
 *  light up without a page reload. */
function applyAdminTokenFromResponse(data: AdminPayload): void {
  if (!data.admin_token) return;
  setAdminToken(data.admin_token);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_TOKEN_REFRESHED));
  }
}

export { ADMIN_TOKEN_REFRESHED };

type Ctx = {
  customer: Customer | null;
  /** True until the initial /auth/me request settles on first mount. */
  loading: boolean;
  login: (email: string, password: string) => Promise<Customer>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    recaptchaToken?: string | null;
  }) => Promise<Customer>;
  logout: () => Promise<void>;
  /** Re-fetch the customer profile from the API. */
  refresh: () => Promise<void>;
};

const AuthContext = React.createContext<Ctx | null>(null);

/** localStorage keys for the two auth tokens — duplicated from
 *  api-client.ts so the storage-event listener below can watch them
 *  without importing constants that aren't currently exported. Keep
 *  in sync with TOKEN_KEY / ADMIN_TOKEN_KEY there. */
const TOKEN_STORAGE_KEYS = new Set([
  "bingo-customer-token",
  "bingo-admin-token",
]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Multi-tab session sync — a `storage` event fires in OTHER tabs
  // whenever either auth token is written or removed in this origin's
  // localStorage. We treat any such change as "the session in another
  // tab just shifted" and hard-reload, so every open tab ends up
  // showing the same logged-in/-out state without the user having to
  // refresh manually. The originating tab updates React state in-line
  // and never receives its own storage event, so it doesn't reload.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !TOKEN_STORAGE_KEYS.has(e.key)) return;
      // Browsers can occasionally fire redundant events with the same
      // value (e.g. removeItem when the key was already absent) — skip
      // those so we don't reload for nothing.
      if (e.newValue === e.oldValue) return;
      window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // On mount, if we have a stored token, try to resolve the customer.
  // Bad/expired tokens are silently cleared so the UI flips back to
  // logged-out without scary error states. Skips entirely when auth
  // is disabled so deployments without a backend don't fire a doomed
  // /auth/me request.
  React.useEffect(() => {
    if (!AUTH_ENABLED) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<MeResponse>("/auth/me")
      .then((data) => {
        if (cancelled) return;
        setCustomer(data.customer);
        // Catch-up path for customers promoted to admin AFTER they
        // logged in: the /me endpoint detects the pairing and hands
        // back an admin token, so the storefront avatar + dropdown
        // light up without forcing a logout/login.
        applyAdminTokenFromResponse(data);
      })
      .catch(() => {
        if (cancelled) return;
        setToken(null);
        setCustomer(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      setToken(data.token);
      setCustomer(data.customer);
      applyAdminTokenFromResponse(data);
      return data.customer;
    },
    []
  );

  const register = React.useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone?: string;
      recaptchaToken?: string | null;
    }) => {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: {
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          password: input.password,
          phone: input.phone ?? null,
          recaptcha_token: input.recaptchaToken ?? null,
        },
        auth: false,
      });
      setToken(data.token);
      setCustomer(data.customer);
      applyAdminTokenFromResponse(data);
      return data.customer;
    },
    []
  );

  const logout = React.useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      /* ignore — clear local state regardless of server error */
    }
    setToken(null);
    setCustomer(null);
  }, []);

  const refresh = React.useCallback(async () => {
    if (!getToken()) {
      setCustomer(null);
      return;
    }
    try {
      const data = await apiFetch<MeResponse>("/auth/me");
      setCustomer(data.customer);
      applyAdminTokenFromResponse(data);
    } catch {
      setToken(null);
      setCustomer(null);
    }
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ customer, loading, login, register, logout, refresh }),
    [customer, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    // Fallback so non-wrapped trees still render in a logged-out state.
    return {
      customer: null,
      loading: false,
      login: async () => {
        throw new Error("AuthProvider not mounted");
      },
      register: async () => {
        throw new Error("AuthProvider not mounted");
      },
      logout: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
