import { PRODUCTS, type Product } from "./products";

export type SubCategory = {
  slug: string;
  name: string;
  parentSlug: string;
};

export type Category = {
  slug: string;
  name: string;
  productCount: number;
  image: string;
  subCategories: SubCategory[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "sacs-de-couchage",
    name: "Sacs de couchage",
    productCount: 24,
    image:
      "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=800&q=80&fit=crop",
    subCategories: [
      { slug: "duvet", name: "Duvet", parentSlug: "sacs-de-couchage" },
      { slug: "synthetique", name: "Synthétique", parentSlug: "sacs-de-couchage" },
      { slug: "4-saisons", name: "4 saisons", parentSlug: "sacs-de-couchage" },
    ],
  },
  {
    slug: "tentes",
    name: "Tentes",
    productCount: 18,
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80&fit=crop",
    subCategories: [
      { slug: "2-places", name: "2 places", parentSlug: "tentes" },
      { slug: "familiales", name: "Familiales", parentSlug: "tentes" },
      { slug: "ultralegeres", name: "Ultralégères", parentSlug: "tentes" },
    ],
  },
  {
    slug: "sacs-a-dos",
    name: "Sacs à dos",
    productCount: 32,
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80&fit=crop",
    subCategories: [
      { slug: "trek", name: "Trek longue distance", parentSlug: "sacs-a-dos" },
      { slug: "journee", name: "Sacs à la journée", parentSlug: "sacs-a-dos" },
      { slug: "hydratation", name: "Sacs d'hydratation", parentSlug: "sacs-a-dos" },
    ],
  },
  {
    slug: "eclairage",
    name: "Éclairage",
    productCount: 15,
    image:
      "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=800&q=80&fit=crop",
    subCategories: [
      { slug: "frontales", name: "Frontales", parentSlug: "eclairage" },
      { slug: "lanternes", name: "Lanternes", parentSlug: "eclairage" },
    ],
  },
  {
    slug: "navigation",
    name: "Navigation",
    productCount: 11,
    image:
      "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=800&q=80&fit=crop",
    subCategories: [
      { slug: "couteaux", name: "Couteaux & multifonctions", parentSlug: "navigation" },
      { slug: "boussoles", name: "Boussoles & GPS", parentSlug: "navigation" },
    ],
  },
  {
    slug: "campement",
    name: "Campement",
    productCount: 28,
    image:
      "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&q=80&fit=crop",
    subCategories: [
      { slug: "cuisine", name: "Cuisine & réchauds", parentSlug: "campement" },
      { slug: "hydratation", name: "Bouteilles & gourdes", parentSlug: "campement" },
      { slug: "mobilier", name: "Mobilier de camp", parentSlug: "campement" },
    ],
  },
];

export const ALL_SUBCATEGORIES: SubCategory[] = CATEGORIES.flatMap(
  (c) => c.subCategories
);

export type SearchResults = {
  categories: Category[];
  subCategories: SubCategory[];
  products: Product[];
};

/** Score how well `text` matches `q`. Higher = more relevant.
 *  0 means no match. Tiered so the dropdown can sort:
 *    exact == 100,  starts-with == 80,  word-boundary == 60,
 *    substring == 30. */
function scoreMatch(text: string, q: string): number {
  if (!q) return 0;
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  // Word boundary — handles "tente" matching inside "Sac de tente 2 places".
  // q is plain text (lower-cased query) so the regex is safe as long as we
  // escape any regex meta-chars.
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${escaped}`, "i").test(text)) return 60;
  if (t.includes(q)) return 30;
  return 0;
}

export function searchCatalogue(query: string): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      categories: CATEGORIES,
      subCategories: ALL_SUBCATEGORIES,
      products: PRODUCTS,
    };
  }

  // Categories — score against name only.
  const categories = CATEGORIES.map((c) => ({
    item: c,
    score: scoreMatch(c.name, q),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "fr"))
    .map((r) => r.item);

  // Sub-categories — same treatment.
  const subCategories = ALL_SUBCATEGORIES.map((s) => ({
    item: s,
    score: scoreMatch(s.name, q),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "fr"))
    .map((r) => r.item);

  // Products — score the better of (name, brand), with a small penalty
  // for brand-only matches so name matches win at equal tier.
  const products = PRODUCTS.map((p) => {
    const nameScore = scoreMatch(p.name, q);
    const brandScore = scoreMatch(p.brand, q) * 0.85;
    return { item: p, score: Math.max(nameScore, brandScore) };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "fr"))
    .map((r) => r.item);

  return { categories, subCategories, products };
}

export function categoryHref(slug: string) {
  return `/categorie/${slug}`;
}

export function subCategoryHref(sub: SubCategory) {
  return `/categorie/${sub.parentSlug}/${sub.slug}`;
}

export function productHref(slug: string) {
  return `/produit/${slug}`;
}
