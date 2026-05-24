"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain } from "lucide-react";

import {
  FacebookIcon,
  InstagramIcon,
  WhatsappIcon,
} from "@/components/icons/social";
import { useLanguage } from "@/lib/i18n";

type FooterColumn = {
  titleKey: string;
  items: { labelKey: string; href: string }[];
};

const FOOTER_NAV: FooterColumn[] = [
  {
    titleKey: "footer.col.catalogue",
    items: [
      { labelKey: "category.tentes",           href: "/catalogue?category=tentes" },
      { labelKey: "category.sacs-a-dos",       href: "/catalogue?category=sacs-a-dos" },
      { labelKey: "category.chaussures",       href: "/catalogue?category=chaussures" },
      { labelKey: "category.eclairage",        href: "/catalogue?category=eclairage" },
      { labelKey: "category.navigation",       href: "/catalogue?category=navigation" },
      { labelKey: "category.campement",        href: "/catalogue?category=campement" },
    ],
  },
  {
    titleKey: "footer.col.help",
    items: [
      { labelKey: "footer.help.faq",      href: "/faq" },
      { labelKey: "footer.help.delivery", href: "/faq#livraison" },
      { labelKey: "footer.help.returns",  href: "/faq#retours" },
      { labelKey: "footer.help.contact",  href: "/contact" },
    ],
  },
  {
    titleKey: "footer.col.about",
    items: [
      { labelKey: "footer.about.story",     href: "/a-propos#notre-histoire" },
      { labelKey: "footer.about.favorites", href: "/favoris" },
      { labelKey: "footer.about.cgv",       href: "/cgv" },
    ],
  },
];

// Brand-mark SVGs live in components/icons/social.tsx (Simple Icons,
// MIT-licensed). Lucide removed Facebook / Twitter as brand icons.
type Social = {
  label: string;
  Icon: React.ComponentType<React.SVGAttributes<SVGSVGElement>>;
  href: string;
};

const SOCIAL: Social[] = [
  { label: "Instagram", Icon: InstagramIcon, href: "https://www.instagram.com/bingo_camping19/" },
  { label: "Facebook",  Icon: FacebookIcon,  href: "https://www.facebook.com/profile.php?id=100090231580510" },
  { label: "WhatsApp",  Icon: WhatsappIcon,  href: "https://wa.me/213673812896" },
];

export function Footer() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  // Admin routes use their own chrome — hide the customer footer.
  if (pathname?.startsWith("/admin")) return null;
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
              {SOCIAL.map(({ label, Icon, href }) => (
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
            {FOOTER_NAV.map((col) => (
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
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-cream/15 pt-6 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between md:mt-16">
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
      </div>
    </footer>
  );
}
