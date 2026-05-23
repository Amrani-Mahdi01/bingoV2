import * as React from "react";
import { ShoppingBag } from "lucide-react";

import { ProductActions } from "@/components/product/product-actions";
import { TentLink } from "@/components/ui/tent-link";
import { PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/utils";

const discountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;

/**
 * Nouveautés — newest arrivals section.
 * Decoration: a flock of pigeons crosses the whole section width on
 * staggered timings. No mountains.
 */

const NEWEST: Array<{
  slug: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
}> = [
  {
    slug: "patagonia-torrentshell",
    name: "Veste imperméable",
    brand: "Patagonia Torrentshell",
    price: 16900,
    oldPrice: 19500,
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80&fit=crop",
  },
  {
    slug: "jetboil-flash",
    name: "Réchaud à gaz",
    brand: "Jetboil Flash",
    price: 11200,
    image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800&q=80&fit=crop",
  },
  {
    slug: "leatherman-wave",
    name: "Couteau multifonctions",
    brand: "Leatherman Wave+",
    price: 8400,
    oldPrice: 9900,
    image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=800&q=80&fit=crop",
  },
  {
    slug: "hydro-flask-1l",
    name: "Bouteille isotherme 1 L",
    brand: "Hydro Flask Wide",
    price: 4200,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80&fit=crop",
  },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(value) + " DA";

export function Newest() {
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
        <header className="flex flex-col gap-5 md:items-end md:text-end">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-300">
              Nouveautés · Cette semaine
            </p>
            <h2
              id="newest-title"
              className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-cream sm:text-4xl md:text-[2.5rem]"
            >
              Tout juste arrivé
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base">
              Les dernières arrivées en boutique — encore tièdes du
              déballage.
            </p>
          </div>
        </header>

        <ul className="relative z-10 mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-12 md:grid-cols-4 md:gap-5">
          {NEWEST.map((p) => (
            <li key={p.slug}>
              <ProductCard {...p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───── Product card — dark theme variant ───── */
function ProductCard({
  slug,
  name,
  brand,
  price,
  oldPrice,
  image,
}: {
  slug: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
}) {
  const pct = discountPercent(price, oldPrice);
  const fullProduct = PRODUCTS.find((p) => p.slug === slug);
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
            Nouveau
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
          {name}
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

        <div className="mt-auto pt-3 sm:pt-4">
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tangerine-500 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cream transition-colors duration-300 group-hover:bg-tangerine-400 group-hover:text-forest-900 sm:py-2.5">
            <ShoppingBag className="size-3" strokeWidth={2.2} />
            Commander
          </span>
        </div>
      </div>
    </TentLink>
  );
}
