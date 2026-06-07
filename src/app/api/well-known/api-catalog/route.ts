import { SITE_URL } from "@/lib/seo/config";

/**
 * RFC 9727 API catalog, served as application/linkset+json (RFC 9264). Exposed
 * at /.well-known/api-catalog via a rewrite in next.config (Next's app router
 * can't host a literal `.well-known` folder). Each linkset entry anchors an API
 * and links its machine spec (service-desc), human docs (service-doc) and
 * health endpoint (status).
 */
export const dynamic = "force-static";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "https://bingo.symloop.com") + "/api";
const HEALTH =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "https://bingo.symloop.com") + "/up";

export function GET(): Response {
  const linkset = {
    linkset: [
      {
        anchor: API_BASE,
        "service-desc": [
          {
            href: `${SITE_URL}/openapi.json`,
            type: "application/json",
            title: "BINGO storefront API — OpenAPI 3.1 spec",
          },
        ],
        "service-doc": [
          {
            href: `${SITE_URL}/docs/api`,
            type: "text/html",
            title: "BINGO storefront API — documentation",
          },
        ],
        status: [
          {
            href: HEALTH,
            type: "text/html",
            title: "Health check",
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(linkset, null, 2), {
    headers: {
      "content-type": "application/linkset+json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
