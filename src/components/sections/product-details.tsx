"use client";

import * as React from "react";

import { ArrowLeft, Check, ShoppingBag } from "lucide-react";

import { TentLink } from "@/components/ui/tent-link";
import { discountPercent, formatDA, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * Product details page.
 *
 * The tent-opener transition is handled globally by `TentOverlay`
 * mounted in the root layout, so this page renders its content
 * straight away. The overlay closes over the previous page, fires
 * the router.push() while the seam is closed, then unzips to reveal
 * this page.
 */
export function ProductDetails({ product }: { product: Product }) {
  const pct = discountPercent(product.price, product.oldPrice);

  return (
    <main className="relative flex flex-1 flex-col bg-cream py-12 md:py-16">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <TentLink
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-700 transition-colors hover:text-tangerine-700"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2.2} />
          Retour à l&apos;accueil
        </TentLink>

        <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-2 md:gap-10 lg:gap-16">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-wood-300/50 bg-wood-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="size-full object-cover"
            />
            {pct ? (
              <span className="absolute end-4 top-4 inline-flex items-center rounded-full bg-tangerine-500 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-cream shadow-lg">
                -{pct}%
              </span>
            ) : null}
          </div>

          <div className="flex flex-col">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-tangerine-700">
              {product.brand}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl md:text-5xl">
              {product.name}
            </h1>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold tracking-tight text-tangerine-700 md:text-4xl">
                {formatDA(product.price)}
              </span>
              {product.oldPrice ? (
                <span className="font-mono text-sm text-wood-500 line-through">
                  {formatDA(product.oldPrice)}
                </span>
              ) : null}
            </div>

            <p className="mt-6 text-base leading-relaxed text-wood-700">
              {product.description}
            </p>

            <ul className="mt-6 space-y-2">
              {product.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 font-display text-sm text-forest-900"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-tangerine-100 text-tangerine-700">
                    <Check className="size-3" strokeWidth={2.5} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5 font-display text-sm font-semibold text-cream shadow-sm",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:bg-tangerine-600 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                )}
              >
                <ShoppingBag className="size-4" strokeWidth={2} />
                Ajouter au panier · {formatDA(product.price)}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-wood-300 bg-cream px-6 py-3.5 font-display text-sm font-semibold text-forest-900 transition-colors hover:border-forest-900 hover:bg-cream-deep"
              >
                Comparer les offres
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
