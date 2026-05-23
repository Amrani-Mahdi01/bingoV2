"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { cn } from "@/lib/utils";
import { BANNERS, type Banner } from "@/lib/banners";
import { useLanguage } from "@/lib/i18n";

interface BannerSliderProps {
  banners?: Banner[];
  intervalMs?: number;
}

/* Port of the production BannerSlider, restyled to use the bingo-hero
   design system (forest / tangerine / cream / wood + font-display /
   font-mono). Embla-driven carousel with autoplay, RTL aware. */
export function BannerSlider({
  banners = BANNERS,
  intervalMs = 4500,
}: BannerSliderProps) {
  const { lang, t } = useLanguage();
  const isRtl = lang === "ar";

  // The slider stays collapsed (h-0) until the hero has finished its
  // entry animation, then grows to its full svh height. Matches the
  // delay used in `<Hero />` for synchronized reveal.
  const [revealed, setRevealed] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setRevealed(true), 2800);
    return () => window.clearTimeout(t);
  }, []);

  const autoplay = React.useRef(
    Autoplay({
      delay: intervalMs,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: false,
      containScroll: false,
      duration: 18,
      direction: isRtl ? "rtl" : "ltr",
    },
    [autoplay.current]
  );

  const [selected, setSelected] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;
    const update = () => setSelected(emblaApi.selectedScrollSnap());
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  React.useEffect(() => {
    emblaApi?.reInit({ direction: isRtl ? "rtl" : "ltr" });
  }, [emblaApi, isRtl]);

  const scrollTo = React.useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi]
  );
  const prev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (banners.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("hero.carousel")}
      className="relative isolate bg-cream"
    >
      {/* Hairline of tangerine at the top edge — echoes the header */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-px bg-linear-to-r from-transparent via-tangerine-500/50 to-transparent"
      />

      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y select-none">
          {banners.map((banner, i) => {
            const title = isRtl ? banner.titleAr : banner.titleFr;
            const subtitle = isRtl ? banner.subtitleAr : banner.subtitleFr;
            const ctaLabel = isRtl
              ? banner.ctaLabelAr
              : banner.ctaLabelFr;
            return (
              <div
                key={banner.id}
                className="relative min-w-0 flex-[0_0_100%] bg-forest-900"
                role="group"
                aria-roledescription="slide"
                aria-label={`${t("hero.slide")} ${i + 1} / ${banners.length}`}
              >
                <div
                  className={cn(
                    "relative overflow-hidden transition-[height] duration-[700ms] ease-out",
                    revealed
                      ? "h-[16svh] sm:h-[18svh] md:h-[20svh] lg:h-[22svh]"
                      : "h-0"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.image}
                    alt={title ?? "BINGO"}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    style={{
                      transform: "translateZ(0)",
                      backfaceVisibility: "hidden",
                    }}
                    className="pointer-events-none absolute inset-0 size-full object-cover"
                  />

                  {/* Forest scrim — same recipe as the production hero:
                      heavier on mobile (bottom-up), flips to a side-anchored
                      gradient on sm+ so the copy side stays legible while
                      the rest of the photo reads clearly.
                      NB: Tailwind v4 uses `bg-linear-*`, not `bg-gradient-*`. */}
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-0 bg-linear-to-t from-forest-900/90 via-forest-900/55 to-forest-900/20",
                      isRtl
                        ? "sm:bg-linear-to-l sm:from-forest-900/85 sm:via-forest-900/55 sm:to-transparent"
                        : "sm:bg-linear-to-r sm:from-forest-900/85 sm:via-forest-900/55 sm:to-transparent"
                    )}
                  />

                  {/* Topographic ring decoration — echoes the editorial
                      section. Subtle, top-end corner. */}
                  <svg
                    aria-hidden
                    viewBox="0 0 600 600"
                    fill="none"
                    className={cn(
                      "pointer-events-none absolute -top-32 size-[520px] text-tangerine-300 opacity-[0.08]",
                      isRtl ? "-left-24" : "-right-24"
                    )}
                  >
                    {[180, 220, 260, 300, 340, 380, 420, 460].map((r) => (
                      <circle
                        key={r}
                        cx="300"
                        cy="300"
                        r={r}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    ))}
                  </svg>

                  {/* Copy overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center">
                    <div className="mx-auto flex w-full max-w-7xl px-6 sm:px-8 lg:px-12">
                      <div
                        className={cn(
                          "w-full max-w-2xl py-3 text-cream md:py-4",
                          selected === i &&
                            "motion-safe:animate-[banner-fade-in_650ms_cubic-bezier(0.22,1,0.36,1)_both]"
                        )}
                      >
                        {/* Title */}
                        <h1 className="max-w-xl font-display text-sm font-bold leading-[1.1] tracking-[-0.02em] sm:text-base md:text-xl">
                          {title}
                        </h1>

                        {/* Subtitle */}
                        {subtitle ? (
                          <p className="mt-1.5 max-w-md text-[10px] leading-relaxed text-cream/85 sm:mt-2 sm:text-[11px] md:text-xs">
                            {subtitle}
                          </p>
                        ) : null}

                        {/* CTA */}
                        {banner.link && ctaLabel ? (
                          <Link
                            href={banner.link}
                            draggable={false}
                            className={cn(
                              "pointer-events-auto mt-2 inline-flex items-center gap-1.5 rounded-full bg-tangerine-500 px-3 py-1.5",
                              "font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-cream",
                              "shadow-[0_8px_24px_-8px_rgba(234,108,29,0.5)]",
                              "transition-all duration-300 hover:bg-tangerine-600 hover:scale-[1.02]",
                              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40 sm:mt-3"
                            )}
                          >
                            {ctaLabel}
                            <ArrowRight
                              className="size-3.5 rtl:rotate-180"
                              strokeWidth={2.2}
                            />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide entry animation */}
      <style jsx>{`
        @keyframes banner-fade-in {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Control cluster — anchored to inline-end (right LTR / left RTL).
          Fades in alongside the slide reveal so it doesn't flash empty. */}
      {banners.length > 1 ? (
        <div
          className={cn(
            "pointer-events-none absolute bottom-5 end-4 z-10 flex items-center gap-3 sm:bottom-7 sm:end-8 lg:end-12",
            "transition-opacity duration-[400ms] ease-out",
            revealed ? "opacity-100 delay-[400ms]" : "opacity-0"
          )}
        >
          {/* Counter */}
          <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.2em] text-cream/70 tabular-nums sm:inline">
            {String(selected + 1).padStart(2, "0")}
            <span className="mx-1 text-cream/30">/</span>
            {String(banners.length).padStart(2, "0")}
          </span>

          {/* Dots */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`${t("hero.slide")} ${i + 1}`}
                aria-current={i === selected}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === selected
                    ? "w-7 bg-tangerine-400"
                    : "w-3 bg-cream/30 hover:bg-cream/55"
                )}
              />
            ))}
          </div>

          {/* Prev / next */}
          <div className="pointer-events-auto inline-flex overflow-hidden rounded-full border border-cream/25 bg-forest-900/45 backdrop-blur">
            <button
              type="button"
              onClick={prev}
              aria-label={t("hero.prev")}
              className="inline-flex size-9 items-center justify-center text-cream/85 transition-colors hover:bg-cream/10"
            >
              {isRtl ? (
                <ChevronRight className="size-4" strokeWidth={2} />
              ) : (
                <ChevronLeft className="size-4" strokeWidth={2} />
              )}
            </button>
            <span aria-hidden className="w-px bg-cream/20" />
            <button
              type="button"
              onClick={next}
              aria-label={t("hero.next")}
              className="inline-flex size-9 items-center justify-center text-cream/85 transition-colors hover:bg-cream/10"
            >
              {isRtl ? (
                <ChevronLeft className="size-4" strokeWidth={2} />
              ) : (
                <ChevronRight className="size-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
