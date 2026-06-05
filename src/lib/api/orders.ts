"use client";

import { http } from "@/lib/api/http";

/** Payload sent to POST /api/orders. */
export interface CreateOrderPayload {
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };
  shipping: {
    wilayaId: string;
    commune: string;
    address?: string | null;
    /** "home" (à domicile) or "stopdesk" (retrait en agence). Defaults home. */
    deliveryType?: "home" | "stopdesk";
    notes?: string | null;
  };
  lines: Array<{
    productSlug: string;
    variant?: string | null;
    quantity: number;
  }>;
  /** Google reCAPTCHA v2 response token. Required in production; the
   *  backend skips verification when RECAPTCHA_SECRET_KEY is unset. */
  recaptchaToken?: string | null;
}

export interface ApiOrderLine {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  image: string | null;
  variant: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ApiOrderStatusEntry {
  id: string;
  status: string;
  by: string | null;
  note: string | null;
  at: string | null;
}

export interface ApiOrderCallAttempt {
  id: string;
  outcome: "answered" | "no_answer" | "wrong_number" | "declined";
  by: string | null;
  note: string | null;
  at: string | null;
}

export interface ApiOrder {
  id: string;
  orderNumber: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";
  paymentMethod: string;
  paymentStatus: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    customerId: string | null;
  };
  shipping: {
    wilayaId: string;
    wilayaName: string;
    commune: string;
    address: string | null;
    deliveryType: "home" | "stopdesk";
    notes: string | null;
  };
  subtotal: number;
  shippingFee: number;
  total: number;
  trackingNumber: string | null;
  cancellationReason: string | null;
  /** ZR Express audit fields — present only on admin responses. */
  zr?: {
    parcelId: string | null;
    state: string | null;
    syncedAt: string | null;
    lastError: string | null;
  };
  customerIp: string | null;
  ipBlocked: boolean;
  lines: ApiOrderLine[];
  statusHistory: ApiOrderStatusEntry[];
  callAttempts: ApiOrderCallAttempt[];
  createdAt: string | null;
  updatedAt: string | null;
}

/** Light row returned by /api/admin/orders. */
export interface ApiOrderRow {
  id: string;
  orderNumber: string;
  status: ApiOrder["status"];
  customer: { firstName: string; lastName: string; phone: string };
  wilayaId: string;
  wilayaName: string;
  commune: string;
  total: number;
  customerIp: string | null;
  ipBlocked: boolean;
  createdAt: string | null;
}

interface ListResponse {
  data: ApiOrderRow[];
  meta: { total: number; page: number; perPage: number; lastPage: number };
}
interface SingleResponse {
  data: ApiOrder;
}

export const ordersApi = {
  /** Public — works as guest checkout, but if a customer is logged in
   *  on the storefront we ship their Sanctum token so the backend can
   *  attribute the order to their account (powers the Compte/Invité
   *  filter on /admin/customers). The /api/orders route itself stays
   *  unauthenticated; auth is optional, validated server-side. */
  create(payload: CreateOrderPayload): Promise<ApiOrder> {
    return http
      .post<SingleResponse>("/api/orders", payload, { auth: "customer" })
      .then((r) => r.data);
  },

  /** Admin — paginated index. */
  listAll(
    params: { page?: number; perPage?: number; q?: string; status?: string; wilayaId?: string } = {},
  ): Promise<ListResponse> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.perPage) qs.set("perPage", String(params.perPage));
    if (params.q) qs.set("q", params.q);
    if (params.status) qs.set("status", params.status);
    if (params.wilayaId) qs.set("wilayaId", params.wilayaId);
    const url = `/api/admin/orders${qs.toString() ? `?${qs}` : ""}`;
    return http.get<ListResponse>(url, { auth: "admin" });
  },

  get(id: string): Promise<ApiOrder> {
    return http
      .get<SingleResponse>(`/api/admin/orders/${id}`, { auth: "admin" })
      .then((r) => r.data);
  },

  updateStatus(
    id: string,
    status: ApiOrder["status"],
    note?: string,
  ): Promise<ApiOrder> {
    return http
      .patch<SingleResponse>(
        `/api/admin/orders/${id}/status`,
        { status, note },
        { auth: "admin" },
      )
      .then((r) => r.data);
  },

  logCall(
    id: string,
    outcome: ApiOrderCallAttempt["outcome"],
    note?: string,
  ): Promise<ApiOrder> {
    return http
      .post<SingleResponse>(
        `/api/admin/orders/${id}/calls`,
        { outcome, note },
        { auth: "admin" },
      )
      .then((r) => r.data);
  },

  destroy(id: string): Promise<void> {
    return http.delete(`/api/admin/orders/${id}`, { auth: "admin" }) as Promise<void>;
  },

  pendingCount(): Promise<number> {
    return http
      .get<{ pending: number }>("/api/admin/orders/pending-count", { auth: "admin" })
      .then((r) => r.pending);
  },

  /** Storefront — full history for the currently authenticated customer.
   *  Powers /mes-commandes. Returns newest-first. The backend already
   *  eager-loads lines + statusHistory so the page can render expandable
   *  cards in a single request. */
  listMine(): Promise<ApiOrder[]> {
    return http
      .get<{ data: ApiOrder[] }>("/api/auth/orders", { auth: "customer" })
      .then((r) => r.data);
  },
};
