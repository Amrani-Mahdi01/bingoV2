"use client";

import { http } from "@/lib/api/http";
import type { BlockedIpEntry as BaseBlockedIpEntry } from "@/lib/api/customers";

// Re-export with the optional pair linkage. The `blockGroupId` field
// is set on rows created via the "block this client" path (manual or
// auto) so the unified blacklist UI can render the matching phone +
// IP pair as a single row. Null on manually-added IP-only blocks.
export type BlockedIpEntry = BaseBlockedIpEntry & {
  blockGroupId?: string | null;
};

/**
 * Admin-only CRUD for the IP blocklist. Storefront POST /api/orders
 * checks this list and 403s blocked IPs before any other work.
 * Per-customer blocking lives on `customersApi.blockIp`; this module
 * is for the /admin/blocked-ips page that lists + unblocks.
 */
export const blockedIpsApi = {
  list(): Promise<BlockedIpEntry[]> {
    return http
      .get<{ data: BlockedIpEntry[] }>("/api/admin/blocked-ips", {
        auth: "admin",
      })
      .then((r) => r.data);
  },
  /** Block an arbitrary IP (not tied to a customer row). */
  create(ipAddress: string, reason?: string): Promise<BlockedIpEntry> {
    return http
      .post<{ data: BlockedIpEntry }>(
        "/api/admin/blocked-ips",
        { ipAddress, reason },
        { auth: "admin" },
      )
      .then((r) => r.data);
  },
  /** Unblock by row id. */
  remove(id: number): Promise<void> {
    return http
      .delete(`/api/admin/blocked-ips/${id}`, { auth: "admin" })
      .then(() => undefined);
  },
};

