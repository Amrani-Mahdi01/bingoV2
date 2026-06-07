import { SITE_NAME, SITE_URL } from "@/lib/seo/config";

/**
 * OpenAPI 3.1 description of BINGO's public storefront API (the read endpoints
 * the site itself consumes, plus guest order/contact submission). Referenced as
 * `service-desc` from /.well-known/api-catalog so agents can discover how to
 * read the catalog and place a cash-on-delivery order. Only documents endpoints
 * that genuinely exist and are public.
 */
export const dynamic = "force-static";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "https://bingo.symloop.com") + "/api";

export function GET(): Response {
  const okJson = {
    description: "Success",
    content: { "application/json": { schema: { type: "object" } } },
  };

  const spec = {
    openapi: "3.1.0",
    info: {
      title: `${SITE_NAME} — Public API`,
      version: "1.0.0",
      description:
        "Public storefront API for BINGO Camping (outdoor & camping gear, " +
        "Algeria). Read endpoints are unauthenticated; orders are placed " +
        "cash-on-delivery via POST /orders. Prices are integers in DZD.",
      contact: { name: SITE_NAME, url: SITE_URL },
    },
    servers: [{ url: API_BASE, description: "Production" }],
    paths: {
      "/products": {
        get: {
          summary: "List products",
          description:
            "Paginated list of active products. Supports optional query " +
            "params for search and pagination (e.g. q, perPage, page).",
          responses: { "200": okJson },
        },
      },
      "/products/{slug}": {
        get: {
          summary: "Get one product by slug",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { "200": okJson, "404": { description: "Not found" } },
        },
      },
      "/categories": {
        get: { summary: "List categories", responses: { "200": okJson } },
      },
      "/brands": {
        get: { summary: "List brands", responses: { "200": okJson } },
      },
      "/banners": {
        get: { summary: "List homepage banners", responses: { "200": okJson } },
      },
      "/wilayas": {
        get: {
          summary: "List wilayas with shipping prices",
          description:
            "All 58 wilayas served, each with home + stop-desk shipping price " +
            "(DZD) and delivery delay.",
          responses: { "200": okJson },
        },
      },
      "/wilayas/{wilaya}/communes": {
        get: {
          summary: "List communes of a wilaya",
          parameters: [
            {
              name: "wilaya",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Wilaya id (2-digit code).",
            },
          ],
          responses: { "200": okJson },
        },
      },
      "/settings": {
        get: {
          summary: "Public store settings",
          description: "Contact info, hours, address, social links.",
          responses: { "200": okJson },
        },
      },
      "/orders": {
        post: {
          summary: "Place an order (cash on delivery)",
          description:
            "Guest checkout. Minimum merchandise total is 1000 DZD. Phone " +
            "must match the Algerian format (0[567]xxxxxxxx).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateOrder" },
              },
            },
          },
          responses: {
            "201": okJson,
            "422": { description: "Validation error" },
          },
        },
      },
      "/contact": {
        post: {
          summary: "Send a contact message",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "message"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": okJson, "422": { description: "Validation error" } },
        },
      },
    },
    components: {
      schemas: {
        CreateOrder: {
          type: "object",
          required: ["customer", "shipping", "lines"],
          properties: {
            customer: {
              type: "object",
              required: ["firstName", "lastName", "phone"],
              properties: {
                firstName: { type: "string" },
                lastName: { type: "string" },
                phone: {
                  type: "string",
                  description: "Algerian mobile, e.g. 0612345678",
                },
                email: { type: "string", format: "email" },
              },
            },
            shipping: {
              type: "object",
              required: ["wilayaId", "commune"],
              properties: {
                wilayaId: { type: "string", description: "2-digit wilaya code" },
                commune: { type: "string" },
                address: { type: "string" },
                deliveryType: {
                  type: "string",
                  enum: ["home", "stopdesk"],
                  default: "home",
                },
                notes: { type: "string" },
              },
            },
            lines: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["productSlug", "quantity"],
                properties: {
                  productSlug: { type: "string" },
                  variantId: {
                    type: "integer",
                    description: "Chosen colour/size variant id, if any",
                  },
                  quantity: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
