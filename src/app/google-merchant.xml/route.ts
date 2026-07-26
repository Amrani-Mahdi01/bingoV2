import { SITE_URL, SITE_NAME, CURRENCY, absUrl } from "@/lib/seo/config";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace).
 *
 * Served at `/google-merchant.xml`. Add this URL in Merchant Center as a
 * scheduled-fetch data source so ALL products are listed (Google's automatic
 * site crawl only finds a partial subset). French locale only, so the FR and
 * AR versions of a product are never submitted as two separate items.
 *
 * Regenerated hourly; prices/stock stay in sync with the catalogue.
 */
export const revalidate = 3600;

interface FeedImage {
  url: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

interface FeedProduct {
  slug: string;
  sku: string;
  nameFr: string;
  descriptionFr?: string | null;
  descriptionShortFr?: string | null;
  price: number;
  oldPrice?: number | null;
  stockStatus?: string;
  allowBackorder?: boolean;
  isActive?: boolean;
  brand?: { name?: string | null } | null;
  images?: FeedImage[];
}

/** Page through the whole catalogue — the API hard-caps perPage at 100. */
async function fetchAllProducts(): Promise<FeedProduct[]> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) return [];
  const perPage = 100;
  const out: FeedProduct[] = [];
  try {
    for (let page = 1; page <= 50; page += 1) {
      const res = await fetch(
        `${base}/api/products?perPage=${perPage}&page=${page}`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) break;
      const body = (await res.json()) as {
        data?: FeedProduct[];
        meta?: { lastPage?: number };
      };
      out.push(...(body.data ?? []));
      if (page >= (body.meta?.lastPage ?? 1)) break;
    }
  } catch {
    // Return whatever we managed to fetch — a partial feed beats an empty one.
  }
  return out;
}

function stripHtml(s?: string | null): string {
  return (s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Strip emoji / flag glyphs so the brand value stays clean for Google. */
function cleanBrand(name?: string | null): string {
  return (name ?? "")
    .replace(
      /[\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function availability(p: FeedProduct): string {
  if (p.stockStatus === "out_of_stock") {
    return p.allowBackorder ? "backorder" : "out_of_stock";
  }
  return "in_stock";
}

function primaryImage(p: FeedProduct): string | null {
  const imgs = p.images ?? [];
  if (imgs.length === 0) return null;
  const primary =
    imgs.find((i) => i.isPrimary) ??
    [...imgs].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0];
  return primary ? absUrl(primary.url) : null;
}

function itemXml(p: FeedProduct): string {
  const link = absUrl(`/produit/${p.slug}`);
  const img = primaryImage(p);
  const description =
    stripHtml(p.descriptionFr) ||
    stripHtml(p.descriptionShortFr) ||
    p.nameFr;
  const onSale = p.oldPrice != null && p.oldPrice > p.price;
  const regularPrice = onSale ? (p.oldPrice as number) : p.price;
  const brand = cleanBrand(p.brand?.name);

  const extraImages = (p.images ?? [])
    .map((i) => absUrl(i.url))
    .filter((u) => u !== img)
    .slice(0, 10)
    .map((u) => `      <g:additional_image_link>${xmlEscape(u)}</g:additional_image_link>`);

  const lines = [
    "    <item>",
    `      <g:id>${xmlEscape(p.sku || p.slug)}</g:id>`,
    `      <g:title>${xmlEscape(p.nameFr)}</g:title>`,
    `      <g:description>${xmlEscape(description.slice(0, 5000))}</g:description>`,
    `      <g:link>${xmlEscape(link)}</g:link>`,
    img ? `      <g:image_link>${xmlEscape(img)}</g:image_link>` : "",
    ...extraImages,
    `      <g:availability>${availability(p)}</g:availability>`,
    `      <g:price>${regularPrice} ${CURRENCY}</g:price>`,
    onSale ? `      <g:sale_price>${p.price} ${CURRENCY}</g:sale_price>` : "",
    brand ? `      <g:brand>${xmlEscape(brand)}</g:brand>` : "",
    "      <g:condition>new</g:condition>",
    // These products have no manufacturer barcodes; tell Google so it doesn't
    // disapprove them for a missing GTIN/MPN.
    "      <g:identifier_exists>no</g:identifier_exists>",
    "    </item>",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function GET() {
  const products = (await fetchAllProducts()).filter(
    (p) => p.isActive !== false && p.slug && p.nameFr,
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${xmlEscape(`Catalogue produits — ${SITE_NAME}`)}</description>
${products.map(itemXml).join("\n")}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
