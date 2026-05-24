import type {
  CallAttempt,
  Order,
  OrderLine,
  OrderStatus,
  StatusHistoryEntry,
} from "@/lib/types";
import { customers } from "@/lib/mock/customers";
import { products } from "@/lib/mock/products";
import { wilayas, getWilayaById } from "@/lib/mock/wilayas";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260420);
const rnd = () => rng();
const rndInt = (min: number, max: number) =>
  Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;

// Status distribution targets a working store: most orders end up delivered,
// a smaller share pending or in-flight, a few cancelled / returned.
const STATUS_DIST: Array<[OrderStatus, number]> = [
  ["pending", 8],
  ["confirmed", 8],
  ["preparing", 7],
  ["shipped", 10],
  ["delivered", 20],
  ["cancelled", 5],
  ["returned", 2],
];

function pickStatus(): OrderStatus {
  const total = STATUS_DIST.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [s, w] of STATUS_DIST) {
    r -= w;
    if (r <= 0) return s;
  }
  return "delivered";
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Commande reçue",
  confirmed: "Confirmée par téléphone",
  preparing: "Préparation en cours",
  shipped: "Expédiée via ZR Express",
  delivered: "Livrée au client",
  cancelled: "Annulée",
  returned: "Retournée",
};

// How many days it typically takes to transition between states.
const STATUS_DAYS: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  shipped: 3,
  delivered: 5,
  cancelled: 1,
  returned: 8,
};

function buildLines(): OrderLine[] {
  const count = rndInt(1, 4);
  const usable = products.filter((p) => p.stockStatus !== "out_of_stock");
  const picked: OrderLine[] = [];
  const seen = new Set<string>();
  while (picked.length < count) {
    const p = pick(usable);
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const quantity = rnd() < 0.75 ? 1 : rndInt(2, 3);
    const variant =
      p.variants.length > 0 ? pick(p.variants).value : undefined;
    const unitPrice = p.price;
    picked.push({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      variant,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
      image: p.images[0]?.url ?? "",
    });
  }
  return picked;
}

function buildCallAttempts(status: OrderStatus, createdAt: number): CallAttempt[] {
  if (status === "pending") {
    // Pending orders may have 0-2 attempts.
    const n = rndInt(0, 2);
    return Array.from({ length: n }, (_, i) => ({
      id: `ca-${rndInt(10000, 99999)}`,
      date: new Date(createdAt + (i + 1) * 4 * 3600 * 1000).toISOString(),
      result: pick(["no_answer", "no_answer", "callback_requested"] as const),
      notes: pick([
        "Pas de réponse, à rappeler en début de soirée.",
        "Client a demandé un rappel demain matin.",
        "Boîte vocale.",
      ]),
    }));
  }
  if (status === "cancelled" || status === "returned") {
    return [
      {
        id: `ca-${rndInt(10000, 99999)}`,
        date: new Date(createdAt + 5 * 3600 * 1000).toISOString(),
        result: "wrong_number",
        notes: "Numéro hors service, commande annulée.",
      },
    ];
  }
  // Confirmed / preparing / shipped / delivered: one successful call.
  return [
    {
      id: `ca-${rndInt(10000, 99999)}`,
      date: new Date(createdAt + 3 * 3600 * 1000).toISOString(),
      result: "answered",
      notes: "Client confirmé, livraison validée.",
    },
  ];
}

function buildHistory(status: OrderStatus, createdAt: number): StatusHistoryEntry[] {
  const order: OrderStatus[] = ["pending"];
  if (status === "cancelled") order.push("cancelled");
  else if (status === "returned")
    order.push("confirmed", "preparing", "shipped", "delivered", "returned");
  else {
    if (status === "confirmed") order.push("confirmed");
    else if (status === "preparing") order.push("confirmed", "preparing");
    else if (status === "shipped")
      order.push("confirmed", "preparing", "shipped");
    else if (status === "delivered")
      order.push("confirmed", "preparing", "shipped", "delivered");
  }
  return order.map((s, i) => ({
    status: s,
    at: new Date(createdAt + i * STATUS_DAYS[s] * 24 * 3600 * 1000).toISOString(),
    by: i === 0 ? "Système" : "Admin",
    note: STATUS_LABEL[s],
  }));
}

function buildTracking(status: OrderStatus): string | undefined {
  if (
    status === "shipped" ||
    status === "delivered" ||
    status === "returned"
  ) {
    return `ZR${rndInt(10000000, 99999999)}DZ`;
  }
  return undefined;
}

function buildOrders(): Order[] {
  const list: Order[] = [];
  const baseDate = new Date("2026-05-15T10:00:00Z").getTime();
  for (let i = 0; i < 60; i++) {
    const status = pickStatus();
    const daysAgo = rndInt(1, 60);
    const createdMs = baseDate - daysAgo * 86_400_000;
    const customer = pick(customers);
    const wilaya = getWilayaById(customer.wilayaId) ?? pick(wilayas);
    const lines = buildLines();
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const shippingFee = wilaya.shippingPrice;
    const total = subtotal + shippingFee;
    const orderNumber = `BIN-2026-${(40000 + i + 1).toString().padStart(5, "0")}`;
    const address = customer.addresses[0]!;
    const history = buildHistory(status, createdMs);
    const updatedMs = history.length
      ? new Date(history[history.length - 1]!.at).getTime()
      : createdMs;

    list.push({
      id: `order-${(i + 1).toString().padStart(3, "0")}`,
      orderNumber,
      status,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
      },
      shipping: {
        wilayaId: wilaya.id,
        wilayaName: wilaya.name,
        commune: address.commune,
        address: address.street,
        notes: rnd() < 0.2 ? "Sonnez deux fois à l'interphone, merci." : undefined,
      },
      lines,
      subtotal,
      shippingFee,
      total,
      callAttempts: buildCallAttempts(status, createdMs),
      statusHistory: history,
      zrTrackingNumber: buildTracking(status),
      createdAt: new Date(createdMs).toISOString(),
      updatedAt: new Date(updatedMs).toISOString(),
    });
  }
  return list.sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

export const orders: Order[] = buildOrders();

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id || o.orderNumber === id);
}

export function getOrdersByCustomer(customerId: string): Order[] {
  // Mock orders don't store a customerId — match by phone instead.
  const cust = customers.find((c) => c.id === customerId);
  if (!cust) return [];
  return orders.filter((o) => o.customer.phone === cust.phone);
}
