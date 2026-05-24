"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Eye, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
import { HttpError } from "@/lib/api/http";
import {
  ordersApi,
  type ApiOrder,
  type ApiOrderRow,
} from "@/lib/api/orders";
import { formatDZD } from "@/lib/format";
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const [rows, setRows] = React.useState<ApiOrderRow[] | null>(null);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | ApiOrder["status"]>("all");
  const [wilaya, setWilaya] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

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

  React.useEffect(() => {
    void load();
  }, [load]);

  // Live refresh every 20s so new orders pop in without a manual click.
  React.useEffect(() => {
    const id = setInterval(() => void load(), 20_000);
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
    } catch (err) {
      setRows(prev);
      toast.error(
        err instanceof Error ? err.message : "Échec de la mise à jour",
      );
    }
  };

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

  const hasFilters =
    search.trim() !== "" ||
    status !== "all" ||
    wilaya !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setWilaya("all");
    setDateFrom("");
    setDateTo("");
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

      {/* ---- Filter bar ---- */}
      <div className="mb-5 rounded-md border border-zinc-200 bg-white p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.2fr]">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="N° commande, nom, téléphone…"
              className="h-9 border-zinc-200 bg-white pl-9 text-xs"
            />
          </div>

          {/* Status select */}
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <SelectTrigger className="h-9 bg-white text-xs">
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
            <SelectTrigger className="h-9 bg-white text-xs">
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
        <div className="space-y-5">
          {grouped.map((bucket) => (
            <DayTable
              key={bucket.day}
              day={bucket.day}
              orders={bucket.list}
              dayRevenue={bucket.revenue}
              pendingCount={bucket.pending}
              onStatusChange={updateRowStatus}
            />
          ))}
        </div>
      )}

      <Body className="mt-4 text-2xs text-zinc-400">
        Les nouvelles commandes apparaissent automatiquement toutes les 20
        secondes.
      </Body>
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
}: {
  day: string;
  orders: ApiOrderRow[];
  dayRevenue: number;
  pendingCount: number;
  onStatusChange: (id: string, next: ApiOrder["status"]) => void | Promise<void>;
}) {
  const dateLabel = new Date(day + "T00:00:00").toLocaleDateString("fr-DZ", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <Mono className="text-zinc-700">{dateLabel}</Mono>
          <Small className="text-zinc-500">
            {orders.length} commande{orders.length > 1 ? "s" : ""}
          </Small>
          {pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-2xs font-medium text-amber-700">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {pendingCount} en attente
            </span>
          ) : null}
        </div>
        <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
          {formatDZD(dayRevenue, "fr")}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-[10px] uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-2 font-medium">Heure</th>
              <th className="px-4 py-2 font-medium">N°</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Téléphone</th>
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
              return (
                <tr
                  key={o.id}
                  className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/60"
                >
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

  const applyPreset = (days: number | "today" | "yesterday" | "thisMonth") => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let f: Date;
    let t: Date = today;
    if (days === "today") {
      f = today;
    } else if (days === "yesterday") {
      f = new Date(today);
      f.setDate(f.getDate() - 1);
      t = new Date(f);
    } else if (days === "thisMonth") {
      f = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      f = new Date(today);
      f.setDate(f.getDate() - (days - 1));
    }
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    onChange(iso(f), iso(t));
    setOpen(false);
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
          <PresetChip onClick={() => applyPreset("today")}>
            Aujourd&apos;hui
          </PresetChip>
          <PresetChip onClick={() => applyPreset("yesterday")}>
            Hier
          </PresetChip>
          <PresetChip onClick={() => applyPreset(7)}>7 derniers jours</PresetChip>
          <PresetChip onClick={() => applyPreset(30)}>
            30 derniers jours
          </PresetChip>
          <PresetChip onClick={() => applyPreset("thisMonth")}>
            Ce mois-ci
          </PresetChip>
          <PresetChip onClick={() => applyPreset(90)}>3 derniers mois</PresetChip>
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
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2 py-1.5 text-left text-xs text-zinc-700 transition-colors hover:bg-zinc-100"
    >
      {children}
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
      <SelectTrigger
        className={cn(
          "h-7 w-[140px] gap-1 rounded-full border px-2.5 text-2xs font-medium uppercase tracking-wide",
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
