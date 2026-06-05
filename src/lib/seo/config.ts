/**
 * Central SEO configuration for the BINGO storefront.
 *
 * Everything that needs an absolute URL (canonical tags, sitemap,
 * Open Graph, JSON-LD `@id`s) resolves through SITE_URL. It reads
 * `NEXT_PUBLIC_SITE_URL` first so swapping the Vercel test URL for the
 * real custom domain later is a one-line env change — no code edits.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://bingo-v2-chi.vercel.app"
)
  // Defensive: trim() strips a stray BOM / surrounding whitespace that some
  // shells inject when setting the env var (a BOM, U+FEFF, counts as
  // whitespace in JS), then drop any trailing slash. Without this, a polluted
  // value leaks into every canonical tag, JSON-LD @id and sitemap <loc>.
  .trim()
  .replace(/\/$/, "");

export const SITE_NAME = "BINGO Camping";
export const SITE_SHORT = "BINGO";

/** ISO 4217 currency for all product offers (Algerian dinar). */
export const CURRENCY = "DZD";

/** Primary content locale rendered server-side, plus the secondary. */
export const LOCALE = "fr_DZ";
export const LOCALE_ALT = "ar_DZ";

export const DEFAULT_TITLE =
  "BINGO Camping — Matériel de camping & d'aventure en Algérie";
export const DEFAULT_DESCRIPTION =
  "Tentes, sacs de couchage, sacs à dos et matériel de bivouac — des marques d'aventure sérieuses, à prix justes, livrées partout en Algérie. Boutique à Sétif.";

export const DEFAULT_TITLE_AR =
  "BINGO Camping — معدات التخييم والمغامرة في الجزائر";
export const DEFAULT_DESCRIPTION_AR =
  "خيام، أكياس نوم، حقائب ظهر ومعدات مبيت — علامات مغامرة جادة بأسعار عادلة، تُوصَّل إلى كامل الجزائر. متجر في سطيف.";

/** Broad keyword set; per-page metadata can extend this. */
export const DEFAULT_KEYWORDS = [
  "camping Algérie",
  "matériel de camping",
  "tente camping",
  "sac de couchage",
  "sac à dos randonnée",
  "bivouac",
  "matériel outdoor Algérie",
  "magasin camping Sétif",
  "BINGO Camping",
  "تخييم الجزائر",
  "معدات التخييم",
  "خيمة",
];

/** Topics the store is an authority on — fed to Organization/LocalBusiness
 *  `knowsAbout` so Google and AI engines understand the brand's domain and
 *  are more likely to surface it for "camping gear in Algeria"-type queries. */
export const KNOWS_ABOUT = [
  "Camping",
  "Randonnée",
  "Bivouac",
  "Trekking",
  "Matériel outdoor",
  "Tentes de camping",
  "Sacs de couchage",
  "Sacs à dos de randonnée",
  "Réchauds de camping",
  "Éclairage de camp",
  "Équipement d'aventure",
];

/** One-line brand positioning, reused in schema `slogan`. */
export const SLOGAN =
  "Le matériel de camping et d'aventure, livré partout en Algérie.";

/** Resolve a possibly-relative path/URL into an absolute one on SITE_URL. */
export function absUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Default 1200×630 social share image (lives in /public). */
export const OG_IMAGE = absUrl("/og-default.png");
