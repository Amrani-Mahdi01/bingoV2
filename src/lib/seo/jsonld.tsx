/**
 * Structured-data (JSON-LD) builders + a tiny render component.
 *
 * These power Google rich results (product snippets, local pack, search
 * box, breadcrumbs, FAQ) AND give answer engines like ChatGPT / Perplexity
 * clean, machine-readable facts about the store and its catalogue. Every
 * builder takes live data (admin-edited contact info, API products) so the
 * markup stays correct as the real catalogue replaces the placeholders.
 */
import * as React from "react";

import type { Product } from "@/lib/products";
import type { SiteContact } from "@/lib/site-contact";
import {
  SITE_NAME,
  SITE_URL,
  CURRENCY,
  absUrl,
  OG_IMAGE,
  KNOWS_ABOUT,
  SLOGAN,
  DEFAULT_DESCRIPTION,
} from "@/lib/seo/config";
import { type Locale, withLocale } from "@/lib/locale";

type Json = Record<string, unknown>;

/** Renders one or more JSON-LD objects as a script tag. The `<` escape
 *  prevents a `</script>` sequence inside any string from breaking out. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

/* ─── Stable @id anchors so nodes can reference each other ─── */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const STORE_ID = `${SITE_URL}/#store`;

function sameAs(c: SiteContact): string[] {
  const urls = [c.social?.facebook, c.social?.instagram, c.social?.tiktok];
  return urls.filter((u): u is string => !!u && u.length > 0);
}

function geoFromMaps(mapsUrl: string): { lat: number; lng: number } | null {
  const m = mapsUrl?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!m) return null;
  return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
}

export function organization(c?: SiteContact): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: "BINGO",
    url: SITE_URL,
    logo: absUrl("/icon.png"),
    image: OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    slogan: SLOGAN,
    knowsAbout: KNOWS_ABOUT,
    areaServed: { "@type": "Country", name: "Algérie" },
    // Verified social profiles → helps Google build a brand knowledge panel
    // and lets AI engines confidently link the entity. Sourced from the
    // live admin contact info when available.
    ...(c ? { sameAs: sameAs(c) } : {}),
  };
}

/** LocalBusiness for the physical Sétif store — drives the Google local
 *  pack and "where to buy camping gear in Algeria" type AI answers. */
export function localBusiness(c: SiteContact): Json {
  const geo = geoFromMaps(c.mapsUrl);
  return {
    "@context": "https://schema.org",
    "@type": ["Store", "SportingGoodsStore", "LocalBusiness"],
    "@id": STORE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    image: OG_IMAGE,
    logo: absUrl("/icon.png"),
    description: DEFAULT_DESCRIPTION,
    slogan: SLOGAN,
    knowsAbout: KNOWS_ABOUT,
    ...(c.phone ? { telephone: c.phone.replace(/\s/g, "") } : {}),
    ...(c.email ? { email: c.email } : {}),
    priceRange: "$$",
    currenciesAccepted: CURRENCY,
    areaServed: { "@type": "Country", name: "Algérie" },
    address: {
      "@type": "PostalAddress",
      streetAddress: c.addressFr || "Sétif",
      addressLocality: "Sétif",
      postalCode: "19000",
      addressCountry: "DZ",
    },
    ...(geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: geo.lat,
            longitude: geo.lng,
          },
        }
      : {}),
    ...(c.mapsUrl ? { hasMap: c.mapsUrl } : {}),
    sameAs: sameAs(c),
    parentOrganization: { "@id": ORG_ID },
  };
}

/** WebSite + SearchAction → enables the Google sitelinks search box and
 *  tells crawlers the catalogue is the on-site search endpoint. */
export function website(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: ["fr", "ar"],
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/catalogue?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** True when the product can currently be ordered. */
function availabilityUrl(p: Product): string {
  const inStock =
    p.trackStock === false ||
    (typeof p.stock === "number" && p.stock > 0) ||
    p.allowBackorder === true;
  if (inStock) {
    return p.trackStock === false || (p.stock ?? 0) > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/BackOrder";
  }
  return "https://schema.org/OutOfStock";
}

export function product(p: Product, opts?: { locale?: Locale }): Json {
  const locale = opts?.locale ?? "fr";
  const name = locale === "ar" && p.nameAr ? p.nameAr : p.name;
  const rawDesc =
    locale === "ar" && p.descriptionAr ? p.descriptionAr : p.description;
  const images = (p.images?.length ? p.images : [p.image])
    .filter(Boolean)
    .map((i) => absUrl(i));
  const url = absUrl(withLocale(`/produit/${p.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name,
    inLanguage: locale,
    ...(images.length ? { image: images } : {}),
    description:
      rawDesc?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || name,
    sku: p.slug,
    ...(p.brand && p.brand !== "—"
      ? { brand: { "@type": "Brand", name: p.brand } }
      : {}),
    ...(p.categorySlug ? { category: p.categorySlug } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: CURRENCY,
      price: p.price,
      availability: availabilityUrl(p),
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
    },
  };
}

export function breadcrumb(items: Array<{ name: string; path: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function article(a: {
  url: string;
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  locale: Locale;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${a.url}#article`,
    headline: a.headline,
    description: a.description,
    image: a.image || OG_IMAGE,
    inLanguage: a.locale,
    datePublished: a.datePublished,
    dateModified: a.dateModified || a.datePublished,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
  };
}

export function faqPage(items: Array<{ q: string; a: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
