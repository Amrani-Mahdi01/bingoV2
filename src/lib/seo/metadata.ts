import type { Metadata } from "next";
import { headers } from "next/headers";

import { SITE_URL, SITE_NAME, OG_IMAGE, absUrl } from "@/lib/seo/config";
import { type Locale, withLocale } from "@/lib/locale";

/** Read the request locale tagged by middleware (defaults to French). */
export async function currentLocale(): Promise<Locale> {
  const h = await headers();
  return h.get("x-locale") === "ar" ? "ar" : "fr";
}

/** The public pathname of the current request (without the /ar prefix). */
export async function currentCleanPath(): Promise<string> {
  const h = await headers();
  const raw = h.get("x-pathname") || "/";
  return raw.replace(/^\/ar(?=\/|$)/, "") || "/";
}

interface LangCopy {
  title: string;
  description: string;
}

/**
 * Build a COMPLETE, locale-aware Metadata object for a page. Returns full
 * `openGraph`/`twitter`/`alternates` objects (not partials) so they cleanly
 * replace the layout defaults without losing fields, and emits hreflang
 * (fr ↔ ar ↔ x-default) + the correct canonical for the active locale.
 *
 * Pass the clean path (e.g. "/catalogue") and both language copies; the
 * active locale is read from the request headers.
 */
export async function pageMetadata(opts: {
  cleanPath: string;
  fr: LangCopy;
  ar: LangCopy;
  images?: string[];
}): Promise<Metadata> {
  const locale = await currentLocale();
  const copy = locale === "ar" ? opts.ar : opts.fr;

  const frUrl = absUrl(withLocale(opts.cleanPath, "fr"));
  const arUrl = absUrl(withLocale(opts.cleanPath, "ar"));
  const canonical = locale === "ar" ? arUrl : frUrl;
  const images = opts.images?.length ? opts.images : [OG_IMAGE];
  const ogTitle = `${copy.title} · ${SITE_NAME}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: { "fr-DZ": frUrl, "ar-DZ": arUrl, "x-default": frUrl },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: ogTitle,
      description: copy.description,
      url: canonical,
      locale: locale === "ar" ? "ar_DZ" : "fr_DZ",
      alternateLocale: locale === "ar" ? "fr_DZ" : "ar_DZ",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: copy.description,
      images,
    },
  };
}
