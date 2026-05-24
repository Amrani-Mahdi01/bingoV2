"use client";

import { http } from "@/lib/api/http";

export interface ApiCustomerRow {
  phone: string;
  firstName: string;
  lastName: string;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  wilayaId: string;
  wilayaName: string;
}

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

export const customersApi = {
  list(q?: string): Promise<{ data: ApiCustomerRow[]; meta: { total: number } }> {
    const url = q ? `/api/admin/customers?q=${encodeURIComponent(q)}` : "/api/admin/customers";
    return http.get(url, { auth: "admin" });
  },
  get(phone: string): Promise<ApiCustomerDetail> {
    return http
      .get<{ data: ApiCustomerDetail }>(`/api/admin/customers/${encodeURIComponent(phone)}`, {
        auth: "admin",
      })
      .then((r) => r.data);
  },
};
