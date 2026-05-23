import * as React from "react";
import { ArrowRight } from "lucide-react";

import { TentLink } from "@/components/ui/tent-link";

/**
 * Promotions banner — full-width forest-themed card with a backdrop
 * photo, headline, lead, and a single tangerine CTA into /promotions.
 */
export function Promotions() {
  return (
    <section
      aria-labelledby="promotions-title"
      className="bg-cream py-16 sm:py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="relative overflow-hidden rounded-2xl bg-forest-900 text-cream md:rounded-3xl">
          {/* Background photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=2000&q=85&fit=crop"
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover opacity-55"
          />

          {/* Forest scrim — heavy on the copy side, fades out toward end */}
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-forest-900/95 via-forest-900/70 to-forest-900/30 sm:bg-linear-to-r sm:from-forest-900/90 sm:via-forest-900/60 sm:to-forest-900/15"
          />

          {/* Topographic ring decoration in the far corner */}
          <svg
            aria-hidden
            viewBox="0 0 600 600"
            fill="none"
            className="pointer-events-none absolute -end-32 -top-32 size-[520px] text-tangerine-300 opacity-[0.10]"
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

          <div className="relative grid gap-8 px-6 py-12 sm:px-10 sm:py-16 md:grid-cols-2 md:items-center md:px-14 md:py-20 lg:px-16">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-300">
                Offre limitée · Octobre
              </p>
              <h2
                id="promotions-title"
                className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-4xl md:text-[2.5rem]"
              >
                Jusqu&apos;à −30 % sur la collection automne
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/80 sm:mt-5 sm:text-base">
                Sacs de couchage, hardshells et sacs à dos — notre meilleure
                sélection est en promo jusqu&apos;à fin octobre. Livraison
                gratuite dès 12 000 DA.
              </p>
              <TentLink
                href="/catalogue?promo=1"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-6 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-all duration-300 hover:scale-[1.02] hover:bg-tangerine-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40 sm:mt-8"
              >
                Voir les promotions
                <ArrowRight
                  className="size-4 rtl:rotate-180"
                  strokeWidth={2.2}
                />
              </TentLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
