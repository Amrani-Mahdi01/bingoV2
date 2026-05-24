/**
 * Canonical contact + social info for the BINGO storefront.
 *
 * Single source of truth: both the admin editor (/admin/contacts) and the
 * public surfaces (Footer, contact page) read from here. Until the
 * settings backend is wired up, edits made in the admin UI are stubs —
 * change this file by hand to update the live site.
 *
 * Shape is intentionally flat and JSON-serialisable so it maps 1:1 to the
 * future GET /api/settings response.
 */

export interface SiteContact {
  /** International phone, e.g. "+213 36 XX XX XX". Used as the `tel:` href. */
  phone: string;
  /** Customer-facing email, e.g. "contact@bingo.dz". Used as the `mailto:` href. */
  email: string;
  /** WhatsApp number — same format as phone. Stripped of non-digits for wa.me. */
  whatsapp: string;
  /** Postal address, bilingual. Renders verbatim in the contact page. */
  addressFr: string;
  addressAr: string;
  social: SiteSocial;
}

export interface SiteSocial {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  /** WhatsApp Business profile or click-to-chat URL. */
  whatsappBusiness: string;
}

export const siteContact: SiteContact = {
  phone: "+213 36 XX XX XX",
  email: "contact@bingo.dz",
  whatsapp: "+213 6 XX XX XX XX",
  addressFr: "Cité Hassan Bey, Sétif 19000, Algérie",
  addressAr: "حي حسن باي، سطيف 19000، الجزائر",
  social: {
    facebook: "https://facebook.com/bingo.dz",
    instagram: "https://instagram.com/bingo.dz",
    tiktok: "",
    youtube: "",
    whatsappBusiness: "+213 6 XX XX XX XX",
  },
};

/** Returns the digits-only form of a phone number, suitable for wa.me. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Builds the `tel:` href the OS dialer will accept. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

/** Builds the `mailto:` href. */
export function mailHref(email: string): string {
  return `mailto:${email}`;
}

/** Builds the wa.me click-to-chat URL (digits only, no `+` or spaces). */
export function waHref(whatsapp: string): string {
  return `https://wa.me/${digitsOnly(whatsapp)}`;
}

/* ---------- localStorage cache ----------
 * The Laravel `/api/admin/settings` allow-list currently only knows about
 * `site.*` keys (see _docs/HANDOFF_TO_BACKEND.md). Until `contact.*` and
 * `social.*` are wired server-side, we mirror saves to localStorage so
 * edits persist on the admin's device and propagate to the public site
 * via a client-side overlay in the provider. Once the backend allow-lists
 * the new namespaces, the server value wins (handled by the merge order
 * in the provider). Keys here mirror the dotted settings convention.
 */
const STORAGE_KEY = "bingo.siteContact.v1";

export function readLocalSettings(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function writeLocalSettings(
  patch: Record<string, string | null>
): void {
  if (typeof window === "undefined") return;
  try {
    const current = readLocalSettings();
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") delete current[k];
      else current[k] = v;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

/**
 * Project a flat settings map (as returned by `/api/settings`) into a
 * typed `SiteContact`. Missing or empty keys fall back to the hardcoded
 * defaults in `siteContact`, so callers always get a complete object.
 */
export function siteContactFromSettings(
  map: Record<string, string | null | undefined>
): SiteContact {
  const pick = (key: string, fallback: string): string => {
    const raw = map[key];
    return typeof raw === "string" && raw.length > 0 ? raw : fallback;
  };
  return {
    phone: pick("contact.phone", siteContact.phone),
    email: pick("contact.email", siteContact.email),
    whatsapp: pick("contact.whatsapp", siteContact.whatsapp),
    addressFr: pick("contact.address.fr", siteContact.addressFr),
    addressAr: pick("contact.address.ar", siteContact.addressAr),
    social: {
      facebook: pick("social.facebook", siteContact.social.facebook),
      instagram: pick("social.instagram", siteContact.social.instagram),
      tiktok: pick("social.tiktok", siteContact.social.tiktok),
      youtube: pick("social.youtube", siteContact.social.youtube),
      whatsappBusiness: pick(
        "social.whatsapp_business",
        siteContact.social.whatsappBusiness
      ),
    },
  };
}
