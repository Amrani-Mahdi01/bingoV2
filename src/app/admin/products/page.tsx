"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Body } from "@/components/ui/typography";
import { StockPill } from "@/components/admin/StockPill";
import { brandsApi, type ApiBrand } from "@/lib/api/brands";
import { categoriesApi, type ApiCategory } from "@/lib/api/categories";
import { productsApi, type ApiProduct } from "@/lib/api/products";
import { downloadCSV, toCSV } from "@/lib/csv";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { formatDZD } from "@/lib/format";
import type { Brand, Category, Product } from "@/lib/types";

/**
 * Convert a Laravel `ApiProduct` to the storefront-shaped `Product` the
 * table UI was originally built against. Keeps the rest of the page
 * unchanged. FR is the canonical name in the admin dashboard.
 */
function adaptProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.nameFr,
    description: p.descriptionFr ?? "",
    descriptionShort: p.descriptionShortFr ?? "",
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.altFr ?? "",
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    stock: p.stock,
    stockStatus: p.stockStatus,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    isPromo: p.isPromo,
    rating: p.rating,
    reviewCount: p.reviewCount,
    viewCount: p.viewCount,
    soldCount: p.soldCount,
    category: p.category
      ? {
          id: p.category.id,
          slug: p.category.slug,
          name: p.category.nameFr,
          icon: p.category.icon,
          parentId: p.category.parentId ?? undefined,
          productCount: p.category.productCount,
          displayOrder: p.category.displayOrder ?? 0,
        }
      : ({} as Category),
    brand: p.brand
      ? {
          id: p.brand.id,
          slug: p.brand.slug,
          name: p.brand.name,
        }
      : ({} as Brand),
    variants: [],
    attributes: [],
    createdAt: "",
    updatedAt: "",
  };
}

function adaptCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    slug: c.slug,
    name: c.nameFr,
    icon: c.icon,
    parentId: c.parentId ?? undefined,
    productCount: c.productCount,
    displayOrder: c.displayOrder ?? 0,
  };
}

function adaptBrand(b: ApiBrand): Brand {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
  };
}

const PAGE_SIZE = 20;

/** CSV column contract — export writes these in this order, import
 *  matches by header name (so column reordering in Excel is fine). */
const CSV_HEADERS = [
  "sku",
  "slug",
  "nameFr",
  "nameAr",
  "categoryName",
  "brandName",
  "price",
  "oldPrice",
  "stock",
  "lowStockThreshold",
  "isActive",
  "isFeatured",
  "isNew",
  "isBestSeller",
  "isPromo",
  "descriptionShortFr",
  "descriptionShortAr",
] as const;

export default function AdminProductsPage() {
  const [allProducts, setAllProducts] = React.useState<Product[] | null>(null);
  // Raw API products kept around so bulk-update calls have access to
  // every column (categoryId, brandId, descriptions, etc.) which the
  // storefront-shaped `Product` adapter drops.
  const [allRawProducts, setAllRawProducts] = React.useState<ApiProduct[]>([]);
  const [allCategories, setAllCategories] = React.useState<Category[]>([]);
  const [allBrands, setAllBrands] = React.useState<Brand[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [brandFilter, setBrandFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [promoOnly, setPromoOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);
  // Server-reported counts — drive the pagination footer so it shows
  // the true catalogue size even when only the current 20 rows are
  // loaded. Falls back to client-derived numbers before the first
  // response lands.
  const [serverMeta, setServerMeta] = React.useState<{
    total: number;
    lastPage: number;
  } | null>(null);
  const confirm = useConfirm();

  // Categories + brands rarely change — load them once.
  const loadMeta = React.useCallback(async () => {
    try {
      const [cats, brands] = await Promise.all([
        categoriesApi.listAll(),
        brandsApi.listAll(),
      ]);
      const flatCats: ApiCategory[] = [];
      for (const top of cats) {
        flatCats.push(top);
        for (const sub of top.children ?? []) flatCats.push(sub);
      }
      setAllCategories(flatCats.map(adaptCategory));
      setAllBrands(brands.map(adaptBrand));
    } catch (err) {
      console.error("[admin/products] meta load failed", err);
    }
  }, []);

  // Products fetch — paginated on the backend at PAGE_SIZE per request.
  // Search is pushed to the server so it spans the whole catalogue;
  // the other dropdown filters (category, brand, status, promo) remain
  // client-side and apply within the loaded page only.
  const loadProducts = React.useCallback(
    async (opts: { page: number; q?: string }) => {
      try {
        const res = await productsApi.listAll({
          page: opts.page,
          perPage: PAGE_SIZE,
          q: opts.q?.trim() || undefined,
        });
        setAllProducts(res.data.map(adaptProduct));
        setAllRawProducts(res.data);
        setServerMeta({
          total: res.meta?.total ?? res.data.length,
          lastPage: res.meta?.lastPage ?? 1,
        });
      } catch (err) {
        console.error("[admin/products] load failed", err);
        toast.error("Impossible de charger les produits");
        setAllProducts([]);
        setServerMeta({ total: 0, lastPage: 1 });
      }
    },
    [],
  );

  const load = React.useCallback(async () => {
    await Promise.all([loadMeta(), loadProducts({ page, q: search })]);
  }, [loadMeta, loadProducts, page, search]);

  React.useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  // Debounce search so we don't hammer the backend on every keystroke,
  // and reset to page 1 whenever the query changes so the user always
  // lands on the first results page.
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      void loadProducts({ page, q: search });
    }, 250);
    return () => window.clearTimeout(id);
  }, [loadProducts, page, search]);

  const deleteProduct = async (p: Product) => {
    const ok = await confirm({
      title: `Supprimer « ${p.name} » ?`,
      message: (
        <>
          Le produit, ses photos et ses variantes seront supprimés
          définitivement. Cette action est irréversible.
          <span className="mt-2 block font-mono text-2xs uppercase tracking-wide text-zinc-500">
            SKU : {p.sku}
          </span>
        </>
      ),
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await productsApi.destroy(p.id);
      toast.success("Produit supprimé");
      await load();
    } catch (err) {
      console.error("[admin/products] delete failed", err);
      toast.error("Impossible de supprimer le produit");
    }
  };

  // When the user picks a parent category, expand the filter to all
  // its sub-category slugs so products linked to a leaf still match.
  const categoryFilterSet = React.useMemo(() => {
    if (categoryFilter === "all") return null;
    const selected = allCategories.find((c) => c.slug === categoryFilter);
    if (!selected) return new Set([categoryFilter]);
    const slugs = new Set<string>([selected.slug]);
    if (!selected.parentId) {
      // It's a parent — include every child's slug too.
      for (const c of allCategories) {
        if (c.parentId === selected.id) slugs.add(c.slug);
      }
    }
    return slugs;
  }, [categoryFilter, allCategories]);

  // Quick lookup for the Statut column + filter — adapted Product drops
  // isActive, but we keep the raw API rows around in `allRawProducts`.
  const activeById = React.useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of allRawProducts) m.set(p.id, p.isActive);
    return m;
  }, [allRawProducts]);

  const filtered = React.useMemo(() => {
    if (!allProducts) return null;
    return allProducts.filter((p) => {
      if (
        search.trim() &&
        !`${p.name} ${p.sku} ${p.brand.name}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (categoryFilterSet && !categoryFilterSet.has(p.category.slug))
        return false;
      if (brandFilter !== "all" && p.brand.slug !== brandFilter) return false;
      // Statut handles two unrelated axes via the same dropdown:
      // visibility (active/inactive) + stock state.
      if (statusFilter === "active") {
        if (activeById.get(p.id) !== true) return false;
      } else if (statusFilter === "inactive") {
        if (activeById.get(p.id) !== false) return false;
      } else if (statusFilter !== "all" && p.stockStatus !== statusFilter) {
        return false;
      }
      if (promoOnly && !p.isPromo) return false;
      return true;
    });
  }, [
    allProducts,
    activeById,
    search,
    categoryFilterSet,
    brandFilter,
    statusFilter,
    promoOnly,
  ]);

  // The server already paginated for us — `filtered` is the current
  // page after the client-side dropdown filters narrow it further. We
  // surface the server's totals in the footer so users see the real
  // catalogue size, not just the count visible on this page.
  const visible = filtered ?? [];
  const totalPages = serverMeta?.lastPage ?? 1;
  const totalCount = serverMeta?.total ?? filtered?.length ?? 0;

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (visible.every((p) => next.has(p.id))) {
        visible.forEach((p) => next.delete(p.id));
      } else {
        visible.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const bulkAction = (action: string) => {
    toast.success(
      `${action} appliqué à ${selected.size} produit${selected.size > 1 ? "s" : ""}`
    );
    setSelected(new Set());
  };

  /** Bulk toggle the `is_active` flag on every selected product. */
  const bulkSetActive = async (next: boolean) => {
    if (selected.size === 0) return;
    const targets = allRawProducts.filter((p) => selected.has(p.id));
    // Only touch rows that would actually change state.
    const todo = targets.filter((p) => p.isActive !== next);
    if (todo.length === 0) {
      toast.info(
        next
          ? "Les produits sélectionnés sont déjà actifs."
          : "Les produits sélectionnés sont déjà inactifs."
      );
      setSelected(new Set());
      return;
    }

    const n = todo.length;
    const verbInf = next ? "Activer" : "Désactiver";
    const ok = await confirm({
      title:
        n === 1
          ? `${verbInf} « ${todo[0]!.nameFr} » ?`
          : `${verbInf} ${n} produits ?`,
      message: (
        <>
          {next
            ? `${n === 1 ? "Le produit sera" : "Les produits seront"} visible${n > 1 ? "s" : ""} sur la boutique immédiatement.`
            : `${n === 1 ? "Le produit sera" : "Les produits seront"} masqué${n > 1 ? "s" : ""} de la boutique. Vous pouvez l'activer à nouveau à tout moment.`}
          {n <= 8 ? (
            <span className="mt-2 block text-xs text-zinc-600">
              {todo.map((p) => p.nameFr).join(", ")}
            </span>
          ) : null}
        </>
      ),
      confirmLabel: n === 1 ? verbInf : `${verbInf} (${n})`,
      variant: next ? "default" : "destructive",
    });
    if (!ok) return;

    let okCount = 0;
    let failCount = 0;
    for (const p of todo) {
      if (!p.categoryId || !p.brandId) {
        failCount++;
        continue;
      }
      try {
        await productsApi.update(p.id, {
          slug: p.slug,
          sku: p.sku,
          nameFr: p.nameFr,
          nameAr: p.nameAr,
          descriptionShortFr: p.descriptionShortFr,
          descriptionShortAr: p.descriptionShortAr,
          descriptionFr: p.descriptionFr,
          descriptionAr: p.descriptionAr,
          categoryId: Number(p.categoryId),
          brandId: Number(p.brandId),
          price: p.price,
          oldPrice: p.oldPrice,
          stock: p.stock,
          lowStockThreshold: p.lowStockThreshold,
          trackStock: p.trackStock,
          allowBackorder: p.allowBackorder,
          isActive: next,
          isFeatured: p.isFeatured,
          isNew: p.isNew,
          isBestSeller: p.isBestSeller,
          isPromo: p.isPromo,
        });
        okCount++;
      } catch (err) {
        failCount++;
        console.error(`[admin/products] bulk active failed for ${p.sku}`, err);
      }
    }
    setSelected(new Set());
    const verb = next ? "activé" : "désactivé";
    if (okCount > 0) {
      toast.success(
        `${okCount} produit${okCount > 1 ? "s" : ""} ${verb}${okCount > 1 ? "s" : ""}`
      );
    }
    if (failCount > 0) {
      toast.error(
        `${failCount} échec${failCount > 1 ? "s" : ""} lors de la mise à jour`
      );
    }
    await load();
  };

  /** Bulk delete the selected products with a single confirmation. */
  const bulkDelete = async () => {
    if (selected.size === 0 || !allProducts) return;
    const targets = allProducts.filter((p) => selected.has(p.id));
    const n = targets.length;
    if (n === 0) return;
    const ok = await confirm({
      title:
        n === 1
          ? `Supprimer « ${targets[0]!.name} » ?`
          : `Supprimer ${n} produits ?`,
      message: (
        <>
          {n === 1 ? "Le produit" : "Les produits"} sélectionné
          {n > 1 ? "s" : ""},{" "}
          {n > 1 ? "leurs photos et leurs" : "ses photos et ses"} variantes
          seront supprimés définitivement. Cette action est irréversible.
          {n <= 8 ? (
            <span className="mt-2 block text-xs text-zinc-600">
              {targets.map((p) => p.name).join(", ")}
            </span>
          ) : null}
        </>
      ),
      confirmLabel: n === 1 ? "Supprimer" : `Supprimer (${n})`,
      variant: "destructive",
    });
    if (!ok) return;

    let okCount = 0;
    let failCount = 0;
    for (const p of targets) {
      try {
        await productsApi.destroy(p.id);
        okCount++;
      } catch (err) {
        failCount++;
        console.error(`[admin/products] bulk delete failed for ${p.sku}`, err);
      }
    }
    setSelected(new Set());
    if (okCount > 0) {
      toast.success(`${okCount} produit${okCount > 1 ? "s" : ""} supprimé${okCount > 1 ? "s" : ""}`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} échec${failCount > 1 ? "s" : ""} lors de la suppression`);
    }
    await load();
  };

  /* ─────────────────────────── CSV export ───────────────────────────
     Two entry points:
       - exportCsv()         → header button, dumps the filtered list
       - exportSelectedCsv() → bulk-action button, dumps only ticked rows
     Both funnel through the same downloader so the column set + file
     naming stays a single source of truth. */
  const downloadProductsAsCsv = (ids: Iterable<string>, fileTag: string) => {
    const idSet = new Set(ids);
    if (idSet.size === 0) {
      toast.info("Rien à exporter.");
      return;
    }
    const catById = new Map(allCategories.map((c) => [c.id, c]));
    const brandById = new Map(allBrands.map((b) => [b.id, b]));

    const rows: string[][] = [CSV_HEADERS.slice()];
    for (const raw of allRawProducts) {
      if (!idSet.has(raw.id)) continue;
      const cat = raw.categoryId ? catById.get(raw.categoryId) : null;
      const brand = raw.brandId ? brandById.get(raw.brandId) : null;
      rows.push([
        raw.sku ?? "",
        raw.slug ?? "",
        raw.nameFr ?? "",
        raw.nameAr ?? "",
        cat?.name ?? "",
        brand?.name ?? "",
        String(raw.price ?? 0),
        raw.oldPrice == null ? "" : String(raw.oldPrice),
        String(raw.stock ?? 0),
        String(raw.lowStockThreshold ?? 0),
        raw.isActive ? "1" : "0",
        raw.isFeatured ? "1" : "0",
        raw.isNew ? "1" : "0",
        raw.isBestSeller ? "1" : "0",
        raw.isPromo ? "1" : "0",
        raw.descriptionShortFr ?? "",
        raw.descriptionShortAr ?? "",
      ]);
    }
    const exported = rows.length - 1;
    if (exported === 0) {
      toast.info("Aucun produit correspondant.");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(`bingo-produits-${fileTag}-${stamp}.csv`, toCSV(rows));
    toast.success(
      `${exported} produit${exported > 1 ? "s" : ""} exporté${exported > 1 ? "s" : ""}`,
    );
  };

  const exportCsv = () => {
    if (!filtered || filtered.length === 0) {
      toast.info("Rien à exporter — la liste filtrée est vide.");
      return;
    }
    downloadProductsAsCsv(
      filtered.map((p) => p.id),
      "tous",
    );
  };

  const exportSelectedCsv = () => {
    if (selected.size === 0) return;
    downloadProductsAsCsv(selected, "selection");
    // Selection stays — admin might want to export again or apply
    // another bulk action without re-ticking. Different from
    // bulkSetActive/bulkDelete which intentionally clear after.
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Produits"
        subtitle={
          allProducts === null
            ? "Chargement…"
            : `${allProducts.length} produit${allProducts.length > 1 ? "s" : ""} au catalogue`
        }
        actions={
          <>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!filtered || filtered.length === 0}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Download className="size-3.5" /> Exporter
            </button>
            <Link
              href={routes.admin.productNew}
              className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
            >
              <Plus className="size-3.5" /> Ajouter un produit
            </Link>
          </>
        }
      />

      {/* Filter bar — mobile = 2-col grid (search spans both, then
          2 selects per row, status + promo on the last row). Desktop
          (sm+) reverts to the original wrapping single-row layout. */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="relative col-span-2 sm:col-span-1 sm:min-w-[260px] sm:flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Nom, SKU, marque…"
            className="h-9 border-zinc-200 bg-white pl-9 text-xs"
          />
        </div>
        <FilterSelect
          value={categoryFilter}
          onChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
          label="Catégorie"
          options={[
            { value: "all", label: "Toutes catégories" },
            // Flat list with sub-categories indented under their parent.
            // Selecting a parent matches every product in its subtree
            // (handled by categoryFilterSet above).
            ...allCategories
              .filter((c) => !c.parentId)
              .flatMap((parent) => [
                { value: parent.slug, label: parent.name },
                ...allCategories
                  .filter((c) => c.parentId === parent.id)
                  .map((sub) => ({
                    value: sub.slug,
                    label: `    ↳ ${sub.name}`,
                  })),
              ]),
          ]}
        />
        <FilterSelect
          value={brandFilter}
          onChange={(v) => {
            setBrandFilter(v);
            setPage(1);
          }}
          label="Marque"
          options={[
            { value: "all", label: "Toutes marques" },
            ...allBrands.map((b) => ({ value: b.slug, label: b.name })),
          ]}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          label="Statut"
          options={[
            { value: "all", label: "Tous statuts" },
            { value: "active", label: "Actif" },
            { value: "inactive", label: "Inactif" },
            { value: "in_stock", label: "En stock" },
            { value: "low_stock", label: "Stock faible" },
            { value: "out_of_stock", label: "Rupture" },
          ]}
        />
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs sm:ml-auto">
          <Checkbox
            checked={promoOnly}
            onCheckedChange={(v) => {
              setPromoOnly(v === true);
              setPage(1);
            }}
          />
          <span className="truncate text-zinc-700">Promo uniquement</span>
        </label>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-blue-900">
          <span className="text-xs font-medium">
            {selected.size} produit{selected.size > 1 ? "s" : ""} sélectionné
            {selected.size > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportSelectedCsv}
              className="h-7 border-blue-300 bg-white text-xs text-blue-900 hover:bg-blue-100"
            >
              <Download className="size-3.5" />
              Exporter
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void bulkSetActive(true)}
              className="h-7 border-blue-300 bg-white text-xs text-blue-900 hover:bg-blue-100"
            >
              Activer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void bulkSetActive(false)}
              className="h-7 border-blue-300 bg-white text-xs text-blue-900 hover:bg-blue-100"
            >
              Désactiver
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void bulkDelete()}
              className="h-7 border-red-300 bg-white text-xs text-red-700 hover:bg-red-50"
            >
              Supprimer
            </Button>
          </div>
        </div>
      ) : null}

      {/* Mobile (< md): card list — the 9-column table is unreadable on
          a phone. Same pattern as /admin/orders: most-important fields
          stacked, full-row tap targets, actions inline. */}
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200 bg-white md:hidden">
        {visible.map((p) => {
          const isChecked = selected.has(p.id);
          const isActive = activeById.get(p.id);
          return (
            <li
              key={p.id}
              className={cn(
                "flex flex-col gap-1.5 px-3 py-2.5",
                isChecked ? "bg-blue-50/60" : "bg-white",
              )}
            >
              {/* Top row — selection + image + name/sku + actions */}
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(v) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (v) next.add(p.id);
                      else next.delete(p.id);
                      return next;
                    });
                  }}
                  aria-label={`Sélectionner ${p.name}`}
                  className="mt-1"
                />
                <span className="relative size-12 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                  <Image
                    src={p.images[0]?.url ?? "/api/placeholder/80/80"}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={routes.admin.product(p.id)}
                    className="line-clamp-2 text-xs font-semibold leading-tight text-zinc-900 hover:text-blue-600"
                  >
                    {p.name}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[10px] text-zinc-500">
                    {p.sku}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Link
                    href={routes.admin.product(p.id)}
                    aria-label={`Éditer ${p.name}`}
                    title="Éditer"
                    className="inline-flex size-6 items-center justify-center rounded text-zinc-500 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Supprimer ${p.name}`}
                    title="Supprimer"
                    onClick={() => void deleteProduct(p)}
                    className="inline-flex size-6 items-center justify-center rounded text-zinc-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta — category · brand */}
              <p className="ps-[3.75rem] truncate text-[10px] text-zinc-500">
                {p.category.name}
                <span className="text-zinc-400"> · {p.brand.name}</span>
              </p>

              {/* Price + stock + status */}
              <div className="ps-[3.75rem] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide text-emerald-700">
                      <span aria-hidden className="size-1 rounded-full bg-emerald-500" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                      <span aria-hidden className="size-1 rounded-full bg-zinc-400" />
                      Inactif
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-zinc-700">
                    Stock {p.stock}
                  </span>
                  <StockPill status={p.stockStatus} compact />
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
                  {formatDZD(p.price)}
                  {p.oldPrice ? (
                    <span className="ms-1 font-normal text-[10px] text-zinc-400 line-through">
                      {formatDZD(p.oldPrice)}
                    </span>
                  ) : null}
                </span>
              </div>

              {/* Views + sales */}
              <p className="ps-[3.75rem] font-mono text-[10px] text-zinc-500">
                {p.viewCount} vues · {p.soldCount} ventes
              </p>
            </li>
          );
        })}
      </ul>

      {/* md+: original wide table. Hidden on mobile (card list replaces it). */}
      <div className="hidden overflow-hidden rounded-md border border-zinc-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="w-10 px-4 py-3 font-medium">
                  <Checkbox
                    checked={
                      visible.length > 0 &&
                      visible.every((p) => selected.has(p.id))
                    }
                    onCheckedChange={toggleAllVisible}
                    aria-label="Tout sélectionner"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Marque</th>
                <th className="px-4 py-3 font-medium text-right">Prix</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Vues</th>
                <th className="px-4 py-3 font-medium text-right">Ventes</th>
                <th className="w-20 px-2 py-3 font-medium text-center" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visible.map((p) => {
                const isChecked = selected.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "transition-colors",
                      isChecked ? "bg-blue-50/50" : "hover:bg-zinc-50/60"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(v) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (v) next.add(p.id);
                            else next.delete(p.id);
                            return next;
                          });
                        }}
                        aria-label={`Sélectionner ${p.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative block size-10 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                          <Image
                            src={p.images[0]?.url ?? "/api/placeholder/80/80"}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                            // Laravel-hosted images (/storage/...) resolve
                            // to localhost in dev; Next refuses to proxy
                            // private IPs, so skip the optimizer.
                            unoptimized
                          />
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={routes.admin.product(p.id)}
                            className="line-clamp-1 text-sm font-medium text-zinc-900 hover:text-blue-600"
                          >
                            {p.name}
                          </Link>
                          <span className="block font-mono text-2xs text-zinc-500">
                            {p.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {p.category.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {p.brand.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-zinc-900">
                      <p className="font-medium">{formatDZD(p.price)}</p>
                      {p.oldPrice ? (
                        <span className="block text-2xs text-zinc-400 line-through">
                          {formatDZD(p.oldPrice)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-right font-mono tabular-nums text-zinc-700">
                          {p.stock}
                        </span>
                        <StockPill status={p.stockStatus} compact />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {activeById.get(p.id) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-emerald-700">
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-emerald-500"
                          />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-zinc-500">
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-zinc-400"
                          />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-zinc-500">
                      {p.viewCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-zinc-500">
                      {p.soldCount}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Link
                          href={routes.admin.product(p.id)}
                          aria-label={`Éditer ${p.name}`}
                          title="Éditer"
                          className="inline-flex size-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                        <button
                          type="button"
                          aria-label={`Supprimer ${p.name}`}
                          title="Supprimer"
                          onClick={() => void deleteProduct(p)}
                          className="inline-flex size-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filtered && filtered.length > 0 ? (
        <div className="mt-4 flex items-center justify-between">
          <Body className="text-xs text-zinc-500">
            Page {page} sur {totalPages} · {totalCount} produit
            {totalCount > 1 ? "s" : ""}
          </Body>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}

      {filtered !== null && filtered.length === 0 ? (
        <p className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-12 text-center text-sm text-zinc-500">
          Aucun produit ne correspond aux filtres.
        </p>
      ) : null}
      {filtered === null ? (
        <p className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-12 text-center text-sm text-zinc-500">
          Chargement…
        </p>
      ) : null}
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  /** Always-visible field name so the admin knows which filter this is. */
  label: string;
}) {
  const selected = options.find((o) => o.value === value);
  const isAll = !value || value === "all";
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger
        size="sm"
        className="w-full border-zinc-200 bg-white text-xs sm:w-[200px]"
      >
        <span className="flex w-full min-w-0 items-center gap-1.5">
          <span className="shrink-0 truncate text-2xs font-medium uppercase tracking-wide text-zinc-400">
            {label}
          </span>
          <span className="truncate text-zinc-900">
            {isAll ? "—" : selected?.label ?? value}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
