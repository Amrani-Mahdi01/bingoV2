/**
 * Typed route constants for BINGO.
 *
 * Every navigation link in the app MUST go through this module — no
 * hardcoded path strings in components. Parameterised routes are exposed as
 * builder functions so callers cannot accidentally drop the segment.
 */

export const routes = {
  // ---------- Public storefront ----------
  home: "/",
  catalog: "/catalog",
  category: (slug: string) => `/catalog/${slug}` as const,
  product: (slug: string) => `/product/${slug}` as const,
  compare: "/compare",
  cart: "/cart",
  checkout: "/checkout",
  checkoutConfirmation: "/checkout/confirmation",
  favorites: "/favorites",

  // Auth
  login: "/login",
  register: "/register",

  // Account
  account: {
    orders: "/account/orders",
    order: (id: string) => `/account/orders/${id}` as const,
    /** @deprecated favorites now live at top-level (guest-friendly). Use `routes.favorites`. */
    favorites: "/favorites",
    addresses: "/account/addresses",
  },

  // Static / corporate
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  delivery: "/delivery",
  returns: "/returns",
  cgv: "/cgv",

  // QA-only
  designSystem: "/design-system",

  // ---------- Admin ----------
  admin: {
    dashboard: "/admin",
    products: "/admin/products",
    productNew: "/admin/products/new",
    product: (id: string) => `/admin/products/${id}` as const,
    categories: "/admin/categories",
    orders: "/admin/orders",
    order: (id: string) => `/admin/orders/${id}` as const,
    customers: "/admin/customers",
    customer: (id: string) => `/admin/customers/${id}` as const,
    statistics: "/admin/statistics",
    settings: "/admin/settings",
    banners: "/admin/banners",
    shipping: "/admin/shipping",
    contacts: "/admin/contacts",
    pages: {
      delivery: "/admin/pages/delivery",
      returns: "/admin/pages/returns",
      cgv: "/admin/pages/cgv",
      about: "/admin/pages/about",
    },
  },
} as const;

/* -----------------------------------------------------------
   Navigation menus — used by Header / Footer / MobileNav /
   AdminSidebar to render link groups without duplication.
   ----------------------------------------------------------- */

export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: "Catalogue", href: routes.catalog },
  { label: "Promotions", href: `${routes.catalog}?promoOnly=true` },
  { label: "À propos", href: routes.about },
  { label: "Contact", href: routes.contact },
];

export const footerNav = {
  boutique: [
    { label: "Toutes catégories", href: routes.catalog },
    { label: "Nouveautés", href: `${routes.catalog}?sort=new` },
    { label: "Promotions", href: `${routes.catalog}?promoOnly=true` },
    { label: "Meilleures ventes", href: `${routes.catalog}?sort=bestseller` },
  ] satisfies NavLink[],
  aide: [
    { label: "Livraison", href: routes.delivery },
    { label: "Retours", href: routes.returns },
    { label: "FAQ", href: routes.faq },
    { label: "Contact", href: routes.contact },
  ] satisfies NavLink[],
  apropos: [
    { label: "Notre histoire", href: routes.about },
    { label: "Favoris", href: routes.favorites },
    { label: "CGV", href: routes.cgv },
  ] satisfies NavLink[],
};

export const accountMenu: NavLink[] = [
  { label: "Mes commandes", href: routes.account.orders },
  { label: "Favoris", href: routes.favorites },
  { label: "Adresses", href: routes.account.addresses },
];

/* Top-level categories — slugs that the catalog [category] route will accept.
   Real category data lands in Phase 3 (lib/mock/categories.ts). For now this
   list drives the MobileNav accordion + the secondary nav strip on category
   pages. */
export const topCategories: NavLink[] = [
  { label: "Tentes & Abris", href: routes.category("tentes-abris") },
  { label: "Sacs de couchage", href: routes.category("sacs-de-couchage") },
  { label: "Cuisine outdoor", href: routes.category("cuisine-outdoor") },
  { label: "Éclairage", href: routes.category("eclairage") },
  { label: "Sacs à dos", href: routes.category("sacs-a-dos") },
  { label: "Vêtements", href: routes.category("vetements") },
  { label: "Chaussures", href: routes.category("chaussures") },
  { label: "Accessoires", href: routes.category("accessoires") },
];

/* Admin sections — drives AdminSidebar. `children` introduces a submenu. */
export interface AdminNavSection {
  label: string;
  href: string;
  icon: string; // lucide icon name (looked up in AdminSidebar)
  children?: NavLink[];
}

export const adminNav: AdminNavSection[] = [
  {
    label: "Tableau de bord",
    href: routes.admin.dashboard,
    icon: "LayoutDashboard",
  },
  {
    label: "Produits",
    href: routes.admin.products,
    icon: "Package",
    children: [
      { label: "Liste", href: routes.admin.products },
      { label: "Ajouter", href: routes.admin.productNew },
      { label: "Catégories", href: routes.admin.categories },
    ],
  },
  {
    label: "Commandes",
    href: routes.admin.orders,
    icon: "ShoppingCart",
  },
  {
    label: "Clients",
    href: routes.admin.customers,
    icon: "Users",
  },
  {
    label: "Statistiques",
    href: routes.admin.statistics,
    icon: "BarChart3",
  },
  {
    label: "Pages du site",
    href: routes.admin.pages.delivery,
    icon: "FileText",
    children: [
      { label: "Livraison", href: routes.admin.pages.delivery },
      { label: "Retours", href: routes.admin.pages.returns },
      { label: "CGV", href: routes.admin.pages.cgv },
      { label: "À propos", href: routes.admin.pages.about },
    ],
  },
  {
    label: "Configuration",
    href: routes.admin.settings,
    icon: "Settings",
    children: [
      { label: "Site", href: routes.admin.settings },
      { label: "Coordonnées & réseaux", href: routes.admin.contacts },
      { label: "Bannières", href: routes.admin.banners },
      { label: "Livraison", href: routes.admin.shipping },
    ],
  },
];

export type Routes = typeof routes;
