import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { TentLink } from "@/components/ui/tent-link";
import { cn } from "@/lib/utils";

/**
 * Categories grid — structure modelled exactly on CategoryTile.tsx
 * (photo variant): aspect-square forest panel, full-card decorative
 * fill (in place of the photo until real images are uploaded), dark
 * scrim from forest-950/85 → /15, bottom caption with name +
 * "X produits" + cream-circle arrow.
 */

/* Unsplash photo IDs — replace with your own admin-uploaded photos
   later. URL form: https://images.unsplash.com/photo-[ID]?w=800&q=80&fit=crop */
const CATEGORIES: Array<{
  slug: string;
  name: string;
  productCount: number;
  image: string;
}> = [
  {
    slug: "sacs-de-couchage",
    name: "Sacs de couchage",
    productCount: 24,
    image: "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=800&q=80&fit=crop",
  },
  {
    slug: "tentes",
    name: "Tentes",
    productCount: 18,
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80&fit=crop",
  },
  {
    slug: "sacs-a-dos",
    name: "Sacs à dos",
    productCount: 32,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80&fit=crop",
  },
  {
    slug: "eclairage",
    name: "Éclairage",
    productCount: 15,
    image: "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=800&q=80&fit=crop",
  },
  {
    slug: "navigation",
    name: "Navigation",
    productCount: 11,
    image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=800&q=80&fit=crop",
  },
  {
    slug: "campement",
    name: "Campement",
    productCount: 28,
    image: "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&q=80&fit=crop",
  },
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

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-12 md:grid-cols-3 md:gap-5 lg:grid-cols-6">
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

/* ───── Section header — eyebrow + display title + lead + optional CTA
   (matches the SectionHeader.tsx pattern from the source files) ───── */
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

/* ───── Category card — mirrors CategoryTile.tsx (photo variant) ───── */
function CategoryCard({
  slug,
  name,
  productCount,
  image,
}: {
  slug: string;
  name: string;
  productCount: number;
  image: string;
}) {
  return (
    <TentLink
      href={`/categorie/${slug}`}
      className={cn(
        "group relative flex aspect-square flex-col justify-end overflow-hidden rounded-xl bg-forest-900 text-cream",
        "transition-all hover:-translate-y-0.5 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
      )}
    >
      {/* Background photo — Unsplash */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      />

      {/* Dark scrim — heavier at the bottom where the caption sits */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-forest-900/90 via-forest-900/45 to-forest-900/15"
      />

      {/* Caption */}
      <div className="relative flex items-end justify-between gap-2 p-3 sm:p-5">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold leading-tight text-cream sm:text-lg">
            {name}
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cream/75">
            {productCount} produits
          </p>
        </div>
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-cream text-tangerine-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:size-9">
          <ArrowUpRight className="size-3.5 sm:size-4" strokeWidth={2.2} />
        </span>
      </div>
    </TentLink>
  );
}
