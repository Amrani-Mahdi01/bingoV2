"use client";

import * as React from "react";
import {
  RotateCcw,
  ShoppingBag,
  Target,
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

  // Selected window + human label (falls back to 30 j for older API responses).
  const days = kpis.rangeDays ?? 30;
  const periodLabel =
    days === 7 ? "7 jours"
    : days === 30 ? "30 jours"
    : days === 90 ? "3 mois"
    : days === 365 ? "1 an"
    : `${days} j`;
  const periodShort =
    days === 7 ? "7 j" : days === 30 ? "30 j" : days === 90 ? "90 j" : "1 an";
  const monthly = days > 90;

  // Window figures + delta vs the previous equal window (from the API).
  const revenue = kpis.rangeRevenue ?? kpis.monthRevenue;
  const orders = kpis.rangeOrders ?? kpis.monthOrders;
  const prevRevenue = kpis.prevRevenue ?? 0;
  const prevOrders = kpis.prevOrders ?? 0;
  const revDelta =
    prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : revenue > 0 ? 1 : 0;
  const ordersDelta =
    prevOrders > 0 ? (orders - prevOrders) / prevOrders : orders > 0 ? 1 : 0;

  const conversionRate = kpis.conversionRate ?? 0;
  const returnRate = kpis.returnRate ?? 0;
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  // Top wilayas by revenue, top 6 for the horizontal-bar widget.
  const topWilayas = [...byWilaya]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((w) => ({ label: w.wilayaName, value: w.revenue }));

  const topProductsBars = top
    .slice(0, 6)
    .map((p) => ({ label: p.name, value: p.revenue }));

  // What's being bought, by category (revenue), and the most-returned products.
  const topCategoriesBars = (
    Array.isArray(stats.topCategories) ? stats.topCategories : []
  )
    .slice(0, 8)
    .map((c) => ({ label: c.name, value: c.revenue }));
  const returnedBars = (
    Array.isArray(stats.topReturnedProducts) ? stats.topReturnedProducts : []
  )
    .slice(0, 8)
    .map((p) => ({ label: p.name, value: p.units }));

  return (
    <div className="space-y-5">
      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={`CA (${periodShort})`}
          value={formatDZD(revenue, "fr")}
          change={revDelta}
          subtitle="vs. période précédente"
          icon={Wallet}
        >
          <Sparkline data={series.map((d) => d.revenue)} />
        </StatCard>
        <StatCard
          label={`Commandes livrées (${periodShort})`}
          value={String(orders)}
          change={ordersDelta}
          subtitle={`${kpis.pendingOrders} en attente`}
          icon={ShoppingBag}
        >
          <Sparkline data={series.map((d) => d.orders)} color="#10b981" />
        </StatCard>
        <StatCard
          label="Panier moyen"
          value={formatDZD(kpis.averageOrderValue, "fr")}
          subtitle={`sur ${periodLabel}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Taux de conversion"
          value={pct(conversionRate)}
          subtitle="livrées / commandes reçues"
          icon={Target}
        />
        <StatCard
          label="Taux de retour"
          value={pct(returnRate)}
          subtitle={`${kpis.returnedOrders ?? 0} commande(s) retournée(s)`}
          icon={RotateCcw}
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
                Évolution sur {periodLabel}
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
              Commandes par {monthly ? "mois" : "jour"}
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
          Top produits — chiffre d&apos;affaires sur {periodLabel}
        </h3>
        {topProductsBars.length === 0 ? (
          <p className="text-xs text-zinc-500">Aucune vente sur {periodLabel}.</p>
        ) : (
          <HorizontalBars
            data={topProductsBars}
            formatValue={(v) => formatDZD(v, "fr")}
          />
        )}
      </div>

      {/* Categories bought + most-returned products */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5">
          <Mono className="text-zinc-500">Catégories</Mono>
          <h3 className="mt-0.5 mb-4 font-sans text-base font-semibold text-zinc-900 sm:text-lg">
            Top catégories — chiffre d&apos;affaires sur {periodLabel}
          </h3>
          {topCategoriesBars.length === 0 ? (
            <p className="text-xs text-zinc-500">Aucune vente sur {periodLabel}.</p>
          ) : (
            <HorizontalBars
              data={topCategoriesBars}
              formatValue={(v) => formatDZD(v, "fr")}
            />
          )}
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-5">
          <Mono className="text-zinc-500">Retours</Mono>
          <h3 className="mt-0.5 mb-4 font-sans text-base font-semibold text-zinc-900 sm:text-lg">
            Produits les plus retournés sur {periodLabel}
          </h3>
          {returnedBars.length === 0 ? (
            <p className="text-xs text-zinc-500">Aucun retour sur {periodLabel}.</p>
          ) : (
            <HorizontalBars
              data={returnedBars}
              formatValue={(v) => `${v} u.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
