"use client";

import * as React from "react";

import { SITE_HOME_DEFAULTS, type SiteHome } from "@/lib/site-home";

/**
 * Storefront-wide context that carries the admin-edited homepage
 * config — featured product picks + promo banner copy. Server-seeded
 * from the layout via getServerSiteHome().
 */
const SiteHomeContext = React.createContext<SiteHome>(SITE_HOME_DEFAULTS);

export function SiteHomeProvider({
  initialValue,
  children,
}: {
  initialValue: SiteHome;
  children: React.ReactNode;
}) {
  return (
    <SiteHomeContext.Provider value={initialValue}>
      {children}
    </SiteHomeContext.Provider>
  );
}

export function useSiteHome(): SiteHome {
  return React.useContext(SiteHomeContext);
}
