"use client";

import { http } from "@/lib/api/http";

/**
 * ZR Express delivery integration — admin API.
 *
 * Mirrors the Laravel controller at /api/admin/zr/* . The API key is never
 * returned in full: `apiKeyMasked` shows the last 4 chars, `apiKeyConfigured`
 * says whether one is stored. Send `apiKey` in updateSettings ONLY when the
 * admin is actually changing it — an empty value leaves the stored token intact.
 */

export interface ZrMapping {
  wilayasMapped: number;
  wilayasTotal: number;
  communesMapped: number;
  communesTotal: number;
}

export interface ZrSettings {
  enabled: boolean;
  autoSend: boolean;
  tenant: string | null;
  baseUrl: string;
  version: string;
  apiKeyConfigured: boolean;
  apiKeyMasked: string | null;
  mapping: ZrMapping;
}

export interface ZrSettingsUpdate {
  apiKey?: string; // only send when changing the token
  tenant?: string | null;
  enabled?: boolean;
  autoSend?: boolean;
  baseUrl?: string | null;
  version?: string | null;
}

/** Shape returned by the sync/test action endpoints (200 = ok). */
export interface ZrActionResult {
  ok: boolean;
  message: string;
  [key: string]: unknown;
}

export interface ZrLabelResult {
  ok: boolean;
  url?: string;
  trackingNumber?: string;
  message?: string;
}

interface DataResponse<T> {
  data: T;
}

export const zrApi = {
  getSettings(): Promise<ZrSettings> {
    return http
      .get<DataResponse<ZrSettings>>("/api/admin/zr/settings", { auth: "admin" })
      .then((r) => r.data);
  },

  updateSettings(payload: ZrSettingsUpdate): Promise<ZrSettings> {
    return http
      .put<DataResponse<ZrSettings>>("/api/admin/zr/settings", payload, {
        auth: "admin",
      })
      .then((r) => r.data);
  },

  /** Verify the stored token against ZR (GET /users/profile). */
  test(): Promise<ZrActionResult> {
    return http.post<ZrActionResult>("/api/admin/zr/test", undefined, {
      auth: "admin",
    });
  },

  /** Map every wilaya + commune to its ZR territory UUID. */
  syncTerritories(): Promise<ZrActionResult> {
    return http.post<ZrActionResult>(
      "/api/admin/zr/sync-territories",
      undefined,
      { auth: "admin" },
    );
  },

  /** ZR-04 — pull delivery fees into each wilaya. */
  syncRates(): Promise<ZrActionResult> {
    return http.post<ZrActionResult>("/api/admin/zr/sync-rates", undefined, {
      auth: "admin",
    });
  },

  /** ZR-03 — pull parcel states onto orders now (also runs on a schedule). */
  syncStatuses(): Promise<ZrActionResult> {
    return http.post<ZrActionResult>("/api/admin/zr/sync-statuses", undefined, {
      auth: "admin",
    });
  },

  /** ZR-01 — push/retry a single order to ZR. */
  shipOrder(orderId: string): Promise<ZrActionResult> {
    return http.post<ZrActionResult>(
      `/api/admin/orders/${orderId}/ship`,
      undefined,
      { auth: "admin" },
    );
  },

  /** ZR-05 — get the bordereau URL for an order. */
  getLabel(orderId: string): Promise<ZrLabelResult> {
    return http.get<ZrLabelResult>(`/api/admin/orders/${orderId}/label`, {
      auth: "admin",
    });
  },

  /** Clear an order's ZR linkage (parcel id, tracking, state, error) — used
   *  when the parcel was deleted/cancelled on ZR's side so the order can be
   *  re-sent from scratch. Does not touch the local order status. */
  detachOrder(orderId: string): Promise<ZrActionResult> {
    return http.post<ZrActionResult>(
      `/api/admin/orders/${orderId}/zr-detach`,
      undefined,
      { auth: "admin" },
    );
  },

  /** ZR-03 — refresh a single order's delivery status from ZR right now. */
  syncOrder(orderId: string): Promise<ZrActionResult> {
    return http.post<ZrActionResult>(
      `/api/admin/orders/${orderId}/zr-sync`,
      undefined,
      { auth: "admin" },
    );
  },
};
