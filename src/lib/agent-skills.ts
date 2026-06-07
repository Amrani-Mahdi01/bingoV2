/**
 * Agent Skills (https://agentskills.io/, Cloudflare discovery RFC v0.2.0).
 *
 * Each skill is a real SKILL.md describing a capability an agent can perform
 * against BINGO's EXISTING public REST API — nothing aspirational. The index
 * route hashes `content` (sha256) and the per-skill route serves the same
 * `content`, so the published digest always matches the served document.
 */
export interface AgentSkill {
  name: string;
  type: "skill-md";
  description: string;
  content: string;
}

const API = "https://bingo.symloop.com/api";
const SITE = "https://bingo-camp.com";

export const AGENT_SKILLS: AgentSkill[] = [
  {
    name: "search-catalog",
    type: "skill-md",
    description: "Search BINGO's camping/outdoor catalogue by keyword.",
    content: `# Skill: search-catalog

Search the BINGO Camping catalogue (outdoor & camping gear, Algeria).

## How
Fetch the product list and filter by keyword (French or Arabic):

\`\`\`
GET ${API}/products
Accept: application/json
\`\`\`

Each item includes \`slug\`, \`nameFr\`, \`nameAr\`, \`price\` (integer, DZD),
\`descriptionShortFr\`. Match your keyword against the name/description fields.

Product page URL: \`${SITE}/produit/{slug}\`.

## MCP alternative
The same capability is available as the \`search_products\` tool on the MCP
server at \`${SITE}/mcp\` (see ${SITE}/.well-known/mcp/server-card.json).
`,
  },
  {
    name: "get-product",
    type: "skill-md",
    description: "Get full details and price of one product by slug.",
    content: `# Skill: get-product

Retrieve one product's details.

## How
\`\`\`
GET ${API}/products/{slug}
Accept: application/json
\`\`\`

Returns \`nameFr\`/\`nameAr\`, \`price\` and \`oldPrice\` (integers, DZD),
\`descriptionShortFr\`, \`descriptionFr\` (HTML), images and variants.

A clean Markdown rendering of any product page is also available with:
\`\`\`
GET ${SITE}/produit/{slug}
Accept: text/markdown
\`\`\`

## MCP alternative
\`get_product\` tool on \`${SITE}/mcp\`.
`,
  },
  {
    name: "check-shipping",
    type: "skill-md",
    description: "Get delivery price and delay for any Algerian wilaya.",
    content: `# Skill: check-shipping

Quote delivery cost for an Algerian wilaya (home delivery and stop-desk pickup).

## How
\`\`\`
GET ${API}/wilayas
Accept: application/json
\`\`\`

Each wilaya has \`code\` (2 digits), \`name\`, \`nameAr\`, \`shippingPrice\`
(home, DZD), \`stopDeskPrice\` (pickup point, DZD) and \`deliveryDays\`.
Match by name or code. Communes of a wilaya:
\`GET ${API}/wilayas/{code}/communes\`.

## MCP alternative
\`get_shipping_price\` tool on \`${SITE}/mcp\`.
`,
  },
  {
    name: "place-order",
    type: "skill-md",
    description: "Place a cash-on-delivery order.",
    content: `# Skill: place-order

Place a cash-on-delivery (COD) order. No online payment; the customer pays the
courier on delivery.

## How
\`\`\`
POST ${API}/orders
Content-Type: application/json
\`\`\`

Body:
\`\`\`json
{
  "customer": { "firstName": "...", "lastName": "...", "phone": "06xxxxxxxx" },
  "shipping": { "wilayaId": "19", "commune": "...", "deliveryType": "home" },
  "lines": [ { "productSlug": "...", "variantId": 123, "quantity": 1 } ]
}
\`\`\`

Rules:
- Phone must match the Algerian format \`0[567]xxxxxxxx\`.
- \`deliveryType\` is \`home\` or \`stopdesk\`.
- \`variantId\` is required only for products that have colour/size variants.
- Minimum merchandise total is 1000 DZD.

Full request/response schema: ${SITE}/openapi.json. In production the endpoint
may require a captcha token, so confirm with the merchant before automating
order creation.
`,
  },
];
