"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";

import {
  MIN_ORDER_DZD,
  QuickOrderDialog,
  type QuickOrderItem,
} from "@/components/product/quick-order-dialog";
import { lineId, useCart } from "@/lib/cart";
import { useFormatPrice, useLanguage, useProductName } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Cart review page — products on the left, pricing + checkout on the right.
 * The checkout form itself lives in QuickOrderDialog (same popup as the
 * product page); the "Commander" button opens it pre-loaded with the cart.
 */
export default function CheckoutPage() {
  const { t, lang } = useLanguage();
  const { items, subtotal, itemCount, clear, removeItem } = useCart();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  const [orderOpen, setOrderOpen] = React.useState(false);

  // Project the cart into the dialog's item shape.
  const orderItems: QuickOrderItem[] = items.map(({ product, qty, variant }) => ({
    productSlug: product.slug,
    variantLabel: variant
      ? [variant.colorNameFr, variant.sizeLabel].filter(Boolean).join(" · ") || null
      : null,
    variantId: variant?.id != null ? Number(variant.id) : null,
    quantity: qty,
    name: productName(product),
    image: product.image,
    unitPrice: product.price + (variant?.priceDelta ?? 0),
  }));

  return (
    <main className="flex flex-1 flex-col bg-cream py-12 pb-24 md:py-16 lg:pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-700 transition-colors hover:text-tangerine-700"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" strokeWidth={2.2} />
          {t("checkout.back")}
        </Link>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-[-0.02em] text-forest-900 rtl:pb-1 rtl:leading-[1.25] sm:text-4xl md:text-[2.5rem]">
          {t("checkout.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wood-700 sm:text-base">
          {itemCount > 0
            ? t("checkout.subtitle", { n: itemCount })
            : t("checkout.subtitleEmpty")}
        </p>

        {items.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-wood-300/50 bg-cream-deep/30 p-6">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <ShoppingBag className="size-8 text-wood-400" strokeWidth={1.5} />
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600">
                {t("checkout.summary.empty")}
              </p>
              <Link
                href="/catalogue"
                className="mt-2 font-display text-sm font-semibold text-tangerine-700 underline-offset-4 hover:underline"
              >
                {t("checkout.summary.browse")}
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
            {/* ─── Left: products in the cart ─────────────────────── */}
            <section className="min-w-0 rounded-2xl border border-wood-300/50 bg-cream-deep/30 p-4 sm:p-6">
              <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-forest-900 sm:text-xl">
                {t("checkout.summary.title")}
              </h2>
              <ul className="mt-5 divide-y divide-wood-300/40">
                {items.map(({ product, qty, variant }) => {
                  const unit = product.price + (variant?.priceDelta ?? 0);
                  const colorLabel = variant
                    ? lang === "ar" && variant.colorNameAr
                      ? variant.colorNameAr
                      : variant.colorNameFr
                    : null;
                  return (
                    <li
                      key={`${product.slug}::${variant?.id ?? ""}`}
                      className="flex min-w-0 gap-2.5 py-3 first:pt-0 last:pb-0 sm:gap-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="size-12 shrink-0 rounded-md object-cover ring-1 ring-wood-300/60 sm:size-14"
                      />
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex min-w-0 flex-1 flex-col leading-tight">
                          <p className="font-display text-[12px] font-semibold leading-snug text-forest-900 sm:text-[13px]">
                            {productName(product)}
                          </p>
                          <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-wood-600 sm:text-[10px] sm:tracking-[0.16em]">
                            {product.brand}
                          </p>

                          {variant ? (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {colorLabel ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-cream-deep px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-wood-700">
                                  <span
                                    aria-hidden
                                    className="size-2.5 rounded-full border border-wood-300/60"
                                    style={{ backgroundColor: variant.colorHex ?? "#e5e5e5" }}
                                  />
                                  {colorLabel}
                                </span>
                              ) : null}
                              {variant.sizeLabel ? (
                                <span className="inline-flex items-center rounded-md border border-wood-300/70 bg-cream px-1.5 py-0.5 font-display text-[10px] font-semibold tracking-tight text-forest-900">
                                  {variant.sizeLabel}
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-wood-700 sm:text-[10.5px]">
                            {t("checkout.summary.qty", { n: qty })}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className="whitespace-nowrap font-display text-[13px] font-semibold text-forest-900">
                            {formatPrice(unit * qty)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(lineId(product.slug, variant?.id))}
                            aria-label={
                              lang === "ar"
                                ? `حذف ${productName(product)}`
                                : `Retirer ${productName(product)}`
                            }
                            title={lang === "ar" ? "حذف من السلة" : "Retirer du panier"}
                            className={cn(
                              "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                              "text-wood-500 transition-colors",
                              "hover:bg-red-50 hover:text-red-600",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
                            )}
                          >
                            <Trash2 className="size-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* ─── Right: pricing + checkout (sticky on desktop) ──── */}
            <aside className="self-start rounded-2xl border border-wood-300/50 bg-cream-deep/30 p-4 sm:p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-forest-900 sm:text-xl">
                {lang === "ar" ? "الملخّص" : "Récapitulatif"}
              </h2>

              <dl className="mt-5 flex items-baseline justify-between border-b border-wood-300/40 pb-4 font-display text-base font-bold tracking-[-0.01em] text-forest-900">
                <dt>{t("checkout.summary.subtotal")}</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </dl>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-wood-500">
                {lang === "ar"
                  ? "تُحتسب رسوم التوصيل في الخطوة التالية"
                  : "Frais de livraison calculés à l'étape suivante"}
              </p>

              {subtotal < MIN_ORDER_DZD ? (
                <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                  {lang === "ar"
                    ? `الحد الأدنى للطلب ${formatPrice(MIN_ORDER_DZD)}. أضف ${formatPrice(MIN_ORDER_DZD - subtotal)} للمتابعة.`
                    : `Commande minimum ${formatPrice(MIN_ORDER_DZD)}. Ajoutez encore ${formatPrice(MIN_ORDER_DZD - subtotal)} pour commander.`}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => setOrderOpen(true)}
                disabled={subtotal < MIN_ORDER_DZD}
                className={cn(
                  "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5",
                  "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
                  "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-all duration-200",
                  "hover:-translate-y-0.5 hover:bg-tangerine-600",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
                )}
              >
                {t("checkout.submit")}
                <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
              </button>
            </aside>
          </div>
        )}
      </div>

      <QuickOrderDialog
        items={orderItems}
        open={orderOpen}
        onOpenChange={setOrderOpen}
        onSuccess={clear}
      />
    </main>
  );
}
