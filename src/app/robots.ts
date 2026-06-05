import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/config";

/**
 * robots.txt. Search + AI crawlers are explicitly welcomed (so the store
 * can surface in ChatGPT / Perplexity / Gemini answers as well as Google),
 * while transactional + private routes are blocked from indexing. The
 * sitemap is advertised for discovery.
 */
export default function robots(): MetadataRoute.Robots {
  // Transactional + private routes, in both French (root) and Arabic (/ar).
  const utility = [
    "/panier",
    "/commander",
    "/favoris",
    "/login",
    "/register",
    "/mes-commandes",
  ];
  const disallow = [
    "/admin",
    "/admin/",
    "/api/",
    ...utility,
    ...utility.map((p) => `/ar${p}`),
  ];

  // Answer-engine / AI crawlers we want to allow full access.
  const aiBots = [
    "GPTBot", // OpenAI training
    "OAI-SearchBot", // ChatGPT search
    "ChatGPT-User", // ChatGPT live browsing
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended", // Gemini / Bard
    "ClaudeBot",
    "Claude-Web",
    "Applebot-Extended",
    "CCBot", // Common Crawl (feeds many LLMs)
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: "/", disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
