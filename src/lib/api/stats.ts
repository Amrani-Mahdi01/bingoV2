"use client";

import { http } from "@/lib/api/http";

/** Periods the dashboard filter offers (days). */
export const STATS_RANGES = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "1 mois" },
  { days: 90, label: "3 mois" },
  { days: 365, label: "1 an" },
] as const;

export interface DashboardStats {
  kpis: {
    /** Selected window (days) + its revenue/orders/AOV. */
    rangeDays?: number;
    rangeRevenue?: number;
    rangeOrders?: number;
    averageOrderValue: number;
    /** Previous equal window, for deltas. */
    prevRevenue?: number;
    prevOrders?: number;
    /** Rates in 0..1. */
    conversionRate?: number;
    returnRate?: number;
    deliveredOrders?: number;
    returnedOrders?: number;
    cancelledOrders?: number;
    totalOrdersInRange?: number;
    pendingOrders: number;
    totalCustomers: number;
    totalProducts: number;
    /** Back-compat aliases (mirror the selected window). */
    monthRevenue: number;
    monthOrders: number;
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
  /** @param range window in days (7 | 30 | 90 | 365). Defaults to 30. */
  dashboard(range = 30): Promise<DashboardStats> {
    return http.get<DashboardStats>(
      `/api/admin/stats/dashboard?range=${range}`,
      { auth: "admin" },
    );
  },
};
