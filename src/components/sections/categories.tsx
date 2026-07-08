"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ArrowUpRight } from "lucide-react";

import { TentLink } from "@/components/ui/tent-link";
import { useLanguage } from "@/lib/i18n";
import { useSiteCategories } from "@/lib/site-categories-context";
import type { SiteCategory } from "@/lib/site-categories";
import { cn } from "@/lib/utils";

/**
 * Categories grid — colorful icon tiles fed by /api/categories via the
 * SiteCategoriesProvider (server-seeded in the root layout). Renders
 * the top-level categories the admin has set up — empty when there
 * are none. Cap the list to 12 tiles laid out as two clean rows —
 * 6 per row on md/lg, 3 per row on mobile.
 */
export function Categories() {
  const { t } = useLanguage();
  const { list } = useSiteCategories();
  // Don't render the section at all if the admin hasn't configured any
  // categories yet — better than an empty grid + lonely header.
  if (list.length === 0) return null;
  const tiles = list.slice(0, 12);
  return (
    <section
      aria-labelledby="categories-title"
      className="relative isolate overflow-hidden border-y border-wood-300/40 bg-cream-deep/40 py-16 sm:py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <SectionHeader
          eyebrow={t("categories.eyebrow", { n: list.length })}
          title={t("categories.title")}
          subtitle={t("categories.subtitle")}
          ctaLabel={t("categories.cta")}
          ctaHref="/catalogue"
        />

        <ul className="mt-10 grid grid-cols-3 gap-4 sm:gap-5 md:mt-12 md:grid-cols-6 md:gap-5 lg:grid-cols-6">
          {tiles.map((c) => (
            <li key={c.slug}>
              <CategoryCard category={c} />
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
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            strokeWidth={2.2}
          />
        </Link>
      ) : null}
    </header>
  );
}

/* ───── Category card — colorful icon tile + label stacked below ───── */
function CategoryCard({ category }: { category: SiteCategory }) {
  const { t, lang } = useLanguage();
  const name =
    (lang === "ar" && category.nameAr ? category.nameAr : category.nameFr) ||
    category.slug;
  // The admin uploads a square PNG/JPG per top-level category. Fall
  // back to the legacy /categories/*.png assets when the DB row has
  // no image yet — they still ship with the project as defaults.
  const image = category.image || "/categories/camping-tent.png";
  return (
    <TentLink
      href={`/catalogue?category=${encodeURIComponent(category.slug)}`}
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
          src={image}
          alt=""
          aria-hidden
          loading="lazy"
          className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.06]"
        />
      </div>

      {/* Label + count */}
      <div className="flex w-full min-w-0 flex-col items-center">
        <span
          className="w-full truncate font-display text-[13px] font-semibold leading-tight text-forest-900 transition-colors group-hover:text-tangerine-700 sm:text-sm"
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          {name}
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-wood-600">
          {t("categories.products", { n: category.productCount })}
        </span>
      </div>
    </TentLink>
  );
}
