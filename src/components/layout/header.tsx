"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  Heart,
  Mountain,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Matériel", href: "/materiel" },
  { label: "Comparer", href: "/comparer" },
  { label: "Offres", href: "/offres" },
  { label: "Journal", href: "/journal" },
] as const;

const STRIP_ITEMS = [
  "36.2°N · 5.4°E · SÉTIF",
  "LIVRAISON GRATUITE DÈS 12 000 DA",
  "GUIDES D'AUTOMNE — EN LIGNE",
  "RETOURS 30 JOURS",
  "AVIS INDÉPENDANTS DEPUIS 2025",
] as const;

export function Header() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 isolate w-full">
      {/* ─── Top weather strip ──────────────────────────────────────────
          A field-journal coord ribbon. Marquees slowly across the page,
          collapses to nothing once the user scrolls past 24 px. */}
      <div
        aria-hidden
        className={cn(
          "overflow-hidden bg-forest-900 text-tangerine-200 transition-[max-height,opacity] duration-500 ease-out",
          scrolled ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
        )}
      >
        <div className="relative flex h-7 items-center">
          <div
            className="header-marquee-track flex shrink-0 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.22em]"
            style={{
              animation: "header-strip-marquee 60s linear infinite",
            }}
          >
            {/* Duplicate twice for seamless loop */}
            {[...STRIP_ITEMS, ...STRIP_ITEMS, ...STRIP_ITEMS, ...STRIP_ITEMS].map(
              (item, i) => (
                <span
                  key={i}
                  className="flex shrink-0 items-center gap-6 px-6"
                >
                  <span>{item}</span>
                  <span aria-hidden className="text-tangerine-500">
                    ✦
                  </span>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* ─── Main bar ───────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300",
          scrolled
            ? "border-wood-300/60 bg-cream/85 shadow-[0_1px_0_0_rgba(91,69,42,0.04),0_8px_24px_-12px_rgba(31,58,30,0.18)] backdrop-blur-md"
            : "border-transparent bg-cream"
        )}
      >
        {/* Hairline of tangerine across the top edge */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tangerine-500/40 to-transparent"
        />

        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:h-[72px] sm:px-6 lg:px-8">
          {/* ─── Logo ──────────────────────────────────────────────── */}
          <Link
            href="/"
            aria-label="BINGO — accueil"
            className="group relative flex items-center gap-2"
          >
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-md bg-forest-900 text-cream transition-transform duration-500 group-hover:rotate-[-8deg]"
            >
              <Mountain className="size-4" strokeWidth={2.2} />
            </span>
            <span className="flex items-baseline font-display text-[24px] font-bold leading-none tracking-[-0.04em] text-forest-900 sm:text-[26px]">
              BINGO
              <span
                aria-hidden
                className="bingo-dot ms-0.5 size-1.5 rounded-full bg-tangerine-500 sm:size-[7px]"
                style={{ animation: "bingo-dot-pulse 3.2s ease-in-out infinite" }}
              />
            </span>
          </Link>

          {/* ─── Nav ───────────────────────────────────────────────── */}
          <nav
            aria-label="Navigation principale"
            className="hidden flex-1 items-center justify-center md:flex"
          >
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group/nav relative flex items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-[13px] font-medium uppercase tracking-[0.18em] text-wood-800 transition-colors duration-300",
                      "hover:text-forest-900"
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-1 rounded-full bg-wood-400 transition-all duration-300 group-hover/nav:bg-tangerine-500 group-hover/nav:scale-150"
                    />
                    {item.label}
                    {/* Sliding underline */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-3.5 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-tangerine-500 transition-transform duration-500 ease-out group-hover/nav:scale-x-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ─── Search (md+) ──────────────────────────────────────── */}
          <div className="hidden lg:flex">
            <label className="group/search relative flex items-center">
              <Search
                className="pointer-events-none absolute start-3 size-3.5 text-wood-600 transition-colors group-focus-within/search:text-tangerine-600"
                strokeWidth={2}
              />
              <input
                type="search"
                placeholder="Rechercher du matériel…"
                aria-label="Rechercher du matériel"
                className={cn(
                  "h-9 w-44 rounded-full border border-wood-300/70 bg-cream-deep/60 ps-9 pe-3 font-mono text-[11px] uppercase tracking-[0.16em] text-wood-800 placeholder:text-wood-500/80",
                  "transition-[width,background-color,border-color,box-shadow] duration-500 ease-out",
                  "hover:border-wood-400 hover:bg-cream-deep",
                  "focus:w-64 focus:border-tangerine-500 focus:bg-cream focus:outline-none focus:ring-4 focus:ring-tangerine-500/15"
                )}
              />
              <kbd
                aria-hidden
                className="pointer-events-none absolute end-2.5 hidden h-5 select-none items-center justify-center rounded-sm border border-wood-300/70 bg-cream px-1.5 font-mono text-[9px] uppercase tracking-widest text-wood-600 group-focus-within/search:opacity-0 xl:flex"
              >
                ⌘ K
              </kbd>
            </label>
          </div>

          {/* ─── Icon cluster ──────────────────────────────────────── */}
          <div className="ms-auto flex items-center md:ms-0">
            {/* Search icon — mobile/tablet only */}
            <IconButton
              aria-label="Rechercher du matériel"
              className="lg:hidden"
            >
              <Search className="size-[18px]" strokeWidth={1.8} />
            </IconButton>

            <IconButton aria-label="Liste de souhaits, 0 articles">
              <Heart className="size-[18px]" strokeWidth={1.8} />
            </IconButton>

            <IconButton aria-label="Mon compte">
              <User className="size-[18px]" strokeWidth={1.8} />
            </IconButton>

            <IconButton
              aria-label="Panier, 2 articles"
              className="header-cart-bounce"
              style={{ animation: "header-cart-bounce 7s ease-in-out infinite" }}
            >
              <ShoppingBag className="size-[18px]" strokeWidth={1.8} />
              <span
                aria-hidden
                className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tangerine-500 px-1 font-mono text-[9px] font-bold leading-none text-cream ring-2 ring-cream group-hover/icon:ring-cream-deep"
              >
                2
              </span>
            </IconButton>

            {/* Vertical separator */}
            <div
              aria-hidden
              className="mx-1 hidden h-6 w-px bg-wood-300/70 sm:block"
            />

            {/* Locale switcher — desktop only, mono style */}
            <button
              type="button"
              className="hidden h-9 items-center gap-1 rounded-full px-2.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900 sm:flex"
              aria-label="Changer de région : Algérie, Français"
            >
              <span className="inline-block size-1.5 rounded-full bg-forest-500" />
              DZ · FR
              <ChevronDown className="size-3 opacity-70" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Icon button — soft hover pill, tangerine wash on press ────── */
function IconButton({
  className,
  children,
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "group/icon relative grid size-10 place-items-center rounded-full text-wood-800",
        "transition-[background-color,color,transform] duration-300",
        "hover:bg-wood-100 hover:text-forest-900",
        "active:scale-95 active:bg-tangerine-500/15",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
