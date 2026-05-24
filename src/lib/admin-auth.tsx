"use client";

import * as React from "react";

import {
  AUTH_ENABLED,
  apiFetch,
  getAdminToken,
  setAdminToken,
} from "@/lib/api-client";

export type Admin = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastSeenAt: string | null;
};

type AuthResponse = { token: string; admin: Admin };

type Ctx = {
  admin: Admin | null;
  /** True until the initial /admin/me request settles on first mount. */
  loading: boolean;
  login: (email: string, password: string) => Promise<Admin>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AdminAuthContext = React.createContext<Ctx | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = React.useState<Admin | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!AUTH_ENABLED) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const token = getAdminToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ admin: Admin }>("/admin/me", { auth: "admin" })
      .then((data) => {
        if (!cancelled) setAdmin(data.admin);
      })
      .catch(() => {
        if (cancelled) return;
        setAdminToken(null);
        setAdmin(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const data = await apiFetch<AuthResponse>("/admin/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setAdminToken(data.token);
    setAdmin(data.admin);
    return data.admin;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await apiFetch("/admin/logout", { method: "POST", auth: "admin" });
    } catch {
      /* ignore */
    }
    setAdminToken(null);
    setAdmin(null);
  }, []);

  const refresh = React.useCallback(async () => {
    if (!getAdminToken()) {
      setAdmin(null);
      return;
    }
    try {
      const data = await apiFetch<{ admin: Admin }>("/admin/me", {
        auth: "admin",
      });
      setAdmin(data.admin);
    } catch {
      setAdminToken(null);
      setAdmin(null);
    }
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ admin, loading, login, logout, refresh }),
    [admin, loading, login, logout, refresh]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): Ctx {
  const ctx = React.useContext(AdminAuthContext);
  if (!ctx) {
    return {
      admin: null,
      loading: false,
      login: async () => {
        throw new Error("AdminAuthProvider not mounted");
      },
      logout: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
