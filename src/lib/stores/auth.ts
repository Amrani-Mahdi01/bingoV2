"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Customer } from "@/lib/types";
import { customers } from "@/lib/mock/customers";
import { useFavorites } from "@/lib/stores/favorites";
import { adminToken, http, HttpError } from "@/lib/api/http";

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthState {
  user: Customer | null;
  isAuthenticated: boolean;
  /** Whether the current user has dashboard access. */
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Creates a new customer in the local registry and signs them in. */
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  /** Demo helper used to flip auth without a form (kept for QA). */
  loginDemo: () => void;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Anyone logging in with one of these emails gets admin rights. Pure-mock
 * for now — once Laravel is wired the API will return a `role` field and
 * this check goes away.
 */
const ADMIN_EMAILS = new Set(["admin@gmail.com", "admin@bingo.dz"]);

/** Mock admin password — replaced by real backend auth in Phase 2/3. */
const ADMIN_PASSWORD = "123456";

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

/* -----------------------------------------------------------
   Registered customers — localStorage backing for the mock.
   Until Laravel is wired, "register" persists a {customer, password}
   record here and "login" authenticates against it. The default seed
   includes the existing demo customer with password "password" so
   anyone clicking around without registering still has a working login.
   ----------------------------------------------------------- */

interface RegisteredCustomer {
  customer: Customer;
  password: string;
}

const REGISTRY_KEY = "bingo-customers";

function loadRegistry(): Record<string, RegisteredCustomer> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    if (raw) return JSON.parse(raw) as Record<string, RegisteredCustomer>;
  } catch {
    /* corrupt — fall through to seed */
  }
  // Seed with the existing demo customer so the previous "any password"
  // demo flow still has at least one working account out of the box.
  const seed: Record<string, RegisteredCustomer> = {};
  for (const c of customers) {
    seed[c.email.toLowerCase()] = { customer: c, password: "password" };
  }
  try {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(seed));
  } catch {
    /* ignore */
  }
  return seed;
}

function saveRegistry(reg: Record<string, RegisteredCustomer>): void {
  try {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
  } catch {
    /* ignore */
  }
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,

      login: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !password.trim()) {
          throw new Error("Identifiants invalides");
        }

        const adminCandidate = isAdminEmail(normalizedEmail);

        // Admin path: talk to the Laravel /api/admin/login endpoint. On
        // success persist the Sanctum token + a synthesized user object so
        // the header shows the right identity.
        if (adminCandidate) {
          try {
            const { token, admin } = await http.post<{
              token: string;
              admin: {
                id: number;
                name: string;
                email: string;
                role: string;
              };
            }>(
              "/api/admin/login",
              { email: normalizedEmail, password },
              { auth: "none" },
            );
            adminToken.set(token);
            const user: Customer = {
              id: `admin-${admin.id}`,
              firstName: admin.name.split(" ")[0] ?? "Admin",
              lastName: admin.name.split(" ").slice(1).join(" ") || "BINGO",
              email: admin.email,
              phone: "",
              wilayaId: "19",
              addresses: [],
              totalSpent: 0,
              orderCount: 0,
              createdAt: new Date().toISOString(),
            };
            set({ user, isAuthenticated: true, isAdmin: true });
            return;
          } catch (err) {
            if (err instanceof HttpError) {
              // Laravel ValidationException returns `{message, errors}`
              throw new Error(
                typeof (err.body as { message?: string })?.message === "string"
                  ? (err.body as { message: string }).message
                  : "Identifiants invalides",
              );
            }
            throw err instanceof Error
              ? err
              : new Error("Identifiants invalides");
          }
        }

        // Customer path: check the registry for an exact email/password match.
        const registry = loadRegistry();
        const record = registry[normalizedEmail];
        if (!record || record.password !== password) {
          throw new Error("Identifiants invalides");
        }
        await delay(450);
        set({ user: record.customer, isAuthenticated: true, isAdmin: false });
        void useFavorites.getState().syncWithServer(record.customer.id);
      },

      register: async (data) => {
        const email = data.email.trim().toLowerCase();
        if (
          !email ||
          !data.firstName.trim() ||
          !data.lastName.trim() ||
          !data.password
        ) {
          throw new Error("Champs requis manquants");
        }

        // Reserve admin emails — even if someone tries to register one we
        // refuse so the strict admin-password rule isn't bypassable.
        if (isAdminEmail(email)) {
          throw new Error("Cette adresse email est réservée");
        }

        const registry = loadRegistry();
        if (registry[email]) {
          throw new Error("Un compte avec cet email existe déjà");
        }

        await delay(450);
        const now = new Date().toISOString();
        const user: Customer = {
          id: `cust-${Date.now()}`,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email,
          phone: data.phone.trim(),
          wilayaId: "16",
          addresses: [],
          totalSpent: 0,
          orderCount: 0,
          createdAt: now,
        };
        registry[email] = { customer: user, password: data.password };
        saveRegistry(registry);

        set({ user, isAuthenticated: true, isAdmin: false });
        void useFavorites.getState().syncWithServer(user.id);
      },

      logout: () => {
        // Best-effort token revoke on the server; failures are fine since
        // we're nuking the local copy regardless.
        const token = adminToken.get();
        if (token) {
          void http
            .post("/api/admin/logout", undefined, { auth: "admin" })
            .catch(() => {});
        }
        adminToken.clear();
        useFavorites.getState().disconnect();
        set({ user: null, isAuthenticated: false, isAdmin: false });
      },

      loginDemo: () => {
        const user = customers[0] ?? null;
        if (user) {
          set({ user, isAuthenticated: true, isAdmin: false });
          void useFavorites.getState().syncWithServer(user.id);
        }
      },
    }),
    {
      name: "bingo-auth",
      storage: createJSONStorage(() => localStorage),
      // Persist only the user object + flags. Method references aren't
      // serializable; Zustand's persist re-attaches them on rehydrate.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
      version: 1,
    }
  )
);
