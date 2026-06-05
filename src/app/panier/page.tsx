"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { productHref } from "@/lib/catalogue";
import { lineId, useCart, type CartItem } from "@/lib/cart";
import { useFormatPrice, useLanguage, useProductName } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * /panier — full-page view of the cart. Mirrors the structure of the
 * header cart drawer (same CartLine layout, same variant chips, same
 * lineId-keyed mutations) but laid out two-column on desktop with a
 * sticky summary card on the side. Empty state nudges the customer
 * back to /catalogue. Checkout CTA links to /commander.
 */
export default function CartPage() {
  const { t, lang } = useLanguage();
  const { items, subtotal, itemCount, updateQty, removeItem, clear } = useCart();
  const formatPrice = useFormatPrice();
  const isRtl = lang === "ar";
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const itemsLabel =
    itemCount === 1
      ? t("cart.itemsCount.one")
      : t("cart.itemsCount.many", { n: itemCount });

  return (
    <main className="bg-cream pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        {/* Back link + title */}
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-wood-600 hover:text-forest-900"
        >
          <BackArrow className="size-3.5" strokeWidth={2} />
          {t("cart.continue")}
        </Link>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-forest-900 sm:text-4xl">
              {t("cart.pageTitle")}
            </h1>
            {items.length > 0 ? (
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600">
                {itemsLabel}
              </p>
            ) : null}
          </div>

          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => clear()}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600 underline-offset-4 hover:text-tangerine-700 hover:underline"
            >
              {lang === "ar" ? "تفريغ السلة" : "Vider le panier"}
            </button>
          ) : null}
        </header>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* ── Lines ────────────────────────────────────────────── */}
            <ul className="overflow-hidden rounded-2xl border border-wood-300/50 bg-cream-deep/20 divide-y divide-wood-300/40">
              {items.map((item) => {
                const key = lineId(item.product.slug, item.variant?.id);
                return (
                  <CartRow
                    key={key}
                    item={item}
                    onIncrement={() => updateQty(key, 1)}
                    onDecrement={() => updateQty(key, -1)}
                    onRemove={() => removeItem(key)}
                  />
                );
              })}
            </ul>

            {/* ── Summary ──────────────────────────────────────────── */}
            <aside className="self-start lg:sticky lg:top-24">
              <div className="rounded-2xl border border-wood-300/60 bg-cream p-5 shadow-[0_8px_22px_-10px_rgba(31,58,30,0.18)]">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-wood-600">
                  {lang === "ar" ? "الملخص" : "Récapitulatif"}
                </h2>
                <dl className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600">
                      {t("cart.subtotal")}
                    </dt>
                    <dd className="font-display text-[20px] font-bold tracking-[-0.01em] text-forest-900">
                      {formatPrice(subtotal)}
                    </dd>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wood-500">
                    {lang === "ar"
                      ? "تُحتسب الشحن في صفحة الطلب"
                      : "Livraison calculée à la commande"}
                  </p>
                </dl>

                <Link
                  href="/commander"
                  className={cn(
                    "mt-5 flex w-full items-center justify-center rounded-full bg-forest-900 px-4 py-3 text-center",
                    "font-display text-[13px] font-medium uppercase tracking-[0.14em] text-cream",
                    "transition-colors hover:bg-forest-950",
                  )}
                >
                  {t("cart.checkout")}
                </Link>
                <Link
                  href="/catalogue"
                  className="mt-2 flex w-full items-center justify-center rounded-full border border-wood-300/80 bg-cream px-4 py-3 text-center font-display text-[12px] font-medium uppercase tracking-[0.14em] text-forest-900 transition-colors hover:border-forest-900 hover:bg-cream-deep"
                >
                  {t("cart.continue")}
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

/* ───────────────────────── Empty state ────────────────────────── */

function EmptyCart() {
  const { t, lang } = useLanguage();
  return (
    <div className="mt-12 grid place-items-center rounded-3xl border border-dashed border-wood-300/70 bg-cream-deep/20 px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-cream ring-1 ring-wood-300/50 shadow-[0_8px_22px_-6px_rgba(31,58,30,0.25)]">
        <ShoppingBag className="size-6 text-wood-600" strokeWidth={1.8} />
      </span>
      <p className="mt-4 font-display text-xl font-semibold text-forest-900">
        {t("cart.empty")}
      </p>
      <p className="mt-2 max-w-sm font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600">
        {t("cart.emptyHint")}
      </p>
      <Link
        href="/catalogue"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest-900 px-5 py-2.5 font-display text-[12px] font-medium uppercase tracking-[0.14em] text-cream transition-colors hover:bg-forest-950"
      >
        {t("cart.discoverCta")}
        {lang === "ar" ? (
          <ArrowLeft className="size-3.5" strokeWidth={2} />
        ) : (
          <ArrowRight className="size-3.5" strokeWidth={2} />
        )}
      </Link>
    </div>
  );
}

/* ───────────────────────── Cart row ───────────────────────────── */

function CartRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const { t, lang } = useLanguage();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  const { product, qty, variant } = item;
  const unit = product.price + (variant?.priceDelta ?? 0);
  const lineTotal = unit * qty;
  const displayName = productName(product);
  const colorLabel = variant
    ? lang === "ar" && variant.colorNameAr
      ? variant.colorNameAr
      : variant.colorNameFr
    : null;

  return (
    <li className="flex gap-4 p-4 sm:gap-5 sm:p-5">
      {/* Thumb */}
      <Link
        href={productHref(product.slug)}
        className="shrink-0"
        aria-label={displayName}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          aria-hidden
          loading="lazy"
          className="size-20 rounded-lg object-cover ring-1 ring-wood-300/60 sm:size-24"
        />
      </Link>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={productHref(product.slug)}
          className="truncate font-display text-[15px] font-semibold leading-tight text-forest-900 hover:text-tangerine-700 rtl:mb-1 rtl:leading-[1.4]"
        >
          {displayName}
        </Link>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-wood-600">
          {product.brand}
        </span>

        {/* Variant chips — color swatch + name, size pill */}
        {variant ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {colorLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-cream-deep px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wood-700">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full border border-wood-300/60"
                  style={{ backgroundColor: variant.colorHex ?? "#e5e5e5" }}
                />
                {colorLabel}
              </span>
            ) : null}
            {variant.sizeLabel ? (
              <span className="inline-flex items-center rounded-md border border-wood-300/70 bg-cream px-2 py-0.5 font-display text-[11px] font-semibold tracking-tight text-forest-900">
                {variant.sizeLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Bottom row: qty stepper + unit price (mobile shows trash) */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-wood-300/70 bg-cream">
            <button
              type="button"
              onClick={onDecrement}
              aria-label={t("cart.decrease")}
              className="grid size-7 place-items-center rounded-full text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900"
            >
              <Minus className="size-3.5" strokeWidth={2.2} />
            </button>
            <span
              aria-label={t("cart.qty")}
              className="min-w-6 px-1 text-center font-mono text-[12px] font-medium text-forest-900"
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              aria-label={t("cart.increase")}
              className="grid size-7 place-items-center rounded-full text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900"
            >
              <Plus className="size-3.5" strokeWidth={2.2} />
            </button>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-wood-600">
            {formatPrice(unit)} × {qty}
          </span>
        </div>
      </div>

      {/* Trail: line total + remove (desktop) / stacked (mobile) */}
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <span className="font-display text-[15px] font-bold text-forest-900 sm:text-[17px]">
          {formatPrice(lineTotal)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("cart.remove")}
          className="grid size-8 place-items-center rounded-full text-wood-500 transition-colors hover:bg-wood-100 hover:text-tangerine-700"
        >
          <Trash2 className="size-4" strokeWidth={1.8} />
        </button>
      </div>
    </li>
  );
}
