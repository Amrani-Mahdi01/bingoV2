/**
 * Admin-edited branding (logo + display tuning) read from /api/settings.
 *
 * Mirrors the same key contract used by /admin/settings (LogoManager):
 *   site.logo           — absolute URL of the uploaded image, or null
 *   site.logo_alt_fr    — alt text (FR), defaults to "BINGO"
 *   site.logo_alt_ar    — alt text (AR), defaults to "بينغو"
 *   site.logo_height    — rendered height in px (20..96, default 36)
 *   site.logo_max_width — rendered max-width in px (60..320, default 180)
 *   site.logo_radius    — border-radius in px (0..48, 9999 = pill, default 0)
 */

export interface SiteBranding {
  logoUrl: string | null;
  logoAltFr: string;
  logoAltAr: string;
  logoHeight: number;
  logoMaxWidth: number;
  logoRadius: number;
}

export const SITE_BRANDING_DEFAULTS: SiteBranding = {
  logoUrl: null,
  logoAltFr: "BINGO",
  logoAltAr: "بينغو",
  logoHeight: 36,
  logoMaxWidth: 180,
  logoRadius: 0,
};

function parseIntSetting(raw: unknown, fallback: number): number {
  if (typeof raw !== "string") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Project the flat /api/settings map onto a typed SiteBranding object. */
export function siteBrandingFromSettings(
  map: Record<string, string | null | undefined>,
): SiteBranding {
  const logoUrl = typeof map["site.logo"] === "string" ? map["site.logo"] : null;
  return {
    logoUrl: logoUrl && logoUrl.length > 0 ? logoUrl : null,
    logoAltFr:
      (typeof map["site.logo_alt_fr"] === "string" && map["site.logo_alt_fr"]) ||
      SITE_BRANDING_DEFAULTS.logoAltFr,
    logoAltAr:
      (typeof map["site.logo_alt_ar"] === "string" && map["site.logo_alt_ar"]) ||
      SITE_BRANDING_DEFAULTS.logoAltAr,
    logoHeight: parseIntSetting(
      map["site.logo_height"],
      SITE_BRANDING_DEFAULTS.logoHeight,
    ),
    logoMaxWidth: parseIntSetting(
      map["site.logo_max_width"],
      SITE_BRANDING_DEFAULTS.logoMaxWidth,
    ),
    logoRadius: parseIntSetting(
      map["site.logo_radius"],
      SITE_BRANDING_DEFAULTS.logoRadius,
    ),
  };
}
