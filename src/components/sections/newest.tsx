"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ProductActions } from "@/components/product/product-actions";
import { TentLink } from "@/components/ui/tent-link";
import { useFormatPrice, useLanguage, useProductName } from "@/lib/i18n";
import { PRODUCTS, type Product } from "@/lib/products";
import { useSiteHome } from "@/lib/site-home-context";
import type { HeroSlot } from "@/lib/site-home";
import { cn } from "@/lib/utils";

const discountPercent = (price: number, oldPrice?: number | null) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;

/**
 * Nouveautés — newest arrivals section. Cards are populated from
 * /api/products?flag=new with a most-recently-created fallback when
 * no product is explicitly flagged as new. Hides itself when the
 * catalogue has nothing to show.
 *
 * Decoration: a flock of pigeons crosses the whole section width on
 * staggered timings. No mountains.
 */
export function Newest() {
  const { t } = useLanguage();
  const { newest } = useSiteHome();
  if (newest.length === 0) return null;
  return (
    <section
      aria-labelledby="newest-title"
      className="relative isolate overflow-hidden border-y border-wood-300/40 bg-forest-900 py-16 text-cream sm:py-20 md:py-24"
    >
      <style>{`
        /* ─── Pigeons crossing the section ─── */
        .newest-bird {
          position: absolute;
          pointer-events: none;
          opacity: 0;
          color: #f5efe0;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          will-change: transform, opacity;
        }
        .newest-bird-1 { top:  8%; width: 30px; stroke-width: 1.6; }
        .newest-bird-2 { top: 14%; width: 38px; stroke-width: 1.7; }
        .newest-bird-3 { top:  4%; width: 26px; stroke-width: 1.4; }
        .newest-bird-4 { top: 22%; width: 34px; stroke-width: 1.6; }
        .newest-bird-5 { top: 11%; width: 32px; stroke-width: 1.5; }
        .newest-bird-6 { top: 18%; width: 28px; stroke-width: 1.4; }
        .newest-bird-1 { animation: newest-bird-fly 22s linear  -2s infinite; }
        .newest-bird-2 { animation: newest-bird-fly 28s linear -10s infinite; }
        .newest-bird-3 { animation: newest-bird-fly 24s linear -18s infinite; }
        .newest-bird-4 { animation: newest-bird-fly 26s linear  -6s infinite; }
        .newest-bird-5 { animation: newest-bird-fly 30s linear -14s infinite; }
        .newest-bird-6 { animation: newest-bird-fly 23s linear -22s infinite; }
        @keyframes newest-bird-fly {
          0%   { transform: translateX(-80px); opacity: 0; }
          8%   { opacity: 0.7; }
          92%  { opacity: 0.7; }
          100% { transform: translateX(calc(100vw + 80px)); opacity: 0; }
        }

        @keyframes newest-dot-pulse {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%      { opacity: 0.5; transform: scale(0.7); }
        }

        @media (prefers-reduced-motion: reduce) {
          .newest-bird { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      {/* Soft wash to add atmospheric depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(252,217,176,0.10),transparent_55%)]"
      />

      {/* ─── Pigeons crossing the full section width ─── */}
      {Array.from({ length: 6 }).map((_, i) => (
        <svg
          key={i}
          aria-hidden
          viewBox="0 0 40 12"
          preserveAspectRatio="xMidYMid meet"
          className={`newest-bird newest-bird-${i + 1}`}
        >
          <path d="M 2 10 q 8 -7 16 0 q 8 -7 16 0" />
        </svg>
      ))}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10">
        <header className="flex flex-col gap-5">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-300">
              {t("newest.eyebrow")}
            </p>
            <h2
              id="newest-title"
              className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-cream sm:text-4xl md:text-[2.5rem]"
            >
              {t("newest.title")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base">
              {t("newest.subtitle")}
            </p>
          </div>
        </header>

        <ul className="relative z-10 mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-12 md:grid-cols-4 md:gap-5">
          {newest.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───── Product card — dark theme variant ───── */
function ProductCard({ product }: { product: HeroSlot }) {
  const slug = product.slug;
  const name = product.nameFr;
  const brand = product.brand ?? "";
  const price = product.price ?? 0;
  const oldPrice = product.oldPrice ?? undefined;
  const image = product.image;
  return <ProductCardInner {...{ slug, name, brand, price, oldPrice, image, nameAr: product.nameAr }} />;
}

/** Inner card kept on the original prop shape so the existing JSX
 *  body (~120 lines below) doesn't need to be rewritten. */
function ProductCardInner({
  slug,
  name,
  nameAr,
  brand,
  price,
  oldPrice,
  image,
}: {
  slug: string;
  name: string;
  nameAr?: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
}) {
  const { t } = useLanguage();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  const pct = discountPercent(price, oldPrice);
  // The cart + favorites contexts expect the legacy local `Product`
  // shape. Use the local mock when the slug matches, otherwise build
  // a synthetic Product from the backend row so heart + add-to-cart
  // work for every card regardless of where the data came from.
  const fullProduct: Product = React.useMemo(() => {
    const legacy = PRODUCTS.find((p) => p.slug === slug);
    if (legacy) return legacy;
    return {
      slug,
      name,
      nameAr: nameAr ?? undefined,
      brand,
      price,
      oldPrice,
      image,
      categorySlug: undefined,
      description: "",
      features: [],
    };
  }, [slug, name, nameAr, brand, price, oldPrice, image]);
  const displayName = productName({ name, nameAr });
  return (
    <TentLink
      href={`/produit/${slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-cream/10 bg-forest-900/60 backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-tangerine-400/60 hover:bg-forest-800/80 hover:shadow-[0_14px_32px_-14px_rgba(0,0,0,0.55)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-400"
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-forest-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />

        {/* Top-left: "Nouveau" + discount stacked; top-right free for actions. */}
        <div className="absolute start-3 top-3 z-10 flex flex-col items-start gap-1.5 sm:start-4 sm:top-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tangerine-500 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cream shadow-sm">
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-cream"
              style={{ animation: "newest-dot-pulse 1.8s ease-in-out infinite" }}
            />
            {t("card.badge.new")}
          </span>

          {pct ? (
            <span className="inline-flex items-center rounded-full bg-cream px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-tangerine-700 shadow-sm">
              -{pct}%
            </span>
          ) : null}
        </div>

        <ProductActions product={fullProduct} />
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="truncate font-display text-[14.5px] font-semibold leading-snug text-cream sm:text-base">
          {displayName}
        </h3>
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-cream/65">
          {brand}
        </p>
        <div className="mt-3 flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight text-tangerine-300 sm:text-xl">
            {formatPrice(price)}
          </span>
          {oldPrice ? (
            <span className="mt-0.5 block font-mono text-[11px] text-cream/45 line-through">
              {formatPrice(oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:pt-4">
          <span className="inline-flex h-7 items-center justify-center gap-1.5 rounded-2xl border border-tangerine-500 bg-tangerine-500 px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cream transition-colors duration-300 hover:bg-tangerine-400 hover:text-forest-900 sm:h-9 sm:flex-1 sm:gap-2 sm:px-3 sm:text-[10px] sm:tracking-[0.2em]">
            <ShoppingBag className="size-3" strokeWidth={2.2} />
            {t("card.order")}
          </span>
          <AddToCartButton
            product={fullProduct}
            className="border-cream/30 bg-transparent text-cream hover:bg-cream hover:text-forest-900"
          />
        </div>
      </div>
    </TentLink>
  );
}
