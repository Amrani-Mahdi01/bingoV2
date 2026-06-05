"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { useLocalizedRouter } from "@/components/ui/locale-link";
import {
  ChevronDown,
  ChevronRight,
  Package,
  ShoppingBag,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { HttpError } from "@/lib/api/http";
import { ordersApi, type ApiOrder } from "@/lib/api/orders";
import { formatDZD } from "@/lib/format";
import { cn } from "@/lib/utils";

// Status palette + bilingual labels — inlined here instead of pushing
// 14 new i18n keys (7 statuses × 2 langs). Mirrors the admin orders
// page colours so the customer and merchant see the same vocabulary.
const STATUS_META: Record<
  ApiOrder["status"],
  { fr: string; ar: string; cls: string; dot: string }
> = {
  pending:   { fr: "En attente",  ar: "قيد الانتظار", cls: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-500" },
  confirmed: { fr: "Confirmée",   ar: "مؤكدة",        cls: "bg-blue-50 text-blue-700 border-blue-200",        dot: "bg-blue-500" },
  preparing: { fr: "Préparation", ar: "قيد التحضير",  cls: "bg-violet-50 text-violet-700 border-violet-200",  dot: "bg-violet-500" },
  shipped:   { fr: "Expédiée",    ar: "تم الشحن",     cls: "bg-cyan-50 text-cyan-700 border-cyan-200",        dot: "bg-cyan-500" },
  delivered: { fr: "Livrée",      ar: "تم التسليم",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { fr: "Annulée",     ar: "ملغاة",        cls: "bg-zinc-100 text-zinc-700 border-zinc-200",       dot: "bg-zinc-400" },
  returned:  { fr: "Retournée",   ar: "مرتجعة",       cls: "bg-red-50 text-red-700 border-red-200",           dot: "bg-red-500" },
};

export default function MesCommandesPage() {
  const router = useLocalizedRouter();
  const { customer, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();

  const [orders, setOrders] = React.useState<ApiOrder[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  // Wait for the auth resolve to finish before deciding what to do.
  // Without this, we'd redirect a logged-in user on the very first
  // render (when customer is still null, before /auth/me resolves).
  React.useEffect(() => {
    if (authLoading) return;
    if (!customer) {
      router.replace("/login?next=/mes-commandes");
    }
  }, [authLoading, customer, router]);

  React.useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    setError(null);
    ordersApi
      .listMine()
      .then((data) => {
        if (cancelled) return;
        setOrders(data);
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 means the customer-side session expired underneath us
        // (e.g. token revoked, server restarted). Bounce to /login
        // instead of showing a "load failed" message — the user can
        // sign back in and land right here.
        if (err instanceof HttpError && err.status === 401) {
          router.replace("/login?next=/mes-commandes");
          return;
        }
        setError(t("mesCommandes.loadError"));
      });
    return () => {
      cancelled = true;
    };
  }, [customer, router, t]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Render nothing until we know who the user is — the redirect effect
  // above will send guests to /login, and showing the page chrome
  // first would flash for a frame before navigation.
  if (authLoading || !customer) {
    return (
      <main className="flex flex-1 items-center justify-center bg-cream py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-wood-600">
          {t("mesCommandes.loading")}
        </p>
      </main>
    );
  }

  const orderCount = orders?.length ?? 0;

  return (
    <main className="flex flex-1 flex-col bg-cream py-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl px-6 md:px-10">
        {/* Breadcrumb */}
        <nav
          aria-label={t("breadcrumb.aria")}
          className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700"
        >
          <Link href="/" className="transition-colors hover:text-tangerine-700">
            {t("breadcrumb.home")}
          </Link>
          <ChevronRight
            className="size-3 text-wood-500 rtl:rotate-180"
            strokeWidth={2.2}
          />
          <span className="text-forest-900">{t("mesCommandes.title")}</span>
        </nav>

        {/* Header */}
        <header className="mt-6 max-w-2xl md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            {t("mesCommandes.eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-[40px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 rtl:pb-2 rtl:leading-[1.25] sm:text-[56px] md:text-[64px]">
            {t("mesCommandes.title")}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wood-700 sm:text-base">
            {orders === null
              ? t("mesCommandes.loading")
              : orderCount === 0
                ? t("mesCommandes.heroEmpty")
                : orderCount === 1
                  ? t("mesCommandes.count.one", { n: 1 })
                  : t("mesCommandes.count.many", { n: orderCount })}
          </p>
        </header>

        {/* Body */}
        <div className="mt-10 md:mt-12">
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-mono text-[12px] text-red-700"
            >
              {error}
            </p>
          ) : orders === null ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wood-500">
              {t("mesCommandes.loading")}
            </p>
          ) : orders.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-4">
              {orders.map((o) => (
                <li key={o.id}>
                  <OrderCard
                    order={o}
                    open={expanded.has(o.id)}
                    onToggle={() => toggleExpanded(o.id)}
                    lang={lang}
                    t={t}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

/* ───────────────────────────────────────────────────────────────── */
/* One order card with an expand-to-see-items section.               */
/* ───────────────────────────────────────────────────────────────── */

function OrderCard({
  order,
  open,
  onToggle,
  lang,
  t,
}: {
  order: ApiOrder;
  open: boolean;
  onToggle: () => void;
  lang: "fr" | "ar";
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const meta = STATUS_META[order.status];
  const statusLabel = meta[lang];
  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const placedAt = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString(
        lang === "ar" ? "ar-DZ" : "fr-DZ",
        { day: "2-digit", month: "long", year: "numeric" },
      )
    : "—";

  return (
    <article className="overflow-hidden rounded-xl border border-wood-300/60 bg-cream-deep/20 shadow-[0_8px_24px_-18px_rgba(31,58,30,0.18)]">
      {/* Top row — always visible */}
      <header className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-forest-900 text-cream">
            <Package className="size-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] uppercase tracking-[0.16em] text-wood-600">
              {order.orderNumber}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-wood-700">
              {t("mesCommandes.placedAt")} {placedAt}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em]",
              meta.cls,
            )}
          >
            <span className={cn("size-1.5 rounded-full", meta.dot)} />
            {statusLabel}
          </span>
          <span className="whitespace-nowrap font-mono text-[15px] font-semibold tabular-nums text-forest-900">
            {formatDZD(order.total, lang)}
          </span>
        </div>
      </header>

      {/* Expand control */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 border-t border-wood-300/40 px-4 py-2.5 text-start text-[12.5px] font-medium text-forest-900 transition-colors hover:bg-cream-deep/40 sm:px-5"
      >
        <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.14em] text-wood-700">
          {t("mesCommandes.items")} · {itemCount}
        </span>
        <span className="inline-flex items-center gap-1.5 text-tangerine-700">
          {open ? t("mesCommandes.hideDetails") : t("mesCommandes.details")}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              open && "rotate-180",
            )}
            strokeWidth={2.2}
          />
        </span>
      </button>

      {/* Expanded body */}
      {open ? (
        <div className="border-t border-wood-300/40 bg-cream/60 px-4 py-4 sm:px-5">
          <ul className="divide-y divide-wood-300/40">
            {order.lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 py-3 sm:gap-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-wood-300/50 bg-wood-100">
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.image}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-forest-900">
                    {line.productName}
                  </p>
                  <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-wood-600">
                    {line.sku}
                    {line.variant ? ` · ${line.variant}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="font-mono text-[12px] text-wood-700">
                    {line.quantity} × {formatDZD(line.unitPrice, lang)}
                  </p>
                  <p className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums text-forest-900">
                    {formatDZD(line.total, lang)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Totals summary */}
          <dl className="mt-4 space-y-1 border-t border-wood-300/40 pt-3 text-[13px]">
            <div className="flex justify-between text-wood-700">
              <dt>{t("mesCommandes.items")}</dt>
              <dd className="font-mono tabular-nums">
                {formatDZD(order.subtotal, lang)}
              </dd>
            </div>
            <div className="flex justify-between text-wood-700">
              <dt>{t("mesCommandes.shipping")}</dt>
              <dd className="font-mono tabular-nums">
                {formatDZD(order.shippingFee, lang)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-wood-300/40 pt-1.5 text-[14px] font-semibold text-forest-900">
              <dt>{t("mesCommandes.total")}</dt>
              <dd className="font-mono tabular-nums">
                {formatDZD(order.total, lang)}
              </dd>
            </div>
          </dl>

          {/* Shipping recap */}
          <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-wood-600">
            {order.shipping.wilayaName} · {order.shipping.commune}
          </p>
        </div>
      ) : null}
    </article>
  );
}

/* ───────────────────────────────────────────────────────────────── */
/* Empty state — shown when the customer has no orders yet.          */
/* ───────────────────────────────────────────────────────────────── */

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-dashed border-wood-300 bg-cream-deep/30 px-6 py-12 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest-900 text-cream">
        <ShoppingBag className="size-7" strokeWidth={1.8} />
      </span>
      <h2 className="mt-5 font-display text-xl font-bold text-forest-900 sm:text-2xl">
        {t("mesCommandes.empty.title")}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-wood-700">
        {t("mesCommandes.empty.text")}
      </p>
      <Link
        href="/catalogue"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-5 py-2.5 font-display text-[12.5px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-tangerine-600"
      >
        {t("mesCommandes.empty.cta")}
      </Link>
    </div>
  );
}
