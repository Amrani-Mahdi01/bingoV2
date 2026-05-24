"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DashboardKpis } from "@/components/admin/DashboardKpis";
import { Button } from "@/components/ui/button";
import { HttpError } from "@/lib/api/http";
import { statsApi, type DashboardStats } from "@/lib/api/stats";
import { cn } from "@/lib/utils";

export default function StatisticsPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const s = await statsApi.dashboard();
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
    void load();
  }, [load]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Analyse"
        title="Statistiques"
        subtitle="Indicateurs clés, ventes, statuts et performance produit sur les 30 derniers jours."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Actualiser
          </Button>
        }
      />

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
