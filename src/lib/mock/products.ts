import type {
  Product,
  ProductAttribute,
  ProductImage,
  ProductVariant,
  StockStatus,
} from "@/lib/types";
import { brands } from "@/lib/mock/brands";
import { categories } from "@/lib/mock/categories";

/* -----------------------------------------------------------
   Deterministic PRNG — mulberry32. Same seed → same catalog
   every time, which keeps screenshots and tests stable.
   ----------------------------------------------------------- */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260518);
const rnd = () => rng();
const rndInt = (min: number, max: number) =>
  Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const pickN = <T,>(arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rnd() * copy.length);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
};

const MODEL_NAMES = [
  "Arpenaz", "Cassiopée", "Lunar", "Aurora", "Trek", "Tasmania", "Atlas",
  "Hoggar", "Sahara", "Kabylie", "Djurdjura", "Tassili", "Aurès", "Chréa",
  "Forclaz", "Boréal", "Vega", "Polaris", "Nimbus", "Cirrus", "Trango",
  "Cassin", "Mistral", "Eole", "Sirocco", "Levant", "Tramontane",
];

const COLORS = [
  "Olive", "Sable", "Anthracite", "Ardoise", "Brique", "Bleu nuit",
  "Vert forêt", "Beige sable", "Noir",
];

const SIZES_APPAREL = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZES_SHOES = ["39", "40", "41", "42", "43", "44", "45", "46"];

interface Template {
  /** parent slug in categories */
  parentSlug: string;
  /** number of products to create from this template */
  count: number;
  buildName(model: string, brandName: string, idx: number): string;
  buildShort(): string;
  buildDescription(name: string): string;
  attrs(): ProductAttribute[];
  priceRange: [number, number];
  variants: "none" | "color" | "color_size" | "size" | "shoe";
  imageHint: string;
  subSlugs: string[];
}

const TEMPLATES: Template[] = [
  {
    parentSlug: "tentes-abris",
    count: 11,
    subSlugs: ["tentes-2-3-places", "tentes-4-places-plus", "tarps-abris", "accessoires-tente"],
    buildName: (m, b) => `Tente ${pickInt(2, 6)} places ${b} ${m}`,
    buildShort: () => `Tente dôme légère, double toit déperlant et tapis de sol étanche. Montage rapide en moins de 10 minutes.`,
    buildDescription: (n) => `${n} — pensée pour les bivouacs longue durée. Armature en fibre de verre 8.5 mm, double toit en polyester 75D imperméabilisé 3000 mm, plancher 5000 mm avec coutures thermo-soudées. Ventilation par grilles moustiquaires sur trois côtés, vestibule pour ranger les sacs à dos et abri la cuisine. Sac de transport compact fourni.`,
    attrs: () => [
      { id: "a-saison", label: "Saison", value: pick(["3 saisons", "3 saisons +", "Toute saison"]) },
      { id: "a-poids", label: "Poids", value: `${(rnd() * 3 + 1.5).toFixed(1)} kg` },
      { id: "a-imperm", label: "Imperméabilité toit", value: pick(["3000 mm", "4000 mm", "5000 mm"]) },
      { id: "a-impermsol", label: "Imperméabilité sol", value: pick(["3000 mm", "5000 mm", "8000 mm"]) },
      { id: "a-portes", label: "Portes", value: String(rndInt(1, 2)) },
      { id: "a-mat", label: "Matériau armature", value: pick(["Fibre de verre", "Aluminium 7001", "Acier"]) },
    ],
    priceRange: [9000, 65000],
    variants: "color",
    imageHint: "tente",
  },
  {
    parentSlug: "sacs-de-couchage",
    count: 9,
    subSlugs: ["ete-3-saisons", "hiver-grand-froid", "matelas-couchage"],
    buildName: (m, b) => `Sac de couchage ${b} ${m} ${pick(["+5°C", "0°C", "-5°C", "-10°C", "-15°C"])}`,
    buildShort: () => `Sac momie en duvet naturel pour les nuits fraîches en montagne. Capuchon ajustable et zip déperlant.`,
    buildDescription: (n) => `${n} — équipement de référence pour la randonnée en altitude. Garnissage duvet de canard 90/10, gonflant 600 cuin, enveloppe ripstop 20D résistante à l'abrasion. Coupe momie ergonomique, capuchon ajustable, collerette anti-froid et zip YKK double-curseur déperlant. Compressible dans un sac de transport étanche fourni.`,
    attrs: () => [
      { id: "a-tempconf", label: "Température confort", value: pick(["+5°C", "0°C", "-3°C", "-8°C"]) },
      { id: "a-templim", label: "Température limite", value: pick(["-2°C", "-8°C", "-15°C", "-20°C"]) },
      { id: "a-garn", label: "Garnissage", value: pick(["Duvet 90/10", "Duvet 80/20", "Synthétique 250g/m²"]) },
      { id: "a-poids", label: "Poids", value: `${(rnd() * 1.5 + 0.8).toFixed(2)} kg` },
      { id: "a-volume", label: "Volume compressé", value: `${rndInt(5, 12)} L` },
    ],
    priceRange: [6500, 48000],
    variants: "size",
    imageHint: "sac-couchage",
  },
  {
    parentSlug: "cuisine-outdoor",
    count: 10,
    subSlugs: ["rechauds", "popotes-vaisselle", "thermos-gourdes", "lyophilises-rations"],
    buildName: (m, b) => {
      const t = pick(["Réchaud", "Popote", "Thermos", "Gourde isotherme", "Kit cuisson"]);
      return `${t} ${b} ${m}`;
    },
    buildShort: () => `Compact, robuste et autonome. Conçu pour les conditions difficiles — du désert à la haute montagne.`,
    buildDescription: (n) => `${n} — l'essentiel de la cuisine en bivouac. Matériaux titane et aluminium anodisé pour un compromis poids/durabilité optimal. Assemblage compact, transport facilité en sac dédié. Compatible cartouche gaz standard (vissable) ou multi-combustible selon le modèle.`,
    attrs: () => [
      { id: "a-poids", label: "Poids", value: `${rndInt(80, 700)} g` },
      { id: "a-mat", label: "Matériau", value: pick(["Titane", "Aluminium anodisé", "Acier inoxydable"]) },
      { id: "a-puiss", label: "Puissance", value: pick(["1200 W", "2000 W", "2700 W", "3000 W"]) },
      { id: "a-cap", label: "Capacité", value: `${(rnd() * 1.5 + 0.4).toFixed(1)} L` },
    ],
    priceRange: [2500, 32000],
    variants: "none",
    imageHint: "cuisine",
  },
  {
    parentSlug: "eclairage",
    count: 8,
    subSlugs: ["lampes-frontales", "lanternes", "lampes-tactiques"],
    buildName: (m, b) => {
      const t = pick(["Lampe frontale", "Lanterne", "Lampe tactique", "Lampe de camp"]);
      return `${t} ${b} ${m}`;
    },
    buildShort: () => `Éclairage puissant, autonomie longue durée. Plusieurs modes pour s'adapter à chaque usage.`,
    buildDescription: (n) => `${n} — éclairage technique haute performance. Modes éco / standard / boost, faisceau large pour le campement, faisceau focalisé pour la progression. Rechargeable USB-C ou compatible piles AAA selon le modèle. Indice IPX4 minimum, supporte la pluie soutenue.`,
    attrs: () => [
      { id: "a-lumen", label: "Puissance", value: `${rndInt(150, 1200)} lumens` },
      { id: "a-auto", label: "Autonomie max", value: `${rndInt(8, 180)} h` },
      { id: "a-ipx", label: "Étanchéité", value: pick(["IPX4", "IPX5", "IPX7"]) },
      { id: "a-poids", label: "Poids", value: `${rndInt(45, 280)} g` },
      { id: "a-recharge", label: "Recharge", value: pick(["USB-C", "USB micro", "Piles AAA"]) },
    ],
    priceRange: [2800, 22000],
    variants: "color",
    imageHint: "lampe",
  },
  {
    parentSlug: "sacs-a-dos",
    count: 11,
    subSlugs: ["journee-20-40l", "randonnee-40-65l", "expedition-65l-plus", "sacs-techniques"],
    buildName: (m, b) => `Sac à dos ${b} ${m} ${rndInt(20, 90)}L`,
    buildShort: () => `Portage ergonomique, dos ventilé et sangles thoraciques ajustables. Pensé pour les longues marches.`,
    buildDescription: (n) => `${n} — confort de portage sur plusieurs jours. Dos AirContact ventilé, sangles renforcées, ceinture ventrale rembourrée avec poches gel-pads. Compartiment sac de couchage isolé en bas, accès frontal au compartiment principal, attaches pour bâtons et casque. Housse imperméable intégrée.`,
    attrs: () => [
      { id: "a-vol", label: "Volume", value: `${rndInt(20, 90)} L` },
      { id: "a-poids", label: "Poids à vide", value: `${(rnd() * 1.5 + 0.8).toFixed(2)} kg` },
      { id: "a-mat", label: "Tissu", value: pick(["420D ripstop", "600D polyester", "210D nylon"]) },
      { id: "a-tail", label: "Taille dos", value: pick(["S/M", "M/L", "Universel"]) },
    ],
    priceRange: [4500, 42000],
    variants: "color",
    imageHint: "sac",
  },
  {
    parentSlug: "vetements",
    count: 12,
    subSlugs: ["vestes-impermeables", "polaires-pulls", "pantalons-shorts", "t-shirts-techniques"],
    buildName: (m, b) => {
      const t = pick(["Veste imperméable", "Polaire", "Pantalon randonnée", "T-shirt technique", "Doudoune", "Veste softshell"]);
      return `${t} ${b} ${m}`;
    },
    buildShort: () => `Tissu technique respirant, déperlant durable et coupe ergonomique. Pour les sorties exigeantes.`,
    buildDescription: (n) => `${n} — performance et confort en conditions changeantes. Membrane 3 couches respirante (15 000 g/m²/24h), traitement déperlant DWR sans PFC, coutures étanchées. Capuche ajustable compatible casque, poches ventilation aux aisselles, bas de manche ajustable. Coupe athlétique non contraignante.`,
    attrs: () => [
      { id: "a-mat", label: "Matière", value: pick(["100% polyester recyclé", "Nylon ripstop 40D", "Coton mélangé"]) },
      { id: "a-imperm", label: "Imperméabilité", value: pick(["10 000 mm", "15 000 mm", "20 000 mm", "—"]) },
      { id: "a-resp", label: "Respirabilité", value: pick(["10 000 g/m²/24h", "15 000 g/m²/24h", "20 000 g/m²/24h"]) },
      { id: "a-coupe", label: "Coupe", value: pick(["Ajustée", "Standard", "Ample"]) },
      { id: "a-genre", label: "Genre", value: pick(["Homme", "Femme", "Unisexe"]) },
    ],
    priceRange: [3500, 38000],
    variants: "color_size",
    imageHint: "vetement",
  },
  {
    parentSlug: "chaussures",
    count: 9,
    subSlugs: ["chaussures-randonnee", "chaussures-trail", "bottes-montagne"],
    buildName: (m, b) => {
      const t = pick(["Chaussures de randonnée", "Chaussures de trail", "Bottes mid", "Chaussures approach"]);
      return `${t} ${b} ${m}`;
    },
    buildShort: () => `Maintien latéral, semelle Vibram et tige imperméable. Pour les terrains accidentés.`,
    buildDescription: (n) => `${n} — adhérence et stabilité sur sentier et hors-piste. Semelle Vibram MegaGrip avec crampons multidirectionnels, membrane imperméable et respirante, tige en cuir nubuck renforcée. Lacet rapide, pare-pierres avant et arrière, semelle EVA double densité avec talon amortissant.`,
    attrs: () => [
      { id: "a-tige", label: "Tige", value: pick(["Cuir nubuck", "Mesh respirant", "Synthétique"]) },
      { id: "a-sem", label: "Semelle", value: pick(["Vibram MegaGrip", "Contagrip MA", "Vibram Litebase"]) },
      { id: "a-imperm", label: "Imperméabilité", value: pick(["Membrane Gore-Tex", "Membrane PU", "Non imperméable"]) },
      { id: "a-poids", label: "Poids (paire taille 42)", value: `${rndInt(620, 1480)} g` },
    ],
    priceRange: [8000, 58000],
    variants: "shoe",
    imageHint: "chaussure",
  },
  {
    parentSlug: "accessoires",
    count: 10,
    subSlugs: ["boussoles-navigation", "couteaux-multifonctions", "premiers-secours", "cartes-guides"],
    buildName: (m, b) => {
      const t = pick(["Boussole", "Couteau multifonctions", "Kit premiers secours", "Bâtons de randonnée", "Filtre à eau", "Trousse de toilette"]);
      return `${t} ${b} ${m}`;
    },
    buildShort: () => `Compact et fiable. L'accessoire essentiel que vous emporterez à chaque sortie.`,
    buildDescription: (n) => `${n} — petit format, grand impact. Pensé pour s'intégrer sans contrainte dans votre équipement quotidien. Matériaux durables, design éprouvé, garantie fabricant longue durée. Indispensable au fond du sac, à portée de main au bivouac.`,
    attrs: () => [
      { id: "a-poids", label: "Poids", value: `${rndInt(15, 480)} g` },
      { id: "a-mat", label: "Matériau", value: pick(["Aluminium", "Plastique renforcé", "Acier inoxydable"]) },
      { id: "a-garantie", label: "Garantie", value: pick(["2 ans", "5 ans", "10 ans", "À vie"]) },
    ],
    priceRange: [2500, 18000],
    variants: "none",
    imageHint: "accessoire",
  },
];

function pickInt(min: number, max: number): number {
  return rndInt(min, max);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildImages(name: string, slug: string, count: number): ProductImage[] {
  const labelBase = slug.replace(/-+/g, "-").slice(0, 40);
  return Array.from({ length: count }, (_, i) => ({
    id: `${slug}-img-${i + 1}`,
    url: `/api/placeholder/800/800/${labelBase}-${i + 1}`,
    alt: `${name} — vue ${i + 1}`,
    displayOrder: i + 1,
  }));
}

function buildVariants(
  baseSku: string,
  mode: Template["variants"],
  stock: number
): ProductVariant[] {
  if (mode === "none") return [];
  const out: ProductVariant[] = [];
  const distribute = (values: string[], axisLabel: string) =>
    values.forEach((v, idx) => {
      out.push({
        id: `${baseSku}-${slugify(v)}`,
        name: axisLabel,
        value: v,
        sku: `${baseSku}-${slugify(v).toUpperCase().slice(0, 4)}`,
        stock: Math.max(0, Math.floor(stock / values.length) + rndInt(-3, 3)),
        priceModifier: idx === 0 ? 0 : rnd() < 0.3 ? rndInt(-500, 1500) : 0,
      });
    });

  if (mode === "color") distribute(pickN(COLORS, rndInt(2, 4)), "Couleur");
  else if (mode === "size")
    distribute(pickN(["Court", "Standard", "Long"], rndInt(2, 3)), "Taille");
  else if (mode === "color_size") {
    const cols = pickN(COLORS, rndInt(2, 3));
    const szs = pickN(SIZES_APPAREL, rndInt(3, 5));
    cols.forEach((c) =>
      szs.forEach((s) =>
        out.push({
          id: `${baseSku}-${slugify(c)}-${slugify(s)}`,
          name: `${c} / ${s}`,
          value: `${c} / ${s}`,
          sku: `${baseSku}-${slugify(c).toUpperCase().slice(0, 3)}-${s}`,
          stock: rndInt(0, Math.max(1, Math.floor(stock / 6))),
        })
      )
    );
  } else if (mode === "shoe") distribute(pickN(SIZES_SHOES, rndInt(4, 6)), "Pointure");
  return out;
}

function nudgePrice(base: number): number {
  // Round to nearest 100 DZD for natural-looking prices
  return Math.round(base / 100) * 100;
}

function computeStockStatus(stock: number): StockStatus {
  if (stock === 0) return "out_of_stock";
  if (stock <= 5) return "low_stock";
  return "in_stock";
}

function buildProducts(): Product[] {
  const all: Product[] = [];
  let n = 0;
  const baseDate = new Date("2026-03-01T08:00:00Z").getTime();

  TEMPLATES.forEach((tpl) => {
    const parent = categories.find((c) => c.slug === tpl.parentSlug);
    if (!parent) return;

    for (let i = 0; i < tpl.count; i++) {
      const brand = pick(brands);
      const model = MODEL_NAMES[(n + i) % MODEL_NAMES.length]!;
      const name = tpl.buildName(model, brand.name, i);
      const slug = `${slugify(name)}-${(n + 1).toString().padStart(3, "0")}`;
      const sku = `BIN-${parent.slug.slice(0, 3).toUpperCase()}-${(n + 1)
        .toString()
        .padStart(4, "0")}`;

      // Mid-weighted DZD price (triangular-ish): average of two uniform rolls
      const [pmin, pmax] = tpl.priceRange;
      const p1 = pmin + rnd() * (pmax - pmin);
      const p2 = pmin + rnd() * (pmax - pmin);
      const basePrice = nudgePrice((p1 + p2) / 2);

      const isPromo = rnd() < 0.3;
      const oldPrice = isPromo ? nudgePrice(basePrice * (1.15 + rnd() * 0.35)) : undefined;

      // Stock distribution: 5% out, 10% low (1-5), 85% in stock (8-80)
      const stockRoll = rnd();
      let stock: number;
      if (stockRoll < 0.05) stock = 0;
      else if (stockRoll < 0.15) stock = rndInt(1, 5);
      else stock = rndInt(8, 80);

      const subSlug = pick(tpl.subSlugs);
      const sub = categories.find((c) => c.slug === subSlug);

      const imgCount = rndInt(4, 6);
      const attrPool = tpl.attrs();
      const attrCount = rndInt(3, Math.min(8, attrPool.length));
      const attrs = attrPool.slice(0, attrCount);

      const variants = buildVariants(sku, tpl.variants, stock);

      // Date distributed across last 90 days
      const created = new Date(baseDate - rndInt(0, 90) * 24 * 3600 * 1000);
      const updated = new Date(created.getTime() + rndInt(0, 30) * 24 * 3600 * 1000);

      const product: Product = {
        id: `prod-${(n + 1).toString().padStart(3, "0")}`,
        slug,
        name,
        description: tpl.buildDescription(name),
        descriptionShort: tpl.buildShort(),
        brand,
        category: parent,
        subcategory: sub,
        price: basePrice,
        oldPrice,
        sku,
        stock,
        stockStatus: computeStockStatus(stock),
        images: buildImages(name, slug, imgCount),
        attributes: attrs,
        variants,
        rating: Math.round((3.5 + rnd() * 1.5) * 10) / 10,
        reviewCount: rndInt(2, 240),
        isFeatured: false,
        isNew: false,
        isBestSeller: false,
        isPromo,
        viewCount: rndInt(50, 4500),
        soldCount: rndInt(0, 480),
        createdAt: created.toISOString(),
        updatedAt: updated.toISOString(),
      };
      all.push(product);
      n++;
    }
  });

  // Assign feature flags deterministically: top 12 viewCount → featured,
  // most recent 15 by createdAt → new, top 10 soldCount → bestseller.
  const byViews = [...all].sort((a, b) => b.viewCount - a.viewCount);
  byViews.slice(0, 12).forEach((p) => (p.isFeatured = true));
  const byNew = [...all].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  byNew.slice(0, 15).forEach((p) => (p.isNew = true));
  const bySold = [...all].sort((a, b) => b.soldCount - a.soldCount);
  bySold.slice(0, 10).forEach((p) => (p.isBestSeller = true));

  // Update productCount per category
  all.forEach((p) => {
    const parent = categories.find((c) => c.id === p.category.id);
    if (parent) parent.productCount += 1;
    if (p.subcategory) {
      const sub = categories.find((c) => c.id === p.subcategory!.id);
      if (sub) sub.productCount += 1;
    }
  });

  return all;
}

export const products: Product[] = buildProducts();

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter(
    (p) => p.category.slug === categorySlug || p.subcategory?.slug === categorySlug
  );
}
