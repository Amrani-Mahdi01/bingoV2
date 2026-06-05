"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Check, Download, Eye, RefreshCw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Body, Mono, Small } from "@/components/ui/typography";
import { Checkbox } from "@/components/ui/checkbox";
import { HttpError } from "@/lib/api/http";
import {
  ordersApi,
  type ApiOrder,
  type ApiOrderRow,
} from "@/lib/api/orders";
import { zrApi } from "@/lib/api/zr";
import { downloadCSV, toCSV } from "@/lib/csv";
import { formatDZD } from "@/lib/format";
import {
  PENDING_ORDERS_BROADCAST,
  PENDING_ORDERS_REFRESH_EVENT,
  refreshPendingOrders,
} from "@/lib/hooks/usePendingOrders";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Status palette — single source of truth for the page.
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  ApiOrder["status"],
  { label: string; cls: string; dot: string }
> = {
  pending: {
    label: "En attente",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmée",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  preparing: {
    label: "Préparation",
    cls: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  shipped: {
    label: "Expédiée",
    cls: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-500",
  },
  delivered: {
    label: "Livrée",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Annulée",
    cls: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dot: "bg-zinc-400",
  },
  returned: {
    label: "Retournée",
    cls: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

const STATUS_ORDER: ApiOrder["status"][] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

// Pull a larger page since we group client-side by day — 200 rows covers
// roughly a busy month at our scale.
const FETCH_PAGE_SIZE = 200;

// Default visible range when the admin first opens the page: the last
// 7 calendar days (today included). Anything older is one preset click
// away through the date picker. Keeping the default tight reduces the
// initial scroll-wall on busy stores.
const DEFAULT_RANGE_DAYS = 7;

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function computeDefaultRange(): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(to);
  from.setDate(from.getDate() - (DEFAULT_RANGE_DAYS - 1));
  return { from: isoDay(from), to: isoDay(to) };
}

// ---------------------------------------------------------------------------
// CSV export — used by per-day "Exporter" buttons AND the floating
// bulk-action bar. One column set so files always have the same
// schema regardless of how the admin scoped the export.
// ---------------------------------------------------------------------------

const ORDER_CSV_HEADERS = [
  "orderNumber",
  "status",
  "createdAt",
  "customerFirstName",
  "customerLastName",
  "customerPhone",
  "customerIp",
  "ipBlocked",
  "wilayaId",
  "wilayaName",
  "commune",
  "total",
] as const;

function orderRowToCsv(o: ApiOrderRow): string[] {
  return [
    o.orderNumber,
    o.status,
    o.createdAt ?? "",
    o.customer.firstName,
    o.customer.lastName,
    o.customer.phone,
    o.customerIp ?? "",
    o.ipBlocked ? "1" : "0",
    o.wilayaId,
    o.wilayaName,
    o.commune,
    String(o.total),
  ];
}

function downloadOrdersCsv(orders: ApiOrderRow[], fileTag: string): void {
  if (orders.length === 0) {
    toast.info("Rien à exporter.");
    return;
  }
  const rows: string[][] = [
    ORDER_CSV_HEADERS.slice(),
    ...orders.map(orderRowToCsv),
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCSV(`bingo-commandes-${fileTag}-${stamp}.csv`, toCSV(rows));
  toast.success(
    `${orders.length} commande${orders.length > 1 ? "s" : ""} exportée${orders.length > 1 ? "s" : ""}`,
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const [rows, setRows] = React.useState<ApiOrderRow[] | null>(null);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [syncingZr, setSyncingZr] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | ApiOrder["status"]>("all");
  const [wilaya, setWilaya] = React.useState<string>("all");
  // The page boots with the last 7 days pre-selected — admins should
  // see "today's work" without having to touch the filter bar. Computed
  // once via the useState initializer so the bounds stay stable across
  // re-renders (only `clearFilters` recomputes them on demand).
  const defaultRange = React.useMemo(() => computeDefaultRange(), []);
  const [dateFrom, setDateFrom] = React.useState<string>(defaultRange.from);
  const [dateTo, setDateTo] = React.useState<string>(defaultRange.to);

  // Multi-select: order IDs currently ticked across every day bucket.
  // Cleared after a successful bulk action or filter change.
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const confirm = useConfirm();

  const toggleOne = React.useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleMany = React.useCallback((ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => setSelected(new Set()), []);

  // ---- Fetch -------------------------------------------------------------
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.listAll({
        page: 1,
        perPage: FETCH_PAGE_SIZE,
        q: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        wilayaId: wilaya === "all" ? undefined : wilaya,
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setError(null);
    } catch (err) {
      console.error("[orders] load", err);
      setError(
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Impossible de charger les commandes.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, wilaya]);

  // Pull every active order's delivery status from ZR now, then refresh the
  // table. Manual ZR-03 trigger (the "Statuts ZR" toolbar button).
  const syncZrStatuses = React.useCallback(async () => {
    setSyncingZr(true);
    try {
      const res = await zrApi.syncStatuses();
      toast.success(res.message ?? "Statuts ZR synchronisés.");
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la synchronisation ZR.",
      );
    } finally {
      setSyncingZr(false);
    }
  }, [load]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Real-time refresh:
  //   • SSE in usePendingOrders (mounted in AdminSidebar) pushes a
  //     window event the instant the backend reports a count change.
  //   • Same-browser tabs (storefront placing an order, another admin
  //     tab changing a status) broadcast via BroadcastChannel.
  //   • Both routes call load() so the table mirrors the server state
  //     without a manual refresh.
  React.useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener(PENDING_ORDERS_REFRESH_EVENT, onRefresh);
    let channel: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        channel = new BroadcastChannel(PENDING_ORDERS_BROADCAST);
        channel.onmessage = onRefresh;
      }
    } catch {
      /* ignore — polling fallback below covers us */
    }
    return () => {
      window.removeEventListener(PENDING_ORDERS_REFRESH_EVENT, onRefresh);
      channel?.close();
    };
  }, [load]);

  // Belt-and-suspenders polling at 60 s in case SSE is unavailable
  // (e.g. proxy strips event-stream, browser kills the connection).
  // The real-time path above usually beats it to the punch.
  React.useEffect(() => {
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Inline status update — optimistically swap the row and only fall back
  // on failure (the admin shouldn't have to wait for a round-trip).
  const updateRowStatus = async (
    orderId: string,
    next: ApiOrder["status"],
  ) => {
    const prev = rows;
    if (!prev) return;
    setRows(
      prev.map((r) => (r.id === orderId ? { ...r, status: next } : r)),
    );
    try {
      await ordersApi.updateStatus(orderId, next);
      toast.success(`Statut: ${STATUS_META[next].label}`);
      // The sidebar badge + tab title key off pending-count. Kick an
      // immediate refresh instead of waiting for the next 20s poll.
      refreshPendingOrders();
    } catch (err) {
      setRows(prev);
      toast.error(
        err instanceof Error ? err.message : "Échec de la mise à jour",
      );
    }
  };

  // Bulk status change — fires updateStatus per selected order in
  // parallel (no dedicated backend endpoint), optimistic UI on every
  // row, summary toast at the end. Failures revert the affected row.
  const applyBulkStatus = React.useCallback(
    async (next: ApiOrder["status"]) => {
      if (selected.size === 0 || bulkBusy) return;
      const ids = [...selected];
      const prev = rows;
      if (!prev) return;
      setBulkBusy(true);
      // Optimistic flip every selected row at once.
      setRows(prev.map((r) => (selected.has(r.id) ? { ...r, status: next } : r)));
      const results = await Promise.allSettled(
        ids.map((id) => ordersApi.updateStatus(id, next)),
      );
      const failed = results
        .map((r, i) => ({ r, id: ids[i] }))
        .filter((x) => x.r.status === "rejected")
        .map((x) => x.id);
      if (failed.length > 0) {
        // Revert only the rows that failed; keep the ones that worked.
        setRows((curr) =>
          curr
            ? curr.map((r) => {
                if (!failed.includes(r.id)) return r;
                const original = prev.find((p) => p.id === r.id);
                return original ?? r;
              })
            : curr,
        );
        toast.error(
          `${failed.length} échec${failed.length > 1 ? "s" : ""} sur ${ids.length}`,
        );
      } else {
        toast.success(
          `${ids.length} commande${ids.length > 1 ? "s" : ""} → ${STATUS_META[next].label}`,
        );
      }
      refreshPendingOrders();
      clearSelection();
      setBulkBusy(false);
    },
    [selected, bulkBusy, rows, clearSelection],
  );

  // Bulk delete — permanent. Confirms, deletes in parallel, drops the rows
  // that succeeded from the table.
  const bulkDelete = React.useCallback(async () => {
    if (selected.size === 0 || bulkBusy) return;
    const ids = [...selected];
    const ok = await confirm({
      title: `Supprimer ${ids.length} commande${ids.length > 1 ? "s" : ""} ?`,
      message:
        "Action définitive : les commandes sélectionnées et tout leur " +
        "historique seront supprimés. C'est irréversible.",
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map((id) => ordersApi.destroy(id)));
    const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
    const failed = ids.length - deleted.length;
    setRows((curr) => (curr ? curr.filter((r) => !deleted.includes(r.id)) : curr));
    setTotal((t) => Math.max(0, t - deleted.length));
    if (failed > 0) {
      toast.error(`${failed} échec${failed > 1 ? "s" : ""} sur ${ids.length}`);
    } else {
      toast.success(
        `${deleted.length} commande${deleted.length > 1 ? "s" : ""} supprimée${deleted.length > 1 ? "s" : ""}`,
      );
    }
    refreshPendingOrders();
    clearSelection();
    setBulkBusy(false);
  }, [selected, bulkBusy, confirm, clearSelection]);

  // Drop the selection whenever the visible set changes — selecting
  // rows that get filtered out is confusing.
  React.useEffect(() => {
    if (selected.size === 0) return;
    clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, wilaya, dateFrom, dateTo]);

  // ---- Date-range + wilaya filtering (client-side) -----------------------
  const filtered = React.useMemo(() => {
    if (!rows) return null;
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : null;
    return rows.filter((r) => {
      if (!r.createdAt) return false;
      const t = new Date(r.createdAt).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
      return true;
    });
  }, [rows, dateFrom, dateTo]);

  // Distinct wilayas present in the current dataset, for the dropdown.
  const wilayaOptions = React.useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (!map.has(r.wilayaId)) map.set(r.wilayaId, r.wilayaName);
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [rows]);

  // Group by yyyy-mm-dd, keeping the newest day first.
  const grouped = React.useMemo(() => {
    if (!filtered) return null;
    const buckets = new Map<string, ApiOrderRow[]>();
    for (const r of filtered) {
      if (!r.createdAt) continue;
      const day = r.createdAt.slice(0, 10);
      const list = buckets.get(day) ?? [];
      list.push(r);
      buckets.set(day, list);
    }
    return [...buckets.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([day, list]) => ({
        day,
        list,
        revenue: list.reduce((s, r) => s + r.total, 0),
        pending: list.filter((r) => r.status === "pending").length,
      }));
  }, [filtered]);

  // The default date range is the "baseline" — only flag the bar as
  // having active filters when the admin has moved away from it.
  const isDefaultRange =
    dateFrom === defaultRange.from && dateTo === defaultRange.to;
  const hasFilters =
    search.trim() !== "" ||
    status !== "all" ||
    wilaya !== "all" ||
    !isDefaultRange;

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setWilaya("all");
    // Reset to the page's default window rather than wiping the dates
    // — "Réinitialiser" should put the admin back where they started,
    // i.e. looking at the last 7 days.
    const fresh = computeDefaultRange();
    setDateFrom(fresh.from);
    setDateTo(fresh.to);
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Commandes"
        subtitle={
          rows === null
            ? "Chargement…"
            : `${total} commande${total > 1 ? "s" : ""} au total · ${
                filtered?.length ?? 0
              } affichée${(filtered?.length ?? 0) > 1 ? "s" : ""}`
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void syncZrStatuses()}
              disabled={syncingZr || loading}
            >
              <RefreshCw className={cn("size-3.5", syncingZr && "animate-spin")} />
              {syncingZr ? "Synchro ZR…" : "Statuts ZR"}
            </Button>
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
          </>
        }
      />

      {/* ---- Filter bar ---- */}
      <div className="mb-5 rounded-md border border-zinc-200 bg-white p-3">
        {/* All four controls share the same h-9 height + rounded-md +
            border-zinc-200 + bg-white + text-xs for a single visual
            row. Note the Selects pass size="sm" — that's the design
            system's way to get h-9; a className h-9 won't override the
            base `data-[size=default]:h-11` variant. */}
        <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.2fr]">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="N° commande, nom, téléphone…"
              className="h-9 rounded-md border-zinc-200 bg-white pl-9 text-xs md:text-xs"
            />
          </div>

          {/* Status select */}
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <SelectTrigger
              size="sm"
              className="w-full border-zinc-200 bg-white text-xs"
            >
              <SelectValue>
                {status === "all"
                  ? "Tous les statuts"
                  : STATUS_META[status as ApiOrder["status"]].label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUS_ORDER.map((k) => (
                <SelectItem key={k} value={k}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        STATUS_META[k].dot,
                      )}
                    />
                    {STATUS_META[k].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Wilaya select */}
          <Select value={wilaya} onValueChange={(v) => setWilaya(v ?? "all")}>
            <SelectTrigger
              size="sm"
              className="w-full border-zinc-200 bg-white text-xs"
            >
              <SelectValue>
                {wilaya === "all"
                  ? "Toutes les wilayas"
                  : (() => {
                      const w = wilayaOptions.find((x) => x.id === wilaya);
                      return w ? `${w.id} — ${w.name}` : "Wilaya";
                    })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les wilayas</SelectItem>
              {wilayaOptions.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.id} — {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range popover */}
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={(f, t) => {
              setDateFrom(f);
              setDateTo(t);
            }}
          />
        </div>
        {hasFilters ? (
          <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2">
            <Small className="text-zinc-500">Filtres actifs</Small>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-2xs font-medium text-blue-700 hover:underline"
            >
              <X className="size-3" /> Réinitialiser
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* ---- Day-grouped tables ---- */}
      {grouped === null ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
          Chargement…
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-white px-4 py-12 text-center text-sm text-zinc-500">
          Aucune commande dans la plage sélectionnée.
        </div>
      ) : (
        <div className={cn("space-y-5", selected.size > 0 && "pb-24")}>
          {grouped.map((bucket) => (
            <DayTable
              key={bucket.day}
              day={bucket.day}
              orders={bucket.list}
              dayRevenue={bucket.revenue}
              pendingCount={bucket.pending}
              onStatusChange={updateRowStatus}
              selected={selected}
              onToggleOne={toggleOne}
              onToggleMany={toggleMany}
            />
          ))}
        </div>
      )}

      <Body className="mt-4 text-2xs text-zinc-400">
        Les nouvelles commandes apparaissent automatiquement, en temps réel.
      </Body>

      {/* ── Floating bulk action bar — appears when ≥1 row is ticked.
            Stacks on mobile (count+cancel, then export+status); single
            rounded pill from sm up. ── */}
      {selected.size > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
          <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-zinc-300 bg-white p-3 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)] sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:py-2 sm:ps-4 sm:pe-2">
            {/* Count + (mobile-only) cancel */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                <span className="grid size-5 place-items-center rounded-full bg-blue-600 text-2xs font-semibold text-white tabular-nums">
                  {selected.size}
                </span>
                sélectionnée{selected.size > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                disabled={bulkBusy}
                aria-label="Annuler la sélection"
                className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 sm:hidden"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:ms-auto">
              <button
                type="button"
                onClick={() => {
                  // Preserve the table's display order (newest-first
                  // grouped by day) when exporting selection.
                  const picked = (rows ?? []).filter((r) => selected.has(r.id));
                  downloadOrdersCsv(picked, "selection");
                }}
                disabled={bulkBusy}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 sm:flex-none"
              >
                <Download className="size-3.5" />
                Exporter
              </button>

              <Select
                value=""
                onValueChange={(v) =>
                  void applyBulkStatus(v as ApiOrder["status"])
                }
                disabled={bulkBusy}
              >
                <SelectTrigger
                  size="sm"
                  className="h-9 min-w-0 flex-1 border-zinc-200 bg-white text-xs sm:w-[180px] sm:flex-none"
                >
                  <SelectValue placeholder="Changer le statut…" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((k) => (
                    <SelectItem key={k} value={k}>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            STATUS_META[k].dot,
                          )}
                        />
                        {STATUS_META[k].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={() => void bulkDelete()}
                disabled={bulkBusy}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50 sm:flex-none"
              >
                <Trash2 className="size-3.5" />
                Supprimer
              </button>

              <button
                type="button"
                onClick={clearSelection}
                disabled={bulkBusy}
                className="hidden h-9 items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 sm:inline-flex"
              >
                <X className="size-3.5" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// One table per day, with a header summarising that day.
// ---------------------------------------------------------------------------

function DayTable({
  day,
  orders,
  dayRevenue,
  pendingCount,
  onStatusChange,
  selected,
  onToggleOne,
  onToggleMany,
}: {
  day: string;
  orders: ApiOrderRow[];
  dayRevenue: number;
  pendingCount: number;
  onStatusChange: (id: string, next: ApiOrder["status"]) => void | Promise<void>;
  selected: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleMany: (ids: string[], checked: boolean) => void;
}) {
  const dateLabel = new Date(day + "T00:00:00").toLocaleDateString("fr-DZ", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  // How many of THIS day's rows are currently ticked. Drives the
  // header checkbox state (none / some / all → unchecked / indeterminate
  // / checked).
  const dayIds = React.useMemo(() => orders.map((o) => o.id), [orders]);
  const selectedInDay = dayIds.filter((id) => selected.has(id)).length;
  const allSelected = orders.length > 0 && selectedInDay === orders.length;
  const someSelected = selectedInDay > 0 && !allSelected;
  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 sm:gap-3">
        <div className="flex items-baseline gap-2 sm:gap-3">
          <Mono className="text-[10px] tracking-tight text-zinc-700 sm:text-xs sm:tracking-normal">
            {dateLabel}
          </Mono>
          <Small className="text-[11px] text-zinc-500 sm:text-sm">
            {orders.length} commande{orders.length > 1 ? "s" : ""}
          </Small>
          {pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 sm:px-2.5 sm:py-1 sm:text-xs">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {pendingCount} en attente
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
            {formatDZD(dayRevenue, "fr")}
          </span>
          <button
            type="button"
            onClick={() => downloadOrdersCsv(orders, day)}
            aria-label={`Exporter les commandes du ${dateLabel}`}
            title="Exporter en CSV"
            className="inline-flex h-6 items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 font-mono text-[10px] font-medium uppercase tracking-wide text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 md:h-7 md:px-2 md:text-2xs"
          >
            <Download className="size-3" />
            Exporter
          </button>
        </div>
      </header>

      {/* ── Mobile (< md): card list — the 11-column table is unreadable
            on a phone, so we render each row as a self-contained card
            with the fields admins actually need at a glance. */}
      <ul className="divide-y divide-zinc-100 md:hidden">
        {orders.map((o) => {
          const time = o.createdAt
            ? new Date(o.createdAt).toLocaleTimeString("fr-DZ", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          const isSelected = selected.has(o.id);
          const isPending = o.status === "pending";
          return (
            <li
              key={o.id}
              className={cn(
                "flex flex-col gap-1.5 px-3 py-2.5 transition-colors",
                isSelected
                  ? "bg-blue-50/60"
                  : isPending
                    ? "bg-amber-50/60"
                    : "bg-white",
              )}
            >
              {/* Top row — selection + time + order # + eye link */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(v) => onToggleOne(o.id, v === true)}
                  aria-label={`Sélectionner la commande ${o.orderNumber}`}
                />
                <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                  {time}
                </span>
                <span className="font-mono text-[10px] text-zinc-500" dir="ltr">
                  {o.orderNumber}
                </span>
                {o.ipBlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide text-red-700">
                    <span className="size-1 rounded-full bg-red-500" />
                    Bloquée
                  </span>
                ) : null}
                <Link
                  href={`/admin/orders/${o.id}`}
                  aria-label="Voir"
                  className="ms-auto inline-flex size-6 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Eye className="size-3.5" />
                </Link>
              </div>

              {/* Customer + contact + address */}
              <div className="ps-6">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="block truncate text-xs font-semibold text-zinc-900 hover:text-blue-600"
                >
                  {o.customer.firstName} {o.customer.lastName}
                </Link>
                <a
                  href={`tel:${o.customer.phone}`}
                  dir="ltr"
                  className="block truncate font-mono text-[10px] leading-tight text-zinc-600 hover:text-blue-700"
                >
                  {o.customer.phone}
                </a>
                <p className="truncate text-[10px] leading-tight text-zinc-500">
                  {o.wilayaName}
                  <span className="text-zinc-400"> · {o.commune}</span>
                </p>
              </div>

              {/* Status pill + total */}
              <div className="ps-6 flex items-center justify-between gap-2">
                <StatusDropdown
                  value={o.status}
                  onChange={(next) => void onStatusChange(o.id, next)}
                />
                <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
                  {formatDZD(o.total, "fr")}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ── md+: original wide table. Hidden on mobile (the card list
            above replaces it). Keeps the horizontal scroll fallback so
            tablet portrait still degrades gracefully. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-[10px] uppercase tracking-wide text-zinc-500">
              <th className="w-10 px-4 py-2">
                {/* Header checkbox — toggles every row in THIS day's
                    table. Shows the indeterminate state when some
                    (but not all) rows in this day are selected. */}
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={(v) =>
                    onToggleMany(dayIds, v === true)
                  }
                  aria-label={
                    allSelected
                      ? "Désélectionner toutes les commandes du jour"
                      : "Sélectionner toutes les commandes du jour"
                  }
                />
              </th>
              <th className="px-4 py-2 font-medium">Heure</th>
              <th className="px-4 py-2 font-medium">N°</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Téléphone</th>
              <th className="px-4 py-2 font-medium">IP</th>
              <th className="px-4 py-2 font-medium">Bloquée</th>
              <th className="px-4 py-2 font-medium">Wilaya</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="w-12 px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const time = o.createdAt
                ? new Date(o.createdAt).toLocaleTimeString("fr-DZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              const isSelected = selected.has(o.id);
              const isPending = o.status === "pending";
              return (
                <tr
                  key={o.id}
                  className={cn(
                    "border-t border-zinc-100 transition-colors",
                    isSelected
                      ? "bg-blue-50/60"
                      : isPending
                        ? "bg-amber-50/60 hover:bg-amber-50"
                        : "hover:bg-zinc-50/60",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => onToggleOne(o.id, v === true)}
                      aria-label={`Sélectionner la commande ${o.orderNumber}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-2xs tabular-nums text-zinc-500">
                    {time}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-2xs text-zinc-700">
                    {o.orderNumber}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-zinc-900 hover:text-blue-600"
                    >
                      {o.customer.firstName} {o.customer.lastName}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-2xs text-zinc-600" dir="ltr">
                    <a
                      href={`tel:${o.customer.phone}`}
                      className="hover:text-blue-700"
                    >
                      {o.customer.phone}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-2xs text-zinc-600" dir="ltr">
                    {o.customerIp ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {o.ipBlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-red-700">
                        <span className="size-1.5 rounded-full bg-red-500" />
                        Bloquée
                      </span>
                    ) : (
                      <span className="text-2xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">
                    {o.wilayaName}
                    <span className="block text-2xs text-zinc-400">
                      {o.commune}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono font-medium tabular-nums text-zinc-900">
                    {formatDZD(o.total, "fr")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <StatusDropdown
                      value={o.status}
                      onChange={(next) => void onStatusChange(o.id, next)}
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      aria-label="Voir"
                      className="inline-flex size-7 items-center justify-center rounded text-zinc-500 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Inline status changer — colored pill that opens a Select.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Date range picker — popover with preset chips + a tiny month calendar
// driven entirely by native Date math (no extra library).
// ---------------------------------------------------------------------------

function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<{ from: string; to: string }>({
    from,
    to,
  });
  // Keep the draft in sync when the popover re-opens, but don't fight typing.
  React.useEffect(() => {
    if (open) setDraft({ from, to });
  }, [open, from, to]);

  const label = React.useMemo(() => {
    if (!from && !to) return "Toutes les dates";
    const fmt = (s: string) =>
      new Date(s + "T00:00:00").toLocaleDateString("fr-DZ", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });
    if (from && to) return `${fmt(from)} → ${fmt(to)}`;
    if (from) return `Depuis ${fmt(from)}`;
    return `Jusqu'au ${fmt(to)}`;
  }, [from, to]);

  type PresetSpec = number | "today" | "yesterday" | "thisMonth";

  const presetRange = (
    spec: PresetSpec,
  ): { from: string; to: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let f: Date;
    let t: Date = today;
    if (spec === "today") {
      f = today;
    } else if (spec === "yesterday") {
      f = new Date(today);
      f.setDate(f.getDate() - 1);
      t = new Date(f);
    } else if (spec === "thisMonth") {
      f = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      f = new Date(today);
      f.setDate(f.getDate() - (spec - 1));
    }
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    return { from: iso(f), to: iso(t) };
  };

  const applyPreset = (spec: PresetSpec) => {
    const r = presetRange(spec);
    onChange(r.from, r.to);
    setOpen(false);
  };

  /** Does the currently-applied (from, to) match this preset exactly?
   *  Drives the checkmark + tinted background on the matching chip so
   *  the admin can tell at a glance which preset is live. */
  const isPresetActive = (spec: PresetSpec): boolean => {
    const r = presetRange(spec);
    return r.from === from && r.to === to;
  };

  const apply = () => {
    onChange(draft.from, draft.to);
    setOpen(false);
  };

  const clear = () => {
    onChange("", "");
    setOpen(false);
  };

  const isActive = from !== "" || to !== "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-700 transition-colors hover:border-zinc-300",
          isActive && "border-blue-300 bg-blue-50 text-blue-700",
        )}
      >
        <Calendar className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        {/* Presets */}
        <div className="grid grid-cols-2 gap-1 border-b border-zinc-100 p-2">
          <PresetChip
            active={isPresetActive("today")}
            onClick={() => applyPreset("today")}
          >
            Aujourd&apos;hui
          </PresetChip>
          <PresetChip
            active={isPresetActive("yesterday")}
            onClick={() => applyPreset("yesterday")}
          >
            Hier
          </PresetChip>
          <PresetChip
            active={isPresetActive(7)}
            onClick={() => applyPreset(7)}
          >
            7 derniers jours
          </PresetChip>
          <PresetChip
            active={isPresetActive(30)}
            onClick={() => applyPreset(30)}
          >
            30 derniers jours
          </PresetChip>
          <PresetChip
            active={isPresetActive("thisMonth")}
            onClick={() => applyPreset("thisMonth")}
          >
            Ce mois-ci
          </PresetChip>
          <PresetChip
            active={isPresetActive(90)}
            onClick={() => applyPreset(90)}
          >
            3 derniers mois
          </PresetChip>
        </div>

        {/* Custom range inputs */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-0.5 block text-2xs font-medium text-zinc-600">
                Du
              </span>
              <input
                type="date"
                value={draft.from}
                max={draft.to || undefined}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, from: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:border-blue-400 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-2xs font-medium text-zinc-600">
                Au
              </span>
              <input
                type="date"
                value={draft.to}
                min={draft.from || undefined}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, to: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:border-blue-400 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={clear}
              className="text-2xs font-medium text-zinc-500 hover:text-zinc-900"
              disabled={!isActive}
            >
              Effacer
            </button>
            <Button type="button" size="sm" variant="primary" onClick={apply}>
              Appliquer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PresetChip({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        active
          ? "bg-blue-50 font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
          : "text-zinc-700 hover:bg-zinc-100",
      )}
    >
      <span className="truncate">{children}</span>
      {active ? <Check className="size-3.5 shrink-0" strokeWidth={2.5} /> : null}
    </button>
  );
}

function StatusDropdown({
  value,
  onChange,
}: {
  value: ApiOrder["status"];
  onChange: (next: ApiOrder["status"]) => void;
}) {
  const meta = STATUS_META[value];
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const next = v as ApiOrder["status"];
        if (next !== value) onChange(next);
      }}
    >
      {/* size="sm" gives us h-9; we override down to h-7 with !
          because the design system's variant class would otherwise win
          over plain h-7. Widened to 160px so "Préparation" + chevron
          fit without truncating. */}
      <SelectTrigger
        size="sm"
        className={cn(
          // Compact on mobile so the pill scales with the new card
          // density; reverts to the original 160 px × 28 px on md+
          // where the table layout has more room.
          "!h-6 w-[130px] gap-1 rounded-full border px-2 py-0 text-[10px] font-medium uppercase tracking-wide",
          "md:!h-7 md:w-[160px] md:gap-1.5 md:px-3 md:text-2xs",
          meta.cls,
        )}
      >
        <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
        <SelectValue>{meta.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_ORDER.map((k) => (
          <SelectItem key={k} value={k}>
            <span className="flex items-center gap-2">
              <span
                className={cn("size-1.5 rounded-full", STATUS_META[k].dot)}
              />
              {STATUS_META[k].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
