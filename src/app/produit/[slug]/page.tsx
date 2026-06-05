import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetails } from "@/components/sections/product-details";
import {
  getServerProductBySlug,
  getServerSimilarProducts,
} from "@/lib/server/site-product";
import { absUrl } from "@/lib/seo/config";
import {
  JsonLd,
  product as productJsonLd,
  breadcrumb,
} from "@/lib/seo/jsonld";
import { pageMetadata, currentLocale } from "@/lib/seo/metadata";
import { withLocale } from "@/lib/locale";

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

/**
 * Server-rendered product page.
 *
 * Each request resolves the slug against /api/products/{slug}; the
 * SSR fetch has a 30-second revalidate window so admin edits surface
 * quickly without rebuilding. When the backend is unreachable the
 * helper falls back to the local mock catalogue so the route still
 * works in offline / build-only environments.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getServerProductBySlug(slug);
  if (!product) return { title: "Produit introuvable", robots: { index: false } };

  const brandSuffix =
    product.brand && product.brand !== "—" ? ` — ${product.brand}` : "";
  const nameAr = product.nameAr || product.name;
  const images = (product.images?.length ? product.images : [product.image])
    .filter(Boolean)
    .map((i) => absUrl(i));

  return pageMetadata({
    cleanPath: `/produit/${slug}`,
    fr: {
      title: `${product.name}${brandSuffix}`,
      description: stripHtml(product.description),
    },
    ar: {
      title: `${nameAr}${brandSuffix}`,
      description: stripHtml(product.descriptionAr || product.description),
    },
    images,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getServerProductBySlug(slug);
  if (!product) notFound();
  // Resolve similar products in parallel — anchored on the same category
  // as the current product. Falls back to recent picks when no category
  // is set or the backend is unreachable.
  const similar = await getServerSimilarProducts(slug, product.categorySlug, 4);
  const locale = await currentLocale();
  const displayName =
    locale === "ar" && product.nameAr ? product.nameAr : product.name;
  const crumbs =
    locale === "ar"
      ? [
          { name: "الرئيسية", path: withLocale("/", "ar") },
          { name: "الكتالوج", path: withLocale("/catalogue", "ar") },
        ]
      : [
          { name: "Accueil", path: "/" },
          { name: "Catalogue", path: "/catalogue" },
        ];
  return (
    <>
      {/* Product + breadcrumb structured data → rich result eligibility
          (price, availability, brand) and clearer facts for AI answers.
          Localized so the /ar page carries Arabic name/description + crumbs. */}
      <JsonLd
        data={[
          productJsonLd(product, { locale }),
          breadcrumb([
            ...crumbs,
            { name: displayName, path: withLocale(`/produit/${slug}`, locale) },
          ]),
        ]}
      />
      <ProductDetails product={product} similar={similar} />
    </>
  );
}
