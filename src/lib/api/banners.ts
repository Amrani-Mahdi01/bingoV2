"use client";

import { http } from "@/lib/api/http";
import type { Banner } from "@/lib/types";

/**
 * Wire to the Laravel BannerController endpoints. Keeps the API close to
 * the previous mock shape (Banner[] / Banner) so the storefront and admin
 * UI mostly didn't have to change.
 */

interface ListResponse {
  data: Banner[];
}
interface SingleResponse {
  data: Banner;
}

export const bannersApi = {
  /** Public — only active banners, ordered. */
  list(): Promise<Banner[]> {
    return http
      .get<ListResponse>("/api/banners", { auth: "none" })
      .then((r) => r.data);
  },

  /** Admin — every banner including inactive. */
  listAll(): Promise<Banner[]> {
    return http
      .get<ListResponse>("/api/admin/banners", { auth: "admin" })
      .then((r) => r.data);
  },

  create(payload: Omit<Banner, "id">): Promise<Banner> {
    return http
      .post<SingleResponse>("/api/admin/banners", payload, { auth: "admin" })
      .then((r) => r.data);
  },

  update(id: string, payload: Omit<Banner, "id">): Promise<Banner> {
    return http
      .put<SingleResponse>(`/api/admin/banners/${id}`, payload, { auth: "admin" })
      .then((r) => r.data);
  },

  destroy(id: string): Promise<void> {
    return http.delete(`/api/admin/banners/${id}`, { auth: "admin" }) as Promise<void>;
  },

  move(id: string, direction: "up" | "down"): Promise<void> {
    return http.post(
      `/api/admin/banners/${id}/move`,
      { direction },
      { auth: "admin" },
    ) as Promise<void>;
  },

  /** Multipart upload — returns the relative storage path + absolute URL. */
  uploadImage(file: File): Promise<{ path: string; url: string }> {
    const fd = new FormData();
    fd.append("file", file);
    return http.upload<{ path: string; url: string }>(
      "/api/admin/uploads/banner-image",
      fd,
      { auth: "admin" },
    );
  },
};
