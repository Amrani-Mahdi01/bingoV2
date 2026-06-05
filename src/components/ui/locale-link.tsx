"use client";

import * as React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/lib/i18n";
import { localizeHref, type Locale } from "@/lib/locale";

/**
 * Drop-in replacement for `next/link` that prefixes internal hrefs with the
 * active locale (`/ar/...` in Arabic, untouched in French). External links,
 * anchors and protocol links pass through unchanged. Most storefront files
 * import it aliased as `Link`, so existing `<Link href="/x">` JSX keeps
 * working while staying in-locale.
 */
type NextLinkProps = React.ComponentProps<typeof NextLink>;

function localizeUrl(
  href: NextLinkProps["href"],
  locale: Locale
): NextLinkProps["href"] {
  if (typeof href === "string") return localizeHref(href, locale);
  if (href && typeof href === "object" && typeof href.pathname === "string") {
    return { ...href, pathname: localizeHref(href.pathname, locale) };
  }
  return href;
}

export const LocaleLink = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  function LocaleLink({ href, ...rest }, ref) {
    const { lang } = useLanguage();
    return <NextLink ref={ref} href={localizeUrl(href, lang)} {...rest} />;
  }
);

export default LocaleLink;

/** `useRouter` whose push/replace/prefetch localize string targets. */
export function useLocalizedRouter() {
  const router = useRouter();
  const { lang } = useLanguage();
  return React.useMemo(
    () => ({
      push: (href: string, opts?: Parameters<typeof router.push>[1]) =>
        router.push(localizeHref(href, lang), opts),
      replace: (href: string, opts?: Parameters<typeof router.replace>[1]) =>
        router.replace(localizeHref(href, lang), opts),
      prefetch: (href: string) => router.prefetch(localizeHref(href, lang)),
      back: () => router.back(),
      forward: () => router.forward(),
      refresh: () => router.refresh(),
    }),
    [router, lang]
  );
}

/** Returns a stable localizer for the active locale. */
export function useLocalize() {
  const { lang } = useLanguage();
  return React.useCallback((href: string) => localizeHref(href, lang), [lang]);
}
