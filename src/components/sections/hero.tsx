"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useFormatPrice, useLanguage, useProductName } from "@/lib/i18n";
import { useSiteHome } from "@/lib/site-home-context";
import type { HeroSlot } from "@/lib/site-home";

/**
 * BINGO hero — animated tipi camp, BINGO wordmark centered, scroll cue.
 *
 * Mobile-resilience pattern:
 *   - Default CSS state for every element is its FINAL, fully-visible
 *     state (so if a browser refuses to honor animations, the page
 *     still renders correctly — Oppo/HeytapBrowser/etc.).
 *   - Animations are gated behind `.hero-mounted` which is added via
 *     JS after the first paint. Inside each @keyframes block we
 *     explicitly declare `from { hidden }` and use
 *     `animation-fill-mode: backwards`, so the from-state is only
 *     applied during the animation's delay window.
 */
export function Hero() {
  const { t, lang } = useLanguage();
  const home = useSiteHome();
  const [mounted, setMounted] = React.useState(false);

  // Hero piles render every slot the admin filled in /admin/banners —
  // products AND categories. Empty / missing-target slots are dropped
  // upstream. With 0 picks the pile block is omitted entirely.
  const adminPicks = home.featuredSlots;

  React.useEffect(() => {
    const id1 = window.requestAnimationFrame(() => {
      const id2 = window.requestAnimationFrame(() => setMounted(true));
      void id2;
    });
    return () => window.cancelAnimationFrame(id1);
  }, []);

  // Promo block — admin copy wins per field; i18n fallback when empty.
  const promoSlogan =
    (lang === "ar" ? home.promo.titleAr : home.promo.titleFr) ||
    t("hero.promo.slogan");
  const promoCta =
    (lang === "ar" ? home.promo.ctaAr : home.promo.ctaFr) ||
    t("hero.promo.cta");
  const promoLink = home.promo.link || "/catalogue?promo=1";

  // Arabic script is connected — splitting per-letter would render
  // each glyph in its isolated form (no joining). For AR we render the
  // whole word as a single animated token; the wave animation still
  // applies to the element as a whole.
  const brand = t("hero.brand");
  const letters = lang === "ar" ? [brand] : brand.split("");

  return (
    <section
      aria-labelledby="hero-title"
      className={[
        "relative isolate flex flex-col overflow-hidden bg-linear-to-b from-cream via-wood-100/40 to-wood-200/60",
        "min-h-[calc(100svh_-_125px)] sm:min-h-[calc(100svh_-_137px)] lg:min-h-[calc(100svh_-_72px)]",
        mounted ? "hero-mounted" : "",
      ].join(" ")}
    >
      <style>{`
        /* ──────────── TIPI ASSEMBLY ──────────── */
        .tipi-line { stroke-dasharray: 100; }

        .hero-mounted .tipi-ground       { animation: tipi-draw 270ms cubic-bezier(0.4,0,0.2,1) 80ms backwards; }
        .hero-mounted .tipi-pole-left    { animation: tipi-draw 290ms cubic-bezier(0.34,1.25,0.64,1) 270ms backwards; }
        .hero-mounted .tipi-pole-right   { animation: tipi-draw 290ms cubic-bezier(0.34,1.25,0.64,1) 330ms backwards; }
        .hero-mounted .tipi-fabric-stroke{ animation: tipi-draw 415ms cubic-bezier(0.4,0,0.2,1) 460ms backwards; }
        @keyframes tipi-draw {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0;   }
        }

        .hero-mounted .tipi-fabric-fill  { animation: tipi-fade-in 370ms ease-out 640ms backwards; }
        .hero-mounted .tipi-detail       { animation: tipi-fade-in 225ms ease-out 840ms backwards; }
        @keyframes tipi-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .hero-mounted .tipi-stake-left   { animation: tipi-stake-in 175ms cubic-bezier(0.34,1.6,0.64,1) 945ms backwards; }
        .hero-mounted .tipi-stake-right  { animation: tipi-stake-in 175ms cubic-bezier(0.34,1.6,0.64,1) 1000ms backwards; }
        @keyframes tipi-stake-in {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .tipi-flag { transform-origin: 300px 55px; }
        .hero-mounted .tipi-flag {
          animation:
            tipi-flag-pop  230ms cubic-bezier(0.34,1.8,0.64,1) 1030ms backwards,
            tipi-flag-wave 3.8s ease-in-out 1320ms infinite;
        }
        @keyframes tipi-flag-pop  {
          from { opacity: 0; transform: scale(0) rotate(-18deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg);   }
        }
        @keyframes tipi-flag-wave {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%      { transform: scale(1) rotate(-5deg); }
        }

        /* ──────────── CAMPFIRE ──────────── */
        .tipi-fire { transform-origin: 360px 408px; }
        .hero-mounted .tipi-fire {
          animation:
            tipi-fire-ignite  305ms ease-out 1095ms backwards,
            tipi-fire-flicker 380ms ease-in-out 1400ms infinite;
        }
        @keyframes tipi-fire-ignite {
          0%   { opacity: 0; transform: scale(0); }
          70%  { opacity: 1; transform: scale(1.18); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes tipi-fire-flicker {
          0%, 100% { transform: scale(1, 1)       rotate(0deg);   }
          25%      { transform: scale(0.93, 1.10) rotate(-2deg);  }
          50%      { transform: scale(1.06, 0.94) rotate(1.5deg); }
          75%      { transform: scale(0.97, 1.05) rotate(-1deg);  }
        }

        .hero-mounted .tipi-ember { animation: tipi-ember-rise 2.6s ease-out infinite; }
        .hero-mounted .tipi-ember-1 { animation-delay: 1.32s; }
        .hero-mounted .tipi-ember-2 { animation-delay: 1.72s; }
        .hero-mounted .tipi-ember-3 { animation-delay: 2.12s; }
        @keyframes tipi-ember-rise {
          0%   { opacity: 0;   transform: translate(0,0); }
          15%  { opacity: 0.95; }
          70%  { opacity: 0.45; }
          100% { opacity: 0;   transform: translate(-14px,-130px); }
        }

        .hero-mounted .tipi-smoke { animation: tipi-smoke-rise 4.4s ease-out infinite; }
        .hero-mounted .tipi-smoke-1 { animation-delay: 1.12s; }
        .hero-mounted .tipi-smoke-2 { animation-delay: 1.84s; }
        .hero-mounted .tipi-smoke-3 { animation-delay: 2.40s; }
        @keyframes tipi-smoke-rise {
          0%   { opacity: 0;    transform: translate(0,0)         scale(0.5); }
          20%  { opacity: 0.55; }
          70%  { opacity: 0.28; }
          100% { opacity: 0;    transform: translate(-32px,-190px) scale(1.8); }
        }

        /* ──────────── SCENE BLUR + IDLE DRIFT ──────────── */
        .tipi-scene { filter: blur(7px); opacity: 0.4; transform: scale(1.06); transform-origin: center; will-change: filter, opacity, transform; }
        .hero-mounted .tipi-scene {
          animation:
            tipi-scene-blur  560ms cubic-bezier(0.4,0,0.2,1) 1320ms backwards,
            tipi-scene-drift 16s   ease-in-out               1920ms infinite;
        }
        @keyframes tipi-scene-blur {
          from { filter: blur(0);    opacity: 1;   transform: scale(1);    }
          to   { filter: blur(7px);  opacity: 0.4; transform: scale(1.06); }
        }
        @keyframes tipi-scene-drift {
          0%, 100% { filter: blur(7px); opacity: 0.4;  transform: translateX(0)    scale(1.06); }
          50%      { filter: blur(7px); opacity: 0.45; transform: translateX(-5px) scale(1.06); }
        }

        /* ──────────── BINGO WORDMARK ──────────── */
        .hero-bingo-letter { display: inline-block; will-change: transform, opacity; }
        .hero-mounted .hero-bingo-letter {
          animation:
            hero-bingo-enter 360ms cubic-bezier(0.16,1,0.3,1) backwards,
            hero-bingo-wave  2.8s  ease-in-out                infinite;
        }
        @keyframes hero-bingo-enter {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes hero-bingo-wave  {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }

        .hero-bingo-dot { display: inline-block; transform-origin: center; will-change: transform, opacity; }
        .hero-mounted .hero-bingo-dot {
          animation:
            hero-dot-pop   240ms cubic-bezier(0.34,1.8,0.64,1) backwards,
            hero-dot-pulse 2.8s  ease-in-out                   infinite;
        }
        @keyframes hero-dot-pop   {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes hero-dot-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.22); } }

        .hero-rule { transform-origin: center; }
        .hero-mounted .hero-rule { animation: hero-rule-in 320ms cubic-bezier(0.16,1,0.3,1) 1920ms backwards; }
        @keyframes hero-rule-in {
          from { opacity: 0; transform: scaleX(0); }
          to   { opacity: 1; transform: scaleX(1); }
        }

        .hero-mounted .hero-tagline { animation: hero-tagline-in 320ms ease-out 1980ms backwards; }
        @keyframes hero-tagline-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        /* ──────────── PRODUCT DECK — one fanned row that shuffles.
              Every card keeps a stable DOM node and is absolutely
              positioned; its slot (horizontal offset --tx + rotation
              --rot + z-index) is fed in via inline style. The transform
              transition below animates whenever the shuffle reassigns a
              card's slot, so a card visibly slides from a right slot to
              a left one (and vice-versa). The entrance keyframe takes
              over during its 600 ms run, then this transition governs. */
        .hero-deck-card {
          will-change: transform, opacity;
          transform: translateX(var(--tx, -50%)) rotate(var(--rot, 0deg));
          transition:
            transform 900ms cubic-bezier(0.34, 1.25, 0.64, 1),
            box-shadow 300ms ease;
        }
        .hero-mounted .hero-deck-card-left {
          animation: hero-deck-in-left 600ms cubic-bezier(0.34,1.25,0.64,1) backwards;
        }
        .hero-mounted .hero-deck-card-right {
          animation: hero-deck-in-right 600ms cubic-bezier(0.34,1.25,0.64,1) backwards;
        }
        @keyframes hero-deck-in-left {
          from { opacity: 0; transform: translateX(calc(var(--tx, -50%) - 220%)) rotate(0deg); }
          to   { opacity: 1; transform: translateX(var(--tx, -50%))               rotate(var(--rot, 0deg)); }
        }
        @keyframes hero-deck-in-right {
          from { opacity: 0; transform: translateX(calc(var(--tx, -50%) + 220%)) rotate(0deg); }
          to   { opacity: 1; transform: translateX(var(--tx, -50%))               rotate(var(--rot, 0deg)); }
        }

        /* ──────────── PROMO BLOCK — eyebrow + slogan + CTA.
              Opens after the piles have all landed. */
        .hero-promo { will-change: opacity, transform; }
        .hero-mounted .hero-promo {
          animation: hero-promo-reveal 480ms ease-out 3100ms backwards;
        }
        @keyframes hero-promo-reveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        /* ──────────── SCROLL INDICATOR ──────────── */
        .hero-mounted .hero-scroll { animation: hero-tagline-in 320ms ease-out 3500ms backwards; }
        .hero-scroll-arrow { will-change: transform; }
        .hero-mounted .hero-scroll-arrow {
          animation: hero-scroll-bounce 1.8s cubic-bezier(0.5,0,0.5,1) 3900ms infinite;
        }
        @keyframes hero-scroll-bounce {
          0%, 100% { transform: translateY(0);   opacity: 1;   }
          50%      { transform: translateY(6px); opacity: 0.6; }
        }
      `}</style>

      {/* TIPI SCENE */}
      <div className="tipi-scene pointer-events-none absolute inset-0 z-[1] grid place-items-center">
        <svg
          aria-hidden
          viewBox="0 0 600 480"
          preserveAspectRatio="xMidYMax meet"
          className="h-[70%] w-auto max-h-[360px] max-w-[70%]"
        >
          <line pathLength={100} className="tipi-line tipi-ground" x1="100" y1="400" x2="500" y2="400" stroke="#5b452a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line pathLength={100} className="tipi-line tipi-pole-left"  x1="200" y1="400" x2="280" y2="34" stroke="#3d341f" strokeWidth="3" strokeLinecap="round" fill="none" />
          <line pathLength={100} className="tipi-line tipi-pole-right" x1="400" y1="400" x2="320" y2="34" stroke="#3d341f" strokeWidth="3" strokeLinecap="round" fill="none" />

          <path className="tipi-fabric-fill" d="M 160 400 L 300 60 L 440 400 Z" fill="#c9b58e" />
          <path pathLength={100} className="tipi-line tipi-fabric-stroke" d="M 160 400 L 300 60 L 440 400 Z" fill="none" stroke="#5b452a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          <g className="tipi-detail" stroke="#7a6035" strokeWidth="1.5" strokeLinecap="round" fill="none">
            <path d="M 300 60 L 232 400" opacity="0.55" />
            <path d="M 300 60 L 368 400" opacity="0.55" />
            <path d="M 300 400 L 300 252" strokeWidth="2" />
            <path d="M 288 252 Q 300 232 312 252" strokeWidth="1.5" />
          </g>

          <ellipse className="tipi-detail" cx="300" cy="74" rx="14" ry="6" fill="#3d341f" opacity="0.85" />

          <line className="tipi-stake-left"  x1="155" y1="395" x2="155" y2="414" stroke="#3d341f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line className="tipi-stake-right" x1="445" y1="395" x2="445" y2="414" stroke="#3d341f" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          <g className="tipi-flag">
            <line x1="300" y1="55" x2="300" y2="22" stroke="#3d341f" strokeWidth="1.5" />
            <path d="M 300 26 L 322 33 L 300 40 Z" fill="#ed8a3c" />
          </g>

          <g fill="#9c7e48">
            <ellipse className="tipi-smoke tipi-smoke-1" cx="300" cy="55" rx="9"  ry="6" />
            <ellipse className="tipi-smoke tipi-smoke-2" cx="296" cy="55" rx="10" ry="7" />
            <ellipse className="tipi-smoke tipi-smoke-3" cx="303" cy="55" rx="8"  ry="6" />
          </g>

          <g className="tipi-fire">
            <line x1="343" y1="409" x2="377" y2="402" stroke="#5b452a" strokeWidth="4" strokeLinecap="round" />
            <line x1="343" y1="402" x2="377" y2="409" stroke="#7a6035" strokeWidth="4" strokeLinecap="round" />
            <path
              d="M 360 411 C 348 400, 348 386, 354 378 C 358 383, 362 385, 364 380 C 366 374, 368 368, 372 377 C 376 388, 370 400, 360 411 Z"
              fill="#ed8a3c" opacity="0.9"
            />
            <path
              d="M 360 408 C 354 400, 354 391, 358 386 C 360 389, 362 390, 363 387 C 365 383, 366 379, 368 385 C 370 393, 366 401, 360 408 Z"
              fill="#fac38a" opacity="0.95"
            />
          </g>

          <g fill="#ed8a3c">
            <circle className="tipi-ember tipi-ember-1" cx="362" cy="385" r="1.5" />
            <circle className="tipi-ember tipi-ember-2" cx="358" cy="385" r="1.2" />
            <circle className="tipi-ember tipi-ember-3" cx="365" cy="385" r="1"   />
          </g>
        </svg>
      </div>

      {/* BINGO wordmark — centered, biased slightly upward so the
          image piles + promo block sit below. Less bottom padding =
          BINGO sits a bit lower in the section. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-[3vh] text-center sm:pb-[5vh]">
        <h1
          id="hero-title"
          className="font-display font-bold leading-[0.86] tracking-[-0.05em] text-forest-900 text-[80px] sm:text-[112px] md:text-[148px] lg:text-[180px]"
        >
          {letters.map((char, i) => (
            <span
              key={i}
              aria-hidden={i > 0}
              className="hero-bingo-letter"
              style={{ animationDelay: `${1500 + i * 50}ms, ${1820 + i * 100}ms` }}
            >
              {char}
            </span>
          ))}
          <span
            aria-hidden
            className="hero-bingo-dot ms-2 inline-block size-3 rounded-full bg-tangerine-500 align-baseline sm:size-4 md:size-[22px] lg:size-[26px]"
            style={{ animationDelay: "1710ms, 1935ms" }}
          />
          <span className="sr-only">{brand}</span>
        </h1>

        <div aria-hidden className="hero-rule mt-4 h-px w-16 bg-wood-700/40 sm:mt-5 sm:w-20" />

        <p className="hero-tagline mt-3 max-w-md font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-tangerine-700 sm:mt-4 sm:text-xs">
          {t("hero.tagline")}
        </p>

        {/* Image piles — only render when the admin has picked at
            least one product in /admin/banners. Empty configuration =
            no pile block, hero collapses to wordmark + promo. */}
        {adminPicks.length > 0 ? (
          <div className="mt-10 flex items-center justify-center sm:mt-28">
            <HeroDeck products={adminPicks} baseDelay={2100} stagger={220} />
          </div>
        ) : null}

        {/* Promo block — eyebrow + slogan + CTA. Slogan/CTA/link all
            come from /admin/banners settings, falling back to the
            i18n defaults when the admin hasn't customized them. */}
        <div className="hero-promo mt-20 flex flex-col items-center gap-3 sm:mt-20 sm:gap-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-tangerine-700">
            {t("hero.promo.eyebrow")}
          </p>
          <p className="max-w-md font-display text-base font-semibold leading-[1.2] tracking-[-0.01em] text-forest-900 sm:text-lg md:text-xl">
            {promoSlogan}
          </p>
          <Link
            href={promoLink}
            className={[
              "mt-1 inline-flex items-center gap-1.5 rounded-full bg-tangerine-500 px-5 py-2",
              "font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-cream",
              "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
              "transition-all duration-300 hover:bg-tangerine-600 hover:scale-[1.03]",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40",
              "sm:px-6 sm:py-2.5 sm:text-[12px]",
            ].join(" ")}
          >
            {promoCta}
            <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={2.2} />
          </Link>
        </div>

        <div className="hero-scroll mt-8 flex items-center gap-2 sm:mt-10" aria-hidden>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-wood-700/70">
            {t("hero.scroll")}
          </span>
          <ArrowDown
            className="hero-scroll-arrow size-4 text-forest-900"
            strokeWidth={2.2}
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Hero product deck — a single fanned row of thumbs that shuffles.
       Every card keeps a stable DOM node and is absolutely positioned;
       its slot (horizontal offset + rotation + stacking) lives in inline
       CSS vars. A transform transition (see the <style> block) animates
       whenever the shuffle swaps two slots, so a card from the right
       visibly slides over to a left slot — and vice-versa — every 2 s.
       Each thumb still flies in back-to-front on first paint. ───────── */
function HeroDeck({
  products,
  baseDelay = 2100,
  stagger = 220,
}: {
  products: HeroSlot[];
  baseDelay?: number;
  stagger?: number;
}) {
  const { lang } = useLanguage();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  const total = products.length;
  const center = (total - 1) / 2;

  // slotOfCard[cardIndex] = the slot that card currently occupies.
  // Starts as identity (card i in slot i); the shuffle swaps entries so
  // the DOM never reorders — only each card's inline transform changes.
  const [slotOfCard, setSlotOfCard] = React.useState<number[]>(() =>
    products.map((_, i) => i)
  );

  // Re-sync if the admin changes the number of picks at runtime.
  React.useEffect(() => {
    setSlotOfCard(products.map((_, i) => i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  /* ─── Shuffle every 2 s ──────────────────────────────────────────
     Each tick picks one card sitting in a left-half slot and one in a
     right-half slot and swaps them, so a swap always crosses the centre
     — what reads as "a right card trading places with a left one." The
     pair is chosen at random. Starts after the entrance cascade has
     settled and pauses while the tab is hidden. */
  React.useEffect(() => {
    if (total < 2) return;
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        if (document.visibilityState !== "visible") return;
        setSlotOfCard((prev) => {
          const cardInSlot: number[] = [];
          prev.forEach((slot, card) => {
            cardInSlot[slot] = card;
          });
          const leftSlots: number[] = [];
          const rightSlots: number[] = [];
          for (let s = 0; s < total; s++) {
            if (s < center) leftSlots.push(s);
            else if (s > center) rightSlots.push(s);
          }
          if (leftSlots.length === 0 || rightSlots.length === 0) return prev;
          const ls = leftSlots[Math.floor(Math.random() * leftSlots.length)];
          const rs = rightSlots[Math.floor(Math.random() * rightSlots.length)];
          const next = prev.slice();
          next[cardInSlot[ls]] = rs;
          next[cardInSlot[rs]] = ls;
          return next;
        });
      }, 2000);
    }, baseDelay + total * stagger + 600);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [total, center, baseDelay, stagger]);

  const STEP = 60; // slot spacing within a group, as a % of a card's width
  const TILT = 5; //  degrees of fan per slot away from the centre
  const GAP = 38; //  extra split between the left & right groups, % of width

  return (
    <div className="relative h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40">
      {products.map((p, i) => {
        const slot = slotOfCard[i] ?? i;
        const rel = slot - center; // <0 left group, >0 right group
        const side = rel < 0 ? -1 : rel > 0 ? 1 : 0;
        // Group spacing + a centre gap that pushes the two groups apart,
        // so it reads as "three on the left, three on the right." A card
        // swapping sides slides the full width incl. this gap.
        const tx = rel * STEP + side * GAP; // horizontal offset, % of width
        const angle = rel * TILT; //          fan rotation, flat-ish near the gap
        // Centre card sits on top; cards fan back toward the edges.
        const zIndex = Math.round((total - Math.abs(rel)) * 10);
        // Entrance: cards resting left of centre fly in from the left
        // edge, the rest from the right. Back-to-front cascade by index.
        const entranceLeft = i <= center;
        const order = total - 1 - i;
        const delay = baseDelay + order * stagger;
        const displayName = productName({
          name: p.nameFr,
          nameAr: p.nameAr,
        });
        // Product cards keep the price pill; category cards show the
        // category name in the same pill so the slot reads cleanly.
        const badgeText =
          p.kind === "product" && p.price != null
            ? formatPrice(p.price)
            : lang === "ar" && p.nameAr
              ? p.nameAr
              : p.nameFr;
        return (
          <Link
            key={`${p.kind}-${p.slug}`}
            href={p.href}
            aria-label={displayName}
            className={[
              "hero-deck-card",
              entranceLeft ? "hero-deck-card-left" : "hero-deck-card-right",
              // White card so transparent / icon-style category images
              // sit on a clean canvas instead of the page background.
              "absolute left-1/2 top-0 size-32 overflow-hidden rounded-xl bg-white ring-2 ring-cream shadow-[0_14px_30px_-8px_rgba(31,58,30,0.45)] sm:size-36 md:size-40",
              "hover:shadow-[0_18px_36px_-10px_rgba(31,58,30,0.55)]",
              "focus-visible:outline-none focus-visible:ring-tangerine-400",
            ].join(" ")}
            style={{
              zIndex,
              "--tx": `calc(-50% + ${tx}%)`,
              "--rot": `${angle}deg`,
              animationDelay: `${delay}ms`,
            } as React.CSSProperties}
          >
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt=""
                aria-hidden
                loading="lazy"
                // Products: fill the card edge-to-edge (photos look best).
                // Categories: contain so icon-style images keep their
                // padding instead of being upscaled past their bounds.
                className={[
                  "absolute inset-0 size-full",
                  p.kind === "product" ? "object-cover" : "object-contain p-3",
                ].join(" ")}
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center bg-wood-200 text-wood-500 font-display text-xs"
              >
                {p.nameFr.slice(0, 1)}
              </span>
            )}
            {/* Bottom scrim so the badge stays legible */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-forest-900/85 via-forest-900/40 to-transparent"
            />
            {/* Badge pill — price for products, category name for cats */}
            <span
              className={[
                "absolute bottom-1.5 left-1/2 -translate-x-1/2 max-w-[90%] truncate rounded-full px-2 py-0.5",
                "font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-cream backdrop-blur sm:text-[10.5px]",
                p.kind === "product" ? "bg-forest-900/90" : "bg-tangerine-600/95",
              ].join(" ")}
            >
              {badgeText}
            </span>
          </Link>
        );
      })}
    </div>
  );
}


