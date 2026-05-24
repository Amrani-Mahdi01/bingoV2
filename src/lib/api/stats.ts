"use client";

import { http } from "@/lib/api/http";

export interface DashboardStats {
  kpis: {
    todayRevenue: number;
    todayOrders: number;
    weekRevenue: number;
    weekOrders: number;
    monthRevenue: number;
    monthOrders: number;
    averageOrderValue: number;
    pendingOrders: number;
    totalCustomers: number;
    totalProducts: number;
  };
  revenueLast30: Array<{ date: string; revenue: number; orders: number }>;
  statusBreakdown: Record<string, number>;
  topProducts: Array<{
    productId: string | null;
    name: string;
    image: string | null;
    units: number;
    revenue: number;
  }>;
  byWilaya: Array<{
    wilayaCode: string;
    wilayaName: string;
    revenue: number;
    orderCount: number;
    averageBasket: number;
  }>;
  funnel: Array<{ label: string; value: number }>;
}

export const statsApi = {
  dashboard(): Promise<DashboardStats> {
    return http.get<DashboardStats>("/api/admin/stats/dashboard", { auth: "admin" });
  },
};
