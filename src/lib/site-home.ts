/**
 * Admin-edited homepage config (hero featured picks + promo banner).
 *
 * Settings key contract — written by /admin/banners:
 *   home.featured.slug.0 .. home.featured.slug.5
 *       Each value is `"<kind>:<slug>"` where kind ∈ `product | category`.
 *       Legacy bare-slug values (no prefix) decode as products for
 *       back-compat.
 *   home.promo.title.fr   /  home.promo.title.ar
 *   home.promo.cta.fr     /  home.promo.cta.ar
 *   home.promo.link
 *       Standalone string keys, all optional.
 */

export const FEATURED_COUNT = 6;

export type FeaturedKind = "product" | "category";
export interface FeaturedRef {
  kind: FeaturedKind;
  slug: string;
}

/** Resolved card — fields the Hero pile needs to render any thumb,
 *  whether it points at a product or a category. Also reused by the
 *  BestSellers / Newest product strips on the homepage. */
export interface HeroSlot {
  kind: FeaturedKind;
  slug: string;
  nameFr: string;
  nameAr: string;
  image: string;
  /** Product → price in DZD; category → null (no badge rendered). */
  price: number | null;
  /** Original price before discount, when applicable (product cards). */
  oldPrice?: number | null;
  /** Brand name — only set for products; categories leave it undefined. */
  brand?: string;
  /** Destination URL — /produit/X for products, /catalogue?category=X for cats. */
  href: string;
}

/** @deprecated retained only for older imports — use HeroSlot instead. */
export type HeroProduct = HeroSlot;

export interface SiteHome {
  /** The 6 admin-picked refs, in display order. */
  featured: (FeaturedRef | null)[];
  /** Resolved cards from `featured` — preserves admin order; drops any
   *  ref whose slug no longer exists in the catalogue. Renders 0–6
   *  cards in the hero piles depending on what the admin set. */
  featuredSlots: HeroSlot[];
  /** Top best-selling products (4 max) — admin-flagged via `is_best_seller`,
   *  fallback to most-sold from the catalogue if none are flagged. */
  bestSellers: HeroSlot[];
  /** Newest arrivals (4 max) — admin-flagged via `is_new`, fallback to
   *  most-recently-created products if none are flagged. */
  newest: HeroSlot[];
  promo: {
    titleFr: string;
    titleAr: string;
    ctaFr: string;
    ctaAr: string;
    link: string;
  };
  /** Live snapshot of active promotions, computed server-side from the
   *  catalogue so the Promotions section never displays stale claims. */
  promoStats: {
    /** Total number of active promo products in the catalogue. 0 hides the section. */
    count: number;
    /** Highest discount % currently active across promo products, or null
     *  when no promo product has an `oldPrice`. */
    maxDiscount: number | null;
  };
}

export const SITE_HOME_DEFAULTS: SiteHome = {
  featured: Array.from({ length: FEATURED_COUNT }, () => null),
  featuredSlots: [],
  bestSellers: [],
  newest: [],
  promo: {
    titleFr: "",
    titleAr: "",
    ctaFr: "",
    ctaAr: "",
    link: "",
  },
  promoStats: { count: 0, maxDiscount: null },
};

/** Parse the `"<kind>:<slug>"` token stored in settings. Bare slug =
 *  product. Empty / unknown kind returns null. */
export function decodeRef(
  raw: string | null | undefined,
): FeaturedRef | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const idx = raw.indexOf(":");
  if (idx === -1) return { kind: "product", slug: raw };
  const kind = raw.slice(0, idx);
  const slug = raw.slice(idx + 1);
  if (!slug) return null;
  if (kind === "product" || kind === "category") {
    return { kind, slug };
  }
  return null;
}

/** Project a flat /api/settings map onto the homepage config — only
 *  the keys that live in `settings`. The slot lists (`featuredSlots`,
 *  `bestSellers`, `newest`) need a separate product fetch and are
 *  filled in by the caller, hence the broader Omit. */
export function siteHomeBaseFromSettings(
  map: Record<string, string | null | undefined>,
): Omit<SiteHome, "featuredSlots" | "bestSellers" | "newest" | "promoStats"> {
  const featured = Array.from({ length: FEATURED_COUNT }, (_, i) =>
    decodeRef(map[`home.featured.slug.${i}`]),
  );
  return {
    featured,
    promo: {
      titleFr: (typeof map["home.promo.title.fr"] === "string"
        ? map["home.promo.title.fr"]
        : "") as string,
      titleAr: (typeof map["home.promo.title.ar"] === "string"
        ? map["home.promo.title.ar"]
        : "") as string,
      ctaFr: (typeof map["home.promo.cta.fr"] === "string"
        ? map["home.promo.cta.fr"]
        : "") as string,
      ctaAr: (typeof map["home.promo.cta.ar"] === "string"
        ? map["home.promo.cta.ar"]
        : "") as string,
      link: (typeof map["home.promo.link"] === "string"
        ? map["home.promo.link"]
        : "") as string,
    },
  };
}
