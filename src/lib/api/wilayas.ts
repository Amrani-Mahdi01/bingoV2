"use client";

import { http } from "@/lib/api/http";
import type { Commune, Wilaya } from "@/lib/types";

interface ListResponse {
  data: Wilaya[];
}
interface SingleResponse {
  data: Wilaya;
}
interface CommuneListResponse {
  data: Commune[];
}
interface CommuneSingleResponse {
  data: Commune;
}

/** Shipping price + delivery days are the only editable fields per wilaya. */
export interface WilayaUpdate {
  shippingPrice: number;
  deliveryDays: number;
}

/** Payload for creating a brand-new wilaya row. */
export interface WilayaCreate {
  code: string; // "01".."99"
  name: string; // FR
  nameAr: string;
  region: "Nord" | "Centre" | "Est" | "Ouest" | "Sud";
  shippingPrice: number;
  deliveryDays: number;
}

/** Payload for creating a new commune under a wilaya. */
export interface CommuneCreate {
  code: string;
  name: string; // FR
  nameAr: string;
}

export const wilayasApi = {
  /** Public — used by the delivery page and checkout for shipping ranges. */
  list(): Promise<Wilaya[]> {
    return http
      .get<ListResponse>("/api/wilayas", { auth: "none" })
      .then((r) => r.data);
  },

  /** Admin — same shape, requires auth. */
  listAll(): Promise<Wilaya[]> {
    return http
      .get<ListResponse>("/api/admin/wilayas", { auth: "admin" })
      .then((r) => r.data);
  },

  update(id: string, payload: WilayaUpdate): Promise<Wilaya> {
    return http
      .put<SingleResponse>(`/api/admin/wilayas/${id}`, payload, { auth: "admin" })
      .then((r) => r.data);
  },

  create(payload: WilayaCreate): Promise<Wilaya> {
    // Backend column for FR name is `name_fr`; the frontend type uses
    // `name`. Send both `nameFr` and `nameAr` so the controller's
    // normalisation picks them up regardless.
    return http
      .post<SingleResponse>(
        "/api/admin/wilayas",
        {
          code: payload.code,
          nameFr: payload.name,
          nameAr: payload.nameAr,
          region: payload.region,
          shippingPrice: payload.shippingPrice,
          deliveryDays: payload.deliveryDays,
        },
        { auth: "admin" }
      )
      .then((r) => r.data);
  },

  /** Communes under a given wilaya — admin auth. */
  listCommunes(wilayaId: string): Promise<Commune[]> {
    return http
      .get<CommuneListResponse>(`/api/admin/wilayas/${wilayaId}/communes`, {
        auth: "admin",
      })
      .then((r) => r.data);
  },

  /** Communes under a given wilaya — public, used by checkout / quick-order. */
  listCommunesPublic(wilayaId: string): Promise<Commune[]> {
    return http
      .get<CommuneListResponse>(`/api/wilayas/${wilayaId}/communes`, {
        auth: "none",
      })
      .then((r) => r.data);
  },

  createCommune(wilayaId: string, payload: CommuneCreate): Promise<Commune> {
    return http
      .post<CommuneSingleResponse>(
        `/api/admin/wilayas/${wilayaId}/communes`,
        {
          code: payload.code,
          nameFr: payload.name,
          nameAr: payload.nameAr,
        },
        { auth: "admin" }
      )
      .then((r) => r.data);
  },

  deleteCommune(wilayaId: string, communeId: number): Promise<void> {
    return http.delete(
      `/api/admin/wilayas/${wilayaId}/communes/${communeId}`,
      { auth: "admin" }
    ) as Promise<void>;
  },
};
