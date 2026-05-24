"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  Folder,
  FolderTree,
  Layers,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { adaptCategory, adaptProduct } from "@/lib/api/adapters";
import { categoriesApi, type ApiCategory } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";

interface LinkPickerProps {
  /** Currently selected destination href, e.g. "/catalog/sacs-a-dos". */
  value: string;
  onChange: (href: string) => void;
  className?: string;
  /** Override the trigger button's empty-state placeholder. */
  placeholder?: string;
}

interface CorpusBundle {
  categories: Category[];
  products: Product[];
}

/** Quick-jump filter shortcuts that don't map to a single product/category. */
const QUICK_FILTERS = [
  { id: "catalog", href: routes.catalog, label: "Catalogue complet", icon: Layers },
  {
    id: "promo",
    href: `${routes.catalog}?promoOnly=true`,
    label: "Promotions en cours",
    icon: Sparkles,
  },
  {
    id: "new",
    href: `${routes.catalog}?sort=new`,
    label: "Nouveautés",
    icon: Tag,
  },
  {
    id: "bestseller",
    href: `${routes.catalog}?sort=bestseller`,
    label: "Meilleures ventes",
    icon: Star,
  },
] as const;

/**
 * Admin form widget for picking a CTA destination. Opens a Command palette
 * with grouped, searchable results — promoted filters, all categories
 * (parents + subs), and all products (matched by name/SKU).
 */
export function LinkPicker({
  value,
  onChange,
  className,
  placeholder = "Choisir une destination…",
}: LinkPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<CorpusBundle | null>(null);
  const [query, setQuery] = React.useState("");

  // Lazy-load the corpus the first time the popover opens. The admin
  // banner editor lives behind admin auth, so we can call admin endpoints.
  React.useEffect(() => {
    if (!open || data) return;
    Promise.all([
      categoriesApi.listAll().catch(() => [] as ApiCategory[]),
      productsApi.listAll({ perPage: 500 }).catch(() => ({ data: [] })),
    ]).then(([cats, prodRes]) => {
      const flat = cats.flatMap((c) => [c, ...(c.children ?? [])]);
      setData({
        categories: flat.map(adaptCategory),
        products: prodRes.data.map(adaptProduct),
      });
    });
  }, [open, data]);

  // Resolve the current value to a friendly label for the trigger.
  const currentLabel = React.useMemo(() => {
    if (!value) return null;
    // Quick filters
    const filter = QUICK_FILTERS.find((f) => f.href === value);
    if (filter) return filter.label;
    if (!data) return value;
    // Category / subcategory
    const catMatch = value.match(/^\/catalog\/([^?]+)/);
    if (catMatch) {
      const cat = data.categories.find((c) => c.slug === catMatch[1]);
      if (cat) return `Catégorie : ${cat.name}`;
    }
    // Product
    const prodMatch = value.match(/^\/product\/([^?]+)/);
    if (prodMatch) {
      const p = data.products.find((p) => p.slug === prodMatch[1]);
      if (p) return `Produit : ${p.name}`;
    }
    return value;
  }, [value, data]);

  // Filter results by search query.
  const results = React.useMemo(() => {
    if (!data) {
      return {
        filters: QUICK_FILTERS.slice(),
        categories: [] as Category[],
        subcategories: [] as Category[],
        products: [] as Product[],
      };
    }
    const q = query.trim().toLowerCase();
    const topCats = data.categories.filter((c) => !c.parentId);
    const subCats = data.categories.filter((c) => !!c.parentId);
    if (!q) {
      return {
        filters: QUICK_FILTERS.slice(),
        categories: topCats,
        subcategories: subCats.slice(0, 12),
        products: data.products.slice(0, 12),
      };
    }
    const matchCat = (c: Category) =>
      `${c.name} ${c.nameAr ?? ""} ${c.slug}`.toLowerCase().includes(q);
    const matchProd = (p: Product) =>
      `${p.name} ${p.sku} ${p.brand.name}`.toLowerCase().includes(q);
    return {
      filters: QUICK_FILTERS.filter((f) =>
        f.label.toLowerCase().includes(q)
      ),
      categories: topCats.filter(matchCat),
      subcategories: subCats.filter(matchCat).slice(0, 8),
      products: data.products.filter(matchProd).slice(0, 12),
    };
  }, [data, query]);

  const parentSlugById = React.useMemo(() => {
    const m = new Map<string, string>();
    data?.categories.forEach((c) => m.set(c.id, c.slug));
    return m;
  }, [data]);

  const pick = (href: string) => {
    onChange(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-left text-sm transition-colors hover:border-zinc-400 data-placeholder:text-zinc-500",
          !currentLabel && "text-zinc-500",
          className
        )}
      >
        <span className="flex-1 truncate">{currentLabel ?? placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[360px] p-0"
        align="start"
        initialFocus={false}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Rechercher catégorie, produit, filtre…"
          />
          <CommandList className="max-h-80">
            {data === null ? (
              <div className="px-4 py-6 text-center text-xs text-zinc-500">
                Chargement…
              </div>
            ) : results.filters.length === 0 &&
              results.categories.length === 0 &&
              results.subcategories.length === 0 &&
              results.products.length === 0 ? (
              <CommandEmpty>Aucun résultat.</CommandEmpty>
            ) : null}

            {results.filters.length > 0 ? (
              <>
                <CommandGroup heading="Filtres rapides">
                  {results.filters.map((f) => {
                    const Icon = f.icon;
                    const active = value === f.href;
                    return (
                      <CommandItem
                        key={f.id}
                        value={`filter ${f.label}`}
                        onSelect={() => pick(f.href)}
                      >
                        <Icon className="size-4 text-zinc-500" />
                        <span className="flex-1 text-sm">{f.label}</span>
                        {active ? (
                          <Check className="size-4 text-emerald-600" />
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {(results.categories.length > 0 ||
                  results.subcategories.length > 0 ||
                  results.products.length > 0) && <CommandSeparator />}
              </>
            ) : null}

            {results.categories.length > 0 ? (
              <>
                <CommandGroup heading="Catégories">
                  {results.categories.map((c) => {
                    const href = routes.category(c.slug);
                    const active = value === href;
                    return (
                      <CommandItem
                        key={c.id}
                        value={`cat ${c.name} ${c.slug}`}
                        onSelect={() => pick(href)}
                      >
                        <Folder className="size-4 text-zinc-500" />
                        <span className="flex-1 text-sm">{c.name}</span>
                        <span className="font-mono text-2xs text-zinc-500">
                          {c.productCount}
                        </span>
                        {active ? (
                          <Check className="size-4 text-emerald-600" />
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {(results.subcategories.length > 0 ||
                  results.products.length > 0) && <CommandSeparator />}
              </>
            ) : null}

            {results.subcategories.length > 0 ? (
              <>
                <CommandGroup heading="Sous-catégories">
                  {results.subcategories.map((c) => {
                    const href = routes.category(c.slug);
                    const active = value === href;
                    const parentSlug = c.parentId
                      ? parentSlugById.get(c.parentId)
                      : undefined;
                    return (
                      <CommandItem
                        key={c.id}
                        value={`sub ${c.name} ${c.slug}`}
                        onSelect={() => pick(href)}
                      >
                        <FolderTree className="size-4 text-zinc-500" />
                        <span className="flex-1 truncate text-sm">{c.name}</span>
                        {parentSlug ? (
                          <span className="truncate text-2xs text-zinc-500">
                            {parentSlug.replace(/-/g, " ")}
                          </span>
                        ) : null}
                        {active ? (
                          <Check className="size-4 text-emerald-600" />
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {results.products.length > 0 && <CommandSeparator />}
              </>
            ) : null}

            {results.products.length > 0 ? (
              <CommandGroup heading="Produits">
                {results.products.map((p) => {
                  const href = routes.product(p.slug);
                  const active = value === href;
                  return (
                    <CommandItem
                      key={p.id}
                      value={`prod ${p.name} ${p.sku} ${p.brand.name}`}
                      onSelect={() => pick(href)}
                    >
                      <ShoppingBag className="size-4 text-zinc-500" />
                      <div className="flex min-w-0 flex-1 items-baseline gap-2">
                        <span className="truncate text-sm font-medium">
                          {p.name}
                        </span>
                        <span className="shrink-0 font-mono text-2xs text-zinc-500">
                          {p.sku}
                        </span>
                      </div>
                      <span className="text-2xs text-zinc-500">
                        {p.brand.name}
                      </span>
                      {active ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
