/**
 * BINGO API client — frontend contract.
 *
 * All page components fetch through this module. The Laravel backend will
 * eventually replace each method body with a real `fetch`, but the request
 * and response shapes stay identical. See _docs/HANDOFF_TO_BACKEND.md for
 * the full wire contract.
 *
 * Right now every method:
 *  1. awaits a short randomised delay so loading states feel real,
 *  2. derives the response from in-memory mock arrays,
 *  3. returns deeply-frozen-safe copies (shallow clone of arrays) to
 *     mimic the immutability you'd get from a network response.
 */

import type {
  Banner,
  Brand,
  CallAttempt,
  CallAttemptResult,
  Category,
  CreateOrderInput,
  Customer,
  CustomerListParams,
  DashboardStats,
  Order,
  OrderListParams,
  OrderStatus,
  Product,
  ProductListParams,
  ProductListResult,
  RevenuePoint,
  Wilaya,
  WilayaRevenue,
} from "@/lib/types";
import { banners } from "@/lib/mock/banners";
import { brands } from "@/lib/mock/brands";
import { categories } from "@/lib/mock/categories";
import { customers } from "@/lib/mock/customers";
import { orders as initialOrders } from "@/lib/mock/orders";
import { products } from "@/lib/mock/products";
import { wilayas, getWilayaById } from "@/lib/mock/wilayas";

/* -----------------------------------------------------------
   Latency helper — every call passes through this.
   200-500ms keeps the UI responsive while still surfacing
   loading skeletons on slower hardware.
   ----------------------------------------------------------- */
const MIN_LATENCY_MS = 200;
const MAX_LATENCY_MS = 500;

function delay(): Promise<void> {
  const ms = Math.floor(
    MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS)
  );
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* In-memory mutable state for orders so admin status changes survive within
   a single SPA session. NOT persisted across reloads — Phase 8 explicitly
   tolerates this. Backend will replace this with a real database. */
let orders: Order[] = [...initialOrders];

/* -----------------------------------------------------------
   Products
   ----------------------------------------------------------- */

function filterProducts(params: ProductListParams = {}): Product[] {
  let items = [...products];

  if (params.category) {
    items = items.filter(
      (p) =>
        p.category.slug === params.category ||
        p.subcategory?.slug === params.category
    );
  }
  if (params.brand) {
    const slugs = Array.isArray(params.brand) ? params.brand : [params.brand];
    items = items.filter((p) => slugs.includes(p.brand.slug));
  }
  if (typeof params.minPrice === "number") {
    items = items.filter((p) => p.price >= params.minPrice!);
  }
  if (typeof params.maxPrice === "number") {
    items = items.filter((p) => p.price <= params.maxPrice!);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }
  if (params.inStockOnly) {
    items = items.filter((p) => p.stockStatus !== "out_of_stock");
  }
  if (params.promoOnly) {
    items = items.filter((p) => p.isPromo);
  }
  if (typeof params.minRating === "number") {
    items = items.filter((p) => p.rating >= params.minRating!);
  }

  switch (params.sort) {
    case "price_asc":
      items.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      items.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      break;
    case "popular":
      items.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case "name_asc":
      items.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      break;
    default:
      // "relevance" — keep featured/bestseller bias on top
      items.sort((a, b) => {
        const sa =
          (a.isFeatured ? 2 : 0) +
          (a.isBestSeller ? 1.5 : 0) +
          (a.isNew ? 0.5 : 0);
        const sb =
          (b.isFeatured ? 2 : 0) +
          (b.isBestSeller ? 1.5 : 0) +
          (b.isNew ? 0.5 : 0);
        return sb - sa;
      });
  }

  return items;
}

const productsApi = {
  async list(params: ProductListParams = {}): Promise<ProductListResult> {
    await delay();
    const items = filterProducts(params);
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(48, params.limit ?? 12));
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const slice = items.slice((page - 1) * limit, page * limit);
    return { items: slice, total, page, totalPages };
  },

  async get(slug: string): Promise<Product | null> {
    await delay();
    return products.find((p) => p.slug === slug) ?? null;
  },

  async getById(id: string): Promise<Product | null> {
    await delay();
    return products.find((p) => p.id === id) ?? null;
  },

  async getFeatured(): Promise<Product[]> {
    await delay();
    return products.filter((p) => p.isFeatured).slice(0, 12);
  },

  async getNew(): Promise<Product[]> {
    await delay();
    return products
      .filter((p) => p.isNew)
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },

  async getBestSellers(): Promise<Product[]> {
    await delay();
    return products
      .filter((p) => p.isBestSeller)
      .slice()
      .sort((a, b) => b.soldCount - a.soldCount);
  },

  async getPromotions(): Promise<Product[]> {
    await delay();
    return products.filter((p) => p.isPromo);
  },

  /** Related = same category, excluding the source product, ranked by views. */
  async getRelated(productId: string, limit = 8): Promise<Product[]> {
    await delay();
    const source = products.find((p) => p.id === productId);
    if (!source) return [];
    return products
      .filter(
        (p) => p.id !== productId && p.category.id === source.category.id
      )
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  },

  /** Fast search (autocomplete) — name/brand/sku, max 8 hits. */
  async search(query: string): Promise<Product[]> {
    await delay();
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      )
      .slice(0, 8);
  },
};

/* -----------------------------------------------------------
   Categories & brands
   ----------------------------------------------------------- */

const categoriesApi = {
  async list(): Promise<Category[]> {
    await delay();
    return [...categories];
  },
  async get(slug: string): Promise<Category | null> {
    await delay();
    return categories.find((c) => c.slug === slug) ?? null;
  },
};

const brandsApi = {
  async list(): Promise<Brand[]> {
    await delay();
    return [...brands];
  },
};

/* -----------------------------------------------------------
   Wilayas
   ----------------------------------------------------------- */

const wilayasApi = {
  async list(): Promise<Wilaya[]> {
    await delay();
    return [...wilayas];
  },
  async get(id: string): Promise<Wilaya | null> {
    await delay();
    return getWilayaById(id) ?? null;
  },
};

/* -----------------------------------------------------------
   Orders
   ----------------------------------------------------------- */

const ordersApi = {
  async create(data: CreateOrderInput): Promise<Order> {
    await delay();
    const wilaya = getWilayaById(data.shipping.wilayaId);
    if (!wilaya) throw new Error("Wilaya invalide");

    const lines = data.lines.map((l) => {
      const product = products.find((p) => p.id === l.productId);
      if (!product) throw new Error(`Produit ${l.productId} introuvable`);
      const unitPrice = product.price;
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        variant: l.variant,
        quantity: l.quantity,
        unitPrice,
        total: unitPrice * l.quantity,
        image: product.images[0]?.url ?? "",
      };
    });

    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const shippingFee = wilaya.shippingPrice;
    const total = subtotal + shippingFee;
    const nextNumber = orders.length + 1 + 40000;
    const now = new Date().toISOString();
    const order: Order = {
      id: `order-${(orders.length + 1).toString().padStart(3, "0")}`,
      orderNumber: `BIN-2026-${nextNumber.toString().padStart(5, "0")}`,
      status: "pending",
      customer: data.customer,
      shipping: {
        wilayaId: wilaya.id,
        wilayaName: wilaya.name,
        commune: data.shipping.commune,
        address: data.shipping.address,
        notes: data.shipping.notes,
      },
      lines,
      subtotal,
      shippingFee,
      total,
      callAttempts: [],
      statusHistory: [
        {
          status: "pending",
          at: now,
          by: "Système",
          note: "Commande reçue",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    orders = [order, ...orders];
    return order;
  },

  async list(params: OrderListParams = {}): Promise<{
    items: Order[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await delay();
    let items = [...orders];
    if (params.status) {
      const want = Array.isArray(params.status) ? params.status : [params.status];
      items = items.filter((o) => want.includes(o.status));
    }
    if (params.wilayaId) {
      items = items.filter((o) => o.shipping.wilayaId === params.wilayaId);
    }
    if (params.from) {
      const from = +new Date(params.from);
      items = items.filter((o) => +new Date(o.createdAt) >= from);
    }
    if (params.to) {
      const to = +new Date(params.to);
      items = items.filter((o) => +new Date(o.createdAt) <= to);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q) ||
          `${o.customer.firstName} ${o.customer.lastName}`
            .toLowerCase()
            .includes(q)
      );
    }
    if (params.customerId) {
      const c = customers.find((x) => x.id === params.customerId);
      if (c) items = items.filter((o) => o.customer.phone === c.phone);
      else items = [];
    }

    const total = items.length;
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(100, params.limit ?? 25));
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items: items.slice((page - 1) * limit, page * limit),
      total,
      page,
      totalPages,
    };
  },

  async get(id: string): Promise<Order | null> {
    await delay();
    return (
      orders.find((o) => o.id === id || o.orderNumber === id) ?? null
    );
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await delay();
    const idx = orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx === -1) throw new Error("Commande introuvable");
    const now = new Date().toISOString();
    const next = { ...orders[idx]! };
    next.status = status;
    next.updatedAt = now;
    next.statusHistory = [
      ...next.statusHistory,
      { status, at: now, by: "Admin" },
    ];
    if (status === "shipped" && !next.zrTrackingNumber) {
      next.zrTrackingNumber = `ZR${Math.floor(Math.random() * 1e8)
        .toString()
        .padStart(8, "0")}DZ`;
    }
    orders = [...orders.slice(0, idx), next, ...orders.slice(idx + 1)];
    return next;
  },

  async addCallAttempt(
    id: string,
    attempt: { result: CallAttemptResult; notes: string }
  ): Promise<Order> {
    await delay();
    const idx = orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx === -1) throw new Error("Commande introuvable");
    const now = new Date().toISOString();
    const newAttempt: CallAttempt = {
      id: `ca-${Math.floor(Math.random() * 1e6)}`,
      date: now,
      result: attempt.result,
      notes: attempt.notes,
    };
    const next = {
      ...orders[idx]!,
      callAttempts: [...orders[idx]!.callAttempts, newAttempt],
      updatedAt: now,
    };
    orders = [...orders.slice(0, idx), next, ...orders.slice(idx + 1)];
    return next;
  },
};

/* -----------------------------------------------------------
   Customers
   ----------------------------------------------------------- */

const customersApi = {
  async list(params: CustomerListParams = {}): Promise<{
    items: Customer[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await delay();
    let items = [...customers];
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
      );
    }
    if (params.wilayaId) {
      items = items.filter((c) => c.wilayaId === params.wilayaId);
    }
    switch (params.sort) {
      case "top_spender":
        items.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case "most_orders":
        items.sort((a, b) => b.orderCount - a.orderCount);
        break;
      default:
        items.sort(
          (a, b) =>
            +new Date(b.lastOrderDate ?? b.createdAt) -
            +new Date(a.lastOrderDate ?? a.createdAt)
        );
    }
    const total = items.length;
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(100, params.limit ?? 25));
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items: items.slice((page - 1) * limit, page * limit),
      total,
      page,
      totalPages,
    };
  },

  async get(id: string): Promise<Customer | null> {
    await delay();
    return customers.find((c) => c.id === id) ?? null;
  },
};

/* -----------------------------------------------------------
   Banners
   ----------------------------------------------------------- */

const bannersApi = {
  async list(): Promise<Banner[]> {
    await delay();
    return [...banners]
      .filter((b) => b.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
};

/* -----------------------------------------------------------
   Stats
   ----------------------------------------------------------- */

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const statsApi = {
  async dashboard(): Promise<DashboardStats> {
    await delay();
    const now = Date.now();
    const day = 86_400_000;

    const inWindow = (o: Order, days: number) =>
      +new Date(o.createdAt) >= now - days * day;
    const revenueOf = (filter: (o: Order) => boolean) =>
      orders.filter(filter).reduce((s, o) => s + o.total, 0);

    const revenueDay = revenueOf((o) => inWindow(o, 1));
    const revenuePrevDay = revenueOf(
      (o) =>
        +new Date(o.createdAt) >= now - 2 * day &&
        +new Date(o.createdAt) < now - 1 * day
    );
    const revenueWeek = revenueOf((o) => inWindow(o, 7));
    const revenueMonth = revenueOf((o) => inWindow(o, 30));
    const revenueDayChange =
      revenuePrevDay === 0 ? 0 : (revenueDay - revenuePrevDay) / revenuePrevDay;

    const ordersPending = orders.filter((o) => o.status === "pending").length;
    const confirmable = orders.filter(
      (o) =>
        o.status !== "pending" && +new Date(o.createdAt) >= now - 30 * day
    ).length;
    const cancelled = orders.filter(
      (o) =>
        o.status === "cancelled" && +new Date(o.createdAt) >= now - 30 * day
    ).length;
    const totalRecent = orders.filter(
      (o) => +new Date(o.createdAt) >= now - 30 * day
    ).length;
    const confirmationRate =
      totalRecent === 0 ? 0 : confirmable / (confirmable + cancelled);

    const delivered = orders.filter(
      (o) =>
        o.status === "delivered" && +new Date(o.createdAt) >= now - 30 * day
    ).length;
    const eligible = orders.filter(
      (o) =>
        o.status !== "pending" &&
        o.status !== "confirmed" &&
        +new Date(o.createdAt) >= now - 30 * day
    ).length;
    const deliveryRate = eligible === 0 ? 0 : delivered / eligible;

    const recentOrders = [...orders]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8);

    const productCounts = new Map<string, number>();
    orders.forEach((o) =>
      o.lines.forEach((l) =>
        productCounts.set(l.productId, (productCounts.get(l.productId) ?? 0) + l.quantity)
      )
    );
    const topProducts = [...productCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, unitsSold]) => {
        const product = products.find((p) => p.id === productId);
        return {
          productId,
          slug: product?.slug ?? "",
          name: product?.name ?? "Produit inconnu",
          image: product?.images[0]?.url ?? "",
          unitsSold,
        };
      });

    const lowStockCount = products.filter((p) => p.stockStatus === "low_stock").length;
    const oldPending = orders.filter(
      (o) =>
        o.status === "pending" && +new Date(o.createdAt) < now - 2 * day
    ).length;
    const toProcessReturns = orders.filter((o) => o.status === "returned").length;

    const alerts = [
      lowStockCount > 0 && {
        id: "alert-stock",
        severity: "warning" as const,
        icon: "TriangleAlert",
        message: `Stock faible : ${lowStockCount} produits`,
      },
      oldPending > 0 && {
        id: "alert-pending",
        severity: "danger" as const,
        icon: "Clock",
        message: `Commandes en attente depuis +48h : ${oldPending}`,
      },
      toProcessReturns > 0 && {
        id: "alert-returns",
        severity: "info" as const,
        icon: "RotateCcw",
        message: `Retours à traiter : ${toProcessReturns}`,
      },
    ].filter(Boolean) as DashboardStats["alerts"];

    const revenueLast7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * day);
      const key = dayKey(d);
      const sum = orders
        .filter((o) => dayKey(new Date(o.createdAt)) === key)
        .reduce((s, o) => s + o.total, 0);
      return { date: key, revenue: sum };
    });

    const ordersLast14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now - (13 - i) * day);
      const key = dayKey(d);
      const count = orders.filter(
        (o) => dayKey(new Date(o.createdAt)) === key
      ).length;
      return { date: key, orders: count };
    });

    return {
      revenueDay,
      revenueWeek,
      revenueMonth,
      revenueDayChange,
      ordersPending,
      confirmationRate,
      deliveryRate,
      recentOrders,
      topProducts,
      alerts,
      revenueLast7,
      ordersLast14,
    };
  },

  async revenueByPeriod(
    period: "day" | "week" | "month",
    from: string,
    to: string
  ): Promise<RevenuePoint[]> {
    await delay();
    const start = +new Date(from);
    const end = +new Date(to);
    const day = 86_400_000;
    const stepDays = period === "day" ? 1 : period === "week" ? 7 : 30;
    const buckets: RevenuePoint[] = [];
    for (let t = start; t <= end; t += stepDays * day) {
      const next = t + stepDays * day;
      const sum = orders
        .filter((o) => {
          const ts = +new Date(o.createdAt);
          return ts >= t && ts < next;
        })
        .reduce((s, o) => s + o.total, 0);
      buckets.push({ date: dayKey(new Date(t)), revenue: sum });
    }
    return buckets;
  },

  async revenueByWilaya(): Promise<WilayaRevenue[]> {
    await delay();
    const byCode = new Map<string, WilayaRevenue>();
    wilayas.forEach((w) =>
      byCode.set(w.code, {
        wilayaCode: w.code,
        wilayaName: w.name,
        region: w.region,
        revenue: 0,
        orderCount: 0,
        deliveryRate: 0,
        averageBasket: 0,
      })
    );
    const deliveredByCode = new Map<string, number>();
    orders.forEach((o) => {
      const bucket = byCode.get(o.shipping.wilayaId);
      if (!bucket) return;
      bucket.revenue += o.total;
      bucket.orderCount += 1;
      if (o.status === "delivered") {
        deliveredByCode.set(
          o.shipping.wilayaId,
          (deliveredByCode.get(o.shipping.wilayaId) ?? 0) + 1
        );
      }
    });
    byCode.forEach((b, code) => {
      b.averageBasket = b.orderCount === 0 ? 0 : b.revenue / b.orderCount;
      b.deliveryRate =
        b.orderCount === 0
          ? 0
          : (deliveredByCode.get(code) ?? 0) / b.orderCount;
    });
    return [...byCode.values()].sort((a, b) => b.revenue - a.revenue);
  },
};

/* -----------------------------------------------------------
   Public surface
   ----------------------------------------------------------- */

/* -----------------------------------------------------------
   Favorites (per-customer, persisted in-memory for the mock).
   On a real backend this would be a DB table keyed by customerId.
   ----------------------------------------------------------- */

/* Per-customer favorites, persisted in localStorage so they survive across
   reloads / logouts / logins — same idea as a real backend table keyed by
   customerId. Falls back to an empty record on SSR. */

const FAV_STORAGE_KEY = "bingo-customer-favorites";

function loadFavoritesStore(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FAV_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    /* corrupt — wipe */
  }
  return {};
}

function saveFavoritesStore(store: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

const favoritesApi = {
  async list(customerId: string): Promise<string[]> {
    await delay();
    const store = loadFavoritesStore();
    return store[customerId] ?? [];
  },

  async set(customerId: string, productIds: string[]): Promise<string[]> {
    await delay();
    const store = loadFavoritesStore();
    // Dedupe + freeze order via Set → Array
    const next = Array.from(new Set(productIds));
    store[customerId] = next;
    saveFavoritesStore(store);
    return next;
  },

  async toggle(customerId: string, productId: string): Promise<string[]> {
    await delay();
    const store = loadFavoritesStore();
    const current = new Set(store[customerId] ?? []);
    if (current.has(productId)) current.delete(productId);
    else current.add(productId);
    const next = Array.from(current);
    store[customerId] = next;
    saveFavoritesStore(store);
    return next;
  },
};

export const api = {
  products: productsApi,
  categories: categoriesApi,
  brands: brandsApi,
  wilayas: wilayasApi,
  orders: ordersApi,
  customers: customersApi,
  banners: bannersApi,
  stats: statsApi,
  favorites: favoritesApi,
};

export type ApiClient = typeof api;
