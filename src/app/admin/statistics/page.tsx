"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DashboardKpis } from "@/components/admin/DashboardKpis";
import { Button } from "@/components/ui/button";
import { HttpError } from "@/lib/api/http";
import { statsApi, STATS_RANGES, type DashboardStats } from "@/lib/api/stats";
import { cn } from "@/lib/utils";

export default function StatisticsPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<number>(30);

  const load = React.useCallback(async (r: number) => {
    setLoading(true);
    try {
      const s = await statsApi.dashboard(r);
      setStats(s);
      setError(null);
    } catch (err) {
      setError(
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Impossible de charger les statistiques.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(range);
  }, [load, range]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Analyse"
        title="Statistiques"
        subtitle="Indicateurs clés, ventes, statuts et performance produit sur la période choisie."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load(range)}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Actualiser
          </Button>
        }
      />

      {/* Period filter */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {STATS_RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            onClick={() => setRange(r.days)}
            disabled={loading}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60",
              range === r.days
                ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {stats ? (
        <DashboardKpis stats={stats} />
      ) : (
        <p className="text-xs text-zinc-500">Chargement…</p>
      )}
    </>
  );
}
