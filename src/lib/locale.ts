/**
 * Locale routing helpers (Approach A: French at the clean root, Arabic
 * under a `/ar` prefix).
 *
 * The URL is the single source of truth for language. Middleware strips
 * the `/ar` prefix before the existing routes render and tags the request
 * with the locale; these helpers convert between the public (prefixed)
 * paths and the internal (clean) ones, and localize hrefs for links.
 */
export type Locale = "fr" | "ar";

export const LOCALES: Locale[] = ["fr", "ar"];
export const DEFAULT_LOCALE: Locale = "fr";

/** Split a public pathname into its locale + the clean (prefix-free) path. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    return { locale: "ar", path: pathname.slice(3) || "/" };
  }
  return { locale: "fr", path: pathname || "/" };
}

/** Build the public URL for a clean path in a given locale. */
export function withLocale(cleanPath: string, locale: Locale): string {
  const p = cleanPath || "/";
  if (locale === "ar") return p === "/" ? "/ar" : `/ar${p}`;
  return p;
}

/**
 * Localize an internal href for the active locale. Leaves external links,
 * anchors, and protocol links (tel:, mailto:, http(s):) untouched, and
 * never double-prefixes a path that already carries `/ar`.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (!href) return href;
  if (!href.startsWith("/")) return href; // external / tel: / mailto: / #hash
  // The admin backoffice is French-only by design — never prefix it, so
  // "Espace admin" always lands on /admin regardless of the active locale.
  if (href === "/admin" || href.startsWith("/admin/")) return href;
  if (href.startsWith("/ar/") || href === "/ar") return href; // already prefixed
  if (locale !== "ar") return href;
  return href === "/" ? "/ar" : `/ar${href}`;
}
