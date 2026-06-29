import {
  getProduct,
  type Product,
  type ProductVariant,
} from "@/lib/products";
import { serverFetch } from "@/lib/server/server-fetch";

/**
 * Server-side fetch of a single product by slug, projected to the
 * local `Product` shape so the existing client-side product page can
 * consume it without changes.
 *
 * Source: GET /api/products/{slug} — public, no auth, returns the full
 * ApiProduct row (eager-loaded category + brand + images + variants).
 *
 * Falls back to the local mock catalogue (legacy `getProduct(slug)`)
 * when the backend is unreachable, so the page still renders for any
 * slug that ships in the build.
 */
export async function getServerProductBySlug(
  slug: string,
): Promise<Product | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) return getProduct(slug);

  try {
    const res = await serverFetch(
      `${base}/api/products/${encodeURIComponent(slug)}`,
      {
        // Refresh every 30s — admin price/description edits propagate
        // without a rebuild but we don't pummel the backend per visit.
        next: { revalidate: 30 },
      },
    );
    if (res.status === 404) return getProduct(slug); // not in DB; try mock
    if (!res.ok) return getProduct(slug); // 500-ish → fall back

    const body = (await res.json()) as { data?: ApiProductPayload };
    if (!body.data) return getProduct(slug);
    return adapt(body.data);
  } catch {
    // Network blip → mock fallback so the route still renders something.
    return getProduct(slug);
  }
}

/* ─── Minimal shape of the response we care about ─── */
interface ApiProductPayload {
  slug: string;
  nameFr: string;
  nameAr?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  descriptionShortFr?: string | null;
  descriptionShortAr?: string | null;
  price: number;
  oldPrice?: number | null;
  stock?: number;
  trackStock?: boolean;
  allowBackorder?: boolean;
  brand?: { name?: string } | null;
  category?: { slug?: string } | null;
  video?: string | null;
  images?: Array<{ url: string; isPrimary?: boolean; displayOrder?: number }>;
  variants?: Array<{
    id: string;
    colorNameFr?: string | null;
    colorNameAr?: string | null;
    colorHex?: string | null;
    sizeLabel?: string | null;
    skuSuffix?: string | null;
    priceDelta?: number;
    stock?: number;
    displayOrder?: number;
  }>;
}

/** Plain-text projection of an HTML string — used for `<meta name=…>`
 *  (which can't carry tags) and for length probes like "is this long
 *  enough to need a Read More?". The full HTML is rendered as-is on
 *  the page. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function adapt(p: ApiProductPayload): Product {
  // Sort images by displayOrder (primary first, then by index) so the
  // hero slide matches the merchant's intent.
  const sortedImages = (p.images ?? [])
    .slice()
    .sort((a, b) => {
      if (!!b.isPrimary !== !!a.isPrimary) return b.isPrimary ? 1 : -1;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    })
    .map((img) => img.url);

  const descFr = p.descriptionFr ?? p.descriptionShortFr ?? "";
  const descAr = p.descriptionAr ?? p.descriptionShortAr ?? "";

  const variants: ProductVariant[] = (p.variants ?? [])
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((v) => ({
      id: v.id,
      colorNameFr: v.colorNameFr ?? null,
      colorNameAr: v.colorNameAr ?? null,
      colorHex: v.colorHex ?? null,
      sizeLabel: v.sizeLabel ?? null,
      priceDelta: v.priceDelta ?? 0,
      stock: v.stock ?? 0,
      skuSuffix: v.skuSuffix ?? null,
      displayOrder: v.displayOrder ?? 0,
    }));

  return {
    slug: p.slug,
    name: p.nameFr,
    nameAr: p.nameAr ?? undefined,
    brand: p.brand?.name ?? "—",
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    image: sortedImages[0] ?? "",
    images: sortedImages.length > 0 ? sortedImages : undefined,
    video: p.video ?? undefined,
    categorySlug: p.category?.slug ?? undefined,
    // Keep the raw HTML — the details page renders it via
    // dangerouslySetInnerHTML so bold, lists, line breaks, etc.
    // survive the round trip. Local mock plain text still renders
    // fine (no tags = harmless).
    description: descFr,
    descriptionAr: descAr || undefined,
    features: [],
    stock: p.stock ?? undefined,
    trackStock: p.trackStock,
    allowBackorder: p.allowBackorder,
    variants: variants.length > 0 ? variants : undefined,
  };
}

/**
 * Server-side fetch of "Produits similaires" — other products in the
 * same category as `currentSlug`. Returns up to `limit` adapted
 * Products with the current one filtered out.
 *
 * Returns an empty array when the backend is unreachable, the
 * category has no other products, or no `categorySlug` is provided.
 * Callers are expected to hide the "Produits similaires" section
 * when the list is empty — we do not fall back to mock data, since
 * that would render unrelated products as if they were genuine
 * recommendations.
 */
export async function getServerSimilarProducts(
  currentSlug: string,
  categorySlug: string | null | undefined,
  limit = 4,
): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base || !categorySlug) return [];
  try {
    const params = new URLSearchParams();
    params.set("category", categorySlug);
    // Pull one extra so we still have `limit` rows after filtering out
    // the current product.
    params.set("perPage", String(limit + 1));
    const res = await serverFetch(`${base}/api/products?${params.toString()}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: ApiProductPayload[] };
    const rows = (body.data ?? []).filter((p) => p.slug !== currentSlug);
    return rows.slice(0, limit).map(adapt);
  } catch {
    return [];
  }
}
