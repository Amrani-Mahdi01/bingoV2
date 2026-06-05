"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ProductActions } from "@/components/product/product-actions";
import { TentLink } from "@/components/ui/tent-link";
import { productsApi, type ApiProduct } from "@/lib/api/products";
import { useFormatPrice, useLanguage, useProductName } from "@/lib/i18n";
import { PRODUCTS, discountPercent, type Product } from "@/lib/products";
import { useSiteCategories } from "@/lib/site-categories-context";
import { cn } from "@/lib/utils";

/** Flattened product row the catalogue page works with. Built on mount
 *  from /api/products?perPage=100 — keeps every filter/sort instant
 *  without per-keystroke API calls. */
interface CatalogueProduct {
  slug: string;
  nameFr: string;
  nameAr: string | null;
  brand: string;
  brandSlug: string | null;
  price: number;
  oldPrice: number | null;
  image: string;
  /** Leaf category slug (could be a sub-category or a top-level cat with no children). */
  categorySlug: string | null;
  /** Resolved parent (top-level) category slug for filtering "all under X". */
  parentCategorySlug: string | null;
  isPromo: boolean;
  stock: number;
  trackStock: boolean;
  allowBackorder: boolean;
}

const SORTS = [
  { value: "popular",    labelKey: "sort.popular" },
  { value: "newest",     labelKey: "sort.newest" },
  { value: "price-asc",  labelKey: "sort.priceAsc" },
  { value: "price-desc", labelKey: "sort.priceDesc" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

// Reasonable price bounds for the catalogue.
const PRICE_MIN = 0;
const PRICE_MAX = 50000;
const PRICE_STEP = 500;

const PAGE_SIZE = 9;

/** Shallow equality for two Sets of strings — used to detect whether
 *  the catalogue's draft filter values differ from the applied ones. */
function setEquals(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/** Convert the backend ApiProduct shape into the lighter CatalogueProduct
 *  the page works with. `parentBySlug` lets us resolve a leaf category
 *  to its top-level parent (so "Tentes & abris" filter shows products
 *  filed under any sub like "Tentes 2-3 places"). */
function adaptApiProduct(
  p: ApiProduct,
  parentBySlug: Map<string, string>,
): CatalogueProduct {
  const catSlug = p.category?.slug ?? null;
  const primary =
    p.images?.find((img) => img.isPrimary)?.url ?? p.images?.[0]?.url ?? "";
  return {
    slug: p.slug,
    nameFr: p.nameFr,
    nameAr: p.nameAr ?? null,
    brand: p.brand?.name ?? "—",
    brandSlug: p.brand?.slug ?? null,
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    image: primary,
    categorySlug: catSlug,
    parentCategorySlug: catSlug ? parentBySlug.get(catSlug) ?? catSlug : null,
    isPromo: !!p.isPromo,
    stock: p.stock ?? 0,
    trackStock: !!p.trackStock,
    allowBackorder: !!p.allowBackorder,
  };
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
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  // Top-level categories with children, fetched once at layout SSR.
  const { list: categoriesList } = useSiteCategories();

  // Read filter intent from the URL (e.g. ?promo=1 from the
  // header "Promotions" link, ?category=tentes from a category tile,
  // ?sort=popular from the best-sellers "Voir le classement" CTA).
  const initialPromosOnly =
    searchParams.get("promo") === "1" ||
    searchParams.get("promo") === "true";
  const initialCategory = searchParams.get("category");
  const initialSub = searchParams.get("sub");
  const initialSort = readSort(searchParams.get("sort"));

  // A `?sub=` value is only honored if it actually belongs to the
  // `?category=` parent — otherwise we silently drop it.
  // Sub-categories aren't included in the SiteCategoriesProvider top-level
  // list, so we walk each top-level's `children` (loaded as nested on the
  // categories tree) — see hookups further down where we hydrate them.
  const findTopBySlug = React.useCallback(
    (slug: string | null) =>
      slug ? categoriesList.find((c) => c.slug === slug) ?? null : null,
    [categoriesList],
  );
  const initialCategoryObj = findTopBySlug(initialCategory);

  const [activeCategory, setActiveCategory] = React.useState<string | null>(
    initialCategoryObj ? initialCategoryObj.slug : null,
  );
  const [activeSubCategory, setActiveSubCategory] = React.useState<
    string | null
  >(initialSub ?? null);
  const [expandedCategories, setExpandedCategories] = React.useState<
    Set<string>
  >(() =>
    initialSub && initialCategoryObj
      ? new Set([initialCategoryObj.slug])
      : new Set(),
  );

  // Whole catalogue loaded once. Filters and sort run client-side on
  // this list — instant UX, single API request per page load.
  const [allProducts, setAllProducts] = React.useState<CatalogueProduct[] | null>(
    null,
  );
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ctrl = new AbortController();
    productsApi
      .listPublic({ perPage: 100, signal: ctrl.signal })
      .then((res) => {
        // Build leaf-slug → top-level-slug map so a product filed under
        // a sub-category still matches its parent in the sidebar filter.
        const parentBySlug = new Map<string, string>();
        for (const top of categoriesList) {
          parentBySlug.set(top.slug, top.slug);
          for (const sub of top.children ?? []) {
            parentBySlug.set(sub.slug, top.slug);
          }
        }
        const list: CatalogueProduct[] = res.data.map((p) =>
          adaptApiProduct(p, parentBySlug),
        );
        setAllProducts(list);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === "AbortError") return;
        setAllProducts([]);
        setLoadError(
          (err as Error)?.message ?? "Impossible de charger le catalogue.",
        );
      });
    return () => ctrl.abort();
  }, [categoriesList]);
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

  /* ─── Draft layer (price + brands only) ──────────────────────────
     These two filter dimensions are batched behind an Apply button
     because they're the ones the merchant typically tweaks several
     times before committing (slide the price, tick a few brand boxes).
     Categories, sub-categories, stock, and promo all stay LIVE — they
     each represent a single decisive choice. */
  const [draftSelectedBrands, setDraftSelectedBrands] = React.useState<
    Set<string>
  >(() => new Set(selectedBrands));
  const [draftPriceMin, setDraftPriceMin] = React.useState(priceMin);
  const [draftPriceMax, setDraftPriceMax] = React.useState(priceMax);

  /** True when the draft differs from the applied state — Apply button
   *  enables itself, Cancel button becomes meaningful. */
  const draftDirty =
    draftPriceMin !== priceMin ||
    draftPriceMax !== priceMax ||
    !setEquals(draftSelectedBrands, selectedBrands);

  /** Apply the draft → triggers the URL sync + grid re-filter via the
   *  existing applied state. Also closes the mobile drawer so the user
   *  sees the new grid right away on phones. */
  const applyDraft = React.useCallback(() => {
    setSelectedBrands(new Set(draftSelectedBrands));
    setPriceMin(draftPriceMin);
    setPriceMax(draftPriceMax);
    setMobileFiltersOpen(false);
  }, [draftSelectedBrands, draftPriceMin, draftPriceMax]);

  /** Restore the draft to the currently-applied values — i.e. discard
   *  pending price / brand edits. */
  const cancelDraft = React.useCallback(() => {
    setDraftSelectedBrands(new Set(selectedBrands));
    setDraftPriceMin(priceMin);
    setDraftPriceMax(priceMax);
  }, [selectedBrands, priceMin, priceMax]);

  // Unique brand names across the loaded catalogue, sorted.
  const allBrands = React.useMemo(() => {
    const set = new Set<string>();
    (allProducts ?? []).forEach((p) => {
      if (p.brand && p.brand !== "—") set.add(p.brand);
    });
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [allProducts]);

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
    setDraftSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  };

  const visible = React.useMemo(() => {
    let list = (allProducts ?? []).slice();

    if (activeCategory) {
      // Match products whose top-level (resolved) category is the one
      // picked in the sidebar — works for both direct top-level
      // attachments and products filed under a sub.
      list = list.filter((p) => p.parentCategorySlug === activeCategory);
    }
    if (activeSubCategory) {
      // Narrow to the leaf sub-category. Products attached directly to
      // the parent (not any sub) drop out — same intent as before.
      list = list.filter((p) => p.categorySlug === activeSubCategory);
    }
    if (selectedBrands.size > 0) {
      list = list.filter((p) => selectedBrands.has(p.brand));
    }
    list = list.filter((p) => p.price >= priceMin && p.price <= priceMax);
    if (promosOnly) {
      list = list.filter(
        (p) => p.isPromo || (p.oldPrice != null && p.oldPrice > p.price),
      );
    }
    if (inStockOnly) {
      // Available if stock-tracking is off, OR backorder is allowed,
      // OR stock > 0 — mirrors the public products endpoint.
      list = list.filter(
        (p) => !p.trackStock || p.allowBackorder || p.stock > 0,
      );
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.nameFr.toLowerCase().includes(q) ||
          (p.nameAr ?? "").includes(query.trim()) ||
          p.brand.toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      // "popular" / "newest" — no client-side metric; keep source order
    }
    return list;
  }, [
    allProducts,
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

  const resetFilters = () => {
    // Applied state — drives the grid / URL.
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
    // Draft state for batched filters (price + brands) — keep the
    // sidebar in sync so the Apply button doesn't go "dirty" right
    // after a reset.
    setDraftPriceMin(PRICE_MIN);
    setDraftPriceMax(PRICE_MAX);
    setDraftSelectedBrands(new Set());
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
    activeSubCategory !== null ||
    promosOnly ||
    inStockOnly ||
    query.trim() !== "" ||
    priceMin !== PRICE_MIN ||
    priceMax !== PRICE_MAX ||
    selectedBrands.size > 0;

  const selectedCategory = activeCategory
    ? categoriesList.find((c) => c.slug === activeCategory) ?? null
    : null;
  const selectedCategoryLabel = selectedCategory
    ? lang === "ar" && selectedCategory.nameAr
      ? selectedCategory.nameAr
      : selectedCategory.nameFr
    : null;

  // If the URL search params change after mount (user clicks the
  // Promotions nav link while already on /catalogue), reflect that in
  // the filter state. Same-route navigation re-uses the component, so
  // lazy useState init alone isn't enough.
  React.useEffect(() => {
    const p = searchParams.get("promo");
    setPromosOnly(p === "1" || p === "true");

    const stock = searchParams.get("stock");
    setInStockOnly(stock === "1" || stock === "true");

    const c = searchParams.get("category");
    const sub = searchParams.get("sub");
    const cat = c ? categoriesList.find((cc) => cc.slug === c) ?? null : null;
    if (cat) {
      setActiveCategory(cat.slug);
      const subOk =
        sub && (cat.children ?? []).some((sc) => sc.slug === sub) ? sub : null;
      setActiveSubCategory(subOk);
      if (subOk) {
        setExpandedCategories((prev) => {
          if (prev.has(cat.slug)) return prev;
          const next = new Set(prev);
          next.add(cat.slug);
          return next;
        });
      }
    } else if (!c) {
      // No category param in URL → clear any stale state (handles the
      // case where the user nukes the filter via the breadcrumb).
      setActiveCategory(null);
      setActiveSubCategory(null);
    }
    const s = readSort(searchParams.get("sort"));
    if (s) setSort(s);
    const q = searchParams.get("q") ?? "";
    setQuery(q);

    const minRaw = Number(searchParams.get("min"));
    const maxRaw = Number(searchParams.get("max"));
    const nextMin =
      Number.isFinite(minRaw) && minRaw >= PRICE_MIN ? minRaw : PRICE_MIN;
    const nextMax =
      Number.isFinite(maxRaw) && maxRaw <= PRICE_MAX && maxRaw > 0
        ? maxRaw
        : PRICE_MAX;
    setPriceMin(nextMin);
    setPriceMax(nextMax);
    setDraftPriceMin(nextMin);
    setDraftPriceMax(nextMax);

    const brandsRaw = searchParams.get("brands");
    const nextBrands = brandsRaw
      ? new Set(brandsRaw.split(",").filter(Boolean))
      : new Set<string>();
    setSelectedBrands(nextBrands);
    setDraftSelectedBrands(new Set(nextBrands));

    // Page hydration. Stamp `prevFiltersRef` with the signature we're
    // about to apply so the page-reset effect below sees no diff and
    // leaves `?page=` alone.
    const nextCategory = cat ? cat.slug : !c ? null : activeCategory;
    const nextSub =
      cat && sub && (cat.children ?? []).some((sc) => sc.slug === sub)
        ? sub
        : !c
        ? null
        : activeSubCategory;
    const nextSort = s ?? sort;
    const nextPromo = p === "1" || p === "true";
    const nextStock = stock === "1" || stock === "true";
    const nextSignature =
      `${nextCategory ?? ""}|${nextSub ?? ""}|${nextSort}|` +
      `${nextPromo ? 1 : 0}|${nextStock ? 1 : 0}|${q.trim()}|` +
      `${nextMin}|${nextMax}|${[...nextBrands].sort().join(",")}`;
    prevFiltersRef.current = nextSignature;

    const pageRaw = Number(searchParams.get("page"));
    const nextPage =
      Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    setPage(nextPage);
  }, [searchParams, categoriesList]);

  // Reset to page 1 whenever the filter set changes so the user doesn't
  // land on an empty page after narrowing the results — but only on
  // *real* filter edits, not on the URL→state hydration that fires on
  // mount and on back/forward nav (which carries its own `?page=`).
  //
  // The URL→state effect below stamps the next signature into
  // `prevFiltersRef` BEFORE calling setX, so by the time this effect
  // runs the signature already matches and we correctly bail out,
  // preserving the URL-supplied page.
  const filtersSignature =
    `${activeCategory ?? ""}|${activeSubCategory ?? ""}|${sort}|` +
    `${promosOnly ? 1 : 0}|${inStockOnly ? 1 : 0}|${query.trim()}|` +
    `${priceMin}|${priceMax}|${[...selectedBrands].sort().join(",")}`;
  const prevFiltersRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (
      prevFiltersRef.current !== null &&
      prevFiltersRef.current !== filtersSignature
    ) {
      setPage(1);
    }
    prevFiltersRef.current = filtersSignature;
  }, [filtersSignature]);

  /* ─── URL ⇄ state sync ────────────────────────────────────────────
     Mirror the current filter state into the address bar so the page
     is bookmarkable / shareable. Uses router.replace (not push) so the
     back button doesn't fill with intermediate filter clicks. Skips
     the first render so we don't clobber the URL during hydration.
     The hydration is the OTHER direction (URL → state); see the
     `searchParams` effect above. */
  const hasSyncedOnceRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasSyncedOnceRef.current) {
      hasSyncedOnceRef.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (activeSubCategory) params.set("sub", activeSubCategory);
    if (sort && sort !== "popular") params.set("sort", sort);
    if (promosOnly) params.set("promo", "1");
    if (inStockOnly) params.set("stock", "1");
    const qTrim = query.trim();
    if (qTrim) params.set("q", qTrim);
    if (priceMin !== PRICE_MIN) params.set("min", String(priceMin));
    if (priceMax !== PRICE_MAX) params.set("max", String(priceMax));
    if (selectedBrands.size > 0) {
      params.set("brands", [...selectedBrands].sort().join(","));
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    // Only push when the URL would actually change — avoids triggering
    // the inverse `searchParams` effect on every render.
    if (next !== `${pathname}${window.location.search}`) {
      router.replace(next, { scroll: false });
    }
  }, [
    pathname,
    router,
    activeCategory,
    activeSubCategory,
    sort,
    promosOnly,
    inStockOnly,
    query,
    priceMin,
    priceMax,
    selectedBrands,
    page,
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
      {/* Header — title only. Apply/Cancel + Clear buttons live in the
          action bar right below so they're the first thing the merchant
          sees and never has to scroll past the filter sections. */}
      <div className="px-4 py-3">
        <p className="font-display text-sm font-bold tracking-[-0.01em] text-forest-900">
          {t("filters.title")}
        </p>
      </div>

      {/* Top action bar — only the "Retirer les filtres" button lives
          here now. The Apply / Cancel pair has moved down so it sits
          right after the two batched sections it commits (Prix +
          Marques) and reads as their direct call-to-action. */}
      {hasFilters ? (
        <div className="border-y border-wood-300/50 bg-cream-deep/40 px-4 py-3">
          <button
            type="button"
            onClick={resetFilters}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50/60 px-4 py-2",
              "font-mono text-[10px] uppercase tracking-[0.2em] text-red-700 transition-colors",
              "hover:border-red-300 hover:bg-red-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
            )}
          >
            <X className="size-3" strokeWidth={2.4} />
            {lang === "ar" ? "إزالة الفلاتر" : "Retirer les filtres"}
          </button>
        </div>
      ) : null}

      {/* Catégories */}
      <FilterSection title={t("filters.section.categories")}>
        <ul className="flex flex-col">
          <li>
            <CategoryRow
              active={activeCategory === null && !activeSubCategory}
              onClick={() => {
                setActiveCategory(null);
                setActiveSubCategory(null);
              }}
            >
              {t("filters.allCategories")}
            </CategoryRow>
          </li>
          {categoriesList.map((c) => {
            const subs = c.children ?? [];
            const expanded = expandedCategories.has(c.slug);
            const hasSubs = subs.length > 0;
            const label =
              lang === "ar" && c.nameAr ? c.nameAr : c.nameFr;
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
                  count={c.productCount}
                  expandable={hasSubs}
                  expanded={expanded}
                  onToggleExpand={() => toggleCategoryExpansion(c.slug)}
                >
                  {label}
                </CategoryRow>
                {hasSubs && expanded ? (
                  <ul className="mt-0.5 flex flex-col">
                    {subs.map((sc) => {
                      const subLabel =
                        lang === "ar" && sc.nameAr ? sc.nameAr : sc.nameFr;
                      return (
                        <li key={sc.slug}>
                          <SubCategoryRow
                            active={activeSubCategory === sc.slug}
                            onClick={() => {
                              setActiveCategory(c.slug);
                              setActiveSubCategory(sc.slug);
                            }}
                          >
                            {subLabel}
                          </SubCategoryRow>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* Prix */}
      <FilterSection
        title={t("filters.section.price")}
        trailing={
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-wood-700">
            {formatPrice(draftPriceMin)} — {formatPrice(draftPriceMax)}
          </span>
        }
      >
        <DualRange
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={[draftPriceMin, draftPriceMax]}
          onChange={([lo, hi]) => {
            setDraftPriceMin(lo);
            setDraftPriceMax(hi);
          }}
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <PriceField
            label={t("filters.price.min")}
            value={draftPriceMin}
            onChange={(v) =>
              setDraftPriceMin(Math.min(Math.max(0, v), draftPriceMax))
            }
          />
          <PriceField
            label={t("filters.price.max")}
            value={draftPriceMax}
            onChange={(v) =>
              setDraftPriceMax(Math.max(Math.min(PRICE_MAX, v), draftPriceMin))
            }
          />
        </div>
      </FilterSection>

      {/* Marques */}
      <FilterSection title={t("filters.section.brands")}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-wood-600"
            strokeWidth={2}
          />
          <input
            type="search"
            value={brandsQuery}
            onChange={(e) => setBrandsQuery(e.target.value)}
            placeholder={t("filters.brands.placeholder")}
            aria-label={t("filters.brands.aria")}
            className="h-9 w-full rounded-md border border-wood-300 bg-cream ps-9 pe-3 font-mono text-[11.5px] text-wood-800 placeholder:text-wood-500 transition-[border-color,box-shadow] duration-200 focus:border-tangerine-500 focus:outline-none focus:ring-4 focus:ring-tangerine-500/15"
          />
        </div>
        <ul className="mt-3 flex flex-col gap-0.5">
          {visibleBrandsList.length === 0 ? (
            <li className="px-2 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-500">
              {t("filters.brands.none")}
            </li>
          ) : (
            visibleBrandsList.map((b) => (
              <li key={b}>
                <CheckRow
                  checked={draftSelectedBrands.has(b)}
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
            {t("filters.brands.more", { n: hiddenBrandsCount })}
            <ChevronDown className="size-3" strokeWidth={2.4} />
          </button>
        ) : null}
        {showAllBrands && allBrands.length > 5 ? (
          <button
            type="button"
            onClick={() => setShowAllBrands(false)}
            className="mt-2 inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700 transition-colors hover:text-tangerine-700"
          >
            {t("filters.brands.less")}
            <ChevronDown
              className="size-3 rotate-180"
              strokeWidth={2.4}
            />
          </button>
        ) : null}
      </FilterSection>

      {/* Apply / Cancel for the batched Prix + Marques sections above.
          Sits right after Marques so it reads as the direct action
          for the two filters that don't apply instantly. */}
      {draftDirty ? (
        <div className="flex gap-2 border-t border-wood-300/50 bg-cream-deep/40 px-4 py-3">
          <button
            type="button"
            onClick={cancelDraft}
            className={cn(
              "inline-flex flex-1 items-center justify-center rounded-full border border-wood-300 bg-cream px-4 py-2.5",
              "font-mono text-[10.5px] uppercase tracking-[0.2em] text-forest-900 transition-colors",
              "hover:border-forest-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500/40",
            )}
          >
            {lang === "ar" ? "إلغاء" : "Annuler"}
          </button>
          <button
            type="button"
            onClick={applyDraft}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-tangerine-500 px-4 py-2.5",
              "font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-cream",
              "shadow-[0_10px_24px_-12px_rgba(234,108,29,0.55)] transition-all duration-200",
              "hover:-translate-y-0.5 hover:bg-tangerine-600",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40",
            )}
          >
            {lang === "ar" ? "تطبيق" : "Appliquer"}
          </button>
        </div>
      ) : null}

      {/* Disponibilité — last section, no bottom divider */}
      <FilterSection title={t("filters.section.availability")} last>
        <div className="flex flex-col gap-0.5">
          <CheckRow checked={inStockOnly} onChange={setInStockOnly}>
            {t("filters.availability.inStock")}
          </CheckRow>
          <CheckRow checked={promosOnly} onChange={setPromosOnly}>
            {t("filters.availability.promo")}
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
          aria-label={t("breadcrumb.aria")}
          className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700"
        >
          <Link
            href="/"
            className="transition-colors hover:text-tangerine-700"
          >
            {t("breadcrumb.home")}
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
                {t("breadcrumb.catalogue")}
              </button>
              <ChevronRight
                className="size-3 text-wood-500 rtl:rotate-180"
                strokeWidth={2.2}
              />
              <span className="text-forest-900">{selectedCategoryLabel}</span>
            </>
          ) : (
            <span className="text-forest-900">{t("breadcrumb.catalogue")}</span>
          )}
        </nav>

        {/* Page header — eyebrow / big title / subtitle */}
        <header className="mt-6 max-w-3xl md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            {t("catalogue.eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-[44px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 rtl:pb-2 rtl:leading-[1.25] sm:text-[64px] md:text-[80px]">
            {selectedCategoryLabel ?? t("catalogue.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-wood-700 sm:text-base">
            {t("catalogue.subtitle")}
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
            placeholder={t("catalogue.search.placeholder")}
            aria-label={t("catalogue.search.aria")}
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
              aria-label={t("catalogue.search.clearAria")}
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
            {t("filters.title")}
            {hasFilters ? (
              <span className="inline-grid size-4 place-items-center rounded-full bg-tangerine-500 font-display text-[9px] font-bold text-cream">
                {(activeCategory ? 1 : 0) +
                  (activeSubCategory ? 1 : 0) +
                  (promosOnly ? 1 : 0) +
                  (query.trim() ? 1 : 0)}
              </span>
            ) : null}
          </button>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600 lg:inline">
            {t("toolbar.results", { n: visible.length })}
            {selectedCategory ? (
              <>
                {" "}·{" "}
                <span className="text-forest-900">
                  {selectedCategoryLabel}
                </span>
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
              {t("toolbar.results", { n: visible.length })}
              {selectedCategory ? (
                <>
                  {" "}·{" "}
                  <span className="text-forest-900">
                    {selectedCategoryLabel}
                  </span>
                </>
              ) : null}
            </p>

            {allProducts === null ? (
              <p className="rounded-md border border-wood-300/40 bg-cream-deep/30 px-4 py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600">
                {t("catalogue.search.placeholder")
                  ? "Chargement…"
                  : "Loading…"}
              </p>
            ) : loadError ? (
              <p className="rounded-md border border-red-300/60 bg-red-50 px-4 py-6 text-sm text-red-700">
                {loadError}
              </p>
            ) : visible.length === 0 ? (
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
        footer={
          // Dynamic CTA bar:
          //   • Dirty (price/brand pending) → Annuler + Appliquer
          //   • Otherwise → Voir les N résultats (closes drawer)
          // Both states put the action at the bottom edge, always
          // reachable without scrolling through every section.
          draftDirty ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelDraft}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-wood-300 bg-cream px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.2em] text-forest-900 transition-colors hover:border-forest-900"
              >
                {lang === "ar" ? "إلغاء" : "Annuler"}
              </button>
              <button
                type="button"
                onClick={applyDraft}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-tangerine-500 px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_24px_-12px_rgba(234,108,29,0.55)] transition-colors hover:bg-tangerine-600"
              >
                {lang === "ar" ? "تطبيق" : "Appliquer"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full rounded-full bg-tangerine-500 px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-tangerine-600"
            >
              {t("toolbar.results", { n: visible.length })}
            </button>
          )
        }
      >
        {filtersNode}
      </MobileFiltersDrawer>
    </main>
  );
}

/* ───── Catalogue card — same design as best-sellers ───────────── */
function CatalogueCard({ product }: { product: CatalogueProduct }) {
  const { t } = useLanguage();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  const pct = discountPercent(product.price, product.oldPrice ?? undefined);
  const displayName = productName({
    name: product.nameFr,
    nameAr: product.nameAr ?? undefined,
  });
  // The cart + favorites contexts expect the legacy local `Product`
  // shape. Synthesize one from the backend row so every card gets the
  // "Ajouter au panier" + heart actions, regardless of whether the
  // slug happens to exist in the legacy mock catalogue.
  const cartProduct: Product = React.useMemo(() => {
    const legacy = PRODUCTS.find((p) => p.slug === product.slug);
    if (legacy) return legacy;
    return {
      slug: product.slug,
      name: product.nameFr,
      nameAr: product.nameAr ?? undefined,
      brand: product.brand,
      price: product.price,
      oldPrice: product.oldPrice ?? undefined,
      image: product.image,
      categorySlug: product.parentCategorySlug ?? undefined,
      description: "",
      features: [],
      stock: product.stock,
      trackStock: product.trackStock,
      allowBackorder: product.allowBackorder,
    };
  }, [product]);
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
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        ) : null}

        {pct ? (
          <span className="absolute start-3 top-3 z-10 inline-flex items-center rounded-full bg-tangerine-500 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cream shadow-sm sm:start-4 sm:top-4">
            -{pct}%
          </span>
        ) : null}

        <ProductActions product={cartProduct} />
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="truncate font-display text-[14.5px] font-semibold leading-snug text-forest-900 sm:text-base">
          {displayName}
        </h3>
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-wood-600">
          {product.brand}
        </p>
        <div className="mt-3 flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight text-tangerine-700 sm:text-xl">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="mt-0.5 block font-mono text-[11px] text-wood-500 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:pt-4">
          <span className="inline-flex h-7 items-center justify-center gap-1.5 rounded-2xl border border-forest-900 bg-forest-900 px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cream transition-colors duration-300 hover:bg-tangerine-500 sm:h-9 sm:flex-1 sm:gap-2 sm:px-3 sm:text-[10px] sm:tracking-[0.2em]">
            <ShoppingBag className="size-3" strokeWidth={2.2} />
            {t("card.order")}
          </span>
          <AddToCartButton product={cartProduct} />
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
  const { t } = useLanguage();
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
          aria-label={
            expanded
              ? t("filters.category.collapse")
              : t("filters.category.expand")
          }
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
  const { t } = useLanguage();
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
      {/* Active range — uses logical inset-inline-start/end so it
          mirrors automatically in RTL, matching the browser's native
          flip of <input type="range"> thumbs (min on the start side,
          max on the end side, in both directions). */}
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-tangerine-500"
        style={{
          insetInlineStart: `${loPct}%`,
          insetInlineEnd: `${100 - hiPct}%`,
        }}
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
        aria-label={t("filters.price.minAria")}
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
        aria-label={t("filters.price.maxAria")}
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
  const { t } = useLanguage();
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
        <span className="hidden sm:inline text-wood-600">{t("sort.prefix")}</span>
        {t(current.labelKey)}
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
                  <span>{t(s.labelKey)}</span>
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
  const { t } = useLanguage();
  const pages = buildPageList(page, totalPages);
  return (
    <nav
      aria-label={t("pagination.aria")}
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
            aria-label={t("pagination.go", { n: p })}
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
  const { t } = useLanguage();
  const isPrev = direction === "prev";
  const Icon = isPrev ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? t("pagination.prev") : t("pagination.next")}
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
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-wood-300/50 bg-cream-deep/30 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-cream ring-1 ring-wood-300/60">
        <ShoppingBag className="size-5 text-wood-600" strokeWidth={1.8} />
      </span>
      <p className="font-display text-base font-semibold text-forest-900">
        {t("catalogue.empty.title")}
      </p>
      <p className="max-w-md text-sm text-wood-700">
        {t("catalogue.empty.subtitle")}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-forest-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cream transition-colors hover:bg-forest-700"
      >
        {t("catalogue.empty.reset")}
      </button>
    </div>
  );
}

/* ───── Mobile filters drawer ─────────────────────────────────── */
function MobileFiltersDrawer({
  open,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional override for the bottom CTA bar. When omitted the drawer
   *  falls back to a single "show N results" button. */
  footer?: React.ReactNode;
}) {
  const { t } = useLanguage();
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
        // `h-dvh` uses the dynamic viewport height — important on
        // mobile Safari / Chrome where the address bar and toolbar
        // shrink/grow with scroll. Without it, `inset-0` extends
        // behind the browser chrome and the drawer's footer ends up
        // offscreen, which in turn breaks the inner scroll calc.
        "fixed inset-x-0 top-0 z-[60] h-dvh overflow-hidden lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t("mobileFilters.closeAria")}
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
        aria-label={t("filters.title")}
        className={cn(
          // Explicit `h-full` on the aside as a belt-and-suspenders
          // backup — some older mobile browsers don't propagate the
          // parent's dvh-based height through `inset-y-0` alone.
          "absolute inset-y-0 start-0 flex h-full w-[min(85vw,360px)] flex-col bg-cream shadow-[0_-8px_60px_-12px_rgba(31,58,30,0.4)]",
          "transition-transform duration-300 ease-out",
          open
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-wood-300/40 px-5 py-4">
          <p className="font-display text-base font-bold text-forest-900">
            {t("filters.title")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("mobileFilters.close")}
            className="grid size-9 place-items-center rounded-full text-wood-800 transition-colors hover:bg-wood-100 hover:text-forest-900"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </header>
        {/* Body — full bleed so the filter card hugs the drawer edges
            and we don't lose horizontal space to extra padding. Bottom
            padding leaves room above the sticky footer so the last
            section isn't visually flush with the action bar.
            `min-h-0` is critical: without it the flex-1 child refuses
            to shrink below its content height and overflow-y-auto
            becomes a no-op (classic flexbox+overflow gotcha).
            Smooth touch scroll on iOS via `-webkit-overflow-scrolling`. */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
        <footer className="border-t border-wood-300/40 bg-cream-deep/30 px-4 py-3">
          {footer ?? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-tangerine-500 px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-tangerine-600"
            >
              {t("mobileFilters.show")}
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
