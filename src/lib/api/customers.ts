"use client";

import { http } from "@/lib/api/http";

export interface ApiCustomerRow {
  phone: string;
  /** Registered customer's id from the customers table — null for
   *  guest-only rows. Used as the React key fallback when the
   *  customer registered without a phone (so two phone-less rows
   *  don't collide on the empty-string key). */
  customerId: number | null;
  firstName: string;
  lastName: string;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  // Nullable for registered customers who haven't placed an order yet.
  wilayaId: string | null;
  wilayaName: string | null;
  /** IP of this customer's most recent order, or null if no order
   *  predates the customer_ip column addition. */
  latestIp: string | null;
  /** True when `latestIp` is currently in the IP blocklist. */
  ipBlocked: boolean;
  /** True when this customer has a registered account (matched by
   *  phone in the customers table, or any order has customer_id set). */
  isRegistered: boolean;
}

/** Filter the admin can pass to /api/admin/customers?type=... */
export type CustomerTypeFilter = "all" | "registered" | "guest";

export interface ApiCustomerDetail extends ApiCustomerRow {
  firstOrderAt: string | null;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string | null;
  }>;
}

export interface PromoteCustomerPayload {
  name: string;
  email: string;
  /** Optional — backend reuses the customer's existing storefront
   *  password hash when this is omitted AND a registered Customer
   *  row matches. Required for guest-only promotions. */
  password?: string;
  role?: "owner" | "admin" | "staff";
}

export interface PromotedAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  /** True when the new admin row shares the customer's password
   *  hash — they keep using their existing storefront credentials. */
  sharesCustomerPassword?: boolean;
}

export interface BlockedIpEntry {
  id: number;
  ipAddress: string;
  reason: string | null;
  /** Set when this IP was blocked alongside a phone via the "block
   *  this client" path (manual or auto). The unified blacklist UI
   *  pairs rows by this id so admin can lift both with one click. */
  blockGroupId?: string | null;
  blockedAt: string | null;
  blockedBy?: { id: number; name: string; email: string } | null;
}

export const customersApi = {
  list(
    params: { q?: string; type?: CustomerTypeFilter } = {},
  ): Promise<{ data: ApiCustomerRow[]; meta: { total: number } }> {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.type && params.type !== "all") qs.set("type", params.type);
    const url = `/api/admin/customers${qs.toString() ? `?${qs}` : ""}`;
    return http.get(url, { auth: "admin" });
  },
  get(phone: string): Promise<ApiCustomerDetail> {
    return http
      .get<{ data: ApiCustomerDetail }>(`/api/admin/customers/${encodeURIComponent(phone)}`, {
        auth: "admin",
      })
      .then((r) => r.data);
  },
  /** Create a brand-new Admin row using this customer's info. The
   *  admin enters the password manually and shares it out-of-band.
   *  Pass the customer's phone when present; for phone-less accounts
   *  (registered via email only), use `promoteById` instead. */
  promote(phone: string, payload: PromoteCustomerPayload): Promise<PromotedAdmin> {
    return http
      .post<{ data: PromotedAdmin }>(
        `/api/admin/customers/${encodeURIComponent(phone)}/promote`,
        payload,
        { auth: "admin" },
      )
      .then((r) => r.data);
  },
  promoteById(
    customerId: number,
    payload: PromoteCustomerPayload,
  ): Promise<PromotedAdmin> {
    return http
      .post<{ data: PromotedAdmin }>(
        `/api/admin/customers/by-id/${customerId}/promote`,
        payload,
        { auth: "admin" },
      )
      .then((r) => r.data);
  },
  /** Block this customer on BOTH signals — phone number AND the IP
   *  of their most recent order. Phone is the durable identifier;
   *  IP catches the immediate next attempt. Endpoint name keeps
   *  `block-ip` for backwards compatibility; the behaviour now
   *  covers both lists. The `ip` half is null when this customer
   *  has no recorded IP (registered customer with no orders yet). */
  blockIp(
    phone: string,
    reason?: string,
  ): Promise<{
    phone: { id: number; phoneNumber: string; reason: string | null; blockedAt: string | null };
    ip: { id: number; ipAddress: string; reason: string | null; blockedAt: string | null } | null;
  }> {
    return http
      .post<{
        data: {
          phone: { id: number; phoneNumber: string; reason: string | null; blockedAt: string | null };
          ip:
            | { id: number; ipAddress: string; reason: string | null; blockedAt: string | null }
            | null;
        };
      }>(
        `/api/admin/customers/${encodeURIComponent(phone)}/block-ip`,
        { reason },
        { auth: "admin" },
      )
      .then((r) => r.data);
  },
};
