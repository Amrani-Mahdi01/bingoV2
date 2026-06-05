"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { usePathname } from "next/navigation";
import { Mountain } from "lucide-react";

import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsappIcon,
} from "@/components/icons/social";
import { useLanguage } from "@/lib/i18n";
import { useSiteCategories } from "@/lib/site-categories-context";
import { useSiteContact } from "@/lib/site-contact-context";
import { waHref } from "@/lib/site-contact";

type FooterItem = { label: string; href: string };
type FooterColumn = { titleKey: string; items: FooterItem[] };

const FOOTER_STATIC_NAV: FooterColumn[] = [
  {
    titleKey: "footer.col.help",
    items: [
      { label: "footer.help.faq",      href: "/faq" },
      { label: "footer.help.delivery", href: "/faq#livraison" },
      { label: "footer.help.returns",  href: "/faq#retours" },
      { label: "footer.help.contact",  href: "/contact" },
    ],
  },
  {
    titleKey: "footer.col.about",
    items: [
      { label: "footer.about.story",     href: "/a-propos#notre-histoire" },
      { label: "nav.guides",             href: "/guides" },
      { label: "footer.about.favorites", href: "/favoris" },
      { label: "footer.about.cgv",       href: "/cgv" },
    ],
  },
];

const FOOTER_CATEGORY_LIMIT = 6;

// Brand-mark SVGs live in components/icons/social.tsx (Simple Icons,
// MIT-licensed). Lucide removed Facebook / Twitter as brand icons.
type Social = {
  label: string;
  Icon: React.ComponentType<React.SVGAttributes<SVGSVGElement>>;
  href: string;
};

export function Footer() {
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const { list: categoriesList } = useSiteCategories();
  const siteContact = useSiteContact();
  const year = new Date().getFullYear();

  const socials: Social[] = [
    { label: "Instagram", Icon: InstagramIcon, href: siteContact.social.instagram },
    { label: "Facebook",  Icon: FacebookIcon,  href: siteContact.social.facebook },
    { label: "TikTok",    Icon: TikTokIcon,    href: siteContact.social.tiktok },
    { label: "WhatsApp",  Icon: WhatsappIcon,  href: siteContact.whatsapp ? waHref(siteContact.whatsapp) : "" },
  ].filter((s) => s.href.length > 0);
  // Admin routes use their own chrome — hide the customer footer.
  if (pathname?.startsWith("/admin")) return null;

  const categoryItems: FooterItem[] = categoriesList
    .slice(0, FOOTER_CATEGORY_LIMIT)
    .map((c) => ({
      label: (lang === "ar" && c.nameAr) ? c.nameAr : c.nameFr,
      href: `/catalogue?category=${encodeURIComponent(c.slug)}`,
    }));

  const columns: FooterColumn[] = [
    { titleKey: "footer.col.catalogue", items: categoryItems },
    ...FOOTER_STATIC_NAV,
  ];
  return (
    <footer className="relative bg-forest-900 text-cream">
      {/* Hairline of tangerine at the top edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-tangerine-500/40 to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="md:col-span-4">
            <Link
              href="/"
              aria-label={t("brand.home")}
              className="inline-flex items-center gap-2.5"
            >
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-md bg-cream text-forest-900"
              >
                <Mountain className="size-5" strokeWidth={2} />
              </span>
              <span className="flex items-baseline font-display text-2xl font-bold tracking-[-0.04em]">
                BINGO
                <span
                  aria-hidden
                  className="ms-0.5 size-1.5 rounded-full bg-tangerine-400"
                />
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">
              {t("footer.tagline")}
            </p>

            {/* Social */}
            <ul className="mt-6 flex items-center gap-2">
              {socials.map(({ label, Icon, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-9 place-items-center rounded-full border border-cream/20 text-cream/75 transition-colors hover:border-tangerine-400 hover:text-tangerine-400"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Nav columns */}
          <nav
            aria-label={t("footer.aria")}
            className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-3"
          >
            {columns.map((col) => (
              <div key={col.titleKey}>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-tangerine-300">
                  {t(col.titleKey)}
                </p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-cream/80 transition-colors hover:text-tangerine-300"
                      >
                        {/* Static items pass an i18n key (e.g. "footer.help.faq")
                            that we resolve through t(); backend category items
                            pass an already-localized name. t() returns the key
                            unchanged when it's not in the catalogue, so a literal
                            name like "Tentes" just falls through. */}
                        {t(item.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-cream/15 pt-6 md:mt-16">
          <div className="flex flex-col gap-4 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
            <p>{t("footer.copyright", { year })}</p>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <li>
                <Link
                  href="/cgv"
                  className="transition-colors hover:text-cream"
                >
                  {t("footer.about.cgv")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Build credit — agency attribution. */}
          <p className="mt-6 flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-cream/5 px-4 py-2.5 text-center text-[13px] text-cream/80">
            {lang === "ar"
              ? "تصميم وتطوير الموقع من قبل"
              : "Site conçu et développé par"}
            <a
              href="https://dz-ecom.com/"
              target="_blank"
              rel="noopener"
              className="font-display font-bold tracking-wide text-tangerine-300 underline decoration-tangerine-400/50 underline-offset-4 transition-colors hover:text-tangerine-200 hover:decoration-tangerine-300"
            >
              dz-ecom.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
