export type Product = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  description: string;
  features: string[];
};

export const PRODUCTS: Product[] = [
  {
    slug: "marmot-lithium-0",
    name: "Sac de couchage en duvet",
    brand: "Marmot Lithium 0",
    price: 12500,
    oldPrice: 14900,
    image:
      "https://images.unsplash.com/photo-1487730116645-7be521e35813?w=1200&q=85&fit=crop",
    description:
      "Conçu pour les nuits glaciales en haute montagne — duvet d'oie 850 fill, isolation thermique jusqu'à -18 °C, poids plume de 1,2 kg. Le compagnon de référence du Djurdjura à l'Atlas.",
    features: [
      "Duvet d'oie 850 fill",
      "Confort thermique jusqu'à -18 °C",
      "Poids : 1,2 kg",
      "Étui de compression inclus",
      "Tissu Pertex Quantum",
    ],
  },
  {
    slug: "msr-hubba-nx",
    name: "Tente 2 places ultralégère",
    brand: "MSR Hubba NX",
    price: 18900,
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=85&fit=crop",
    description:
      "Double paroi imperméable, montage en 5 minutes chrono, deux portes pour ne plus enjamber son binôme. Pensée pour les longues traversées sans concession sur le poids.",
    features: [
      "Poids : 1,7 kg",
      "Double paroi imperméable 1500 mm",
      "Montage 5 min, 2 personnes",
      "Deux portes + auvents",
      "Arceaux DAC Featherlite NSL",
    ],
  },
  {
    slug: "osprey-atmos-65",
    name: "Sac à dos de trek 65 L",
    brand: "Osprey Atmos AG",
    price: 14200,
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
    description:
      "Le sac de référence pour le trek longue distance. Suspension Anti-Gravity, dos ventilé, ceinture ajustable au degré près. 65 L pensés pour avaler les expéditions de plusieurs semaines.",
    features: [
      "Volume : 65 L",
      "Suspension Anti-Gravity ventilée",
      "Poids : 2,1 kg",
      "Housse de pluie intégrée",
      "Garantie à vie Osprey",
    ],
  },
  {
    slug: "petzl-actik-core",
    name: "Lampe frontale 450 lm",
    brand: "Petzl Actik Core",
    price: 4800,
    oldPrice: 5600,
    image:
      "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=1200&q=85&fit=crop",
    description:
      "Frontale rechargeable polyvalente — 450 lumens en mode large + faisceau focalisé pour les sentiers techniques. Batterie Core remplaçable par 3 piles AAA en dépannage.",
    features: [
      "450 lumens max",
      "Batterie Core rechargeable USB-C",
      "Compatible 3× AAA en secours",
      "Bandeau réfléchissant",
      "Étanchéité IPX4",
    ],
  },
  {
    slug: "patagonia-torrentshell",
    name: "Veste imperméable",
    brand: "Patagonia Torrentshell",
    price: 16900,
    oldPrice: 19500,
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=85&fit=crop",
    description:
      "Hardshell 3 couches H2No®, taillée pour la pluie alpine. Capuche réglable, fermeture pit-zip pour ventiler en montée. Tissu en nylon recyclé, certifié Fair Trade.",
    features: [
      "Membrane H2No® 3 couches",
      "Capuche ajustable au casque",
      "Fermetures éclair étanches",
      "Nylon 100 % recyclé",
      "Fair Trade Certified™",
    ],
  },
  {
    slug: "jetboil-flash",
    name: "Réchaud à gaz",
    brand: "Jetboil Flash",
    price: 11200,
    image:
      "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&q=85&fit=crop",
    description:
      "Système d'ébullition tout-en-un — 0,5 L en 100 secondes. Tasse isolée FluxRing®, allumage piézo, design empilable. Le réchaud du break-fast au sommet.",
    features: [
      "500 ml en 100 s",
      "Allumage piézo intégré",
      "Tasse isolée 1 L FluxRing®",
      "Poids : 371 g",
      "Stockage de la cartouche intégré",
    ],
  },
  {
    slug: "leatherman-wave",
    name: "Couteau multifonctions",
    brand: "Leatherman Wave+",
    price: 8400,
    oldPrice: 9900,
    image:
      "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=85&fit=crop",
    description:
      "Dix-huit outils, accessibles d'une seule main. Lames en acier 420HC, pince à ressort, brucelles de remplacement. Garantie 25 ans — l'outil pour la vie.",
    features: [
      "18 outils intégrés",
      "Acier 420HC trempé",
      "Ouvrable à une main",
      "Garantie 25 ans",
      "Étui en cuir inclus",
    ],
  },
  {
    slug: "hydro-flask-1l",
    name: "Bouteille isotherme 1 L",
    brand: "Hydro Flask Wide",
    price: 4200,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=85&fit=crop",
    description:
      "Double paroi sous vide TempShield™ — 24 h frais, 12 h chaud. Goulot large pour le café du matin et les glaçons du soir. Inox 18/8 sans BPA, garanti à vie.",
    features: [
      "Capacité : 1 L (32 oz)",
      "24 h frais · 12 h chaud",
      "Inox 18/8 sans BPA",
      "Goulot large 5,3 cm",
      "Garantie à vie",
    ],
  },
];

export function getProduct(slug: string): Product | null {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export const formatDA = (value: number) =>
  new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(value) +
  " DA";

export const discountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;
