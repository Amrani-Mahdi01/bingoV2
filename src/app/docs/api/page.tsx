import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "@/lib/seo/config";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "https://bingo.symloop.com") + "/api";

export const metadata: Metadata = {
  title: `API — ${SITE_NAME}`,
  description:
    "Public storefront API for BINGO Camping: read the catalog, shipping " +
    "prices, and place a cash-on-delivery order.",
  alternates: { canonical: `${SITE_URL}/docs/api` },
};

const ENDPOINTS: Array<{ method: string; path: string; desc: string }> = [
  { method: "GET", path: "/products", desc: "List active products (paginated)." },
  { method: "GET", path: "/products/{slug}", desc: "Get one product by slug." },
  { method: "GET", path: "/categories", desc: "List categories." },
  { method: "GET", path: "/brands", desc: "List brands." },
  { method: "GET", path: "/banners", desc: "List homepage banners." },
  { method: "GET", path: "/wilayas", desc: "List wilayas with shipping prices (DZD)." },
  { method: "GET", path: "/wilayas/{id}/communes", desc: "List communes of a wilaya." },
  { method: "GET", path: "/settings", desc: "Public store settings (contact, hours)." },
  { method: "POST", path: "/orders", desc: "Place an order (cash on delivery)." },
  { method: "POST", path: "/contact", desc: "Send a contact message." },
];

export default function ApiDocsPage() {
  return (
    <main className="flex flex-1 flex-col bg-cream py-10 md:py-14">
      <div className="mx-auto w-full max-w-3xl px-6 md:px-10">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-forest-900 sm:text-4xl">
          {SITE_NAME} — Public API
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-wood-700 sm:text-base">
          A read API for the BINGO Camping catalogue plus guest order and
          contact submission. Read endpoints are unauthenticated; orders are
          placed cash-on-delivery. All prices are integers in Algerian dinar
          (DZD).
        </p>

        <dl className="mt-6 space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-semibold text-forest-900">Base URL</dt>
            <dd className="font-mono text-wood-800">{API_BASE}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-semibold text-forest-900">OpenAPI</dt>
            <dd>
              <a
                href={`${SITE_URL}/openapi.json`}
                className="font-mono text-tangerine-700 hover:underline"
              >
                {SITE_URL}/openapi.json
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-semibold text-forest-900">Catalog</dt>
            <dd>
              <a
                href={`${SITE_URL}/.well-known/api-catalog`}
                className="font-mono text-tangerine-700 hover:underline"
              >
                /.well-known/api-catalog
              </a>
            </dd>
          </div>
        </dl>

        <h2 className="mt-10 font-display text-xl font-bold text-forest-900">
          Endpoints
        </h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-wood-300/50 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-cream-deep/40 text-xs uppercase tracking-wide text-wood-700">
              <tr>
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Path</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr
                  key={`${e.method} ${e.path}`}
                  className="border-t border-wood-200/60"
                >
                  <td className="px-4 py-2 font-mono font-semibold text-forest-900">
                    {e.method}
                  </td>
                  <td className="px-4 py-2 font-mono text-wood-800">{e.path}</td>
                  <td className="px-4 py-2 text-wood-700">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 font-display text-xl font-bold text-forest-900">
          Placing an order
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-wood-700">
          <code className="font-mono">POST /orders</code> with a JSON body:
          <code className="font-mono"> customer</code> (firstName, lastName,
          phone), <code className="font-mono">shipping</code> (wilayaId, commune,
          deliveryType <code className="font-mono">home</code>/
          <code className="font-mono">stopdesk</code>) and{" "}
          <code className="font-mono">lines</code> (productSlug, variantId,
          quantity). Minimum merchandise total is 1000 DZD. See the OpenAPI spec
          above for the full schema.
        </p>
      </div>
    </main>
  );
}
