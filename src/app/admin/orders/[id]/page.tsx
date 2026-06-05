"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  Download,
  History,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Unlink,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mono, Small } from "@/components/ui/typography";
import { customersApi } from "@/lib/api/customers";
import { HttpError } from "@/lib/api/http";
import { ordersApi, type ApiOrder } from "@/lib/api/orders";
import { zrApi } from "@/lib/api/zr";
import { downloadCSV, toCSV } from "@/lib/csv";
import { formatDZD } from "@/lib/format";
import { refreshPendingOrders } from "@/lib/hooks/usePendingOrders";
import { cn } from "@/lib/utils";

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError) {
    const body = err.body as { message?: string } | null;
    if (body?.message) return body.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

const STATUS_META: Record<
  ApiOrder["status"],
  { label: string; cls: string; dot: string }
> = {
  pending:   { label: "En attente",   cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  confirmed: { label: "Confirmée",    cls: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
  preparing: { label: "Préparation",  cls: "bg-violet-50 text-violet-700 border-violet-200",   dot: "bg-violet-500" },
  shipped:   { label: "Expédiée",     cls: "bg-cyan-50 text-cyan-700 border-cyan-200",         dot: "bg-cyan-500" },
  delivered: { label: "Livrée",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { label: "Annulée",      cls: "bg-zinc-100 text-zinc-600 border-zinc-200",        dot: "bg-zinc-400" },
  returned:  { label: "Retournée",    cls: "bg-red-50 text-red-700 border-red-200",            dot: "bg-red-500" },
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const confirm = useConfirm();

  const [order, setOrder] = React.useState<ApiOrder | null>(null);
  const [loadState, setLoadState] = React.useState<
    "loading" | "ready" | "notfound" | "error"
  >("loading");
  const [busy, setBusy] = React.useState(false);
  const [zrBusy, setZrBusy] = React.useState<null | "ship" | "label" | "detach" | "sync">(null);

  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const o = await ordersApi.get(id);
      setOrder(o);
      setLoadState("ready");
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) setLoadState("notfound");
      else setLoadState("error");
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Status change handler — confirms destructive transitions
  // (cancellation, return) and pushes the change to the backend with
  // an optimistic update so the dropdown reflects the new value
  // before the round-trip resolves.
  const setOrderStatus = async (next: ApiOrder["status"]) => {
    if (!order || next === order.status) return;
    const meta = STATUS_META[next];
    const destructive = next === "cancelled" || next === "returned";
    if (destructive) {
      const ok = await confirm({
        title: `Passer en « ${meta.label} » ?`,
        message:
          next === "cancelled"
            ? "L'annulation libère le stock et clôt la commande. Cette action est définitive."
            : "Marquer la commande comme retournée libère le stock et déclenche le compteur d'auto-blocage du client.",
        confirmLabel: meta.label,
        variant: "destructive",
      });
      if (!ok) return;
    }
    const prev = order;
    setOrder({ ...order, status: next });
    setBusy(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, next);
      setOrder(updated);
      toast.success(`Statut mis à jour : ${meta.label}`);
      // The sidebar badge + tab title key off pending-count.
      refreshPendingOrders();
    } catch (err) {
      setOrder(prev);
      toast.error(
        err instanceof Error ? err.message : "Erreur de mise à jour",
      );
    } finally {
      setBusy(false);
    }
  };

  const blockCustomer = async () => {
    if (!order) return;
    const ip = order.customerIp;
    const phone = order.customer.phone;
    if (!phone) {
      toast.error("Aucun numéro enregistré pour cette commande.");
      return;
    }
    const ok = await confirm({
      title: "Bloquer ce client ?",
      message:
        `Le numéro ${phone}${ip ? ` et l'adresse IP ${ip}` : ""} seront ajoutés à la liste noire. ` +
        "Toute nouvelle commande depuis ce numéro OU cette IP sera refusée — " +
        "même avec un VPN, le numéro reste la barrière durable. Les commandes existantes ne sont pas affectées.",
      confirmLabel: "Bloquer ce client",
      variant: "destructive",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await customersApi.blockIp(
        phone,
        `Bloqué depuis la commande ${order.orderNumber}`,
      );
      setOrder({ ...order, ipBlocked: true });
      toast.success(
        `Client bloqué — numéro ${phone}${ip ? ` + IP ${ip}` : ""}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec du blocage.",
      );
    } finally {
      setBusy(false);
    }
  };

  // CSV export — one row per line item, with the order's metadata
  // (status, customer, shipping, totals) repeated on each row so the
  // file imports cleanly into Excel / Sheets without needing merged
  // cells or a separate header block.
  const exportCsv = () => {
    if (!order) return;
    const headers = [
      "orderNumber",
      "status",
      "createdAt",
      "customerFirstName",
      "customerLastName",
      "customerPhone",
      "customerEmail",
      "customerIp",
      "wilayaId",
      "wilayaName",
      "commune",
      "address",
      "shippingNotes",
      "subtotal",
      "shippingFee",
      "total",
      "paymentMethod",
      "paymentStatus",
      "lineSku",
      "lineProductName",
      "lineVariant",
      "lineQuantity",
      "lineUnitPrice",
      "lineTotal",
    ];
    const meta: string[] = [
      order.orderNumber,
      order.status,
      order.createdAt ?? "",
      order.customer.firstName,
      order.customer.lastName,
      order.customer.phone,
      order.customer.email ?? "",
      order.customerIp ?? "",
      order.shipping.wilayaId,
      order.shipping.wilayaName,
      order.shipping.commune,
      order.shipping.address ?? "",
      order.shipping.notes ?? "",
      String(order.subtotal),
      String(order.shippingFee),
      String(order.total),
      order.paymentMethod,
      order.paymentStatus,
    ];
    const rows: string[][] = [headers];
    if (order.lines.length === 0) {
      // Edge case: an order with no lines still produces one row so
      // the export is never empty.
      rows.push([...meta, "", "", "", "", "", ""]);
    } else {
      for (const line of order.lines) {
        rows.push([
          ...meta,
          line.sku,
          line.productName,
          line.variant ?? "",
          String(line.quantity),
          String(line.unitPrice),
          String(line.total),
        ]);
      }
    }
    downloadCSV(`bingo-commande-${order.orderNumber}.csv`, toCSV(rows));
    toast.success(`Commande ${order.orderNumber} exportée`);
  };

  // ZR-01 (manual) — push/retry this order to ZR Express, then reload to
  // pick up the parcel id + tracking number the backend just stored.
  const sendToZr = async () => {
    if (!order) return;
    setZrBusy("ship");
    try {
      const res = await zrApi.shipOrder(order.id);
      toast.success(res.message ?? "Commande envoyée à ZR Express.");
      await load();
    } catch (err) {
      toast.error(extractMessage(err, "Échec de l'envoi à ZR Express."));
    } finally {
      setZrBusy(null);
    }
  };

  // ZR-05 — fetch the bordereau URL and open it in a new tab to print.
  const printLabel = async () => {
    if (!order) return;
    setZrBusy("label");
    try {
      const res = await zrApi.getLabel(order.id);
      if (res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.message ?? "Bordereau indisponible.");
      }
    } catch (err) {
      toast.error(extractMessage(err, "Impossible de générer le bordereau."));
    } finally {
      setZrBusy(null);
    }
  };

  // Clear this order's ZR linkage — for when the parcel was deleted/cancelled
  // on ZR's side, leaving the order stuck (status sync 404s, resend blocked).
  const detachZr = async () => {
    if (!order) return;
    const ok = await confirm({
      title: "Détacher de ZR Express ?",
      message:
        "Le lien vers le colis ZR (numéro de suivi, état, erreur) sera effacé. " +
        "À utiliser si le colis a été supprimé chez ZR. Le statut de la commande " +
        "n'est pas modifié, et elle pourra ensuite être renvoyée à ZR.",
      confirmLabel: "Détacher",
    });
    if (!ok) return;
    setZrBusy("detach");
    try {
      const res = await zrApi.detachOrder(order.id);
      toast.success(res.message ?? "Commande détachée de ZR Express.");
      await load();
    } catch (err) {
      toast.error(extractMessage(err, "Échec du détachement."));
    } finally {
      setZrBusy(null);
    }
  };

  // Refresh THIS order's ZR delivery status on demand.
  const syncZr = async () => {
    if (!order) return;
    setZrBusy("sync");
    try {
      const res = await zrApi.syncOrder(order.id);
      toast.success(res.message ?? "Statut ZR synchronisé.");
      await load();
    } catch (err) {
      toast.error(extractMessage(err, "Échec de la synchronisation ZR."));
    } finally {
      setZrBusy(null);
    }
  };

  if (loadState === "loading") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        Chargement…
      </div>
    );
  }
  if (loadState === "notfound") {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <p className="text-sm font-semibold text-zinc-900">
          Commande introuvable
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Aucune commande avec l&apos;identifiant {id}.
        </p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux commandes
        </Link>
      </div>
    );
  }
  if (loadState === "error" || !order) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erreur de chargement. Vérifiez votre session ou réessayez.
      </div>
    );
  }

  const statusMeta = STATUS_META[order.status];
  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const placedAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString("fr-DZ", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "—";

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top bar — minimal back + actions. The full order identity
          lives in the hero card below. On mobile the back link
          collapses to a single word and the buttons go icon-only so
          all three controls fit one row at 320 px. */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex shrink items-center gap-1.5 whitespace-nowrap font-mono text-2xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="size-3.5 shrink-0" />
          <span className="sm:hidden">Commandes</span>
          <span className="hidden sm:inline">Toutes les commandes</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={busy}
            aria-label="Exporter CSV"
            className="h-8 gap-1 px-2 sm:h-9 sm:gap-1.5 sm:px-3"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={busy}
            aria-label="Actualiser"
            className="h-8 gap-1 px-2 sm:h-9 sm:gap-1.5 sm:px-3"
          >
            <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Hero card — order identity, status dropdown, KPI strip */}
      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 sm:px-6 sm:py-6">
          <div className="min-w-0">
            <Mono className="text-2xs text-zinc-500">
              {order.orderNumber}
            </Mono>
            <h1 className="mt-1 truncate font-display text-xl font-bold tracking-tight text-zinc-900 sm:mt-1.5 sm:text-3xl">
              {order.customer.firstName} {order.customer.lastName}
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-2xs text-zinc-500 sm:mt-1.5 sm:text-xs">
              <CalendarClock className="size-3.5" strokeWidth={1.8} />
              Passée le {placedAt}
            </p>
          </div>

          {/* Status dropdown — replaces the "Passer à X" + "Annuler"
              button pair from the previous design. Picks any status
              directly; destructive ones go through a confirm dialog. */}
          <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end sm:gap-1.5">
            <Mono className="text-2xs uppercase tracking-wide text-zinc-500">
              Statut
            </Mono>
            <Select
              value={order.status}
              onValueChange={(v) =>
                void setOrderStatus(v as ApiOrder["status"])
              }
              disabled={busy}
            >
              <SelectTrigger
                size="sm"
                className={cn(
                  "!h-8 w-full gap-2 rounded-full border px-3 text-xs font-medium uppercase tracking-wide sm:!h-9 sm:w-[180px]",
                  statusMeta.cls,
                )}
              >
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", statusMeta.dot)}
                />
                <SelectValue>{statusMeta.label}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
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
          </div>
        </div>

        {/* KPI strip — stacked on mobile so the wilaya / commune line
            isn't truncated, then horizontal at sm+. The divider axis
            flips with the layout. */}
        <div className="grid grid-cols-1 divide-y divide-zinc-100 border-t border-zinc-100 bg-zinc-50/40 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          <KpiCell
            icon={ShoppingBag}
            label="Total"
            value={formatDZD(order.total, "fr")}
            mono
          />
          <KpiCell
            icon={Package}
            label={`Article${itemCount > 1 ? "s" : ""}`}
            value={String(itemCount)}
          />
          <KpiCell
            icon={MapPin}
            label="Livraison"
            value={`${order.shipping.wilayaName} · ${order.shipping.commune}`}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:gap-5">
        {/* Left column — line items + history */}
        <div className="space-y-4 sm:space-y-5">
          {/* Lines */}
          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 sm:px-5 sm:py-3">
              <Mono className="text-zinc-500">Articles</Mono>
              <Small className="text-zinc-500">
                {order.lines.length} ligne{order.lines.length > 1 ? "s" : ""}
              </Small>
            </header>
            <ul className="divide-y divide-zinc-100">
              {order.lines.map((line) => (
                <li
                  key={line.id}
                  className="flex flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4"
                >
                  {/* Image + product info — stay on the same row on
                      mobile so the layout reads as a single product
                      header, then the price line moves below. */}
                  <div className="flex min-w-0 items-center gap-2.5 sm:flex-1 sm:gap-3">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 sm:size-16">
                      {line.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.image}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-zinc-300">
                          <Package className="size-5" strokeWidth={1.6} />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900">
                        {line.productName}
                      </p>
                      <p className="mt-1 font-mono text-2xs uppercase tracking-wide text-zinc-500">
                        {line.sku}
                        {line.variant ? ` · ${line.variant}` : ""}
                      </p>
                    </div>
                  </div>
                  {/* Price — full-width row under the product on
                      mobile (justified left/right for clean reading),
                      compact right-aligned column at sm+. */}
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                    <p className="font-mono text-2xs text-zinc-500">
                      {line.quantity} × {formatDZD(line.unitPrice, "fr")}
                    </p>
                    <p className="font-mono text-sm font-semibold tabular-nums text-zinc-900 sm:mt-0.5">
                      {formatDZD(line.total, "fr")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 text-sm sm:px-5 sm:py-4">
              <dl className="space-y-1.5">
                <div className="flex justify-between text-zinc-600">
                  <dt>Sous-total</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDZD(order.subtotal, "fr")}
                  </dd>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <dt>Livraison</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDZD(order.shippingFee, "fr")}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold text-zinc-900">
                  <dt>Total</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDZD(order.total, "fr")}
                  </dd>
                </div>
              </dl>
            </footer>
          </section>

          {/* Status history */}
          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <header className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 sm:px-5 sm:py-3">
              <History className="size-3.5 text-zinc-500" strokeWidth={1.8} />
              <Mono className="text-zinc-500">Historique</Mono>
            </header>
            {order.statusHistory.length === 0 ? (
              <div className="px-4 py-5 text-center text-xs text-zinc-500 sm:px-5 sm:py-6">
                Aucun événement.
              </div>
            ) : (
              <ol className="divide-y divide-zinc-100">
                {order.statusHistory.map((s) => {
                  const meta = STATUS_META[s.status as ApiOrder["status"]];
                  return (
                    <li
                      key={s.id}
                      className="flex items-baseline gap-2.5 px-4 py-2.5 sm:gap-3 sm:px-5 sm:py-3"
                    >
                      <span
                        className={cn(
                          "mt-0.5 size-2 shrink-0 rounded-full",
                          meta?.dot ?? "bg-zinc-300",
                        )}
                      />
                      {/* Mobile: date drops to a row below the label so
                          neither the label nor the note get crushed by
                          the wide timestamp. Desktop: stays side-by-side. */}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-zinc-900">
                            {meta?.label ?? s.status}
                            {s.by ? (
                              <span className="ms-2 font-normal text-zinc-500">
                                · par {s.by}
                              </span>
                            ) : null}
                          </p>
                          {s.note ? (
                            <p className="mt-0.5 text-2xs text-zinc-500">
                              {s.note}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 whitespace-nowrap font-mono text-2xs text-zinc-400">
                          {s.at
                            ? new Date(s.at).toLocaleString("fr-DZ", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : ""}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Right column — customer + shipping + IP */}
        <div className="space-y-4 sm:space-y-5">
          {/* Customer */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
            <header className="flex items-center gap-2">
              <User className="size-3.5 text-zinc-500" strokeWidth={1.8} />
              <Mono className="text-zinc-500">Client</Mono>
            </header>
            <p className="mt-3 text-sm font-semibold text-zinc-900">
              {order.customer.firstName} {order.customer.lastName}
            </p>
            <a
              href={`tel:${order.customer.phone}`}
              className="mt-1 block font-mono text-xs text-zinc-700 hover:text-blue-700"
              dir="ltr"
            >
              {order.customer.phone}
            </a>
            {order.customer.email ? (
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {order.customer.email}
              </p>
            ) : null}

            <div className="mt-4 border-t border-zinc-100 pt-4">
              <div className="flex items-center justify-between gap-2">
                <Mono className="text-2xs text-zinc-500">Adresse IP</Mono>
                {order.ipBlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-red-700">
                    <span className="size-1.5 rounded-full bg-red-500" />
                    Bloquée
                  </span>
                ) : null}
              </div>
              {order.customerIp ? (
                <>
                  <p
                    className="mt-1.5 font-mono text-xs text-zinc-700"
                    dir="ltr"
                  >
                    {order.customerIp}
                  </p>
                  {order.ipBlocked ? (
                    <Small className="mt-2 block text-zinc-500">
                      Sur la liste noire. Gérez le déblocage depuis « Liste noire ».
                    </Small>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => void blockCustomer()}
                      className="mt-3 w-full border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Ban className="size-3.5" />
                      Bloquer ce client
                    </Button>
                  )}
                </>
              ) : (
                <p className="mt-1.5 text-xs italic text-zinc-400">
                  Non enregistrée
                </p>
              )}
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
            <header className="flex items-center gap-2">
              <MapPin className="size-3.5 text-zinc-500" strokeWidth={1.8} />
              <Mono className="text-zinc-500">Livraison</Mono>
            </header>
            <p className="mt-3 text-sm font-medium text-zinc-900">
              {order.shipping.wilayaName}
            </p>
            <p className="text-xs text-zinc-600">{order.shipping.commune}</p>
            {order.shipping.address ? (
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {order.shipping.address}
              </p>
            ) : null}
            {order.shipping.notes ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Mono className="block text-2xs text-amber-700">Note client</Mono>
                <span className="mt-0.5 block leading-relaxed">
                  {order.shipping.notes}
                </span>
              </div>
            ) : null}
          </section>

          {/* ZR Express */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
            <header className="flex items-center gap-2">
              <Truck className="size-3.5 text-zinc-500" strokeWidth={1.8} />
              <Mono className="text-zinc-500">ZR Express</Mono>
            </header>

            {order.zr?.parcelId ? (
              <div className="mt-3 space-y-2.5">
                <div>
                  <Mono className="text-2xs text-zinc-500">Numéro de suivi</Mono>
                  <p className="mt-0.5 font-mono text-sm text-zinc-900" dir="ltr">
                    {order.trackingNumber ?? "—"}
                  </p>
                </div>
                {order.zr.state ? (
                  <div>
                    <Mono className="text-2xs text-zinc-500">État ZR</Mono>
                    <p className="mt-0.5 text-xs capitalize text-zinc-700">
                      {order.zr.state.replace(/_/g, " ")}
                    </p>
                  </div>
                ) : null}
                {order.zr.syncedAt ? (
                  <Small className="block text-zinc-400">
                    Synchronisé le{" "}
                    {new Date(order.zr.syncedAt).toLocaleString("fr-DZ", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </Small>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void syncZr()}
                  disabled={zrBusy !== null}
                  className="mt-1 w-full"
                >
                  <RefreshCw className={cn("size-3.5", zrBusy === "sync" && "animate-spin")} />
                  {zrBusy === "sync" ? "Synchronisation…" : "Rafraîchir le statut ZR"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void printLabel()}
                  disabled={zrBusy !== null || !order.trackingNumber}
                  className="mt-1 w-full"
                >
                  <Printer className="size-3.5" />
                  {zrBusy === "label" ? "Génération…" : "Imprimer le bordereau"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void detachZr()}
                  disabled={zrBusy !== null}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <Unlink className="size-3.5" />
                  {zrBusy === "detach" ? "Détachement…" : "Détacher de ZR Express"}
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-zinc-500">
                  Cette commande n&apos;a pas encore été envoyée à ZR Express.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void sendToZr()}
                  disabled={zrBusy !== null}
                  className="w-full"
                >
                  <Send className="size-3.5" />
                  {zrBusy === "ship" ? "Envoi…" : "Envoyer à ZR Express"}
                </Button>
              </div>
            )}

            {order.zr?.lastError ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <Mono className="block text-2xs text-red-600">
                  Dernière erreur
                </Mono>
                <span className="mt-0.5 block leading-relaxed">
                  {order.zr.lastError}
                </span>
              </div>
            ) : null}
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
            <header className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-zinc-500" strokeWidth={1.8} />
              <Mono className="text-zinc-500">Paiement</Mono>
            </header>
            <p className="mt-3 text-sm font-medium uppercase text-zinc-900">
              {order.paymentMethod === "cod"
                ? "Paiement à la livraison"
                : order.paymentMethod}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Statut : {order.paymentStatus}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function KpiCell({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-zinc-500 ring-1 ring-zinc-200 sm:size-8">
        <Icon className="size-3.5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <Mono className="text-2xs uppercase tracking-wide text-zinc-500">
          {label}
        </Mono>
        <p
          className={cn(
            // No truncate — cells span the full row on mobile, so a
            // long wilaya · commune string wraps onto two lines
            // instead of disappearing behind an ellipsis.
            "mt-0.5 text-xs font-semibold text-zinc-900 sm:text-sm",
            mono && "font-mono tabular-nums",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
