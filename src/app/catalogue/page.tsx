"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  X,
} from "lucide-react";

import { ProductActions } from "@/components/product/product-actions";
import { TentLink } from "@/components/ui/tent-link";
import { CATEGORIES } from "@/lib/catalogue";
import {
  discountPercent,
  formatDA,
  PRODUCTS,
  type Product,
} from "@/lib/products";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "popular", label: "Populaires" },
  { value: "newest", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

// Reasonable price bounds for the catalogue.
const PRICE_MIN = 0;
const PRICE_MAX = 50000;
const PRICE_STEP = 500;

const PAGE_SIZE = 12;

/** Best-effort manufacturer extraction from `product.brand`.
 *  "Marmot Lithium 0" → "Marmot", "Hydro Flask Wide" → "Hydro Flask". */
function manufacturerOf(p: Product): string {
  const parts = p.brand.split(/\s+/);
  if (parts[0] === "Hydro" && parts[1] === "Flask") return "Hydro Flask";
  return parts[0];
}

export default function CataloguePage() {
  // useSearchParams() needs to live under a Suspense boundary so the
  // page can be statically rendered without bailing out the whole route.
  return (
    <React.Suspense fallback={null}>
      <CatalogueContent />
    </React.Suspense>
  );
}

const SORT_VALUES = SORTS.map((s) => s.value) as readonly string[];
function readSort(raw: string | null): SortValue | null {
  return raw && SORT_VALUES.includes(raw) ? (raw as SortValue) : null;
}

function CatalogueContent() {
  const searchParams = useSearchParams();
  // Read filter intent from the URL (e.g. ?promo=1 from the
  // header "Promotions" link, ?category=tentes from a category tile,
  // ?sort=popular from the best-sellers "Voir le classement" CTA).
  const initialPromosOnly =
    searchParams.get("promo") === "1" ||
    searchParams.get("promo") === "true";
  const initialCategory = searchParams.get("category");
  const initialSort = readSort(searchParams.get("sort"));

  const [activeCategory, setActiveCategory] = React.useState<string | null>(
    initialCategory && CATEGORIES.some((c) => c.slug === initialCategory)
      ? initialCategory
      : null
  );
  const [activeSubCategory, setActiveSubCategory] = React.useState<
    string | null
  >(null);
  const [expandedCategories, setExpandedCategories] = React.useState<
    Set<string>
  >(() => new Set());
  const [sort, setSort] = React.useState<SortValue>(initialSort ?? "popular");
  const [promosOnly, setPromosOnly] = React.useState(initialPromosOnly);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [priceMin, setPriceMin] = React.useState(PRICE_MIN);
  const [priceMax, setPriceMax] = React.useState(PRICE_MAX);
  const [selectedBrands, setSelectedBrands] = React.useState<Set<string>>(
    () => new Set()
  );
  const [brandsQuery, setBrandsQuery] = React.useState("");
  const [showAllBrands, setShowAllBrands] = React.useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const gridTopRef = React.useRef<HTMLDivElement>(null);

  // Unique manufacturers across the catalogue, sorted.
  const allBrands = React.useMemo(() => {
    const set = new Set<string>();
    PRODUCTS.forEach((p) => set.add(manufacturerOf(p)));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, []);

  const filteredBrands = React.useMemo(() => {
    const q = brandsQuery.trim().toLowerCase();
    return q
      ? allBrands.filter((b) => b.toLowerCase().includes(q))
      : allBrands;
  }, [allBrands, brandsQuery]);

  const visibleBrandsList = showAllBrands
    ? filteredBrands
    : filteredBrands.slice(0, 5);
  const hiddenBrandsCount = filteredBrands.length - visibleBrandsList.length;

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  };

  const visible = React.useMemo(() => {
    let list = PRODUCTS.slice();

    if (activeCategory) {
      list = list.filter((p) => p.categorySlug === activeCategory);
    }
    if (selectedBrands.size > 0) {
      list = list.filter((p) => selectedBrands.has(manufacturerOf(p)));
    }
    list = list.filter((p) => p.price >= priceMin && p.price <= priceMax);
    if (promosOnly) {
      list = list.filter((p) => p.oldPrice && p.oldPrice > p.price);
    }
    // `inStockOnly` has no backing data yet — all products are
    // considered in stock; the toggle is honored as a no-op for now.
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      // "popular" / "newest" — no real metric yet, keep source order
    }
    return list;
  }, [
    activeCategory,
    sort,
    promosOnly,
    inStockOnly,
    query,
    priceMin,
    priceMax,
    selectedBrands,
  ]);

  const resetFilters = () => {
    setActiveCategory(null);
    setActiveSubCategory(null);
    setExpandedCategories(new Set());
    setPromosOnly(false);
    setInStockOnly(false);
    setQuery("");
    setPriceMin(PRICE_MIN);
    setPriceMax(PRICE_MAX);
    setSelectedBrands(new Set());
    setBrandsQuery("");
    setShowAllBrands(false);
  };

  const toggleCategoryExpansion = (slug: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const hasFilters =
    activeCategory !== null ||
    promosOnly ||
    inStockOnly ||
    query.trim() !== "" ||
    priceMin !== PRICE_MIN ||
    priceMax !== PRICE_MAX ||
    selectedBrands.size > 0;

  const selectedCategory = activeCategory
    ? CATEGORIES.find((c) => c.slug === activeCategory)
    : null;

  // If the URL search params change after mount (user clicks the
  // Promotions nav link while already on /catalogue), reflect that in
  // the filter state. Same-route navigation re-uses the component, so
  // lazy useState init alone isn't enough.
  React.useEffect(() => {
    const p = searchParams.get("promo");
    setPromosOnly(p === "1" || p === "true");
    const c = searchParams.get("category");
    if (c && CATEGORIES.some((cat) => cat.slug === c)) {
      setActiveCategory(c);
      setActiveSubCategory(null);
    }
    const s = readSort(searchParams.get("sort"));
    if (s) setSort(s);
  }, [searchParams]);

  // Reset to page 1 whenever the filter set changes so the user doesn't
  // land on an empty page after narrowing the results.
  React.useEffect(() => {
    setPage(1);
  }, [
    activeCategory,
    activeSubCategory,
    sort,
    promosOnly,
    inStockOnly,
    query,
    priceMin,
    priceMax,
    selectedBrands,
  ]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  // Clamp page if the filter set shrank the list below the current page.
  const safePage = Math.min(page, totalPages);
  const pagedProducts = visible.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    // Bring the grid back into view so the user sees the new page.
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtersNode = (
    <div className="overflow-hidden rounded-2xl border border-wood-300/60 bg-cream-deep/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-display text-sm font-bold tracking-[-0.01em] text-forest-900">
          Filtres
        </p>
        <button
          type="button"
          onClick={resetFilters}
          disabled={!hasFilters}
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.22em] transition-colors",
            hasFilters
              ? "text-tangerine-700 hover:text-tangerine-600"
              : "cursor-not-allowed text-wood-500"
          )}
        >
          Aucun
        </button>
      </div>

      {/* Catégories */}
      <FilterSection title="Catégories">
        <ul className="flex flex-col">
          <li>
            <CategoryRow
              active={activeCategory === null && !activeSubCategory}
              onClick={() => {
                setActiveCategory(null);
                setActiveSubCategory(null);
              }}
            >
              Toutes les catégories
            </CategoryRow>
          </li>
          {CATEGORIES.map((c) => {
            const count = PRODUCTS.filter(
              (p) => p.categorySlug === c.slug
            ).length;
            const expanded = expandedCategories.has(c.slug);
            const hasSubs = c.subCategories.length > 0;
            return (
              <li key={c.slug}>
                <CategoryRow
                  active={
                    activeCategory === c.slug && !activeSubCategory
                  }
                  onClick={() => {
                    setActiveCategory(c.slug);
                    setActiveSubCategory(null);
                  }}
                  count={count}
                  expandable={hasSubs}
                  expanded={expanded}
                  onToggleExpand={() => toggleCategoryExpansion(c.slug)}
                >
                  {c.name}
                </CategoryRow>
                {hasSubs && expanded ? (
                  <ul className="mt-0.5 flex flex-col">
                    {c.subCategories.map((sc) => (
                      <li key={sc.slug}>
                        <SubCategoryRow
                          active={activeSubCategory === sc.slug}
                          onClick={() => {
                            setActiveCategory(c.slug);
                            setActiveSubCategory(sc.slug);
                          }}
                        >
                          {sc.name}
                        </SubCategoryRow>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* Prix */}
      <FilterSection
        title="Prix"
        trailing={
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-wood-700">
            {formatDA(priceMin)} — {formatDA(priceMax)}
          </span>
        }
      >
        <DualRange
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={[priceMin, priceMax]}
          onChange={([lo, hi]) => {
            setPriceMin(lo);
            setPriceMax(hi);
          }}
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <PriceField
            label="Min"
            value={priceMin}
            onChange={(v) => setPriceMin(Math.min(Math.max(0, v), priceMax))}
          />
          <PriceField
            label="Max"
            value={priceMax}
            onChange={(v) =>
              setPriceMax(Math.max(Math.min(PRICE_MAX, v), priceMin))
            }
          />
        </div>
      </FilterSection>

      {/* Marques */}
      <FilterSection title="Marques">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-wood-600"
            strokeWidth={2}
          />
          <input
            type="search"
            value={brandsQuery}
            onChange={(e) => setBrandsQuery(e.target.value)}
            placeholder="Rechercher une marque…"
            aria-label="Rechercher une marque"
            className="h-9 w-full rounded-md border border-wood-300 bg-cream ps-9 pe-3 font-mono text-[11.5px] text-wood-800 placeholder:text-wood-500 transition-[border-color,box-shadow] duration-200 focus:border-tangerine-500 focus:outline-none focus:ring-4 focus:ring-tangerine-500/15"
          />
        </div>
        <ul className="mt-3 flex flex-col gap-0.5">
          {visibleBrandsList.length === 0 ? (
            <li className="px-2 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-500">
              Aucune marque
            </li>
          ) : (
            visibleBrandsList.map((b) => (
              <li key={b}>
                <CheckRow
                  checked={selectedBrands.has(b)}
                  onChange={() => toggleBrand(b)}
                >
                  {b}
                </CheckRow>
              </li>
            ))
          )}
        </ul>
        {!showAllBrands && hiddenBrandsCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowAllBrands(true)}
            className="mt-2 inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-tangerine-700 transition-colors hover:text-tangerine-600"
          >
            Voir plus ({hiddenBrandsCount})
            <ChevronDown className="size-3" strokeWidth={2.4} />
          </button>
        ) : null}
        {showAllBrands && allBrands.length > 5 ? (
          <button
            type="button"
            onClick={() => setShowAllBrands(false)}
            className="mt-2 inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700 transition-colors hover:text-tangerine-700"
          >
            Voir moins
            <ChevronDown
              className="size-3 rotate-180"
              strokeWidth={2.4}
            />
          </button>
        ) : null}
      </FilterSection>

      {/* Disponibilité — last section, no bottom divider */}
      <FilterSection title="Disponibilité" last>
        <div className="flex flex-col gap-0.5">
          <CheckRow checked={inStockOnly} onChange={setInStockOnly}>
            En stock uniquement
          </CheckRow>
          <CheckRow checked={promosOnly} onChange={setPromosOnly}>
            Produits en promotion
          </CheckRow>
        </div>
      </FilterSection>
    </div>
  );

  return (
    <main className="flex flex-1 flex-col bg-cream py-10 md:py-14">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700"
        >
          <Link
            href="/"
            className="transition-colors hover:text-tangerine-700"
          >
            Accueil
          </Link>
          <ChevronRight
            className="size-3 text-wood-500 rtl:rotate-180"
            strokeWidth={2.2}
          />
          {selectedCategory ? (
            <>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="transition-colors hover:text-tangerine-700"
              >
                Catalogue
              </button>
              <ChevronRight
                className="size-3 text-wood-500 rtl:rotate-180"
                strokeWidth={2.2}
              />
              <span className="text-forest-900">{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-forest-900">Catalogue</span>
          )}
        </nav>

        {/* Page header — eyebrow / big title / subtitle */}
        <header className="mt-6 max-w-3xl md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            Boutique
          </p>
          <h1 className="mt-3 font-display text-[44px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 sm:text-[64px] md:text-[80px]">
            {selectedCategory ? selectedCategory.name : "Catalogue"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-wood-700 sm:text-base">
            Toute notre sélection — testée, choisie, livrée dans toute
            l&apos;Algérie.
          </p>
        </header>

        {/* Search bar */}
        <div className="relative mt-6 max-w-3xl sm:mt-8">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-wood-600"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher tente, sac de couchage, lampe frontale…"
            aria-label="Rechercher dans le catalogue"
            className={cn(
              "h-12 w-full rounded-full border border-wood-300 bg-cream-deep/40 ps-11 pe-11",
              "font-mono text-[13px] text-wood-800 placeholder:text-wood-500",
              "transition-[border-color,background-color,box-shadow] duration-200",
              "hover:bg-cream-deep/55",
              "focus:border-tangerine-500 focus:bg-cream focus:outline-none focus:ring-4 focus:ring-tangerine-500/15"
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Effacer la recherche"
              className="absolute end-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900"
            >
              <X className="size-4" strokeWidth={2.2} />
            </button>
          ) : null}
        </div>

        {/* Toolbar — mobile filter trigger + sort, sits above the grid */}
        <div className="mt-6 flex items-center justify-between gap-3 border-y border-wood-300/40 py-3 sm:mt-8">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-wood-300 bg-cream px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-forest-900 transition-colors hover:border-forest-900 lg:hidden"
          >
            <SlidersHorizontal className="size-4" strokeWidth={2} />
            Filtres
            {hasFilters ? (
              <span className="inline-grid size-4 place-items-center rounded-full bg-tangerine-500 font-display text-[9px] font-bold text-cream">
                {(activeCategory ? 1 : 0) +
                  (promosOnly ? 1 : 0) +
                  (query.trim() ? 1 : 0)}
              </span>
            ) : null}
          </button>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600 lg:inline">
            {visible.length} résultat{visible.length > 1 ? "s" : ""}
            {selectedCategory ? (
              <>
                {" "}· <span className="text-forest-900">{selectedCategory.name}</span>
              </>
            ) : null}
          </span>
          <div className="ms-auto">
            <SortMenu value={sort} onChange={setSort} />
          </div>
        </div>

        {/* Body */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block">{filtersNode}</aside>

          {/* Grid */}
          <div ref={gridTopRef} className="scroll-mt-32">
            {/* Result count — mobile only; desktop shows it in the toolbar */}
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600 lg:hidden">
              {visible.length} résultat{visible.length > 1 ? "s" : ""}
              {selectedCategory ? (
                <>
                  {" "}·{" "}
                  <span className="text-forest-900">
                    {selectedCategory.name}
                  </span>
                </>
              ) : null}
            </p>

            {visible.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
                  {pagedProducts.map((p) => (
                    <li key={p.slug}>
                      <CatalogueCard product={p} />
                    </li>
                  ))}
                </ul>

                {totalPages > 1 ? (
                  <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onChange={goToPage}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      >
        {filtersNode}
      </MobileFiltersDrawer>
    </main>
  );
}

/* ───── Catalogue card — same design as best-sellers ───────────── */
function CatalogueCard({ product }: { product: Product }) {
  const pct = discountPercent(product.price, product.oldPrice);
  return (
    <TentLink
      href={`/produit/${product.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-wood-300/50 bg-cream",
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
        <div className="mt-3 flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight text-tangerine-700 sm:text-xl">
            {formatDA(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="mt-0.5 block font-mono text-[11px] text-wood-500 line-through">
              {formatDA(product.oldPrice)}
            </span>
          ) : null}
        </div>

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

/* ───── Filter sidebar primitives ─────────────────────────────── */

function FilterSection({
  title,
  trailing,
  last,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "px-4 py-4",
        !last && "border-t border-wood-300/50"
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <p className="font-display text-[12px] font-bold uppercase tracking-[0.16em] text-forest-900">
          {title}
        </p>
        {trailing}
      </header>
      {children}
    </section>
  );
}

function CategoryRow({
  active,
  onClick,
  count,
  expandable,
  expanded,
  onToggleExpand,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          "flex flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start",
          "font-display text-[13px] transition-colors",
          active
            ? "text-tangerine-700"
            : "text-forest-900 hover:text-tangerine-700"
        )}
      >
        <span className="truncate">{children}</span>
        {typeof count === "number" ? (
          <span
            className={cn(
              "shrink-0 font-mono text-[10.5px] tabular-nums",
              active ? "text-tangerine-700" : "text-wood-500"
            )}
          >
            {count}
          </span>
        ) : null}
      </button>
      {expandable ? (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? "Replier" : "Déplier"}
          aria-expanded={expanded}
          className="grid size-6 shrink-0 place-items-center rounded-md text-wood-600 transition-colors hover:bg-cream-deep/70 hover:text-forest-900"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              expanded && "rotate-180"
            )}
            strokeWidth={2.4}
          />
        </button>
      ) : null}
    </div>
  );
}

function SubCategoryRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 rounded-md py-1 ps-7 pe-2 text-start",
        "font-display text-[12.5px] transition-colors",
        active
          ? "text-tangerine-700"
          : "text-wood-700 hover:text-tangerine-700"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1 shrink-0 rounded-full transition-colors",
          active ? "bg-tangerine-500" : "bg-wood-400"
        )}
      />
      <span className="truncate">{children}</span>
    </button>
  );
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-cream-deep/60">
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded border transition-colors",
          checked
            ? "border-forest-900 bg-forest-900 text-cream"
            : "border-wood-400 bg-cream"
        )}
      >
        {checked ? <Check className="size-2.5" strokeWidth={3.5} /> : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-display text-[13px] text-forest-900">{children}</span>
    </label>
  );
}

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-wood-600">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={PRICE_STEP}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="h-8 w-full rounded-md border border-wood-300 bg-cream px-2 font-mono text-[12px] text-wood-800 focus:border-tangerine-500 focus:outline-none focus:ring-2 focus:ring-tangerine-500/20"
      />
    </label>
  );
}

/* Custom dual-thumb price slider — two layered <input type="range">
   share a single track; non-interactive parts use pointer-events:none
   so each thumb is independently grabbable. */
function DualRange({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const span = max - min;
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;

  return (
    <div className="relative h-6 select-none">
      <style>{`
        .dual-range {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          appearance: none;
          background: transparent;
          pointer-events: none;
          margin: 0;
          padding: 0;
        }
        .dual-range::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #ed8a3c;
          border: 2px solid #f5efe0;
          box-shadow: 0 1px 4px rgba(31,58,30,0.25);
          pointer-events: auto;
          cursor: grab;
        }
        .dual-range:active::-webkit-slider-thumb { cursor: grabbing; }
        .dual-range::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #ed8a3c;
          border: 2px solid #f5efe0;
          box-shadow: 0 1px 4px rgba(31,58,30,0.25);
          pointer-events: auto;
          cursor: grab;
        }
        .dual-range::-webkit-slider-runnable-track,
        .dual-range::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}</style>

      {/* Track */}
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-wood-300" />
      {/* Active range */}
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-tangerine-500"
        style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
      />
      {/* Low thumb */}
      <input
        type="range"
        className="dual-range"
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={(e) => {
          const v = Math.min(Number(e.target.value), hi - step);
          onChange([Math.max(min, v), hi]);
        }}
        aria-label="Prix minimum"
      />
      {/* High thumb */}
      <input
        type="range"
        className="dual-range"
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={(e) => {
          const v = Math.max(Number(e.target.value), lo + step);
          onChange([lo, Math.min(max, v)]);
        }}
        aria-label="Prix maximum"
      />
    </div>
  );
}

function SortMenu({
  value,
  onChange,
}: {
  value: SortValue;
  onChange: (v: SortValue) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = SORTS.find((s) => s.value === value)!;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border bg-cream px-4 py-2.5",
          "font-mono text-[11px] uppercase tracking-[0.18em] text-forest-900",
          "transition-colors hover:border-forest-900",
          open ? "border-forest-900" : "border-wood-300"
        )}
      >
        <span className="hidden sm:inline text-wood-600">Trier ·</span>
        {current.label}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
          strokeWidth={2.2}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute end-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-lg border border-wood-300 bg-cream shadow-[0_18px_40px_-14px_rgba(31,58,30,0.3)]"
        >
          {SORTS.map((s) => {
            const active = s.value === value;
            return (
              <li key={s.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 font-display text-[13px] transition-colors",
                    active
                      ? "bg-forest-900 text-cream"
                      : "text-wood-800 hover:bg-cream-deep hover:text-forest-900"
                  )}
                >
                  <span>{s.label}</span>
                  {active ? (
                    <Check
                      className="size-4 text-tangerine-300"
                      strokeWidth={2.4}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* ───── Pagination — prev · numbered pages (with ellipsis) · next ── */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  const pages = buildPageList(page, totalPages);
  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2"
    >
      <PaginationArrow
        direction="prev"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      />
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ell-${i}`}
            aria-hidden
            className="grid size-9 place-items-center font-mono text-[12px] text-wood-500"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Aller à la page ${p}`}
            aria-current={page === p ? "page" : undefined}
            className={cn(
              "grid size-9 place-items-center rounded-full font-display text-[13px] font-semibold transition-colors",
              page === p
                ? "bg-forest-900 text-cream"
                : "text-forest-900 hover:bg-cream-deep"
            )}
          >
            {p}
          </button>
        )
      )}
      <PaginationArrow
        direction="next"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      />
    </nav>
  );
}

function PaginationArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  const Icon = isPrev ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? "Page précédente" : "Page suivante"}
      className={cn(
        "grid size-9 place-items-center rounded-full border transition-colors",
        disabled
          ? "cursor-not-allowed border-wood-300/60 text-wood-400"
          : "border-wood-300 text-forest-900 hover:border-forest-900 hover:bg-cream-deep"
      )}
    >
      <Icon className="size-4 rtl:rotate-180" strokeWidth={2.2} />
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-wood-300/50 bg-cream-deep/30 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-cream ring-1 ring-wood-300/60">
        <ShoppingBag className="size-5 text-wood-600" strokeWidth={1.8} />
      </span>
      <p className="font-display text-base font-semibold text-forest-900">
        Aucun produit ne correspond à vos filtres
      </p>
      <p className="max-w-md text-sm text-wood-700">
        Essayez d&apos;élargir votre recherche ou réinitialisez les filtres.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-forest-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cream transition-colors hover:bg-forest-700"
      >
        Réinitialiser
      </button>
    </div>
  );
}

/* ───── Mobile filters drawer ─────────────────────────────────── */
function MobileFiltersDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] overflow-hidden lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fermer les filtres"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={cn(
          "absolute inset-0 bg-forest-950/60 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtres"
        className={cn(
          "absolute inset-y-0 start-0 flex w-[min(85vw,360px)] flex-col bg-cream shadow-[0_-8px_60px_-12px_rgba(31,58,30,0.4)]",
          "transition-transform duration-300 ease-out",
          open
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-wood-300/40 px-5 py-4">
          <p className="font-display text-base font-bold text-forest-900">
            Filtres
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-9 place-items-center rounded-full text-wood-800 transition-colors hover:bg-wood-100 hover:text-forest-900"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </header>
        <div className="flex flex-1 flex-col gap-7 overflow-y-auto p-5">
          {children}
        </div>
        <footer className="border-t border-wood-300/40 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-tangerine-500 px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-tangerine-600"
          >
            Voir les résultats
          </button>
        </footer>
      </aside>
    </div>
  );
}
