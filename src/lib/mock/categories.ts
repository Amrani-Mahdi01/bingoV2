import type { Category } from "@/lib/types";

interface SeedCategory {
  slug: string;
  name: string;
  nameAr?: string;
  icon: string; // lucide
  subs: { slug: string; name: string }[];
}

const SEED: SeedCategory[] = [
  {
    slug: "tentes-abris",
    name: "Tentes & Abris",
    nameAr: "الخيام والمآوي",
    icon: "Tent",
    subs: [
      { slug: "tentes-2-3-places", name: "Tentes 2-3 places" },
      { slug: "tentes-4-places-plus", name: "Tentes 4 places et +" },
      { slug: "tarps-abris", name: "Tarps & abris" },
      { slug: "accessoires-tente", name: "Accessoires de tente" },
    ],
  },
  {
    slug: "sacs-de-couchage",
    name: "Sacs de couchage",
    nameAr: "أكياس النوم",
    icon: "Moon",
    subs: [
      { slug: "ete-3-saisons", name: "Été / 3 saisons" },
      { slug: "hiver-grand-froid", name: "Hiver & grand froid" },
      { slug: "matelas-couchage", name: "Matelas de couchage" },
    ],
  },
  {
    slug: "cuisine-outdoor",
    name: "Cuisine outdoor",
    nameAr: "مطبخ المغامرة",
    icon: "ChefHat",
    subs: [
      { slug: "rechauds", name: "Réchauds" },
      { slug: "popotes-vaisselle", name: "Popotes & vaisselle" },
      { slug: "thermos-gourdes", name: "Thermos & gourdes" },
      { slug: "lyophilises-rations", name: "Lyophilisés & rations" },
    ],
  },
  {
    slug: "eclairage",
    name: "Éclairage",
    nameAr: "الإضاءة",
    icon: "Lamp",
    subs: [
      { slug: "lampes-frontales", name: "Lampes frontales" },
      { slug: "lanternes", name: "Lanternes" },
      { slug: "lampes-tactiques", name: "Lampes tactiques" },
    ],
  },
  {
    slug: "sacs-a-dos",
    name: "Sacs à dos",
    nameAr: "حقائب الظهر",
    icon: "Backpack",
    subs: [
      { slug: "journee-20-40l", name: "Journée 20-40L" },
      { slug: "randonnee-40-65l", name: "Randonnée 40-65L" },
      { slug: "expedition-65l-plus", name: "Expédition 65L et +" },
      { slug: "sacs-techniques", name: "Sacs techniques" },
    ],
  },
  {
    slug: "vetements",
    name: "Vêtements",
    nameAr: "الملابس",
    icon: "Shirt",
    subs: [
      { slug: "vestes-impermeables", name: "Vestes & imperméables" },
      { slug: "polaires-pulls", name: "Polaires & pulls" },
      { slug: "pantalons-shorts", name: "Pantalons & shorts" },
      { slug: "t-shirts-techniques", name: "T-shirts techniques" },
    ],
  },
  {
    slug: "chaussures",
    name: "Chaussures",
    nameAr: "الأحذية",
    icon: "Footprints",
    subs: [
      { slug: "chaussures-randonnee", name: "Chaussures de randonnée" },
      { slug: "chaussures-trail", name: "Chaussures de trail" },
      { slug: "bottes-montagne", name: "Bottes de montagne" },
    ],
  },
  {
    slug: "accessoires",
    name: "Accessoires",
    nameAr: "الإكسسوارات",
    icon: "Compass",
    subs: [
      { slug: "boussoles-navigation", name: "Boussoles & navigation" },
      { slug: "couteaux-multifonctions", name: "Couteaux multifonctions" },
      { slug: "premiers-secours", name: "Premiers secours" },
      { slug: "cartes-guides", name: "Cartes & guides" },
    ],
  },
];

/* Build a flat list — parents first, then children. Product counts are
   recomputed at runtime by walking `products.ts`. */
function build(): Category[] {
  const out: Category[] = [];
  SEED.forEach((seed, i) => {
    const parentId = `cat-${seed.slug}`;
    out.push({
      id: parentId,
      slug: seed.slug,
      name: seed.name,
      nameAr: seed.nameAr,
      icon: seed.icon,
      productCount: 0,
      displayOrder: i + 1,
    });
    seed.subs.forEach((sub, j) => {
      out.push({
        id: `cat-${sub.slug}`,
        slug: sub.slug,
        name: sub.name,
        parentId,
        icon: seed.icon,
        productCount: 0,
        displayOrder: j + 1,
      });
    });
  });
  return out;
}

export const categories: Category[] = build();

export const topCategories = categories.filter((c) => !c.parentId);

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getChildCategories(parentId: string): Category[] {
  return categories.filter((c) => c.parentId === parentId);
}
