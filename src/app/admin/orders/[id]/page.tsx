"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  PhoneCall,
  PhoneMissed,
  RefreshCw,
  ShieldX,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Mono, Small } from "@/components/ui/typography";
import { HttpError } from "@/lib/api/http";
import {
  ordersApi,
  type ApiOrder,
  type ApiOrderCallAttempt,
} from "@/lib/api/orders";
import { formatDZD } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmée", cls: "bg-blue-50 text-blue-700" },
  preparing: { label: "Préparation", cls: "bg-violet-50 text-violet-700" },
  shipped: { label: "Expédiée", cls: "bg-cyan-50 text-cyan-700" },
  delivered: { label: "Livrée", cls: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Annulée", cls: "bg-zinc-100 text-zinc-600" },
  returned: { label: "Retournée", cls: "bg-red-50 text-red-700" },
};

const STATUS_FLOW: ApiOrder["status"][] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

const CALL_OUTCOMES: Array<{
  value: ApiOrderCallAttempt["outcome"];
  label: string;
  icon: typeof PhoneCall;
  cls: string;
}> = [
  { value: "answered", label: "Confirmé", icon: PhoneCall, cls: "border-emerald-300 text-emerald-700 hover:bg-emerald-50" },
  { value: "no_answer", label: "Pas de réponse", icon: PhoneMissed, cls: "border-amber-300 text-amber-700 hover:bg-amber-50" },
  { value: "wrong_number", label: "Faux numéro", icon: Phone, cls: "border-zinc-300 text-zinc-700 hover:bg-zinc-100" },
  { value: "declined", label: "Refus client", icon: ShieldX, cls: "border-red-300 text-red-700 hover:bg-red-50" },
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const confirm = useConfirm();

  const [order, setOrder] = React.useState<ApiOrder | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "notfound" | "error">(
    "loading",
  );
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const o = await ordersApi.get(id);
      setOrder(o);
      setStatus("ready");
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) setStatus("notfound");
      else setStatus("error");
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const setOrderStatus = async (next: ApiOrder["status"]) => {
    if (!order) return;
    const meta = STATUS_META[next];
    const ok = await confirm({
      title: `Passer en « ${meta?.label ?? next} » ?`,
      message:
        next === "cancelled"
          ? "L'annulation est définitive. Le client n'est pas notifié automatiquement."
          : "La commande passera au statut suivant et l'historique sera mis à jour.",
      confirmLabel: meta?.label ?? next,
      variant: next === "cancelled" ? "destructive" : "default",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, next);
      setOrder(updated);
      toast.success(`Statut mis à jour : ${meta?.label ?? next}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur de mise à jour",
      );
    } finally {
      setBusy(false);
    }
  };

  const logCall = async (outcome: ApiOrderCallAttempt["outcome"]) => {
    if (!order) return;
    setBusy(true);
    try {
      const updated = await ordersApi.logCall(order.id, outcome);
      setOrder(updated);
      toast.success("Tentative d'appel enregistrée");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
        Chargement…
      </div>
    );
  }
  if (status === "notfound") {
    return (
      <div className="space-y-4">
        <AdminPageHeader
          eyebrow="Commerce"
          title="Commande introuvable"
          subtitle={`Aucune commande avec l'identifiant ${id}.`}
        />
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Retour aux commandes
        </Link>
      </div>
    );
  }
  if (status === "error" || !order) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erreur de chargement. Vérifiez votre session ou réessayez.
      </div>
    );
  }

  const statusMeta = STATUS_META[order.status] ?? {
    label: order.status,
    cls: "bg-zinc-100 text-zinc-700",
  };

  // Next status in the flow — used for the primary action button.
  const flowIndex = STATUS_FLOW.indexOf(order.status);
  const nextStatus =
    flowIndex >= 0 && flowIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[flowIndex + 1]
      : null;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow={`Commande · ${order.orderNumber}`}
        title={`${order.customer.firstName} ${order.customer.lastName}`}
        subtitle={
          <span className="inline-flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium uppercase tracking-wide",
                statusMeta.cls,
              )}
            >
              {statusMeta.label}
            </span>
            <span className="text-zinc-500">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString("fr-DZ", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })
                : ""}
            </span>
          </span>
        }
        actions={
          <>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              <ArrowLeft className="me-1 inline size-3.5" />
              Retour
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={busy}
            >
              <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
              Actualiser
            </Button>
          </>
        }
      />

      {/* Status actions */}
      <section className="rounded-md border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Mono className="me-2 text-zinc-500">Statut</Mono>
          {nextStatus ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => void setOrderStatus(nextStatus)}
            >
              <Truck className="size-3.5" /> Passer à «{" "}
              {STATUS_META[nextStatus]?.label ?? nextStatus} »
            </Button>
          ) : null}
          {order.status !== "cancelled" && order.status !== "delivered" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void setOrderStatus("cancelled")}
            >
              <ShieldX className="size-3.5" /> Annuler
            </Button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Lines */}
          <section className="rounded-md border border-zinc-200 bg-white">
            <header className="border-b border-zinc-100 px-5 py-3">
              <Mono className="text-zinc-500">Articles</Mono>
            </header>
            <ul className="divide-y divide-zinc-100">
              {order.lines.map((line) => (
                <li
                  key={line.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                    {line.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.image}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-zinc-900">
                      {line.productName}
                    </p>
                    <p className="font-mono text-2xs text-zinc-500">
                      {line.sku}
                      {line.variant ? ` · ${line.variant}` : ""}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-xs text-zinc-600">
                    {line.quantity} × {formatDZD(line.unitPrice, "fr")}
                  </p>
                  <p className="whitespace-nowrap font-mono text-sm font-semibold tabular-nums text-zinc-900">
                    {formatDZD(line.total, "fr")}
                  </p>
                </li>
              ))}
            </ul>
            <footer className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 text-sm">
              <dl className="space-y-1.5">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Sous-total</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDZD(order.subtotal, "fr")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Livraison</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDZD(order.shippingFee, "fr")}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1.5 font-semibold">
                  <dt>Total</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDZD(order.total, "fr")}
                  </dd>
                </div>
              </dl>
            </footer>
          </section>

          {/* Status history */}
          <section className="rounded-md border border-zinc-200 bg-white">
            <header className="border-b border-zinc-100 px-5 py-3">
              <Mono className="text-zinc-500">Historique</Mono>
            </header>
            <ul className="divide-y divide-zinc-100">
              {order.statusHistory.length === 0 ? (
                <li className="px-5 py-3 text-xs text-zinc-500">
                  Aucun événement.
                </li>
              ) : (
                order.statusHistory.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-medium text-zinc-900">
                        {STATUS_META[s.status]?.label ?? s.status}
                      </span>
                      {s.by ? (
                        <span className="ms-2 text-zinc-500">par {s.by}</span>
                      ) : null}
                      {s.note ? (
                        <span className="ms-2 text-zinc-500">— {s.note}</span>
                      ) : null}
                    </div>
                    <span className="font-mono text-2xs text-zinc-400">
                      {s.at
                        ? new Date(s.at).toLocaleString("fr-DZ", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : ""}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Customer */}
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <Mono className="text-zinc-500">Client</Mono>
            <p className="mt-2 text-sm font-semibold text-zinc-900">
              {order.customer.firstName} {order.customer.lastName}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-700" dir="ltr">
              <a
                href={`tel:${order.customer.phone}`}
                className="hover:text-blue-700"
              >
                {order.customer.phone}
              </a>
            </p>
            {order.customer.email ? (
              <p className="mt-0.5 text-xs text-zinc-600">
                {order.customer.email}
              </p>
            ) : null}
          </section>

          {/* Shipping */}
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <Mono className="text-zinc-500">Livraison</Mono>
            <p className="mt-2 text-sm text-zinc-900">
              {order.shipping.wilayaName}
            </p>
            <p className="text-xs text-zinc-600">{order.shipping.commune}</p>
            {order.shipping.address ? (
              <p className="mt-1 text-xs text-zinc-500">
                {order.shipping.address}
              </p>
            ) : null}
            {order.shipping.notes ? (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {order.shipping.notes}
              </p>
            ) : null}
          </section>

          {/* Call attempts */}
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <Mono className="text-zinc-500">Appels de confirmation</Mono>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {CALL_OUTCOMES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  disabled={busy}
                  onClick={() => void logCall(c.value)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                    c.cls,
                  )}
                >
                  <c.icon className="size-3.5" />
                  {c.label}
                </button>
              ))}
            </div>
            {order.callAttempts.length === 0 ? (
              <Small className="mt-3 block text-zinc-500">
                Aucune tentative enregistrée.
              </Small>
            ) : (
              <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-xs">
                {order.callAttempts.map((c) => (
                  <li key={c.id} className="flex items-baseline justify-between">
                    <span className="text-zinc-700">
                      {CALL_OUTCOMES.find((o) => o.value === c.outcome)
                        ?.label ?? c.outcome}
                      {c.by ? (
                        <span className="ms-2 text-zinc-500">— {c.by}</span>
                      ) : null}
                    </span>
                    <span className="font-mono text-2xs text-zinc-400">
                      {c.at
                        ? new Date(c.at).toLocaleString("fr-DZ", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
