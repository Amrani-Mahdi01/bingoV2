import type { NextRequest } from "next/server";
import { NodeHtmlMarkdown } from "node-html-markdown";

/**
 * Markdown for Agents.
 *
 * Middleware rewrites any page request carrying `Accept: text/markdown` to this
 * handler (with the original path in `?p=`). We fetch that page's own HTML
 * (asking for text/html so it renders normally — no loop), strip the chrome,
 * convert the main content to Markdown, and return it as `text/markdown`.
 * Browsers, which never send `Accept: text/markdown`, keep getting HTML.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Decode the handful of HTML entities that show up in <title>. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Pull the meaningful content out of a full HTML document. */
function extractContent(html: string): string {
  const strip = (s: string) =>
    s
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "");

  const main = html.match(/<main[\s\S]*?<\/main>/i);
  if (main) return strip(main[0]);

  const body = html.match(/<body[\s\S]*?<\/body>/i);
  let content = strip(body ? body[0] : html);
  // No <main> — drop the site chrome so agents get the page, not the nav.
  content = content
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "");
  return content;
}

export async function GET(req: NextRequest): Promise<Response> {
  const path = req.nextUrl.searchParams.get("p") || "/";
  const query = req.nextUrl.searchParams.get("q");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || req.nextUrl.host;
  const target = `${proto}://${host}${path}${query ? `?${query}` : ""}`;

  let html: string;
  try {
    const upstream = await fetch(target, {
      headers: { accept: "text/html", "user-agent": "bingo-markdown/1.0" },
    });
    if (!upstream.ok) {
      return new Response(`# ${upstream.status}\n\nPage indisponible.\n`, {
        status: upstream.status,
        headers: { "content-type": "text/markdown; charset=utf-8" },
      });
    }
    html = await upstream.text();
  } catch {
    return new Response("# 502\n\nImpossible de rendre la page.\n", {
      status: 502,
      headers: { "content-type": "text/markdown; charset=utf-8" },
    });
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? decodeEntities(titleMatch[1].replace(/\s+/g, " ").trim())
    : "BINGO Camping";

  const md = NodeHtmlMarkdown.translate(extractContent(html)).trim();
  const out = `# ${title}\n\n> Source : ${target}\n\n${md}\n`;

  return new Response(out, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      // Rough token estimate (~4 chars/token) for agents that read it.
      "x-markdown-tokens": String(Math.ceil(out.length / 4)),
      "cache-control": "public, max-age=300, s-maxage=300",
      "x-robots-tag": "noindex",
    },
  });
}
