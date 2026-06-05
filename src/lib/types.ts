/**
 * BINGO domain types.
 *
 * These shape every page in the storefront and admin. The Laravel backend
 * implements the same vocabulary in JSON — `_docs/HANDOFF_TO_BACKEND.md`
 * (Phase 10) documents the wire contract.
 */

/* -----------------------------------------------------------
   Geography & shipping
   ----------------------------------------------------------- */

export type WilayaRegion = "Nord" | "Centre" | "Est" | "Ouest" | "Sud";

export interface Wilaya {
  id: string; // padded code "01" .. "58"
  code: string; // "01" .. "58"
  name: string; // French
  nameAr: string; // Arabic
  region: WilayaRegion;
  shippingPrice: number; // DZD — home delivery
  stopDeskPrice: number; // DZD — point-relais / stop-desk delivery
  deliveryDays: number; // 2 .. 5
}

export interface Commune {
  id: number;
  wilayaId: string; // matches Wilaya.id
  code: string; // postal code or admin ref
  name: string; // French
  nameAr: string; // Arabic
}

/* -----------------------------------------------------------
   Catalog primitives
   ----------------------------------------------------------- */

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  parentId?: string;
  icon: string; // lucide icon name
  image?: string;
  productCount: number;
  displayOrder: number;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logo?: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductVariant {
  id: string;
  /** Axis label, e.g. "Couleur", "Taille", or "Couleur / Taille". */
  name: string;
  /** Composite value the selector tracks, e.g. "Olive" or "Olive / M". */
  value: string;
  sku: string;
  stock: number;
  priceModifier?: number; // signed DZD delta

  // Split-axis fields — populated by the adapter so the selector can
  // render two pickers (colour + size) instead of one composite picker.
  colorName?: string | null;
  colorHex?: string | null;
  sizeLabel?: string | null;
}

export interface ProductAttribute {
  id: string;
  label: string;
  value: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  description: string; // long-form (FR)
  descriptionAr?: string;
  descriptionShort: string; // 2-3 sentences (FR)
  descriptionShortAr?: string;
  brand: Brand;
  category: Category;
  subcategory?: Category;

  price: number;
  oldPrice?: number;
  sku: string;
  stock: number;
  stockStatus: StockStatus;

  images: ProductImage[];
  attributes: ProductAttribute[];
  variants: ProductVariant[];

  rating: number; // 0..5, one decimal
  reviewCount: number;

  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isPromo: boolean;

  viewCount: number;
  soldCount: number;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/* -----------------------------------------------------------
   Orders
   ----------------------------------------------------------- */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface OrderLine {
  productId: string;
  productName: string;
  sku: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image: string;
}

export type CallAttemptResult =
  | "answered"
  | "no_answer"
  | "wrong_number"
  | "callback_requested";

export interface CallAttempt {
  id: string;
  date: string; // ISO
  result: CallAttemptResult;
  notes: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  at: string; // ISO
  by?: string; // operator name; undefined = system
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // BIN-2026-XXXXX
  status: OrderStatus;

  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };

  shipping: {
    wilayaId: string;
    wilayaName: string;
    commune: string;
    address: string;
    notes?: string;
  };

  lines: OrderLine[];
  subtotal: number;
  shippingFee: number;
  total: number;

  callAttempts: CallAttempt[];
  statusHistory: StatusHistoryEntry[];
  zrTrackingNumber?: string;
  internalNotes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  customer: Order["customer"];
  shipping: {
    wilayaId: string;
    commune: string;
    address: string;
    notes?: string;
  };
  lines: Array<{
    productId: string;
    variant?: string;
    quantity: number;
  }>;
}

/* -----------------------------------------------------------
   Customers
   ----------------------------------------------------------- */

export interface Address {
  id: string;
  label: string; // "Domicile" etc
  firstName: string;
  lastName: string;
  phone: string;
  wilayaId: string;
  commune: string;
  street: string;
  notes?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  wilayaId: string;
  addresses: Address[];
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string; // ISO
  createdAt: string; // ISO
}

/* -----------------------------------------------------------
   Marketing
   ----------------------------------------------------------- */

export interface Banner {
  id: string;
  image: string;
  link?: string;

  // Bilingual content — French + Arabic for every visible string. The
  // legacy single-language fields below are kept for backwards-compat with
  // older seeded banners that haven't been edited yet.
  titleFr?: string;
  titleAr?: string;
  subtitleFr?: string;
  subtitleAr?: string;
  ctaLabelFr?: string;
  ctaLabelAr?: string;

  /** @deprecated falls back to `titleFr` */
  title?: string;
  /** @deprecated falls back to `subtitleFr` */
  subtitle?: string;
  /** @deprecated falls back to `ctaLabelFr` */
  ctaLabel?: string;

  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

/* -----------------------------------------------------------
   Cart & UI (frontend-only — never persisted to backend in this shape)
   ----------------------------------------------------------- */

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  variant?: string;
  quantity: number;
}

/* -----------------------------------------------------------
   Stats (dashboard payloads)
   ----------------------------------------------------------- */

export interface DashboardAlert {
  id: string;
  severity: "info" | "warning" | "danger";
  icon: string; // lucide name
  message: string;
}

export interface TopProductStat {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitsSold: number;
}

export interface DashboardStats {
  revenueDay: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueDayChange: number; // % vs yesterday
  ordersPending: number;
  confirmationRate: number; // 0..1
  deliveryRate: number; // 0..1
  recentOrders: Order[];
  topProducts: TopProductStat[];
  alerts: DashboardAlert[];
  revenueLast7: Array<{ date: string; revenue: number }>;
  ordersLast14: Array<{ date: string; orders: number }>;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface WilayaRevenue {
  wilayaCode: string;
  wilayaName: string;
  region: WilayaRegion;
  revenue: number;
  orderCount: number;
  deliveryRate: number;
  averageBasket: number;
}

/* -----------------------------------------------------------
   API request shapes
   ----------------------------------------------------------- */

export interface ProductListParams {
  category?: string;
  brand?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?:
    | "relevance"
    | "price_asc"
    | "price_desc"
    | "newest"
    | "popular"
    | "name_asc";
  page?: number;
  limit?: number;
  inStockOnly?: boolean;
  promoOnly?: boolean;
  minRating?: number;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OrderListParams {
  status?: OrderStatus | OrderStatus[];
  wilayaId?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  search?: string; // order number or phone or name
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface CustomerListParams {
  search?: string;
  wilayaId?: string;
  sort?: "recent" | "top_spender" | "most_orders";
  page?: number;
  limit?: number;
}
