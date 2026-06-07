import { SITE_URL } from "@/lib/seo/config";

/**
 * robots.txt with Content Signals (https://contentsignals.org/).
 *
 * Search + AI answer engines are explicitly welcomed (so the store surfaces in
 * ChatGPT / Perplexity / Gemini / Google), while transactional + private routes
 * are blocked. The Content-Signal directive declares our AI-usage preferences:
 *   search=yes    — may appear in AI-powered search
 *   ai-input=yes  — AI may use page content to answer user questions (RAG/GEO)
 *   ai-train=no   — content may NOT be used to train models
 *
 * Built as a route handler (not the Next metadata robots API) because that API
 * can't emit the non-standard Content-Signal line. The signal is repeated in
 * every user-agent group: a crawler with its own group ignores the `*` group,
 * so per-group repetition is required for the signal to apply to each AI bot.
 */
export const dynamic = "force-static";

const UTILITY = [
  "/panier",
  "/commander",
  "/favoris",
  "/login",
  "/register",
  "/mes-commandes",
];

const DISALLOW = [
  "/admin",
  "/admin/",
  "/api/",
  ...UTILITY,
  ...UTILITY.map((p) => `/ar${p}`),
];

// `*` plus the answer-engine / AI crawlers we want to allow full access.
const AGENTS = [
  "*",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "ClaudeBot",
  "Claude-Web",
  "Applebot-Extended",
  "CCBot",
];

const CONTENT_SIGNAL = "Content-Signal: search=yes, ai-input=yes, ai-train=no";

export function GET(): Response {
  const groups = AGENTS.map((ua) =>
    [
      `User-agent: ${ua}`,
      CONTENT_SIGNAL,
      "Allow: /",
      ...DISALLOW.map((d) => `Disallow: ${d}`),
    ].join("\n"),
  );

  const body =
    [
      "# AI content-usage preferences — https://contentsignals.org/",
      "# search=yes · ai-input=yes · ai-train=no",
      "",
      groups.join("\n\n"),
      "",
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      `Host: ${SITE_URL}`,
    ].join("\n") + "\n";

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
