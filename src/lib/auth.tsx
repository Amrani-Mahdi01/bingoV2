"use client";

import * as React from "react";

import { AUTH_ENABLED, apiFetch, getToken, setToken } from "@/lib/api-client";

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

type AuthResponse = { token: string; customer: Customer };

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
  }) => Promise<Customer>;
  logout: () => Promise<void>;
  /** Re-fetch the customer profile from the API. */
  refresh: () => Promise<void>;
};

const AuthContext = React.createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(true);

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
    apiFetch<{ customer: Customer }>("/auth/me")
      .then((data) => {
        if (cancelled) return;
        setCustomer(data.customer);
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
    }) => {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: {
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          password: input.password,
          phone: input.phone ?? null,
        },
        auth: false,
      });
      setToken(data.token);
      setCustomer(data.customer);
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
      const data = await apiFetch<{ customer: Customer }>("/auth/me");
      setCustomer(data.customer);
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
