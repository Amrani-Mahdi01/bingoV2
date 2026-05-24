"use client";

import * as React from "react";
import { RefreshCw, Search, ShoppingBag, Users, Wallet } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mono } from "@/components/ui/typography";
import { customersApi, type ApiCustomerRow } from "@/lib/api/customers";
import { formatDZD } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CustomersPage() {
  const [rows, setRows] = React.useState<ApiCustomerRow[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.list(search.trim() || undefined);
      setRows(res.data);
      setError(null);
    } catch {
      setError("Impossible de charger les clients.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const totals = React.useMemo(() => {
    if (!rows) return null;
    return {
      count: rows.length,
      orders: rows.reduce((s, r) => s + r.orderCount, 0),
      revenue: rows.reduce((s, r) => s + r.totalSpent, 0),
    };
  }, [rows]);

  return (
    <>
      <AdminPageHeader
        eyebrow="CRM"
        title="Clients"
        subtitle={
          rows === null
            ? "Chargement…"
            : `${rows.length} client${rows.length > 1 ? "s" : ""} ayant déjà commandé`
        }
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

      {totals ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <KpiCard icon={Users} label="Clients uniques" value={String(totals.count)} />
          <KpiCard
            icon={ShoppingBag}
            label="Commandes (total)"
            value={String(totals.orders)}
          />
          <KpiCard
            icon={Wallet}
            label="Revenu cumulé"
            value={formatDZD(totals.revenue, "fr")}
          />
        </div>
      ) : null}

      <div className="mb-3 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone, email…"
            className="h-9 border-zinc-200 bg-white pl-9 text-xs"
          />
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Wilaya</th>
                <th className="px-4 py-3 font-medium text-right">Commandes</th>
                <th className="px-4 py-3 font-medium text-right">Total dépensé</th>
                <th className="px-4 py-3 font-medium">Dernière</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Chargement…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Aucun client pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr
                    key={c.phone}
                    className="border-t border-zinc-100 hover:bg-zinc-50/60"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {c.firstName} {c.lastName}
                      </p>
                      {c.email ? (
                        <p className="text-2xs text-zinc-500">{c.email}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-2xs text-zinc-700" dir="ltr">
                      <a href={`tel:${c.phone}`} className="hover:text-blue-700">
                        {c.phone}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {c.wilayaName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-900">
                      {c.orderCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-medium tabular-nums text-zinc-900">
                      {formatDZD(c.totalSpent, "fr")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {c.lastOrderAt
                        ? new Date(c.lastOrderAt).toLocaleDateString("fr-DZ")
                        : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-4">
      <span className="inline-flex size-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <Icon className="size-4" />
      </span>
      <div>
        <Mono className="text-2xs text-zinc-500">{label}</Mono>
        <p className="font-mono text-base font-semibold tabular-nums text-zinc-900">
          {value}
        </p>
      </div>
    </div>
  );
}
