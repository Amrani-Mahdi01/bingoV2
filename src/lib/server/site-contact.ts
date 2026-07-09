import {
  siteContact as contactDefaults,
  siteContactFromSettings,
  type SiteContact,
} from "@/lib/site-contact";
import {
  SITE_BRANDING_DEFAULTS,
  siteBrandingFromSettings,
  type SiteBranding,
} from "@/lib/site-branding";
import {
  SITE_HOME_DEFAULTS,
  siteHomeBaseFromSettings,
  type HeroSlot,
  type SiteHome,
} from "@/lib/site-home";
import {
  SITE_CATEGORIES_DEFAULTS,
  type SiteCategories,
  type SiteCategory,
} from "@/lib/site-categories";
import { serverFetch } from "@/lib/server/server-fetch";
import { mediaUrl } from "@/lib/media";

/**
 * Server-side fetch of the public /api/settings map. Next.js dedupes
 * identical fetches within a single render, so the two project-callers
 * below (`getServerSiteContact`, `getServerSiteBranding`) only hit the
 * backend once per page load.
 *
 * Returns `null` on any error so each projector can apply its own
 * defaults — we don't want a network blip to break the whole layout.
 */
async function fetchSettingsMap(): Promise<Record<
  string,
  string | null | undefined
> | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) return null;
  try {
    const res = await serverFetch(`${base}/api/settings`, {
      // Refresh every 10s — the client-side provider also fetches the
      // map on mount with `cache: "no-store"`, so even when this SSR
      // cache is stale, the visible top bar updates within a tick of
      // the user landing on the page.
      next: { revalidate: 10 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data?: Record<string, string | null | undefined>;
    };
    return body.data ?? {};
  } catch {
    return null;
  }
}

/** Server-side seed for SiteContactProvider — admin-edited contact info. */
export async function getServerSiteContact(): Promise<SiteContact> {
  const map = await fetchSettingsMap();
  if (!map) return contactDefaults;
  return siteContactFromSettings(map);
}

/** Server-side seed for SiteBrandingProvider — logo + display tuning. */
export async function getServerSiteBranding(): Promise<SiteBranding> {
  const map = await fetchSettingsMap();
  if (!map) return SITE_BRANDING_DEFAULTS;
  return siteBrandingFromSettings(map);
}

/**
 * Server-side seed for SiteHomeProvider — hero featured picks + promo
 * banner. Resolves admin-picked product AND category slugs against the
 * public catalogue API in parallel so the Hero gets full card data
 * (name, image, price/href) without any client-side fetches.
 */
export async function getServerSiteHome(): Promise<SiteHome> {
  const map = await fetchSettingsMap();
  if (!map) return SITE_HOME_DEFAULTS;

  const base = siteHomeBaseFromSettings(map);
  const emptyStats = { count: 0, maxDiscount: null as number | null };
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiBase) {
    return {
      ...base,
      featuredSlots: [],
      bestSellers: [],
      newest: [],
      promoStats: emptyStats,
    };
  }

  const productSlugs = base.featured
    .filter((r): r is { kind: "product"; slug: string } =>
      r?.kind === "product",
    )
    .map((r) => r.slug);
  const categorySlugs = base.featured
    .filter((r): r is { kind: "category"; slug: string } =>
      r?.kind === "category",
    )
    .map((r) => r.slug);

  // Fetch products + categories + best-sellers + newest + active promos
  // in parallel. Each is a single request — cheaper than per-slug lookups.
  const [productsRes, categoriesRes, bestRes, newRes, promoRes] = await Promise.allSettled([
    productSlugs.length > 0
      ? serverFetch(`${apiBase}/api/products?perPage=100`, { next: { revalidate: 30 } })
      : Promise.resolve(null),
    categorySlugs.length > 0
      ? serverFetch(`${apiBase}/api/categories`, { next: { revalidate: 30 } })
      : Promise.resolve(null),
    serverFetch(
      `${apiBase}/api/products?flag=bestseller&sort=bestseller&perPage=4`,
      { next: { revalidate: 30 } },
    ),
    serverFetch(
      `${apiBase}/api/products?flag=new&sort=new&perPage=4`,
      { next: { revalidate: 30 } },
    ),
    // perPage=50 is enough headroom to find the real max discount
    // without paging through the whole promo list. meta.total carries
    // the true count.
    serverFetch(
      `${apiBase}/api/products?promoOnly=1&perPage=50`,
      { next: { revalidate: 30 } },
    ),
  ]);

  // ---- Promo stats — real count + max discount from the live catalogue.
  let promoStats = emptyStats;
  if (promoRes.status === "fulfilled" && promoRes.value && promoRes.value.ok) {
    try {
      const body = (await promoRes.value.json()) as {
        data?: Array<{ price: number; oldPrice?: number | null }>;
        meta?: { total?: number };
      };
      const rows = body.data ?? [];
      let maxPct: number | null = null;
      for (const p of rows) {
        if (p.oldPrice && p.oldPrice > p.price) {
          const pct = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
          if (maxPct === null || pct > maxPct) maxPct = pct;
        }
      }
      promoStats = {
        count: body.meta?.total ?? rows.length,
        maxDiscount: maxPct,
      };
    } catch {
      /* swallow — leave stats at zero */
    }
  }

  const productBySlug = new Map<
    string,
    {
      slug: string;
      nameFr: string;
      nameAr: string;
      price: number;
      oldPrice?: number | null;
      brand?: { name?: string } | null;
      images?: Array<{ url: string }>;
    }
  >();
  if (productsRes.status === "fulfilled" && productsRes.value && productsRes.value.ok) {
    try {
      const body = (await productsRes.value.json()) as {
        data?: Array<{
          slug: string;
          nameFr: string;
          nameAr: string;
          price: number;
          oldPrice?: number | null;
          brand?: { name?: string } | null;
          images?: Array<{ url: string }>;
        }>;
      };
      for (const p of body.data ?? []) productBySlug.set(p.slug, p);
    } catch {
      /* swallow */
    }
  }

  const categoryBySlug = new Map<
    string,
    { slug: string; nameFr: string; nameAr: string; image: string | null }
  >();
  if (categoriesRes.status === "fulfilled" && categoriesRes.value && categoriesRes.value.ok) {
    try {
      const body = (await categoriesRes.value.json()) as {
        data?: Array<{
          slug: string;
          nameFr: string;
          nameAr: string;
          image: string | null;
          children?: Array<{
            slug: string;
            nameFr: string;
            nameAr: string;
            image: string | null;
          }>;
        }>;
      };
      // Flatten parents + children so admin sub-category picks resolve too.
      for (const top of body.data ?? []) {
        categoryBySlug.set(top.slug, top);
        for (const sub of top.children ?? []) {
          categoryBySlug.set(sub.slug, sub);
        }
      }
    } catch {
      /* swallow */
    }
  }

  // Walk the slots in admin order; build a HeroSlot per ref, skipping
  // any whose target no longer exists.
  const resolved: HeroSlot[] = [];
  for (const ref of base.featured) {
    if (!ref) continue;
    if (ref.kind === "product") {
      const p = productBySlug.get(ref.slug);
      if (!p) continue;
      resolved.push(productToHeroSlot(p));
    } else {
      const c = categoryBySlug.get(ref.slug);
      if (!c) continue;
      resolved.push({
        kind: "category",
        slug: c.slug,
        nameFr: c.nameFr,
        nameAr: c.nameAr,
        image: mediaUrl(c.image),
        price: null,
        href: `/catalogue?category=${encodeURIComponent(c.slug)}`,
      });
    }
  }

  // Best-sellers — try the flagged set first. If empty, the storefront
  // section can fall back to anything else via a second call (top by
  // sold_count). Worst case: empty array → section is hidden.
  let bestSellers: HeroSlot[] = [];
  if (bestRes.status === "fulfilled" && bestRes.value.ok) {
    try {
      const body = (await bestRes.value.json()) as {
        data?: Array<{
          slug: string;
          nameFr: string;
          nameAr: string;
          price: number;
          oldPrice?: number | null;
          brand?: { name?: string } | null;
          images?: Array<{ url: string }>;
        }>;
      };
      bestSellers = (body.data ?? []).map(productToHeroSlot);
    } catch {
      /* swallow */
    }
  }
  // Fallback: when no admin has flagged any best sellers yet, surface
  // the top-sold products instead so the section isn't empty.
  if (bestSellers.length === 0) {
    try {
      const fallback = await serverFetch(
        `${apiBase}/api/products?sort=bestseller&perPage=4`,
        { next: { revalidate: 30 } },
      );
      if (fallback.ok) {
        const body = (await fallback.json()) as {
          data?: Array<{
            slug: string;
            nameFr: string;
            nameAr: string;
            price: number;
            oldPrice?: number | null;
            brand?: { name?: string } | null;
            images?: Array<{ url: string }>;
          }>;
        };
        bestSellers = (body.data ?? []).map(productToHeroSlot);
      }
    } catch {
      /* swallow */
    }
  }

  // Newest arrivals — same pattern as best-sellers: try the flagged
  // set first, fall back to the most-recently-created products when
  // nothing is flagged yet.
  let newest: HeroSlot[] = [];
  if (newRes.status === "fulfilled" && newRes.value.ok) {
    try {
      const body = (await newRes.value.json()) as {
        data?: Array<{
          slug: string;
          nameFr: string;
          nameAr: string;
          price: number;
          oldPrice?: number | null;
          brand?: { name?: string } | null;
          images?: Array<{ url: string }>;
        }>;
      };
      newest = (body.data ?? []).map(productToHeroSlot);
    } catch {
      /* swallow */
    }
  }
  if (newest.length === 0) {
    try {
      const fallback = await serverFetch(
        `${apiBase}/api/products?sort=new&perPage=4`,
        { next: { revalidate: 30 } },
      );
      if (fallback.ok) {
        const body = (await fallback.json()) as {
          data?: Array<{
            slug: string;
            nameFr: string;
            nameAr: string;
            price: number;
            oldPrice?: number | null;
            brand?: { name?: string } | null;
            images?: Array<{ url: string }>;
          }>;
        };
        newest = (body.data ?? []).map(productToHeroSlot);
      }
    } catch {
      /* swallow */
    }
  }

  return { ...base, featuredSlots: resolved, bestSellers, newest, promoStats };
}

/** Project a raw API product row to the shared HeroSlot shape. */
function productToHeroSlot(p: {
  slug: string;
  nameFr: string;
  nameAr: string;
  price: number;
  oldPrice?: number | null;
  brand?: { name?: string } | null;
  images?: Array<{ url: string }>;
}): HeroSlot {
  return {
    kind: "product",
    slug: p.slug,
    nameFr: p.nameFr,
    nameAr: p.nameAr,
    image: mediaUrl(p.images?.[0]?.url),
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    brand: p.brand?.name ?? undefined,
    href: `/produit/${p.slug}`,
  };
}

/**
 * Server-side seed for SiteCategoriesProvider — fetches the public
 * categories tree (top-level + children rolled up to product counts)
 * so homepage tiles and any other storefront surface can render the
 * live list without a client roundtrip.
 */
export async function getServerCategories(): Promise<SiteCategories> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) return SITE_CATEGORIES_DEFAULTS;
  try {
    const res = await serverFetch(`${base}/api/categories`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return SITE_CATEGORIES_DEFAULTS;
    const body = (await res.json()) as {
      data?: Array<{
        id: string;
        slug: string;
        nameFr: string;
        nameAr: string;
        image: string | null;
        icon: string;
        productCount: number;
        children?: Array<{
          id: string;
          slug: string;
          nameFr: string;
          nameAr: string;
          productCount: number;
        }>;
      }>;
    };
    const list: SiteCategory[] = (body.data ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      nameFr: c.nameFr,
      nameAr: c.nameAr,
      image: mediaUrl(c.image),
      icon: c.icon,
      productCount: c.productCount,
      children: (c.children ?? []).map((sc) => ({
        id: sc.id,
        slug: sc.slug,
        nameFr: sc.nameFr,
        nameAr: sc.nameAr,
        productCount: sc.productCount,
      })),
    }));
    return { list };
  } catch {
    return SITE_CATEGORIES_DEFAULTS;
  }
}
