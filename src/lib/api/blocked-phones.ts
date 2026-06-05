"use client";

import { http } from "@/lib/api/http";

/** Row returned by GET /api/admin/blocked-phones. */
export interface BlockedPhoneEntry {
  id: number;
  phoneNumber: string;
  reason: string | null;
  /** Set when this phone was blocked alongside an IP via the "block
   *  this client" path (manual or auto). Matching `blockGroupId` on
   *  a BlockedIpEntry means the two rows are paired. */
  blockGroupId?: string | null;
  blockedAt: string | null;
  blockedBy?: { id: number; name: string; email: string } | null;
}

/**
 * Admin-only CRUD for the phone-number blocklist. Storefront
 * POST /api/orders checks this list (alongside blocked-ips) and
 * 403s the request before any other work.
 *
 * VPN/proxy use makes IP blocking unreliable on its own — phone
 * numbers tend to stay constant across attempts, so this is the
 * durable signal for repeat abusers.
 */
export const blockedPhonesApi = {
  list(): Promise<BlockedPhoneEntry[]> {
    return http
      .get<{ data: BlockedPhoneEntry[] }>("/api/admin/blocked-phones", {
        auth: "admin",
      })
      .then((r) => r.data);
  },
  create(phoneNumber: string, reason?: string): Promise<BlockedPhoneEntry> {
    return http
      .post<{ data: BlockedPhoneEntry }>(
        "/api/admin/blocked-phones",
        { phoneNumber, reason },
        { auth: "admin" },
      )
      .then((r) => r.data);
  },
  /** Unblock. Backend ALSO flips the customer's `returned` orders to
   *  `cancelled` so the auto-block counter resets — `cancelledOrders`
   *  reports how many rows got converted (0 when there were none). */
  remove(id: number): Promise<{ cancelledOrders: number }> {
    return http
      .delete<{ message?: string; cancelledOrders?: number }>(
        `/api/admin/blocked-phones/${id}`,
        { auth: "admin" },
      )
      .then((r) => ({ cancelledOrders: r?.cancelledOrders ?? 0 }));
  },
};
