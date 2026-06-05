/**
 * Cached, server-rendered slice of the public categories tree used by
 * homepage tiles (and anywhere else the storefront wants a quick read
 * without firing its own fetch).
 *
 * Source: GET /api/categories — returns top-level categories with their
 * direct children, only active rows, ordered by display_order, with
 * `products_count` rolled up to include sub-category totals.
 */

export interface SiteCategory {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  /** Absolute URL or relative `/categories/foo.png` path. */
  image: string | null;
  icon: string;
  productCount: number;
  /** Direct children (sub-categories). Only top-level rows carry this. */
  children?: SiteCategorySub[];
}

export interface SiteCategorySub {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  productCount: number;
}

export interface SiteCategories {
  /** Top-level categories, in display order. */
  list: SiteCategory[];
}

export const SITE_CATEGORIES_DEFAULTS: SiteCategories = {
  list: [],
};
