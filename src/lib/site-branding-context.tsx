"use client";

import * as React from "react";

import {
  SITE_BRANDING_DEFAULTS,
  type SiteBranding,
} from "@/lib/site-branding";

/**
 * Storefront-wide context that carries the admin-edited logo + display
 * tuning. Mirrors SiteContactContext — the (server) layout fetches
 * /api/settings and seeds this provider with the resulting SiteBranding
 * so the very first paint already has the right logo, no flash.
 */
const SiteBrandingContext = React.createContext<SiteBranding>(
  SITE_BRANDING_DEFAULTS,
);

export function SiteBrandingProvider({
  initialValue,
  children,
}: {
  initialValue: SiteBranding;
  children: React.ReactNode;
}) {
  return (
    <SiteBrandingContext.Provider value={initialValue}>
      {children}
    </SiteBrandingContext.Provider>
  );
}

export function useSiteBranding(): SiteBranding {
  return React.useContext(SiteBrandingContext);
}
