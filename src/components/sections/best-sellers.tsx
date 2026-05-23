import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";

import { ProductActions } from "@/components/product/product-actions";
import { TentLink } from "@/components/ui/tent-link";
import { PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/utils";

const discountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;

/**
 * Les plus vendus — best-selling products section.
 * A hand-drawn boussole (compass) sits in the top-right corner of the
 * section as a decorative anchor; the needle sways gently on a slow loop.
 */

const BEST_SELLERS: Array<{
  slug: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
}> = [
  {
    slug: "marmot-lithium-0",
    name: "Sac de couchage en duvet",
    brand: "Marmot Lithium 0",
    price: 12500,
    oldPrice: 14900,
    image: "https://images.unsplash.com/photo-1487730116645-7be521e35813?w=800&q=80&fit=crop",
  },
  {
    slug: "msr-hubba-nx",
    name: "Tente 2 places ultralégère",
    brand: "MSR Hubba NX",
    price: 18900,
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80&fit=crop",
  },
  {
    slug: "osprey-atmos-65",
    name: "Sac à dos de trek 65 L",
    brand: "Osprey Atmos AG",
    price: 14200,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80&fit=crop",
  },
  {
    slug: "petzl-actik-core",
    name: "Lampe frontale 450 lm",
    brand: "Petzl Actik Core",
    price: 4800,
    oldPrice: 5600,
    image: "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=800&q=80&fit=crop",
  },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(value) + " DA";

export function BestSellers() {
  return (
    <section
      aria-labelledby="best-sellers-title"
      className="relative isolate overflow-hidden bg-cream py-16 sm:py-20 md:py-24"
    >
      {/* ─── Boussole — back in the top-right corner, smaller, behind
          the product cards (z-0). Cards (z-10) overlap most of it; the
          compass shows through the gaps between cards. ──────────────── */}
      <Compass className="pointer-events-none absolute -end-4 top-24 z-0 size-[200px] text-wood-800 opacity-30 sm:end-2 sm:top-28 sm:size-[230px] md:end-8 md:top-32 md:size-[260px] md:opacity-35" />

      {/* ─── Section header ──────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-700">
              Best-sellers · Choix de l&apos;équipe
            </p>
            <h2
              id="best-sellers-title"
              className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl md:text-[2.5rem]"
            >
              Les plus vendus ce mois-ci
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-wood-700 sm:text-base">
              Notre top 4 des produits les plus comparés et achetés — testés sur
              le terrain, validés par la communauté.
            </p>
          </div>
          <Link
            href="/best-sellers"
            className="group inline-flex items-center gap-1.5 self-start font-display text-sm font-medium text-forest-900 underline-offset-4 transition-colors hover:text-tangerine-700 hover:underline md:self-end"
          >
            Voir le classement complet
            <ArrowUpRight
              className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </Link>
        </header>

        {/* ─── Product grid ─────────────────────────────────────────── */}
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-12 md:grid-cols-4 md:gap-5">
          {BEST_SELLERS.map((p) => (
            <li key={p.slug}>
              <ProductCard {...p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───── Product card ───── */
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
  // Look up the full product (with description, images, etc.) so the
  // cart icon can push the canonical Product object into the cart.
  const fullProduct = PRODUCTS.find((p) => p.slug === slug);
  return (
    <TentLink
      href={`/produit/${slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-wood-300/50 bg-cream",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-14px_rgba(31,58,30,0.22)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-wood-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
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

        <ProductActions product={fullProduct} />
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="truncate font-display text-[14.5px] font-semibold leading-snug text-forest-900 sm:text-base">
          {name}
        </h3>
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-wood-600">
          {brand}
        </p>
        <div className="mt-3 flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight text-tangerine-700 sm:text-xl">
            {formatPrice(price)}
          </span>
          {oldPrice ? (
            <span className="mt-0.5 block font-mono text-[11px] text-wood-500 line-through">
              {formatPrice(oldPrice)}
            </span>
          ) : null}
        </div>

        {/* Commander pill — anchored to the bottom so every card in a
            row finishes at the same point regardless of name length. */}
        <div className="mt-auto pt-3 sm:pt-4">
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-900 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cream transition-colors duration-300 group-hover:bg-tangerine-500 sm:py-2.5">
            <ShoppingBag className="size-3" strokeWidth={2.2} />
            Commander
          </span>
        </div>
      </div>
    </TentLink>
  );
}

/* ───── Boussole — hand-drawn SVG compass, fully animated.
   On mount: bezel draws around → tick marks fade in → inner ring + rose
   bloom in → cardinal letters fade up → needle pops in → starts swaying
   forever. Total draw time ≈ 2.9 s, then idle sway loop. */
function Compass({ className }: { className?: string }) {
  // 32 tick marks around the bezel (every 11.25°). Cardinal & inter-
  // cardinal ticks are slightly longer so the rose reads at a glance.
  const ticks = Array.from({ length: 32 }, (_, i) => {
    const angle = (i / 32) * Math.PI * 2;
    const isCardinal = i % 8 === 0;
    const isInter    = i % 4 === 0 && !isCardinal;
    const outer = 116;
    const inner = isCardinal ? 100 : isInter ? 104 : 108;
    return {
      x1: 120 + Math.sin(angle) * outer,
      y1: 120 - Math.cos(angle) * outer,
      x2: 120 + Math.sin(angle) * inner,
      y2: 120 - Math.cos(angle) * inner,
      width: isCardinal ? 2 : isInter ? 1.4 : 0.8,
    };
  });

  return (
    <svg
      viewBox="0 0 240 240"
      aria-hidden
      className={className}
      style={{ color: "currentColor" }}
    >
      <style>{`
        /* Bezel draws around the rim */
        .compass-bezel {
          stroke-dasharray: 743;
          stroke-dashoffset: 743;
          animation: compass-bezel-draw 1500ms cubic-bezier(0.4,0,0.2,1) 200ms forwards;
        }
        @keyframes compass-bezel-draw { to { stroke-dashoffset: 0; } }

        /* Tick marks fade in together once the bezel is mostly drawn */
        .compass-ticks > * { opacity: 0; animation: compass-fade-in 700ms ease-out 1200ms forwards; }

        /* Inner dashed ring */
        .compass-ring { opacity: 0; animation: compass-fade-in 600ms ease-out 1500ms forwards; }
        @keyframes compass-fade-in { to { opacity: 1; } }

        /* Rose des vents — bloom in then slowly rotate forever */
        .compass-rose {
          opacity: 0;
          transform: scale(0.6) rotate(-12deg);
          transform-origin: 120px 120px;
          animation:
            compass-rose-in   800ms cubic-bezier(0.34,1.5,0.64,1) 1700ms forwards,
            compass-rose-spin 90s   linear                          2500ms infinite;
        }
        @keyframes compass-rose-in {
          to { opacity: 0.22; transform: scale(1) rotate(0deg); }
        }
        @keyframes compass-rose-spin {
          to { transform: scale(1) rotate(360deg); }
        }

        /* Cardinal letters cascade in */
        .compass-letter { opacity: 0; transform: translateY(4px); }
        .compass-letter-n { animation: compass-letter-in 500ms ease-out 2000ms forwards; }
        .compass-letter-e { animation: compass-letter-in 500ms ease-out 2120ms forwards; }
        .compass-letter-s { animation: compass-letter-in 500ms ease-out 2240ms forwards; }
        .compass-letter-o { animation: compass-letter-in 500ms ease-out 2360ms forwards; }
        @keyframes compass-letter-in { to { opacity: 1; transform: translateY(0); } }

        /* Needle pops in spinning, then settles + sways forever */
        .compass-needle {
          opacity: 0;
          transform-origin: 120px 120px;
          transform: scale(0) rotate(-180deg);
          animation:
            compass-needle-in 900ms cubic-bezier(0.34,1.4,0.5,1) 2500ms forwards,
            compass-sway      6s   ease-in-out                   3500ms infinite;
        }
        @keyframes compass-needle-in {
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes compass-sway {
          0%,  100% { transform: scale(1) rotate(-14deg); }
          12%       { transform: scale(1) rotate(8deg);   }
          22%       { transform: scale(1) rotate(-3deg);  }
          28%       { transform: scale(1) rotate(-3deg);  }
          42%       { transform: scale(1) rotate(11deg);  }
          55%       { transform: scale(1) rotate(2deg);   }
          63%       { transform: scale(1) rotate(2deg);   }
          78%       { transform: scale(1) rotate(-9deg);  }
          90%       { transform: scale(1) rotate(-12deg); }
        }

        /* Center pivot pops last, then gently pulses forever */
        .compass-pivot {
          opacity: 0;
          transform-origin: 120px 120px;
          transform: scale(0);
          animation:
            compass-pivot-in    450ms cubic-bezier(0.34,1.6,0.64,1) 2900ms forwards,
            compass-pivot-pulse 2.4s  ease-in-out                   3500ms infinite;
        }
        @keyframes compass-pivot-in    { to { opacity: 1; transform: scale(1); } }
        @keyframes compass-pivot-pulse {
          0%, 100% { transform: scale(1);    }
          50%      { transform: scale(1.18); }
        }

        @media (prefers-reduced-motion: reduce) {
          .compass-bezel { stroke-dashoffset: 0 !important; animation: none !important; }
          .compass-ticks > *,
          .compass-ring,
          .compass-letter,
          .compass-needle,
          .compass-pivot {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
          .compass-rose { opacity: 0.22 !important; transform: none !important; animation: none !important; }
        }
      `}</style>

      {/* Outer bezel */}
      <circle
        className="compass-bezel"
        cx="120"
        cy="120"
        r="118"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Tick marks */}
      <g className="compass-ticks" stroke="currentColor" strokeLinecap="round">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={t.width}
          />
        ))}
      </g>

      {/* Inner dashed ring */}
      <circle
        className="compass-ring"
        cx="120"
        cy="120"
        r="90"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 4"
        opacity="0.7"
      />

      {/* Rose des vents — 8-point star */}
      <g className="compass-rose" fill="currentColor">
        <path d="M 120 30 L 126 120 L 120 120 Z" />
        <path d="M 120 30 L 114 120 L 120 120 Z" opacity="0.55" />
        <path d="M 210 120 L 120 126 L 120 120 Z" />
        <path d="M 210 120 L 120 114 L 120 120 Z" opacity="0.55" />
        <path d="M 120 210 L 114 120 L 120 120 Z" />
        <path d="M 120 210 L 126 120 L 120 120 Z" opacity="0.55" />
        <path d="M 30 120 L 120 114 L 120 120 Z" />
        <path d="M 30 120 L 120 126 L 120 120 Z" opacity="0.55" />

        {/* Diagonal accents */}
        <path d="M 56 56 L 120 116 L 124 120 Z" opacity="0.4" />
        <path d="M 184 56 L 124 120 L 120 116 Z" opacity="0.4" />
        <path d="M 184 184 L 120 124 L 116 120 Z" opacity="0.4" />
        <path d="M 56 184 L 116 120 L 120 124 Z" opacity="0.4" />
      </g>

      {/* Cardinal letters (FR: N · E · S · O) */}
      <g
        fontFamily="serif"
        fontSize="18"
        fontWeight="700"
        fill="currentColor"
        textAnchor="middle"
      >
        <text className="compass-letter compass-letter-n" x="120" y="20">N</text>
        <text className="compass-letter compass-letter-e" x="225" y="125">E</text>
        <text className="compass-letter compass-letter-s" x="120" y="232">S</text>
        <text className="compass-letter compass-letter-o" x="16"  y="125">O</text>
      </g>

      {/* Needle — North half tangerine, South half wood */}
      <g className="compass-needle">
        <path
          d="M 120 42 L 130 120 L 120 130 L 110 120 Z"
          fill="#ed8a3c"
          stroke="#a95613"
          strokeWidth="0.5"
        />
        <path
          d="M 120 198 L 110 120 L 120 110 L 130 120 Z"
          fill="currentColor"
          opacity="0.85"
        />
      </g>

      {/* Center pivot */}
      <g className="compass-pivot">
        <circle cx="120" cy="120" r="6" fill="currentColor" />
        <circle cx="120" cy="120" r="2.5" fill="#ed8a3c" />
      </g>
    </svg>
  );
}
