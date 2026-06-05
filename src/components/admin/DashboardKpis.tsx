"use client";

import * as React from "react";
import {
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Mono } from "@/components/ui/typography";
import { AlgeriaGeoGrid } from "@/components/admin/AlgeriaGeoGrid";
import {
  OrdersBarChart,
  RevenueAreaChart,
  Sparkline,
} from "@/components/admin/DashboardCharts";
import { StatCard } from "@/components/admin/StatCard";
import { Funnel, HorizontalBars } from "@/components/admin/StatsCharts";
import type { DashboardStats } from "@/lib/api/stats";
import { formatDZD } from "@/lib/format";

interface Props {
  stats: DashboardStats;
}

/**
 * Composes the original tile / chart / heat-grid layout we had with the
 * dummy data, now fed by `/api/admin/stats/dashboard` from Laravel:
 *
 *   - 4 KPI tiles (revenue / orders / AOV / customers) each with a
 *     7-day sparkline derived from `revenueLast30`
 *   - Revenue area chart (30 d)  +  Orders bar chart (30 d)
 *   - Algeria geo heat-grid by wilaya
 *   - Funnel (Reçues → Confirmées → Expédiées → Livrées)
 *   - Top wilayas horizontal bars + top products horizontal bars
 */
export function DashboardKpis({ stats }: Props) {
  const { kpis, revenueLast30, topProducts } = stats;
  // Tolerate older API responses that don't include these keys yet — empty
  // arrays so the geo-grid + funnel just render their empty states.
  const byWilaya = Array.isArray(stats.byWilaya) ? stats.byWilaya : [];
  const funnel = Array.isArray(stats.funnel) ? stats.funnel : [];

  const series = Array.isArray(revenueLast30) ? revenueLast30 : [];
  const top = Array.isArray(topProducts) ? topProducts : [];

  // 7-day rolling deltas + sparkline arrays so the KPI tiles stay alive
  // even when there's only one real day of data.
  const last7 = series.slice(-7);
  const prev7 = series.slice(-14, -7);
  const sumRev = (rows: typeof series) =>
    rows.reduce((s, r) => s + r.revenue, 0);
  const sumOrders = (rows: typeof series) =>
    rows.reduce((s, r) => s + r.orders, 0);

  const last7Rev = sumRev(last7);
  const prev7Rev = sumRev(prev7);
  const revDelta =
    prev7Rev > 0 ? (last7Rev - prev7Rev) / prev7Rev : last7Rev > 0 ? 1 : 0;

  const last7Orders = sumOrders(last7);
  const prev7Orders = sumOrders(prev7);
  const ordersDelta =
    prev7Orders > 0
      ? (last7Orders - prev7Orders) / prev7Orders
      : last7Orders > 0
        ? 1
        : 0;

  // Top wilayas by revenue, top 6 for the horizontal-bar widget.
  const topWilayas = [...byWilaya]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((w) => ({ label: w.wilayaName, value: w.revenue }));

  const topProductsBars = top
    .slice(0, 6)
    .map((p) => ({ label: p.name, value: p.revenue }));

  return (
    <div className="space-y-5">
      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="CA (30 jours)"
          value={formatDZD(kpis.monthRevenue, "fr")}
          change={revDelta}
          subtitle="vs. les 7 jours précédents"
          icon={Wallet}
        >
          <Sparkline data={series.slice(-14).map((d) => d.revenue)} />
        </StatCard>
        <StatCard
          label="Commandes (30 j)"
          value={String(kpis.monthOrders)}
          change={ordersDelta}
          subtitle={`${kpis.pendingOrders} en attente`}
          icon={ShoppingBag}
        >
          <Sparkline
            data={series.slice(-14).map((d) => d.orders)}
            color="#10b981"
          />
        </StatCard>
        <StatCard
          label="Panier moyen"
          value={formatDZD(kpis.averageOrderValue, "fr")}
          subtitle="sur les 30 derniers jours"
          icon={TrendingUp}
        />
        <StatCard
          label="Clients uniques"
          value={String(kpis.totalCustomers)}
          subtitle={`${kpis.totalProducts} produits actifs`}
          icon={Users}
        />
      </div>

      {/* Revenue + orders side-by-side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <Mono className="text-zinc-500">Chiffre d&apos;affaires</Mono>
              <h3 className="mt-0.5 font-sans text-base font-semibold text-zinc-900 sm:text-lg">
                Évolution sur 30 jours
              </h3>
            </div>
            <span className="font-mono text-2xs text-zinc-400">
              {series[0]?.date} → {series.at(-1)?.date}
            </span>
          </div>
          <RevenueAreaChart data={series} />
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="mb-3">
            <Mono className="text-zinc-500">Volume</Mono>
            <h3 className="mt-0.5 font-sans text-base font-semibold text-zinc-900 sm:text-lg">
              Commandes par jour
            </h3>
          </div>
          <OrdersBarChart data={series} />
        </div>
      </div>

      {/* Geography heat-grid (full width) */}
      <AlgeriaGeoGrid
        data={byWilaya.map((w) => ({
          wilayaCode: w.wilayaCode,
          wilayaName: w.wilayaName,
          // Region + delivery rate aren't used by the grid's heat cells,
          // so pass defaults — the component reads `revenue`.
          region: "Nord" as const,
          revenue: w.revenue,
          orderCount: w.orderCount,
          deliveryRate: 1,
          averageBasket: w.averageBasket,
        }))}
      />

      {/* Funnel + side-by-side top lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5">
          <Mono className="text-zinc-500">Entonnoir</Mono>
          <h3 className="mt-0.5 mb-4 font-sans text-base font-semibold text-zinc-900 sm:text-lg">
            Du panier à la livraison
          </h3>
          <Funnel steps={funnel} />
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5">
          <Mono className="text-zinc-500">Wilayas</Mono>
          <h3 className="mt-0.5 mb-4 font-sans text-base font-semibold text-zinc-900 sm:text-lg">
            Top wilayas — chiffre d&apos;affaires
          </h3>
          {topWilayas.length === 0 ? (
            <p className="text-xs text-zinc-500">Aucune donnée.</p>
          ) : (
            <HorizontalBars
              data={topWilayas}
              formatValue={(v) => formatDZD(v, "fr")}
            />
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5">
        <Mono className="text-zinc-500">Catalogue</Mono>
        <h3 className="mt-0.5 mb-4 font-sans text-base font-semibold text-zinc-900 sm:text-lg">
          Top produits — chiffre d&apos;affaires sur 30 jours
        </h3>
        {topProductsBars.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Aucune vente sur les 30 derniers jours.
          </p>
        ) : (
          <HorizontalBars
            data={topProductsBars}
            formatValue={(v) => formatDZD(v, "fr")}
          />
        )}
      </div>
    </div>
  );
}
