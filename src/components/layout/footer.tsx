import * as React from "react";
import Link from "next/link";
import { Mountain } from "lucide-react";

import {
  FacebookIcon,
  InstagramIcon,
  WhatsappIcon,
} from "@/components/icons/social";

type FooterColumn = {
  title: string;
  items: { label: string; href: string }[];
};

const FOOTER_NAV: FooterColumn[] = [
  {
    title: "Catalogue",
    items: [
      { label: "Tentes", href: "/catalogue?category=tentes" },
      { label: "Sacs à dos", href: "/catalogue?category=sacs-a-dos" },
      { label: "Chaussures", href: "/catalogue?category=chaussures" },
      { label: "Éclairage", href: "/catalogue?category=eclairage" },
      { label: "Navigation", href: "/catalogue?category=navigation" },
      { label: "Campement", href: "/catalogue?category=campement" },
    ],
  },
  {
    title: "Aide",
    items: [
      { label: "FAQ", href: "/faq" },
      { label: "Livraison", href: "/faq#livraison" },
      { label: "Retours", href: "/faq#retours" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "À propos",
    items: [
      { label: "Notre histoire", href: "/a-propos#notre-histoire" },
      { label: "Favoris", href: "/favoris" },
      { label: "CGV", href: "/cgv" },
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
  const year = new Date().getFullYear();
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
              aria-label="BINGO — accueil"
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
              Matériel d&apos;aventure indépendant, sélectionné et testé
              sur le terrain depuis Sétif.
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
            aria-label="Pied de page"
            className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-3"
          >
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-tangerine-300">
                  {col.title}
                </p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-cream/80 transition-colors hover:text-tangerine-300"
                      >
                        {item.label}
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
          <p>© {year} BINGO Camping · Sétif, Algérie</p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <li>
              <Link
                href="/cgv"
                className="transition-colors hover:text-cream"
              >
                CGV
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
