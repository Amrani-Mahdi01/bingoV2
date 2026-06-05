"use client";

import { http } from "@/lib/api/http";

/** Row returned by GET /api/admin/admins — the directory of dashboard
 *  users. Mirrors the shape AdminController::index serialises. */
export interface ApiAdminRow {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string | null;
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
  // Owner is intentionally not selectable from the UI — only seeded
  // via the database — so we don't accept it here either.
  role: "admin" | "staff";
}

/**
 * Direct admin-account CRUD — backs /admin/admins. The other place
 * admins get created is via "Promouvoir un client" in CustomersTable;
 * that path is for converting an existing storefront customer, whereas
 * this is for adding a new teammate who never shopped.
 */
export const adminsApi = {
  list(): Promise<ApiAdminRow[]> {
    return http
      .get<{ data: ApiAdminRow[] }>("/api/admin/admins", { auth: "admin" })
      .then((r) => r.data);
  },
  create(payload: CreateAdminPayload): Promise<ApiAdminRow> {
    return http
      .post<{ data: ApiAdminRow }>("/api/admin/admins", payload, {
        auth: "admin",
      })
      .then((r) => r.data);
  },
  /** Owner-only on the backend — UI must gate the call site. Backend
   *  also refuses self-deletion and last-owner deletion. */
  remove(id: number): Promise<void> {
    return http
      .delete(`/api/admin/admins/${id}`, { auth: "admin" })
      .then(() => undefined);
  },
};
