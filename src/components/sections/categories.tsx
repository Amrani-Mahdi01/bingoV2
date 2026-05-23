import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { TentLink } from "@/components/ui/tent-link";
import { cn } from "@/lib/utils";

/**
 * Categories grid — colorful icon tiles.
 *
 * Each tile = a cream rounded square holding one of the brand's flat
 * PNG icons (public/categories/*.png), with the category name +
 * product count stacked below. Some PNGs are reused across categories
 * until dedicated artwork is available.
 */

type Category = {
  slug: string;
  name: string;
  productCount: number;
  icon: string;
};

const CATEGORIES: Category[] = [
  { slug: "tentes",            name: "Tentes",            productCount: 18, icon: "/categories/camping-tent.png" },
  { slug: "sacs-a-dos",        name: "Sacs à dos",        productCount: 32, icon: "/categories/backpack.png" },
  { slug: "chaussures",        name: "Chaussures",        productCount: 24, icon: "/categories/boots.png" },
  { slug: "eclairage",         name: "Éclairage",         productCount: 15, icon: "/categories/flashlight.png" },
  { slug: "navigation",        name: "Navigation",        productCount: 11, icon: "/categories/map.png" },
  { slug: "campement",         name: "Campement",         productCount: 28, icon: "/categories/bonfire.png" },
  { slug: "sacs-de-couchage",  name: "Sacs de couchage",  productCount: 14, icon: "/categories/camping-tent.png" },
  { slug: "cuisine",           name: "Cuisine de camp",   productCount: 19, icon: "/categories/bonfire.png" },
  { slug: "hydratation",       name: "Hydratation",       productCount: 12, icon: "/categories/map.png" },
  { slug: "vetements",         name: "Vêtements",         productCount: 22, icon: "/categories/backpack.png" },
  { slug: "rechauds",          name: "Réchauds",          productCount: 9,  icon: "/categories/bonfire.png" },
  { slug: "couteaux",          name: "Couteaux & outils", productCount: 17, icon: "/categories/map.png" },
  { slug: "accessoires",       name: "Accessoires",       productCount: 25, icon: "/categories/boots.png" },
  { slug: "sacs-etanches",     name: "Sacs étanches",     productCount: 8,  icon: "/categories/backpack.png" },
  { slug: "tapis-matelas",     name: "Tapis & matelas",   productCount: 13, icon: "/categories/camping-tent.png" },
  { slug: "securite",          name: "Sécurité",          productCount: 7,  icon: "/categories/flashlight.png" },
];

export function Categories() {
  return (
    <section
      aria-labelledby="categories-title"
      className="relative isolate overflow-hidden border-y border-wood-300/40 bg-cream-deep/40 py-16 sm:py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <SectionHeader
          eyebrow="Catalogue · 6 collections"
          title="Trouvez le matériel par catégorie"
          subtitle="Sacs de couchage, tentes, sacs à dos et plus encore — testés sur le terrain, comparés côte à côte."
          ctaLabel="Voir tout"
          ctaHref="/materiel"
        />

        <ul className="mt-10 grid grid-cols-3 gap-4 sm:gap-5 md:mt-12 md:grid-cols-6 md:gap-5 lg:grid-cols-8">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <CategoryCard {...c} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───── Section header — eyebrow + display title + lead + optional CTA ───── */
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-700">
          {eyebrow}
        </p>
        <h2
          id="categories-title"
          className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl md:text-[2.5rem]"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-wood-700 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-1.5 self-start font-display text-sm font-medium text-forest-900 underline-offset-4 transition-colors hover:text-tangerine-700 hover:underline md:self-end"
        >
          {ctaLabel}
          <ArrowUpRight
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={2.2}
          />
        </Link>
      ) : null}
    </header>
  );
}

/* ───── Category card — colorful icon tile + label stacked below ───── */
function CategoryCard({
  slug,
  name,
  productCount,
  icon,
}: Category) {
  return (
    <TentLink
      href={`/categorie/${slug}`}
      className={cn(
        "group flex flex-col items-center gap-2.5 text-center",
        "focus-visible:outline-none"
      )}
    >
      {/* Icon tile */}
      <div
        className={cn(
          "grid aspect-square w-full place-items-center rounded-2xl bg-cream p-8 ring-1 ring-wood-300/40 sm:p-10 md:p-12",
          "transition-all duration-300 ease-out",
          "group-hover:-translate-y-0.5 group-hover:bg-cream-deep/60 group-hover:ring-tangerine-500/45",
          "group-hover:shadow-[0_14px_28px_-14px_rgba(31,58,30,0.3)]",
          "group-focus-visible:ring-2 group-focus-visible:ring-tangerine-500"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt=""
          aria-hidden
          loading="lazy"
          className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.06]"
        />
      </div>

      {/* Label + count */}
      <div className="flex w-full min-w-0 flex-col items-center">
        <span className="w-full truncate font-display text-[13px] font-semibold leading-tight text-forest-900 transition-colors group-hover:text-tangerine-700 sm:text-sm">
          {name}
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-wood-600">
          {productCount} produits
        </span>
      </div>
    </TentLink>
  );
}
