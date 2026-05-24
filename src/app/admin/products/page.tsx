"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
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

export default function AdminProductsPage() {
  const [allProducts, setAllProducts] = React.useState<Product[] | null>(null);
  const [allCategories, setAllCategories] = React.useState<Category[]>([]);
  const [allBrands, setAllBrands] = React.useState<Brand[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [brandFilter, setBrandFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [promoOnly, setPromoOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const confirm = useConfirm();

  const load = React.useCallback(async () => {
    try {
      const [res, cats, brands] = await Promise.all([
        // Pull up to 100 (current Laravel cap) — pagination on the server
        // will be wired when the catalog grows.
        productsApi.listAll({ perPage: 100 }),
        categoriesApi.listAll(),
        brandsApi.listAll(),
      ]);
      const flatCats: ApiCategory[] = [];
      for (const top of cats) {
        flatCats.push(top);
        for (const sub of top.children ?? []) flatCats.push(sub);
      }
      setAllProducts(res.data.map(adaptProduct));
      setAllCategories(flatCats.map(adaptCategory));
      setAllBrands(brands.map(adaptBrand));
    } catch (err) {
      console.error("[admin/products] load failed", err);
      toast.error("Impossible de charger les produits");
      setAllProducts([]);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

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
      if (statusFilter !== "all" && p.stockStatus !== statusFilter) return false;
      if (promoOnly && !p.isPromo) return false;
      return true;
    });
  }, [allProducts, search, categoryFilterSet, brandFilter, statusFilter, promoOnly]);

  const visible = filtered?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];
  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / PAGE_SIZE));

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
              onClick={() => toast.info("Import CSV — backend à venir")}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Upload className="size-3.5" /> Importer CSV
            </button>
            <button
              type="button"
              onClick={() => toast.info("Export en cours…")}
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

      {/* Filter bar — borderless single row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1 max-w-md">
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
          placeholder="Catégorie"
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
          placeholder="Marque"
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
          placeholder="Statut"
          options={[
            { value: "all", label: "Tous statuts" },
            { value: "in_stock", label: "En stock" },
            { value: "low_stock", label: "Stock faible" },
            { value: "out_of_stock", label: "Rupture" },
          ]}
        />
        <label className="ml-auto inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs">
          <Checkbox
            checked={promoOnly}
            onCheckedChange={(v) => {
              setPromoOnly(v === true);
              setPage(1);
            }}
          />
          <span className="text-zinc-700">Promo uniquement</span>
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
            {["Activer", "Désactiver", "Supprimer", "Modifier prix…"].map(
              (label) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bulkAction(label)}
                  className="h-7 border-blue-300 bg-white text-xs text-blue-900 hover:bg-blue-100"
                >
                  {label}
                </Button>
              )
            )}
          </div>
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
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
            Page {page} sur {totalPages} · {filtered.length} produit
            {filtered.length > 1 ? "s" : ""}
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
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="h-9 w-[180px] border-zinc-200 bg-white text-xs">
        <SelectValue placeholder={placeholder} />
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
