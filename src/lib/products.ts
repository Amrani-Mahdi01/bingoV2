export type Product = {
  slug: string;
  name: string;
  /** Arabic display name. Falls back to `name` when missing. */
  nameAr?: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  /** Optional multi-image gallery for the product slider. Defaults to [image]. */
  images?: string[];
  /** Optional product video (absolute URL), at most one per product. */
  video?: string;
  /** Category slug — used by the catalogue filters. */
  categorySlug?: string;
  description: string;
  /** Arabic description. Falls back to `description` when missing. */
  descriptionAr?: string;
  features: string[];
  /** Top-level stock (used when the product has no variants). When
   *  `trackStock === false` the product is always considered in
   *  stock. When `allowBackorder === true` it stays orderable even
   *  with stock at 0. */
  stock?: number;
  trackStock?: boolean;
  allowBackorder?: boolean;
  /** Color / size variants (when present, the details page renders
   *  pickers and the price/stock derive from the selected variant). */
  variants?: ProductVariant[];
};

/**
 * Single source of truth for "can this product be ordered right now?".
 * If a variant is selected, its stock takes priority over the
 * top-level number (variants are the per-SKU layer). Untracked or
 * backorder-friendly products are never out of stock. Mirrors the
 * same rule used by the backend `/api/products` adapter.
 */
export function isProductOutOfStock(
  product: Pick<Product, "stock" | "trackStock" | "allowBackorder">,
  selectedVariant?: { stock: number } | null,
): boolean {
  if (selectedVariant) return selectedVariant.stock <= 0;
  if (product.trackStock === false) return false;
  if (product.allowBackorder) return false;
  // `stock` is optional on the legacy mock catalogue — undefined means
  // "no tracking", which is treated as in-stock.
  if (product.stock == null) return false;
  return product.stock <= 0;
}

export type ProductVariant = {
  id: string;
  colorNameFr: string | null;
  colorNameAr: string | null;
  colorHex: string | null;
  sizeLabel: string | null;
  /** Added to `Product.price` when this variant is the selected one. */
  priceDelta: number;
  stock: number;
  skuSuffix: string | null;
  displayOrder: number;
};

export const PRODUCTS: Product[] = [
  {
    slug: "marmot-lithium-0",
    name: "Sac de couchage en duvet",
    nameAr: "كيس نوم زغبي",
    brand: "Marmot Lithium 0",
    price: 12500,
    oldPrice: 14900,
    image:
      "https://images.unsplash.com/photo-1487730116645-7be521e35813?w=1200&q=85&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1487730116645-7be521e35813?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
    ],
    categorySlug: "sacs-de-couchage",
    description:
      "Conçu pour les nuits glaciales en haute montagne — duvet d'oie 850 fill, isolation thermique jusqu'à -18 °C, poids plume de 1,2 kg. Le compagnon de référence du Djurdjura à l'Atlas.",
    descriptionAr:
      "مُصمَّم لليالي الجبلية الباردة — زغب إوز 850 fill، عزل حراري حتى ‎-18°م، وزن خفيف 1.2 كغ. الرفيق المعتمد من جرجرة إلى الأطلس.",
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
    nameAr: "خيمة لشخصين فائقة الخفة",
    brand: "MSR Hubba NX",
    price: 18900,
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=85&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1487730116645-7be521e35813?w=1200&q=85&fit=crop",
    ],
    categorySlug: "tentes",
    description:
      "Double paroi imperméable, montage en 5 minutes chrono, deux portes pour ne plus enjamber son binôme. Pensée pour les longues traversées sans concession sur le poids.",
    descriptionAr:
      "جدار مزدوج مقاوم للماء، نصب في 5 دقائق، بابان لتجنّب تخطّي رفيقك. مصمّمة للمسارات الطويلة دون أي تنازل عن الوزن.",
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
    nameAr: "حقيبة ظهر للترحال 65 لتر",
    brand: "Osprey Atmos AG",
    price: 14200,
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
    ],
    categorySlug: "sacs-a-dos",
    description:
      "Le sac de référence pour le trek longue distance. Suspension Anti-Gravity, dos ventilé, ceinture ajustable au degré près. 65 L pensés pour avaler les expéditions de plusieurs semaines.",
    descriptionAr:
      "الحقيبة المرجعية للترحال الطويل. تعليق Anti-Gravity، ظهر متهوّى، وحزام قابل للضبط بدقة. 65 لتر مصمّمة لاستيعاب رحلات تستغرق أسابيع.",
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
    nameAr: "كشاف رأس 450 لومن",
    brand: "Petzl Actik Core",
    price: 4800,
    oldPrice: 5600,
    image:
      "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=1200&q=85&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1487730116645-7be521e35813?w=1200&q=85&fit=crop",
    ],
    categorySlug: "eclairage",
    description:
      "Frontale rechargeable polyvalente — 450 lumens en mode large + faisceau focalisé pour les sentiers techniques. Batterie Core remplaçable par 3 piles AAA en dépannage.",
    descriptionAr:
      "كشاف رأس قابل للشحن متعدد الاستخدامات — 450 لومن في الوضع الواسع + شعاع مركّز للمسارات التقنية. بطارية Core قابلة للاستبدال ببطاريات AAA عند الحاجة.",
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
    nameAr: "سترة مقاومة للماء",
    brand: "Patagonia Torrentshell",
    price: 16900,
    oldPrice: 19500,
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=85&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
    ],
    categorySlug: "campement",
    description:
      "Hardshell 3 couches H2No®, taillée pour la pluie alpine. Capuche réglable, fermeture pit-zip pour ventiler en montée. Tissu en nylon recyclé, certifié Fair Trade.",
    descriptionAr:
      "سترة هاردشيل بثلاث طبقات H2No®، مصمّمة للمطر الجبلي. غطاء رأس قابل للضبط، سحّاب pit-zip للتهوية أثناء الصعود. قماش نايلون معاد التدوير، معتمد Fair Trade.",
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
    nameAr: "موقد غاز",
    brand: "Jetboil Flash",
    price: 11200,
    image:
      "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&q=85&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=85&fit=crop",
    ],
    categorySlug: "campement",
    description:
      "Système d'ébullition tout-en-un — 0,5 L en 100 secondes. Tasse isolée FluxRing®, allumage piézo, design empilable. Le réchaud du break-fast au sommet.",
    descriptionAr:
      "نظام غليان متكامل — 0.5 لتر في 100 ثانية. كأس معزولة FluxRing®، إشعال piezo، تصميم قابل للتكديس. موقد فطور الصباح في القمة.",
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
    nameAr: "سكين متعدد الاستخدامات",
    brand: "Leatherman Wave+",
    price: 8400,
    oldPrice: 9900,
    image:
      "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=85&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
    ],
    categorySlug: "navigation",
    description:
      "Dix-huit outils, accessibles d'une seule main. Lames en acier 420HC, pince à ressort, brucelles de remplacement. Garantie 25 ans — l'outil pour la vie.",
    descriptionAr:
      "ثمانية عشر أداة، يمكن الوصول إليها بيد واحدة. شفرات من فولاذ 420HC، ملقط زنبركي، وملاقط احتياطية. ضمان 25 سنة — الأداة لمدى الحياة.",
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
    nameAr: "زجاجة عازلة 1 لتر",
    brand: "Hydro Flask Wide",
    price: 4200,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=85&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=1200&q=85&fit=crop",
      "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
    ],
    categorySlug: "campement",
    description:
      "Double paroi sous vide TempShield™ — 24 h frais, 12 h chaud. Goulot large pour le café du matin et les glaçons du soir. Inox 18/8 sans BPA, garanti à vie.",
    descriptionAr:
      "جدار مزدوج مفرّغ TempShield™ — 24 ساعة بارد، 12 ساعة ساخن. فوهة واسعة لقهوة الصباح ومكعّبات الثلج في المساء. فولاذ 18/8 خالي من BPA، ضمان مدى الحياة.",
    features: [
      "Capacité : 1 L (32 oz)",
      "24 h frais · 12 h chaud",
      "Inox 18/8 sans BPA",
      "Goulot large 5,3 cm",
      "Garantie à vie",
    ],
  },
  /* ──────────── Catalogue filler — extra products to exercise the
     filters + pagination. Short descriptions on purpose. ─────────── */
  {
    slug: "big-agnes-copper-spur",
    name: "Tente 2 places haute montagne",
    nameAr: "خيمة جبلية لشخصين",
    brand: "Big Agnes Copper Spur HV UL2",
    price: 22500,
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=85&fit=crop",
    categorySlug: "tentes",
    description: "Tente ultralégère 2 places — double paroi imperméable, deux portes, arceaux DAC Featherlite.",
    descriptionAr: "خيمة فائقة الخفة لشخصين — جدار مزدوج مقاوم للماء، بابان، وأعمدة DAC Featherlite.",
    features: ["Poids : 1,4 kg", "Imperméabilité 1500 mm", "Deux portes + auvents", "Arceaux DAC Featherlite"],
  },
  {
    slug: "nemo-hornet-elite-2p",
    name: "Tente alpine 2 places",
    nameAr: "خيمة ألبية لشخصين",
    brand: "Nemo Hornet Elite OSMO 2P",
    price: 24500,
    image: "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
    categorySlug: "tentes",
    description: "La référence ultralégère pour le trek alpin — tissu OSMO™, montage 4 min.",
    descriptionAr: "المرجع فائق الخفة للترحال الجبلي — قماش OSMO™، نصب في 4 دقائق.",
    features: ["Poids : 0,99 kg", "Tissu OSMO™", "Montage en 4 min", "Vestibules doubles"],
  },
  {
    slug: "coleman-sundome-4",
    name: "Tente familiale 4 places",
    nameAr: "خيمة عائلية لـ4 أشخاص",
    brand: "Coleman Sundome 4",
    price: 9500,
    oldPrice: 11200,
    image: "https://images.unsplash.com/photo-1487730116645-7be521e35813?w=1200&q=85&fit=crop",
    categorySlug: "tentes",
    description: "La grande classique — 4 places, montage en 10 min, technologie WeatherTec™.",
    descriptionAr: "الكلاسيكية الكبيرة — 4 أشخاص، نصب في 10 دقائق، تقنية WeatherTec™.",
    features: ["4 places", "Montage en 10 min", "Sol thermosoudé", "Hauteur 1,8 m"],
  },
  {
    slug: "marmot-trestles-30",
    name: "Sac de couchage synthétique",
    nameAr: "كيس نوم اصطناعي",
    brand: "Marmot Trestles 30",
    price: 8200,
    oldPrice: 9500,
    image: "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=1200&q=85&fit=crop",
    categorySlug: "sacs-de-couchage",
    description: "Synthétique 3 saisons — confort jusqu'à -1 °C, idéal pour les nuits humides.",
    descriptionAr: "اصطناعي ثلاثي المواسم — راحة حتى ‎-1°م، مثالي لليالي الرطبة.",
    features: ["Isolation SpiraFil™", "Confort -1 °C", "Poids : 1,8 kg", "Capuche ajustable"],
  },
  {
    slug: "sea-to-summit-trek-tkii",
    name: "Sac de couchage en duvet -5 °C",
    nameAr: "كيس نوم زغبي ‎-5°م",
    brand: "Sea to Summit Trek TkII",
    price: 11500,
    image: "https://images.unsplash.com/photo-1487730116645-7be521e35813?w=1200&q=85&fit=crop",
    categorySlug: "sacs-de-couchage",
    description: "Duvet d'oie 650FP — sac compact pour les expéditions estivales en altitude.",
    descriptionAr: "زغب إوز 650FP — كيس مدمج للرحلات الصيفية في الارتفاعات.",
    features: ["Duvet d'oie 650FP", "Confort -5 °C", "Poids : 1,1 kg", "Sac de compression"],
  },
  {
    slug: "therm-a-rest-hyperion",
    name: "Sac de couchage ultraléger -7 °C",
    nameAr: "كيس نوم فائق الخفة ‎-7°م",
    brand: "Therm-a-Rest Hyperion 32",
    price: 15800,
    image: "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
    categorySlug: "sacs-de-couchage",
    description: "Duvet 900FP traité hydrofuge — le sac ultraléger des sommets.",
    descriptionAr: "زغب 900FP مُعالج مضاد للماء — الكيس فائق الخفة للقمم.",
    features: ["Duvet 900FP Nikwax", "Confort -7 °C", "Poids : 0,52 kg", "Construction Toe-asis"],
  },
  {
    slug: "gregory-baltoro-65",
    name: "Sac à dos trek 65 L",
    nameAr: "حقيبة ظهر للترحال 65 لتر",
    brand: "Gregory Baltoro 65",
    price: 17800,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
    categorySlug: "sacs-a-dos",
    description: "Suspension Response A3 — confort longue distance, accès rapide au volume principal.",
    descriptionAr: "تعليق Response A3 — راحة للمسافات الطويلة، ووصول سريع إلى الحجم الرئيسي.",
    features: ["Volume : 65 L", "Suspension Response A3", "Poids : 2,15 kg", "Housse de pluie"],
  },
  {
    slug: "deuter-aircontact-core",
    name: "Sac à dos trek 60+10 L",
    nameAr: "حقيبة ظهر للترحال 60+10 لتر",
    brand: "Deuter Aircontact Core 60+10",
    price: 13900,
    oldPrice: 16400,
    image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=85&fit=crop",
    categorySlug: "sacs-a-dos",
    description: "Dos Aircontact ventilé — confort durable même chargé. Extension +10 L.",
    descriptionAr: "ظهر Aircontact متهوّى — راحة مستدامة حتى محمّلاً. توسعة +10 لتر.",
    features: ["Volume : 60+10 L", "Dos Aircontact ventilé", "Poids : 2,3 kg", "Ouverture frontale"],
  },
  {
    slug: "osprey-talon-22",
    name: "Sac à dos journée 22 L",
    nameAr: "حقيبة ظهر يومية 22 لتر",
    brand: "Osprey Talon 22",
    price: 7800,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
    categorySlug: "sacs-a-dos",
    description: "Le sac AirScape™ pour la randonnée à la journée — léger, accessible, ventilé.",
    descriptionAr: "حقيبة AirScape™ للمشي اليومي — خفيفة، سهلة الوصول، ومتهوّاة.",
    features: ["Volume : 22 L", "Dos AirScape™", "Poids : 0,75 kg", "Poches stretch latérales"],
  },
  {
    slug: "black-diamond-spot-400",
    name: "Lampe frontale 400 lm",
    nameAr: "كشاف رأس 400 لومن",
    brand: "Black Diamond Spot 400",
    price: 5400,
    image: "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=1200&q=85&fit=crop",
    categorySlug: "eclairage",
    description: "400 lumens, gestes PowerTap™ — la frontale polyvalente alpine/trail.",
    descriptionAr: "400 لومن، إيماءات PowerTap™ — كشاف رأس متعدد الاستخدامات للجبال والمسارات.",
    features: ["400 lumens max", "Gestes PowerTap™", "Étanchéité IPX8", "3× AAA / Rechargeable"],
  },
  {
    slug: "biolite-headlamp-425",
    name: "Frontale rechargeable 425 lm",
    nameAr: "كشاف رأس قابل للشحن 425 لومن",
    brand: "BioLite HeadLamp 425",
    price: 6200,
    image: "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=1200&q=85&fit=crop",
    categorySlug: "eclairage",
    description: "Bandeau Slimfit™ minimaliste, batterie 900 mAh, recharge USB-C.",
    descriptionAr: "شريط رأس Slimfit™ بتصميم بسيط، بطارية 900 mAh، شحن USB-C.",
    features: ["425 lumens", "Bandeau Slimfit™", "Recharge USB-C", "Mode rouge sans éblouir"],
  },
  {
    slug: "goal-zero-lighthouse-mini",
    name: "Lanterne LED 210 lm",
    nameAr: "فانوس LED 210 لومن",
    brand: "Goal Zero Lighthouse Mini",
    price: 9800,
    oldPrice: 11500,
    image: "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1200&q=85&fit=crop",
    categorySlug: "eclairage",
    description: "Lanterne 360° + batterie de secours USB pour recharger un téléphone.",
    descriptionAr: "فانوس 360° + بطارية احتياطية USB لشحن الهاتف.",
    features: ["210 lumens 360°", "Batterie 3000 mAh", "Sortie USB", "Crochet et trépied"],
  },
  {
    slug: "garmin-gpsmap-67",
    name: "GPS de randonnée",
    nameAr: "جهاز GPS للمشي",
    brand: "Garmin GPSMAP 67",
    price: 45000,
    image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=85&fit=crop",
    categorySlug: "navigation",
    description: "GPS multi-bandes GNSS, écran transflectif lisible au soleil, autonomie 180 h.",
    descriptionAr: "GPS متعدد النطاقات GNSS، شاشة transflective قابلة للقراءة تحت الشمس، استقلالية 180 ساعة.",
    features: ["GNSS multi-bandes", "Écran 3″ transflectif", "Autonomie 180 h", "Cartographie TopoActive"],
  },
  {
    slug: "suunto-mc-2",
    name: "Boussole de visée",
    nameAr: "بوصلة تصويب",
    brand: "Suunto MC-2",
    price: 6800,
    image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=85&fit=crop",
    categorySlug: "navigation",
    description: "Boussole miroir avec déclinaison ajustable — la référence des cartographes.",
    descriptionAr: "بوصلة بمرآة مع انحراف قابل للضبط — المرجع لرسامي الخرائط.",
    features: ["Aiguille à amortissement liquide", "Miroir de visée", "Déclinaison ajustable", "Clinomètre intégré"],
  },
  {
    slug: "victorinox-camper",
    name: "Couteau suisse Camper",
    nameAr: "سكين سويسرية Camper",
    brand: "Victorinox Camper",
    price: 4500,
    oldPrice: 5200,
    image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=85&fit=crop",
    categorySlug: "navigation",
    description: "13 fonctions, scie à bois — le compagnon historique des bivouacs.",
    descriptionAr: "13 وظيفة، منشار خشب — الرفيق التاريخي للمخيمات.",
    features: ["13 fonctions", "Scie à bois", "Acier inoxydable", "Made in Switzerland"],
  },
  {
    slug: "msr-pocketrocket-2",
    name: "Réchaud à gaz ultraléger",
    nameAr: "موقد غاز فائق الخفة",
    brand: "MSR PocketRocket 2",
    price: 6900,
    image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&q=85&fit=crop",
    categorySlug: "campement",
    description: "73 g — ébullition d'1 L en 3,5 min. Plus compact tu ne trouveras pas.",
    descriptionAr: "73 غرام — غليان 1 لتر في 3.5 دقيقة. لن تجد أكثر إحكاماً من هذا.",
    features: ["Poids : 73 g", "1 L en 3,5 min", "Pliable en bouchon", "Compatible cartouche EN417"],
  },
  {
    slug: "primus-omnilite-ti",
    name: "Réchaud multi-combustible",
    nameAr: "موقد متعدد الوقود",
    brand: "Primus OmniLite Ti",
    price: 18900,
    image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&q=85&fit=crop",
    categorySlug: "campement",
    description: "Gaz, essence, kérosène — le réchaud des expéditions où le combustible se trouve.",
    descriptionAr: "غاز، بنزين، كيروسين — موقد الرحلات حيث يتوفّر الوقود.",
    features: ["Multi-combustible", "Titane / aluminium", "Pompe ErgoPump™", "Poids : 245 g"],
  },
  {
    slug: "sea-to-summit-x-cup",
    name: "Tasse silicone pliable",
    nameAr: "كوب سيليكون قابل للطي",
    brand: "Sea to Summit X-Cup",
    price: 1800,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=85&fit=crop",
    categorySlug: "campement",
    description: "Tasse 250 ml qui se replie à plat. Idéale pour les sacs à dos minimalistes.",
    descriptionAr: "كوب 250 مل ينطوي بشكل مسطّح. مثالي للحقائب الخفيفة.",
    features: ["250 ml", "Silicone alimentaire", "Pliable à 11 mm", "Anse rigide"],
  },
  {
    slug: "biolite-campstove-2",
    name: "Réchaud à bois rechargeur",
    nameAr: "موقد حطب مع شاحن",
    brand: "BioLite CampStove 2",
    price: 21500,
    oldPrice: 24900,
    image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&q=85&fit=crop",
    categorySlug: "campement",
    description: "Brûle des brindilles, recharge votre téléphone via USB. Bivouac autonome.",
    descriptionAr: "يحرق الأغصان، ويشحن هاتفك عبر USB. مخيّم مستقلّ.",
    features: ["Combustible : brindilles", "Sortie USB 3 W", "Batterie 2600 mAh", "Poids : 935 g"],
  },
  {
    slug: "nalgene-wide-mouth-1l",
    name: "Gourde Nalgene 1 L",
    nameAr: "قنينة Nalgene 1 لتر",
    brand: "Nalgene Wide Mouth",
    price: 1200,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=85&fit=crop",
    categorySlug: "campement",
    description: "L'inusable 1 litre — sans BPA, supporte l'eau bouillante, garanti à vie.",
    descriptionAr: "1 لتر لا يفنى — خالي من BPA، يتحمّل الماء المغلي، ضمان مدى الحياة.",
    features: ["1 L", "Tritan sans BPA", "Goulot large", "Bouchon attaché"],
  },
  {
    slug: "klean-kanteen-32oz",
    name: "Bouteille isotherme 946 ml",
    nameAr: "زجاجة عازلة 946 مل",
    brand: "Klean Kanteen TKWide 32oz",
    price: 5400,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=85&fit=crop",
    categorySlug: "campement",
    description: "Inox 18/8 — climatise vos boissons 50 h froides, 24 h chaudes.",
    descriptionAr: "فولاذ 18/8 — يحفظ مشروباتك 50 ساعة باردة، 24 ساعة ساخنة.",
    features: ["946 ml", "Inox 18/8", "50 h froid · 24 h chaud", "Bouchon en bambou"],
  },
];

export function getProduct(slug: string): Product | null {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

/* ─────────────────────────────────────────────────────────────
   Product → sub-category mapping.
   Kept as a side-table (rather than a field on each Product
   entry) to avoid touching the 29 product records every time the
   sub-category taxonomy is tweaked. The catalogue filter looks
   up here; products not present here simply aren't filtered by
   sub-category and fall through on the parent category match.
   ───────────────────────────────────────────────────────────── */
export const PRODUCT_SUBCATEGORY: Record<string, string> = {
  // sacs-de-couchage
  "marmot-lithium-0": "duvet",
  "marmot-trestles-30": "synthetique",
  "sea-to-summit-trek-tkii": "duvet",
  "therm-a-rest-hyperion": "duvet",
  // tentes
  "msr-hubba-nx": "ultralegeres",
  "big-agnes-copper-spur": "ultralegeres",
  "nemo-hornet-elite-2p": "ultralegeres",
  "coleman-sundome-4": "familiales",
  // sacs-a-dos
  "osprey-atmos-65": "trek",
  "gregory-baltoro-65": "trek",
  "deuter-aircontact-core": "trek",
  "osprey-talon-22": "journee",
  // eclairage
  "petzl-actik-core": "frontales",
  "black-diamond-spot-400": "frontales",
  "biolite-headlamp-425": "frontales",
  "goal-zero-lighthouse-mini": "lanternes",
  // navigation
  "leatherman-wave": "couteaux",
  "victorinox-camper": "couteaux",
  "suunto-mc-2": "boussoles",
  "garmin-gpsmap-67": "boussoles",
  // campement (note: "hydratation" slug exists under both campement
  // and sacs-a-dos — they're distinguished by the parent category)
  "jetboil-flash": "cuisine",
  "msr-pocketrocket-2": "cuisine",
  "primus-omnilite-ti": "cuisine",
  "biolite-campstove-2": "cuisine",
  "sea-to-summit-x-cup": "cuisine",
  "hydro-flask-1l": "hydratation",
  "nalgene-wide-mouth-1l": "hydratation",
  "klean-kanteen-32oz": "hydratation",
  // patagonia-torrentshell: campement, no matching sub — left out
};

export function getProductSubCategory(slug: string): string | null {
  return PRODUCT_SUBCATEGORY[slug] ?? null;
}

export const formatDA = (value: number) =>
  new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(value) +
  " DA";

export const discountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;
