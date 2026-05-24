"use client";

import { http } from "@/lib/api/http";

/**
 * Site-wide settings — flat string→string map keyed by dotted strings
 * (e.g. "site.logo"). Image values are absolute URLs.
 */
export type SettingsMap = Record<string, string | null>;

interface MapResponse {
  data: SettingsMap;
}

export const settingsApi = {
  /** Admin — every setting, public or not. */
  listAll(): Promise<SettingsMap> {
    return http
      .get<MapResponse>("/api/admin/settings", { auth: "admin" })
      .then((r) => r.data);
  },

  /** Bulk-update writable keys. Pass only the ones you're changing. */
  update(payload: Partial<SettingsMap>): Promise<SettingsMap> {
    return http
      .put<MapResponse>("/api/admin/settings", payload, { auth: "admin" })
      .then((r) => r.data);
  },

  /** Multipart upload — returns the relative storage path + absolute URL. */
  uploadLogo(file: File): Promise<{ path: string; url: string }> {
    const fd = new FormData();
    fd.append("file", file);
    return http.upload<{ path: string; url: string }>(
      "/api/admin/uploads/logo",
      fd,
      { auth: "admin" },
    );
  },
};
