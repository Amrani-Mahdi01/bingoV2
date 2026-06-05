"use client";

import * as React from "react";

import {
  SITE_CATEGORIES_DEFAULTS,
  type SiteCategories,
} from "@/lib/site-categories";

/**
 * Server-seeded list of top-level public categories. Mounted in the
 * root layout so any storefront component can read it without firing
 * its own /api/categories request.
 */
const SiteCategoriesContext = React.createContext<SiteCategories>(
  SITE_CATEGORIES_DEFAULTS,
);

export function SiteCategoriesProvider({
  initialValue,
  children,
}: {
  initialValue: SiteCategories;
  children: React.ReactNode;
}) {
  return (
    <SiteCategoriesContext.Provider value={initialValue}>
      {children}
    </SiteCategoriesContext.Provider>
  );
}

export function useSiteCategories(): SiteCategories {
  return React.useContext(SiteCategoriesContext);
}
