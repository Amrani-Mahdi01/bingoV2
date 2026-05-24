"use client";

import { http } from "@/lib/api/http";

export interface ApiBrand {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  country: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
  isActive: boolean;
  productCount: number;
}

interface BrandPayload {
  name: string;
  slug?: string | null;
  country?: string | null;
  logo?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  isActive?: boolean;
}

interface ListResponse {
  data: ApiBrand[];
}
interface SingleResponse {
  data: ApiBrand;
}

export const brandsApi = {
  listAll(): Promise<ApiBrand[]> {
    return http
      .get<ListResponse>("/api/admin/brands", { auth: "admin" })
      .then((r) => r.data);
  },
  create(payload: BrandPayload): Promise<ApiBrand> {
    return http
      .post<SingleResponse>("/api/admin/brands", payload, { auth: "admin" })
      .then((r) => r.data);
  },
  update(id: string, payload: BrandPayload): Promise<ApiBrand> {
    return http
      .put<SingleResponse>(`/api/admin/brands/${id}`, payload, { auth: "admin" })
      .then((r) => r.data);
  },
  destroy(id: string): Promise<void> {
    return http.delete(`/api/admin/brands/${id}`, { auth: "admin" }) as Promise<void>;
  },
};
