import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/config";
import { withLocale } from "@/lib/locale";
import { getServerCategories } from "@/lib/server/site-contact";
import { guideSlugs } from "@/lib/guides/guides";

/** hreflang alternates for a clean path (fr ↔ ar ↔ x-default). */
function langs(cleanPath: string) {
  const fr = `${SITE_URL}${withLocale(cleanPath, "fr")}`;
  const ar = `${SITE_URL}${withLocale(cleanPath, "ar")}`;
  return { languages: { "fr-DZ": fr, "ar-DZ": ar, "x-default": fr } };
}

/**
 * Dynamic sitemap. Static storefront routes are always present; product
 * and category URLs are pulled live from the API so the real catalogue
 * (when it replaces the placeholders) is indexed automatically with no
 * code change. Utility routes (cart, checkout, account, admin) are left
 * out on purpose — they're handled by robots.ts and aren't search landing
 * pages. Revalidates hourly.
 */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

async function fetchProductSlugs(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/products?perPage=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as {
      data?: Array<{ slug: string; updatedAt?: string }>;
    };
    return (body.data ?? [])
      .filter((p) => p.slug)
      .map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Each entry lists its French URL with hreflang alternates pointing to
  // the Arabic (/ar) version, so both languages are discoverable.
  const staticEntries: Entry[] = (
    [
      { path: "/", changeFrequency: "daily", priority: 1 },
      { path: "/catalogue", changeFrequency: "daily", priority: 0.9 },
      { path: "/guides", changeFrequency: "weekly", priority: 0.6 },
      { path: "/a-propos", changeFrequency: "monthly", priority: 0.5 },
      { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
      { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
      { path: "/cgv", changeFrequency: "yearly", priority: 0.3 },
    ] as const
  ).map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: langs(path),
  }));

  const [{ list: categories }, products] = await Promise.all([
    getServerCategories(),
    fetchProductSlugs(),
  ]);

  const categoryEntries: Entry[] = categories.flatMap((c) => {
    const topPath = `/catalogue?category=${encodeURIComponent(c.slug)}`;
    const top: Entry = {
      url: `${SITE_URL}${topPath}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: langs(topPath),
    };
    const subs: Entry[] = (c.children ?? []).map((sc) => {
      const subPath = `/catalogue?sub=${encodeURIComponent(sc.slug)}`;
      return {
        url: `${SITE_URL}${subPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: langs(subPath),
      };
    });
    return [top, ...subs];
  });

  const productEntries: Entry[] = products.map((p) => {
    const path = `/produit/${encodeURIComponent(p.slug)}`;
    return {
      url: `${SITE_URL}${path}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: langs(path),
    };
  });

  const guideEntries: Entry[] = guideSlugs.map((slug) => {
    const path = `/guides/${slug}`;
    return {
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: langs(path),
    };
  });

  return [
    ...staticEntries,
    ...guideEntries,
    ...categoryEntries,
    ...productEntries,
  ];
}
