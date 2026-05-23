"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  ShoppingBag,
} from "lucide-react";

import { ProductActions } from "@/components/product/product-actions";
import { TentLink } from "@/components/ui/tent-link";
import { useFavorites } from "@/lib/favorites";
import {
  discountPercent,
  formatDA,
  PRODUCTS,
  type Product,
} from "@/lib/products";
import { cn } from "@/lib/utils";

export default function FavorisPage() {
  const { slugs, clear } = useFavorites();

  // Map slugs → Product objects, dropping any that no longer exist.
  const items = React.useMemo<Product[]>(
    () =>
      slugs
        .map((s) => PRODUCTS.find((p) => p.slug === s))
        .filter((p): p is Product => Boolean(p)),
    [slugs]
  );

  return (
    <main className="flex flex-1 flex-col bg-cream py-10 md:py-14">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700"
        >
          <Link href="/" className="transition-colors hover:text-tangerine-700">
            Accueil
          </Link>
          <ChevronRight
            className="size-3 text-wood-500 rtl:rotate-180"
            strokeWidth={2.2}
          />
          <span className="text-forest-900">Favoris</span>
        </nav>

        {/* Header */}
        <header className="mt-6 flex flex-col gap-5 md:mt-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
              Votre sélection
            </p>
            <h1 className="mt-3 font-display text-[40px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 sm:text-[56px] md:text-[64px]">
              Favoris
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-wood-700 sm:text-base">
              {items.length === 0
                ? "Aucun produit en favoris pour le moment. Cliquez sur le ♥ d'une fiche produit pour la garder ici."
                : `${items.length} produit${items.length > 1 ? "s" : ""} sauvegardé${items.length > 1 ? "s" : ""}.`}
            </p>
          </div>

          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => clear()}
              className="inline-flex items-center gap-2 self-start rounded-full border border-wood-300 bg-cream px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700 transition-colors hover:border-tangerine-500 hover:text-tangerine-700 md:self-end"
            >
              Tout vider
            </button>
          ) : null}
        </header>

        {/* Body */}
        <div className="mt-10 md:mt-12">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {items.map((p) => (
                <li key={p.slug}>
                  <FavoriteCard product={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

/* ───── Favorite card — same design as the rest of the catalogue ── */
function FavoriteCard({ product }: { product: Product }) {
  const pct = discountPercent(product.price, product.oldPrice);
  return (
    <TentLink
      href={`/produit/${product.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-wood-300/50 bg-cream",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-14px_rgba(31,58,30,0.22)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-wood-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />

        {pct ? (
          <span className="absolute start-3 top-3 z-10 inline-flex items-center rounded-full bg-tangerine-500 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cream shadow-sm sm:start-4 sm:top-4">
            -{pct}%
          </span>
        ) : null}

        <ProductActions product={product} />
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="truncate font-display text-[14.5px] font-semibold leading-snug text-forest-900 sm:text-base">
          {product.name}
        </h3>
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-wood-600">
          {product.brand}
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-lg font-bold tracking-tight text-tangerine-700 sm:text-xl">
            {formatDA(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="font-mono text-[11px] text-wood-500 line-through">
              {formatDA(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <span className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-forest-900 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cream transition-colors duration-300 group-hover:bg-tangerine-500 sm:mt-4 sm:py-2.5">
          <ShoppingBag className="size-3" strokeWidth={2.2} />
          Commander
        </span>
      </div>
    </TentLink>
  );
}

/* ───── Empty state ─────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-wood-300/50 bg-cream-deep/30 px-6 py-16 text-center md:py-20">
      <span className="grid size-14 place-items-center rounded-full bg-cream text-tangerine-600 ring-1 ring-wood-300/60">
        <Heart className="size-6" strokeWidth={1.8} />
      </span>
      <h2 className="font-display text-xl font-bold text-forest-900 sm:text-2xl">
        Aucun favori pour l&apos;instant
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-wood-700">
        Parcourez le catalogue et cliquez sur le ♥ d&apos;un produit
        pour le retrouver ici, n&apos;importe quand.
      </p>
      <Link
        href="/catalogue"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-5 py-2.5 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-tangerine-600"
      >
        Explorer le catalogue
        <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
      </Link>
    </div>
  );
}
