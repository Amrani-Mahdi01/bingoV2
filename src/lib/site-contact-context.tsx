"use client";

import * as React from "react";

import {
  readLocalSettings,
  siteContact as defaults,
  siteContactFromSettings,
  type SiteContact,
} from "@/lib/site-contact";

/**
 * Storefront-wide context that carries the admin-edited contact info
 * (phone, email, WhatsApp, address, social URLs).
 *
 * Three layers, in priority order (highest wins per field):
 *   1. Live server fetch on mount — `GET /api/settings` runs once when
 *      the provider mounts, bypassing the SSR `revalidate: 60` cache.
 *      This is what makes admin edits show up immediately on refresh.
 *   2. `initialValue` — server-side seed baked into the HTML at SSR.
 *   3. localStorage cache — kept around so the admin's edits persist
 *      per-device even if the network blip drops layers 1 + 2.
 *
 * In effect: the latest server data always wins; localStorage is just
 * a safety net.
 */
const SiteContactContext = React.createContext<SiteContact>(defaults);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export function SiteContactProvider({
  initialValue,
  children,
}: {
  initialValue: SiteContact;
  children: React.ReactNode;
}) {
  const [value, setValue] = React.useState<SiteContact>(initialValue);

  React.useEffect(() => {
    let cancelled = false;

    /** Combine three sources into a single SiteContact.
     *  Priority: serverMap[key] > localStorage[key] > initialValue[field]. */
    const apply = (serverMap: Record<string, string | null> | null) => {
      const local = readLocalSettings();
      const pick = (key: string, fb: string): string => {
        const fromServer = serverMap?.[key];
        if (typeof fromServer === "string" && fromServer.length > 0) {
          return fromServer;
        }
        const fromLocal = local[key];
        if (typeof fromLocal === "string" && fromLocal.length > 0) {
          return fromLocal;
        }
        return fb;
      };
      if (cancelled) return;
      // If we got a fresh server map, project it through the canonical
      // mapper first so the structure exactly matches what SSR built —
      // then overlay local + defaults on any field the server omitted.
      const fromServer = serverMap ? siteContactFromSettings(serverMap) : null;
      setValue({
        phone: pick("contact.phone", fromServer?.phone ?? initialValue.phone),
        email: pick("contact.email", fromServer?.email ?? initialValue.email),
        whatsapp: pick(
          "contact.whatsapp",
          fromServer?.whatsapp ?? initialValue.whatsapp,
        ),
        addressFr: pick(
          "contact.address.fr",
          fromServer?.addressFr ?? initialValue.addressFr,
        ),
        addressAr: pick(
          "contact.address.ar",
          fromServer?.addressAr ?? initialValue.addressAr,
        ),
        mapsUrl: pick(
          "contact.maps_url",
          fromServer?.mapsUrl ?? initialValue.mapsUrl,
        ),
        mapsPlaceFr: pick(
          "contact.maps_place.fr",
          fromServer?.mapsPlaceFr ?? initialValue.mapsPlaceFr,
        ),
        mapsPlaceAr: pick(
          "contact.maps_place.ar",
          fromServer?.mapsPlaceAr ?? initialValue.mapsPlaceAr,
        ),
        social: {
          facebook: pick(
            "social.facebook",
            fromServer?.social.facebook ?? initialValue.social.facebook,
          ),
          instagram: pick(
            "social.instagram",
            fromServer?.social.instagram ?? initialValue.social.instagram,
          ),
          tiktok: pick(
            "social.tiktok",
            fromServer?.social.tiktok ?? initialValue.social.tiktok,
          ),
          youtube: pick(
            "social.youtube",
            fromServer?.social.youtube ?? initialValue.social.youtube,
          ),
        },
      });
    };

    // First paint: apply with no server map (uses localStorage + initialValue).
    apply(null);

    // Then fetch the live server map and re-apply so admin edits show up
    // even when SSR is still serving a stale revalidate-60 cache.
    if (API_URL) {
      // Via the Cloudflare backend (real per-visitor IP, no Vercel-IP 429).
      fetch(`https://api.bingo-camp.com/api/settings`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => {
          const data = body?.data;
          if (data && typeof data === "object") apply(data);
        })
        .catch(() => {
          /* swallow — initial paint is still fine */
        });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "bingo.siteContact.v1") apply(null);
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, [initialValue]);

  return (
    <SiteContactContext.Provider value={value}>
      {children}
    </SiteContactContext.Provider>
  );
}

export function useSiteContact(): SiteContact {
  return React.useContext(SiteContactContext);
}
