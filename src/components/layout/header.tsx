"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Minus,
  Mountain,
  Package,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsappIcon,
} from "@/components/icons/social";
import { AUTH_ENABLED } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import {
  categoryHref,
  productHref,
  searchCatalogue,
  subCategoryHref,
} from "@/lib/catalogue";
import { type Product } from "@/lib/products";
import { useCart, type CartItem } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import {
  useFormatPrice,
  useLanguage,
  useProductName,
  type Language,
} from "@/lib/i18n";

/* Nav + strip items reference translation keys so they swap with the
   active language. The keys live in `src/lib/i18n.tsx`. */
const NAV_ITEMS = [
  { key: "nav.catalogue", href: "/catalogue" },
  { key: "nav.promotions", href: "/catalogue?promo=1" },
  { key: "nav.about", href: "/a-propos" },
  { key: "nav.contact", href: "/contact" },
] as const;

const STRIP_KEYS = [
  "strip.coords",
  "strip.shipping",
  "strip.guides",
  "strip.returns",
  "strip.reviews",
] as const;

export function Header() {
  const pathname = usePathname();
  // Admin routes have their own chrome — don't render the customer
  // header on top of them.
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const { t } = useLanguage();
  const { count: favoritesCount } = useFavorites();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isAdminRoute) return null;

  return (
    <header className="sticky top-0 z-50 isolate w-full">
      {/* ─── Top weather strip — hidden for now. Remove `hidden` to
              bring it back. ───────────────────────────────────────────── */}
      <div
        aria-hidden
        className={cn(
          "hidden overflow-hidden bg-forest-900 text-tangerine-200 transition-[max-height,opacity] duration-500 ease-out",
          scrolled ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
        )}
      >
        <div className="relative flex h-7 items-center">
          <div
            className="header-marquee-track flex shrink-0 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.22em]"
            style={{ animation: "header-strip-marquee 60s linear infinite" }}
          >
            {[...STRIP_KEYS, ...STRIP_KEYS, ...STRIP_KEYS, ...STRIP_KEYS].map(
              (key, i) => (
                <span key={i} className="flex shrink-0 items-center gap-6 px-6">
                  <span>{t(key)}</span>
                  <span aria-hidden className="text-tangerine-500">
                    ✦
                  </span>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* ─── Top info bar — contact info (left) + socials (right).
              Shown on every breakpoint; stays pinned with the header
              (no scroll-collapse). Location chip hides on narrow
              screens to keep the bar from wrapping. ──────────────── */}
      <div className="border-b border-forest-700/40 bg-forest-900 text-cream/80">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Contact (start) */}
          <ul className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] sm:gap-5 sm:text-[10.5px] sm:tracking-[0.18em]">
            <li>
              <a
                href="tel:+213673812896"
                dir="ltr"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-tangerine-300"
              >
                <Phone className="size-3" strokeWidth={2} />
                +213 673 81 28 96
              </a>
            </li>
            <li className="hidden md:block">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3" strokeWidth={2} />
                {t("header.address")}
              </span>
            </li>
          </ul>

          {/* Socials (end) */}
          <ul className="flex items-center gap-1">
            {[
              {
                label: "Instagram",
                Icon: InstagramIcon,
                href: "https://www.instagram.com/bingo_camping19/",
              },
              {
                label: "Facebook",
                Icon: FacebookIcon,
                href: "https://www.facebook.com/profile.php?id=100090231580510",
              },
              {
                label: "WhatsApp",
                Icon: WhatsappIcon,
                href: "https://wa.me/213673812896",
              },
            ].map(({ label, Icon, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-7 place-items-center rounded-full text-cream/70 transition-colors hover:bg-forest-700 hover:text-tangerine-300"
                >
                  <Icon className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── Main bar ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300",
          scrolled
            ? "border-wood-300/60 bg-cream/85 shadow-[0_1px_0_0_rgba(91,69,42,0.04),0_8px_24px_-12px_rgba(31,58,30,0.18)] backdrop-blur-md"
            : "border-transparent bg-cream"
        )}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tangerine-500/40 to-transparent"
        />

        <div className="group/bar mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-[72px] sm:gap-4 sm:px-6 lg:gap-6 lg:px-8">
          {/* Logo (left) */}
          <Link
            href="/"
            aria-label={t("brand.home")}
            className="group relative flex shrink-0 items-center gap-2"
          >
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-md bg-forest-900 text-cream transition-transform duration-500 group-hover:rotate-[-8deg]"
            >
              <Mountain className="size-4" strokeWidth={2.2} />
            </span>
            <span className="flex items-baseline font-display text-[22px] font-bold leading-none tracking-[-0.04em] text-forest-900 sm:text-[26px]">
              BINGO
              <span
                aria-hidden
                className="bingo-dot ms-0.5 size-1.5 rounded-full bg-tangerine-500 sm:size-[7px]"
                style={{ animation: "bingo-dot-pulse 3.2s ease-in-out infinite" }}
              />
            </span>
          </Link>

          {/* Nav — lg+ only, centered. Aggressively compact at lg (no
              dot, tight tracking, small text) so it survives the search
              input expanding to w-72 on focus; opens up at xl. */}
          <nav
            aria-label={t("nav.primary")}
            className="hidden flex-1 items-center justify-center lg:flex"
          >
            <ul className="flex items-center xl:gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      // French/LTR: smaller default; Arabic/RTL: keep the larger sizes.
                      "group/nav relative flex items-center whitespace-nowrap rounded-full px-1.5 py-1 font-display text-[10px] font-medium uppercase tracking-[0.02em] text-wood-800 rtl:text-[12px]",
                      "transition-[color,font-size,letter-spacing,padding] duration-300 ease-out",
                      "xl:gap-1.5 xl:px-3.5 xl:py-2 xl:text-[13px] xl:tracking-[0.18em] xl:rtl:text-[15px]",
                      // When any input in the main bar is focused (i.e. the
                      // search is open), shrink nav links so the expanded
                      // search input doesn't push them around.
                      "group-has-[input:focus]/bar:px-1 group-has-[input:focus]/bar:text-[9px] group-has-[input:focus]/bar:tracking-[0] rtl:group-has-[input:focus]/bar:text-[11px]",
                      "xl:group-has-[input:focus]/bar:px-2.5 xl:group-has-[input:focus]/bar:text-[11px] xl:group-has-[input:focus]/bar:tracking-[0.1em] xl:rtl:group-has-[input:focus]/bar:text-[13px]",
                      "hover:text-forest-900"
                    )}
                  >
                    <span
                      aria-hidden
                      className="hidden size-1 rounded-full bg-wood-400 transition-all duration-300 group-hover/nav:bg-tangerine-500 group-hover/nav:scale-150 xl:inline-block"
                    />
                    {t(item.key)}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-1.5 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-tangerine-500 transition-transform duration-500 ease-out rtl:origin-right group-hover/nav:scale-x-100 xl:inset-x-3.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Spacer when nav is hidden (mobile) so right cluster sits right */}
          <div className="flex-1 lg:hidden" />

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            {/* Desktop: search + language toggle live in the main bar */}
            <div className="hidden lg:block">
              <HeaderSearch inline />
            </div>
            <div className="hidden lg:block">
              <LanguageToggle />
            </div>

            <Link
              href="/favoris"
              aria-label={
                favoritesCount > 0
                  ? t("icon.wishlist.withCount", { n: favoritesCount })
                  : t("icon.wishlist")
              }
              className={cn(
                "group/icon relative hidden size-10 place-items-center rounded-full text-wood-800 lg:grid",
                "transition-[background-color,color,transform] duration-300",
                "hover:bg-wood-100 hover:text-forest-900",
                "active:scale-95 active:bg-tangerine-500/15",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              )}
            >
              <Heart
                className={cn(
                  "size-[18px] transition-colors duration-200",
                  favoritesCount > 0 && "text-tangerine-600"
                )}
                strokeWidth={1.8}
                fill={favoritesCount > 0 ? "currentColor" : "none"}
              />
              {favoritesCount > 0 ? (
                <span
                  aria-hidden
                  className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tangerine-500 px-1 font-mono text-[9px] font-bold leading-none text-cream ring-2 ring-cream group-hover/icon:ring-cream-deep"
                >
                  {favoritesCount}
                </span>
              ) : null}
            </Link>

            <AccountButton />

            {/* Mobile search trigger — opens the inline search panel
                below the main bar. */}
            <IconButton
              aria-label={t("search.aria")}
              aria-expanded={searchOpen}
              aria-controls="mobile-search-panel"
              onClick={() => setSearchOpen((s) => !s)}
              className="lg:hidden"
            >
              {searchOpen ? (
                <X className="size-[20px]" strokeWidth={1.8} />
              ) : (
                <Search className="size-[18px]" strokeWidth={1.8} />
              )}
            </IconButton>

            <HeaderCart />

            <IconButton
              aria-label={t("menu.open")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="size-[20px]" strokeWidth={1.8} />
            </IconButton>
          </div>
        </div>

        {/* ─── Mobile search panel — toggled by the search icon ─── */}
        {searchOpen ? (
          <div
            id="mobile-search-panel"
            className="border-t border-wood-300/40 bg-cream-deep/30 lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl items-center px-4 py-2.5 sm:px-6 sm:py-3">
              <div className="flex min-w-0 flex-1">
                <HeaderSearch autoFocus onSelect={() => setSearchOpen(false)} />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

/* ─── Language toggle — segmented [FR | AR] pill ───────────────── */
function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  const options: Array<{ value: Language; label: string }> = [
    { value: "fr", label: "FR" },
    { value: "ar", label: "AR" },
  ];

  return (
    <div
      role="group"
      aria-label={t("lang.toggleAria")}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-full border border-wood-300/70 bg-cream p-0.5 shadow-[0_1px_0_0_rgba(91,69,42,0.04)]",
        className
      )}
    >
      {options.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            className={cn(
              "h-full rounded-full px-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em]",
              "transition-colors duration-300 ease-out",
              active
                ? "bg-forest-900 text-cream shadow-[0_2px_8px_-2px_rgba(31,58,30,0.4)]"
                : "text-wood-700 hover:text-forest-900"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Header search — input + anchored dropdown panel showing
       catégories / sous-catégories / produits, filtered live.

       Variants:
       - default (fluid)  — full-width input, dropdown spans the parent
                            (used in the mobile sub-row).
       - inline           — fixed-width input that expands on focus,
                            dropdown anchored end with fixed width
                            (used in the desktop main bar). */
function HeaderSearch({
  inline = false,
  autoFocus = false,
  onSelect,
}: {
  inline?: boolean;
  autoFocus?: boolean;
  onSelect?: () => void;
}) {
  const { t } = useLanguage();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // When mounted via the mobile search panel, focus the input so the
  // user can start typing immediately.
  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const trimmedQuery = query.trim();
  const results = React.useMemo(
    () => searchCatalogue(trimmedQuery),
    [trimmedQuery]
  );
  const hasResults =
    results.categories.length +
      results.subCategories.length +
      results.products.length >
    0;

  // Dropdown only appears when the user has actually typed something.
  // Focusing the empty input no longer pops it open.
  const panelOpen = open && trimmedQuery.length > 0;

  const close = React.useCallback(() => {
    setOpen(false);
    inputRef.current?.blur();
    onSelect?.();
  }, [onSelect]);

  React.useEffect(() => {
    if (!panelOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen, close]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        inline
          ? "w-56 focus-within:w-72 transition-[width] duration-500 ease-out"
          : "w-full"
      )}
    >
      <label className="group/search relative flex w-full items-center">
        <Search
          className="pointer-events-none absolute start-3 size-4 text-wood-600 transition-colors group-focus-within/search:text-tangerine-600 lg:size-3.5"
          strokeWidth={2}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={
            inline ? t("search.placeholderShort") : t("search.placeholder")
          }
          aria-label={t("search.aria")}
          aria-expanded={panelOpen}
          aria-controls="header-search-results"
          className={cn(
            "w-full rounded-full border border-wood-300/70 bg-cream ps-9 pe-3 font-mono uppercase tracking-[0.16em] text-wood-800 placeholder:text-wood-500/80",
            "transition-[background-color,border-color,box-shadow] duration-300 ease-out",
            "hover:border-wood-400",
            "focus:border-tangerine-500 focus:outline-none focus:ring-4 focus:ring-tangerine-500/15",
            inline ? "h-9 text-[11px]" : "h-10 text-[12px]"
          )}
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute end-2.5 hidden h-5 select-none items-center justify-center rounded-sm border border-wood-300/70 bg-cream-deep px-1.5 font-mono text-[9px] uppercase tracking-widest text-wood-600 group-focus-within/search:opacity-0 xl:flex"
        >
          ⌘ K
        </kbd>
      </label>

      {panelOpen ? (
        <div
          id="header-search-results"
          role="listbox"
          className={cn(
            "absolute inset-x-0 top-full z-50 mt-2 w-full overflow-hidden",
            "rounded-xl border border-wood-300/70 bg-cream",
            "shadow-[0_18px_36px_-14px_rgba(31,58,30,0.28)]"
          )}
        >
          {/* Sticky query summary */}
          <div className="flex items-center justify-between gap-2 border-b border-wood-300/40 bg-cream-deep/40 px-3 py-2">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-wood-600">
              {hasResults
                ? t("search.results.count", {
                    n:
                      results.categories.length +
                      results.subCategories.length +
                      results.products.length,
                  })
                : t("search.results.none")}
            </span>
            <span className="truncate font-mono text-[9.5px] text-tangerine-700">
              « {trimmedQuery} »
            </span>
          </div>

          <div className="bingo-scrollbar max-h-[60vh] overflow-y-auto p-1.5">
            {!hasResults ? (
              <div className="px-3 py-6 text-center">
                <p className="font-display text-[13px] font-semibold text-forest-900">
                  {t("search.notFound.title")}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-wood-600">
                  {t("search.notFound.hint")}
                </p>
              </div>
            ) : (
              <>
                <SearchGroup
                  label={t("search.categories")}
                  count={results.categories.length}
                  layout="list"
                >
                  {results.categories.slice(0, 6).map((c) => (
                    <SearchRow
                      key={c.slug}
                      href={categoryHref(c.slug)}
                      onClick={close}
                      image={c.image}
                      title={c.name}
                      meta={`${c.productCount} ${t("search.products").toLowerCase()}`}
                    />
                  ))}
                </SearchGroup>

                <SearchGroup
                  label={t("search.subCategories")}
                  count={results.subCategories.length}
                  layout="chips"
                >
                  {results.subCategories.slice(0, 8).map((s) => (
                    <SearchChip
                      key={`${s.parentSlug}/${s.slug}`}
                      href={subCategoryHref(s)}
                      onClick={close}
                      label={s.name}
                    />
                  ))}
                </SearchGroup>

                <SearchGroup
                  label={t("search.products")}
                  count={results.products.length}
                  layout="list"
                >
                  {results.products.slice(0, 6).map((p) => (
                    <SearchRow
                      key={p.slug}
                      href={productHref(p.slug)}
                      onClick={close}
                      image={p.image}
                      title={productName(p)}
                      meta={`${p.brand} · ${formatPrice(p.price)}`}
                    />
                  ))}
                </SearchGroup>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({
  label,
  count,
  layout,
  children,
}: {
  label: string;
  count: number;
  layout: "list" | "chips";
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="mb-1 last:mb-0">
      <p className="px-2.5 pb-1 pt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-wood-500">
        {label}
      </p>
      {layout === "chips" ? (
        <div className="flex flex-wrap gap-1 px-2 pb-1">{children}</div>
      ) : (
        <ul>{children}</ul>
      )}
    </section>
  );
}

function SearchRow({
  href,
  onClick,
  image,
  title,
  meta,
}: {
  href: string;
  onClick: () => void;
  image: string;
  title: string;
  meta: string;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "group/row flex items-center gap-2.5 rounded-md px-2 py-1.5",
          "transition-colors hover:bg-cream-deep/70 focus-visible:bg-cream-deep/70 focus-visible:outline-none"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          aria-hidden
          loading="lazy"
          className="size-9 shrink-0 rounded-md object-cover ring-1 ring-wood-300/60"
        />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate font-display text-[12.5px] font-medium text-forest-900 group-hover/row:text-tangerine-700">
            {title}
          </span>
          <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-wood-600">
            {meta}
          </span>
        </span>
      </Link>
    </li>
  );
}

function SearchChip({
  href,
  onClick,
  label,
}: {
  href: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border border-wood-300/70 bg-cream px-2 py-0.5",
        "font-mono text-[9.5px] uppercase tracking-[0.14em] text-wood-800",
        "transition-colors hover:border-tangerine-500 hover:text-forest-900"
      )}
    >
      {label}
    </Link>
  );
}

/* ─── Mobile menu — slide-in panel ─────────────────────────────── */
function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { customer, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const menu = (
    <div
      id="mobile-menu"
      className={cn(
        "fixed inset-0 z-[70] overflow-hidden lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label={t("menu.close")}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={cn(
          "absolute inset-0 bg-forest-950/60 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("menu.dialog")}
        className={cn(
          "absolute inset-y-0 start-0 flex w-[min(85vw,360px)] flex-col bg-cream shadow-[0_-8px_60px_-12px_rgba(31,58,30,0.4)]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-wood-300/40 px-5 py-4">
          <Link
            href="/"
            onClick={onClose}
            aria-label={t("brand.home")}
            className="flex items-center gap-2"
          >
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-md bg-forest-900 text-cream"
            >
              <Mountain className="size-4" strokeWidth={2.2} />
            </span>
            <span className="flex items-baseline font-display text-[20px] font-bold leading-none tracking-[-0.04em] text-forest-900">
              BINGO
              <span
                aria-hidden
                className="ms-0.5 size-1.5 rounded-full bg-tangerine-500"
              />
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("menu.close")}
            className={cn(
              "grid size-10 place-items-center rounded-full text-wood-800",
              "transition-colors hover:bg-wood-100 hover:text-forest-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500/40"
            )}
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </header>

        {/* Language toggle — pinned at the top of the menu */}
        <div className="flex border-b border-wood-300/40 px-5 py-3">
          <LanguageToggle />
        </div>

        <nav
          aria-label={t("nav.primary")}
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group/menu flex items-center justify-between rounded-xl px-3 py-3",
                    "font-display text-[15px] font-medium text-forest-900",
                    "transition-colors hover:bg-cream-deep/70 focus-visible:bg-cream-deep/70 focus-visible:outline-none"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-wood-400 transition-colors group-hover/menu:bg-tangerine-500"
                    />
                    {t(item.key)}
                  </span>
                  <ArrowRight
                    className="size-4 text-wood-500 transition-transform group-hover/menu:translate-x-0.5 rtl:rotate-180"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-wood-300/40 pt-4">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-tangerine-700">
              {t("menu.mySpace")}
            </p>
            {AUTH_ENABLED && customer ? (
              <div className="mb-2 flex items-center gap-3 rounded-xl bg-cream-deep/40 px-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-900 text-cream font-display text-sm font-bold">
                  {(customer.firstName?.[0] ?? customer.email?.[0] ?? "?").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[13px] font-semibold text-forest-900">
                    {t("account.greeting", { name: customer.firstName })}
                  </p>
                  <p className="truncate font-mono text-[10px] text-wood-600">
                    {customer.email}
                  </p>
                </div>
              </div>
            ) : null}
            <ul className="flex flex-col gap-1">
              {AUTH_ENABLED ? (
                customer ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        void logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start font-display text-[14px] text-tangerine-700 transition-colors hover:bg-cream-deep/70"
                    >
                      <LogOut className="size-[18px] rtl:rotate-180" strokeWidth={1.8} />
                      {t("account.logout")}
                    </button>
                  </li>
                ) : (
                  <li>
                    <Link
                      href="/login"
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-[14px] text-wood-800 transition-colors hover:bg-cream-deep/70 hover:text-forest-900"
                    >
                      <User className="size-[18px]" strokeWidth={1.8} />
                      {t("menu.account")}
                    </Link>
                  </li>
                )
              ) : null}
              <li>
                <Link
                  href="/favoris"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-[14px] text-wood-800 transition-colors hover:bg-cream-deep/70 hover:text-forest-900"
                >
                  <Heart className="size-[18px]" strokeWidth={1.8} />
                  {t("menu.wishlist")}
                </Link>
              </li>
            </ul>
          </div>
        </nav>

      </aside>
    </div>
  );

  return mounted ? createPortal(menu, document.body) : null;
}

/* ─── Header cart — icon button + slide-in side drawer.
       Cart state lives in the shared `CartProvider` (lib/cart.tsx) so
       any component (product details, etc.) can call `useCart().addItem`
       and the drawer updates in lock-step. ───────────────────────── */
function HeaderCart() {
  const { t } = useLanguage();
  const formatPrice = useFormatPrice();
  const { items, itemCount, subtotal, updateQty, removeItem } = useCart();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Portal target needs the DOM, so mount-gate it for SSR safety
  React.useEffect(() => setMounted(true), []);

  // Lock body scroll + ESC handler while drawer is open
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drawer = (
    <div
      id="header-cart-drawer"
      className={cn(
        "fixed inset-0 z-[80] overflow-hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t("menu.close")}
        onClick={() => setOpen(false)}
        tabIndex={open ? 0 : -1}
        className={cn(
          "absolute inset-0 bg-forest-950/60 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Panel — always slides in from the physical right edge,
          regardless of language direction. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.title")}
        className={cn(
          "absolute inset-y-0 right-0 flex w-[min(92vw,420px)] flex-col bg-cream shadow-[0_-8px_60px_-12px_rgba(31,58,30,0.4)]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-wood-300/40 bg-cream-deep/40 px-5 py-4">
          <div className="flex items-baseline gap-3">
            <h3 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-forest-900">
              {t("cart.title")}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-wood-600">
              {itemCount} {t("cart.items")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("menu.close")}
            className={cn(
              "grid size-10 place-items-center rounded-full text-wood-800",
              "transition-colors hover:bg-wood-100 hover:text-forest-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500/40"
            )}
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
            <style>{`
              .cart-fire { transform-origin: center bottom; animation: cart-fire-flicker 380ms ease-in-out infinite; }
              @keyframes cart-fire-flicker {
                0%, 100% { transform: scale(1, 1)       rotate(0deg);   }
                25%      { transform: scale(0.93, 1.10) rotate(-2deg);  }
                50%      { transform: scale(1.06, 0.94) rotate(1.5deg); }
                75%      { transform: scale(0.97, 1.05) rotate(-1deg);  }
              }
              .cart-smoke   { animation: cart-smoke-rise 3.6s ease-out infinite; opacity: 0; transform-origin: center bottom; }
              .cart-smoke-1 { animation-delay: 0.0s; }
              .cart-smoke-2 { animation-delay: 1.2s; }
              .cart-smoke-3 { animation-delay: 2.4s; }
              @keyframes cart-smoke-rise {
                0%   { opacity: 0;    transform: translate(0,0)          scale(0.35); }
                20%  { opacity: 0.6;  }
                70%  { opacity: 0.3;  }
                100% { opacity: 0;    transform: translate(-14px,-100px) scale(1.8);  }
              }
              .cart-ember   { animation: cart-ember-rise 2.4s ease-out infinite; opacity: 0; }
              .cart-ember-1 { animation-delay: 0.4s; }
              .cart-ember-2 { animation-delay: 1.4s; }
              @keyframes cart-ember-rise {
                0%   { opacity: 0;    transform: translate(0,0); }
                15%  { opacity: 0.95; }
                70%  { opacity: 0.45; }
                100% { opacity: 0;    transform: translate(-6px,-52px); }
              }
              .cart-empty-content {
                animation: cart-empty-drop-in 700ms cubic-bezier(0.34,1.5,0.64,1) backwards;
              }
              @keyframes cart-empty-drop-in {
                from { opacity: 0; transform: translateY(-24px); }
                to   { opacity: 1; transform: translateY(0);     }
              }
            `}</style>

            {/* Blurred fire + rising smoke backdrop */}
            <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
              <svg
                viewBox="0 0 200 200"
                className="size-56 opacity-70 blur-[6px]"
                fill="none"
              >
                {/* Smoke — emerges from the flame tip (y≈118) and rises */}
                <g fill="#9c7e48">
                  <ellipse className="cart-smoke cart-smoke-1" cx="100" cy="118" rx="10" ry="6" />
                  <ellipse className="cart-smoke cart-smoke-2" cx="96"  cy="118" rx="11" ry="7" />
                  <ellipse className="cart-smoke cart-smoke-3" cx="103" cy="118" rx="9"  ry="6" />
                </g>

                {/* Embers */}
                <g fill="#ed8a3c">
                  <circle className="cart-ember cart-ember-1" cx="102" cy="124" r="1.6" />
                  <circle className="cart-ember cart-ember-2" cx="98"  cy="124" r="1.3" />
                </g>

                {/* Logs */}
                <line x1="76"  y1="160" x2="124" y2="152" stroke="#5b452a" strokeWidth="4" strokeLinecap="round" />
                <line x1="76"  y1="152" x2="124" y2="160" stroke="#7a6035" strokeWidth="4" strokeLinecap="round" />

                {/* Flame */}
                <g className="cart-fire">
                  <path
                    d="M 100 162 C 84 148, 84 128, 92 116 C 97 123, 102 125, 105 119 C 108 112, 111 105, 116 117 C 121 131, 113 148, 100 162 Z"
                    fill="#ed8a3c"
                    opacity="0.92"
                  />
                  <path
                    d="M 100 158 C 91 148, 91 134, 96 128 C 99 131, 102 132, 103 129 C 105 124, 107 119, 110 127 C 113 137, 108 148, 100 158 Z"
                    fill="#fac38a"
                    opacity="0.95"
                  />
                </g>
              </svg>
            </div>

            {/* Foreground — icon + text, drops in from above */}
            <div className="cart-empty-content relative flex flex-col items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-cream ring-1 ring-wood-300/50 shadow-[0_8px_22px_-6px_rgba(31,58,30,0.25)]">
                <ShoppingBag className="size-5 text-wood-600" strokeWidth={1.8} />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-wood-700">
                {t("cart.empty")}
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-wood-300/40">
            {items.map((item) => (
              <CartLine
                key={item.product.slug}
                item={item}
                onIncrement={() => updateQty(item.product.slug, 1)}
                onDecrement={() => updateQty(item.product.slug, -1)}
                onRemove={() => removeItem(item.product.slug)}
              />
            ))}
          </ul>
        )}

        {items.length > 0 ? (
          <footer className="border-t border-wood-300/40 bg-cream-deep/30 px-5 py-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-wood-600">
                {t("cart.subtotal")}
              </span>
              <span className="font-display text-[20px] font-bold tracking-[-0.01em] text-forest-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/panier"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex-1 rounded-full border border-wood-300/80 bg-cream px-3 py-2.5 text-center",
                  "font-display text-[12px] font-medium uppercase tracking-[0.14em] text-forest-900",
                  "transition-colors hover:border-forest-900 hover:bg-cream-deep"
                )}
              >
                {t("cart.view")}
              </Link>
              <Link
                href="/commander"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex-1 rounded-full bg-forest-900 px-3 py-2.5 text-center",
                  "font-display text-[12px] font-medium uppercase tracking-[0.14em] text-cream",
                  "transition-colors hover:bg-forest-950"
                )}
              >
                {t("cart.checkout")}
              </Link>
            </div>
          </footer>
        ) : null}
      </aside>
    </div>
  );

  return (
    <>
      <IconButton
        aria-label={
          itemCount > 0
            ? t("icon.cart.withCount", { n: itemCount })
            : t("icon.cart")
        }
        aria-expanded={open}
        aria-controls="header-cart-drawer"
        onClick={() => setOpen(true)}
        className="header-cart-bounce"
        style={{ animation: "header-cart-bounce 7s ease-in-out infinite" }}
      >
        <ShoppingBag className="size-[18px]" strokeWidth={1.8} />
        {itemCount > 0 ? (
          <span
            aria-hidden
            className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tangerine-500 px-1 font-mono text-[9px] font-bold leading-none text-cream ring-2 ring-cream group-hover/icon:ring-cream-deep"
          >
            {itemCount}
          </span>
        ) : null}
      </IconButton>

      {/* Portalled to <body> so it escapes the header's `isolate z-50`
          stacking context and renders above all page content */}
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}

function CartLine({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  const { product, qty } = item;
  const lineTotal = product.price * qty;
  const displayName = productName(product);

  return (
    <li className="flex gap-3 px-3 py-3">
      {/* Thumb */}
      <Link
        href={productHref(product.slug)}
        className="shrink-0"
        aria-label={displayName}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          aria-hidden
          loading="lazy"
          className="size-16 rounded-md object-cover ring-1 ring-wood-300/60"
        />
      </Link>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={productHref(product.slug)}
          className="truncate font-display text-[13px] font-medium leading-tight text-forest-900 hover:text-tangerine-700 rtl:mb-1 rtl:leading-[1.4]"
        >
          {displayName}
        </Link>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-wood-600">
          {product.categorySlug
            ? t(`category.${product.categorySlug}`)
            : product.brand}
        </span>

        {/* Qty stepper */}
        <div className="mt-2 inline-flex items-center self-start rounded-full border border-wood-300/70 bg-cream">
          <button
            type="button"
            onClick={onDecrement}
            aria-label={t("cart.decrease")}
            className="grid size-6 place-items-center rounded-full text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900"
          >
            <Minus className="size-3" strokeWidth={2.2} />
          </button>
          <span
            aria-label={t("cart.qty")}
            className="min-w-5 px-1 text-center font-mono text-[11px] font-medium text-forest-900"
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            aria-label={t("cart.increase")}
            className="grid size-6 place-items-center rounded-full text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900"
          >
            <Plus className="size-3" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Trail: price + remove */}
      <div className="flex shrink-0 flex-col items-end justify-between">
        <span className="font-display text-[13px] font-semibold text-forest-900">
          {formatPrice(lineTotal)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("cart.remove")}
          className="grid size-7 place-items-center rounded-full text-wood-500 transition-colors hover:bg-wood-100 hover:text-tangerine-700"
        >
          <Trash2 className="size-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </li>
  );
}

/* ─── Account button — User icon when logged out, initial-circle +
       dropdown when logged in. Desktop only (lg+); the mobile menu has
       its own equivalent (see MobileMenu). ─────────────────────────── */
function AccountButton() {
  const { t } = useLanguage();
  const { customer, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Auth UI hidden until the backend is available — see AUTH_ENABLED
  // in @/lib/api-client.
  if (!AUTH_ENABLED) return null;

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!customer) {
    return (
      <Link
        href="/login"
        aria-label={t("icon.account")}
        className={cn(
          "group/icon relative hidden size-10 place-items-center rounded-full text-wood-800 lg:grid",
          "transition-[background-color,color,transform] duration-300",
          "hover:bg-wood-100 hover:text-forest-900",
          "active:scale-95 active:bg-tangerine-500/15",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        )}
      >
        <User className="size-[18px]" strokeWidth={1.8} />
      </Link>
    );
  }

  const initial = (customer.firstName?.[0] ?? customer.email?.[0] ?? "?").toUpperCase();
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("account.menu.aria")}
        className={cn(
          "grid size-10 place-items-center rounded-full bg-forest-900 text-cream",
          "font-display text-sm font-bold tracking-tight",
          "transition-all duration-200 hover:bg-forest-700",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        )}
      >
        {initial}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-wood-300/70 bg-cream shadow-[0_18px_40px_-14px_rgba(31,58,30,0.3)]"
        >
          {/* Greeting block */}
          <div className="border-b border-wood-300/40 bg-cream-deep/30 px-4 py-3">
            <p className="font-display text-[13px] font-semibold text-forest-900">
              {t("account.greeting", { name: customer.firstName })}
            </p>
            <p className="mt-0.5 truncate font-mono text-[10.5px] text-wood-600">
              {customer.email}
            </p>
          </div>

          <ul className="py-1.5">
            <li>
              <Link
                href="/favoris"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 font-display text-[13px] text-forest-900 transition-colors hover:bg-cream-deep/60"
              >
                <Heart className="size-4" strokeWidth={1.8} />
                {t("icon.wishlist")}
              </Link>
            </li>
            <li>
              <Link
                href="/commander"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 font-display text-[13px] text-forest-900 transition-colors hover:bg-cream-deep/60"
              >
                <Package className="size-4" strokeWidth={1.8} />
                {t("account.orders")}
              </Link>
            </li>
            <li className="my-1 border-t border-wood-300/40" />
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-start font-display text-[13px] text-tangerine-700 transition-colors hover:bg-cream-deep/60"
              >
                <LogOut className="size-4 rtl:rotate-180" strokeWidth={1.8} />
                {t("account.logout")}
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
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
