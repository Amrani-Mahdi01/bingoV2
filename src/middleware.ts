import { NextResponse, type NextRequest } from "next/server";

/**
 * Locale routing (Approach A). French is served at the clean root; Arabic
 * lives under a `/ar` prefix. The actual page routes are NOT duplicated —
 * for an `/ar/...` request we rewrite to the prefix-free path so the
 * existing route renders, and tag the request with `x-locale=ar`. The
 * root layout reads that header to render Arabic server-side (html lang/dir
 * + the language provider's initial value).
 *
 * `x-pathname` carries the original public path so server code can build
 * canonical + hreflang URLs that reflect the address bar, not the rewrite.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const locale = isArabic ? "ar" : "fr";

  const headers = new Headers(req.headers);
  headers.set("x-locale", locale);
  headers.set("x-pathname", pathname);

  if (isArabic) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/"; // drop the leading "/ar"
    url.search = search;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Run on everything except Next internals, the API, the admin backoffice
  // (French-only by design), and any file with an extension (static assets,
  // sitemap.xml, robots.txt, llms.txt, og-default.png, icons, …).
  matcher: ["/((?!_next/|api/|admin|.*\\.).*)"],
};
