"use client";

import * as React from "react";

import {
  readLocalSettings,
  siteContact as defaults,
  type SiteContact,
} from "@/lib/site-contact";

/**
 * Storefront-wide context that carries the admin-edited contact info
 * (phone, email, WhatsApp, address, social URLs). The (public) layout
 * fetches `/api/settings` server-side, parses it into a `SiteContact`,
 * and seeds this provider with that value as `initialValue`.
 *
 * On the client we also overlay localStorage on top of the server value,
 * so admin edits persist on the same device even while the backend
 * allow-list for `contact.*` / `social.*` is still being built out.
 * When the server starts returning those keys, they win on next mount.
 */
const SiteContactContext = React.createContext<SiteContact>(defaults);

export function SiteContactProvider({
  initialValue,
  children,
}: {
  initialValue: SiteContact;
  children: React.ReactNode;
}) {
  const [value, setValue] = React.useState<SiteContact>(initialValue);

  // Merge any locally-cached overrides on mount, and re-read whenever
  // another tab updates the cache (admin form in a separate tab).
  React.useEffect(() => {
    const apply = () => {
      const local = readLocalSettings();
      if (Object.keys(local).length === 0) {
        setValue(initialValue);
        return;
      }
      // Local overrides per-field; everything else stays at initialValue.
      const pick = (key: string, fb: string): string =>
        typeof local[key] === "string" && local[key].length > 0
          ? local[key]
          : fb;
      setValue({
        phone: pick("contact.phone", initialValue.phone),
        email: pick("contact.email", initialValue.email),
        whatsapp: pick("contact.whatsapp", initialValue.whatsapp),
        addressFr: pick("contact.address.fr", initialValue.addressFr),
        addressAr: pick("contact.address.ar", initialValue.addressAr),
        social: {
          facebook: pick("social.facebook", initialValue.social.facebook),
          instagram: pick("social.instagram", initialValue.social.instagram),
          tiktok: pick("social.tiktok", initialValue.social.tiktok),
          youtube: pick("social.youtube", initialValue.social.youtube),
          whatsappBusiness: pick(
            "social.whatsapp_business",
            initialValue.social.whatsappBusiness
          ),
        },
      });
    };
    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bingo.siteContact.v1") apply();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
