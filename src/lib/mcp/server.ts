/**
 * Minimal, real MCP server for the BINGO storefront. Read-only tools backed by
 * the existing public REST API, so an AI agent can browse the catalogue and
 * quote shipping. No write tools (order creation needs the recaptcha/anti-abuse
 * path the storefront uses, so it isn't exposed here).
 *
 * The HTTP (Streamable HTTP) JSON-RPC plumbing lives in app/api/mcp/route.ts;
 * this module is the server identity + tool catalogue + handlers.
 */

export const MCP_SERVER = {
  name: "bingo-camp",
  version: "1.0.0",
  instructions:
    "BINGO Camping — outdoor & camping gear store in Algeria (cash on " +
    "delivery). Use search_products / get_product to browse the catalogue, " +
    "list_categories for sections, and get_shipping_price for delivery cost by " +
    "wilaya. Prices are in Algerian dinar (DZD).",
};

export const PROTOCOL_VERSION = "2025-06-18";

export const MCP_TOOLS = [
  {
    name: "search_products",
    description:
      "Search the BINGO catalogue by keyword (French or Arabic). Returns " +
      "matching products with price and product URL.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword, e.g. 'tente', 'sac'." },
        limit: { type: "integer", minimum: 1, maximum: 25, default: 8 },
      },
    },
  },
  {
    name: "get_product",
    description: "Get full details of one product by its slug.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
  {
    name: "list_categories",
    description: "List product categories with how many products each holds.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_shipping_price",
    description:
      "Get home + stop-desk delivery price (DZD) and delay for a wilaya, by " +
      "name or 2-digit code.",
    inputSchema: {
      type: "object",
      properties: {
        wilaya: { type: "string", description: "Wilaya name or code, e.g. 'Sétif' or '19'." },
      },
      required: ["wilaya"],
    },
  },
];

const API =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "https://bingo.symloop.com") + "/api";
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://bingo-camp.com";

async function api<T = { data: unknown }>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return (await r.json()) as T;
}

function priceTxt(p: { price?: number; oldPrice?: number | null }): string {
  if (typeof p.price !== "number") return "prix sur demande";
  const base = `${p.price.toLocaleString("fr-FR")} DA`;
  return typeof p.oldPrice === "number" && p.oldPrice > p.price
    ? `${base} (au lieu de ${p.oldPrice.toLocaleString("fr-FR")} DA)`
    : base;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type ApiProduct = {
  slug: string;
  nameFr?: string;
  nameAr?: string;
  price?: number;
  oldPrice?: number | null;
  descriptionShortFr?: string;
  descriptionFr?: string;
};
type ApiWilaya = {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  shippingPrice: number;
  stopDeskPrice: number;
  deliveryDays?: number;
};
type ApiCategory = { nameFr?: string; slug: string; productCount?: number };

/** Run a tool. Returns plain text (the MCP content for the agent). */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ text: string; isError?: boolean }> {
  switch (name) {
    case "search_products": {
      const query = String(args.query ?? "").trim().toLowerCase();
      const limit = Math.min(Math.max(Number(args.limit ?? 8) || 8, 1), 25);
      const { data } = await api<{ data: ApiProduct[] }>("/products");
      const list = (data || []).filter((p) => {
        if (!query) return true;
        return [p.nameFr, p.nameAr, p.descriptionShortFr]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(query));
      });
      if (list.length === 0) {
        return { text: `Aucun produit pour « ${args.query ?? ""} ».` };
      }
      const lines = list.slice(0, limit).map(
        (p) => `- ${p.nameFr} — ${priceTxt(p)} — ${SITE}/produit/${p.slug}`,
      );
      return {
        text: `${list.length} résultat(s)${list.length > limit ? ` (top ${limit})` : ""} :\n${lines.join("\n")}`,
      };
    }

    case "get_product": {
      const slug = String(args.slug ?? "").trim();
      if (!slug) return { text: "slug requis.", isError: true };
      const { data: p } = await api<{ data: ApiProduct }>(`/products/${encodeURIComponent(slug)}`);
      const desc =
        p.descriptionShortFr ||
        (p.descriptionFr ? stripHtml(p.descriptionFr).slice(0, 400) : "");
      return {
        text: [
          `# ${p.nameFr}`,
          `Prix : ${priceTxt(p)}`,
          desc && `\n${desc}`,
          `\nURL : ${SITE}/produit/${p.slug}`,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }

    case "list_categories": {
      const { data } = await api<{ data: ApiCategory[] }>("/categories");
      const lines = (data || []).map(
        (c) => `- ${c.nameFr} (${c.productCount ?? 0} produits) — ${SITE}/catalogue?category=${c.slug}`,
      );
      return { text: lines.join("\n") || "Aucune catégorie." };
    }

    case "get_shipping_price": {
      const q = String(args.wilaya ?? "").trim().toLowerCase();
      if (!q) return { text: "wilaya requise.", isError: true };
      const { data } = await api<{ data: ApiWilaya[] }>("/wilayas");
      const w = (data || []).find(
        (x) =>
          x.code === q ||
          x.id === q ||
          x.name.toLowerCase().includes(q) ||
          (x.nameAr ?? "").includes(args.wilaya as string),
      );
      if (!w) return { text: `Wilaya « ${args.wilaya} » introuvable.`, isError: true };
      return {
        text:
          `Livraison à ${w.name} (${w.code}) : ` +
          `domicile ${w.shippingPrice.toLocaleString("fr-FR")} DA, ` +
          `stop-desk ${w.stopDeskPrice.toLocaleString("fr-FR")} DA` +
          (w.deliveryDays ? `, délai ~${w.deliveryDays} j.` : "."),
      };
    }

    default:
      return { text: `Outil inconnu : ${name}`, isError: true };
  }
}
