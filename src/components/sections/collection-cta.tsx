"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import { TentLink } from "@/components/ui/tent-link";
import { useLanguage } from "@/lib/i18n";

/**
 * Bottom CTA — funnels visitors who scrolled past every section into
 * the full catalogue. Centered, cream background, single tangerine
 * pill button.
 */
export function CollectionCTA() {
  const { t } = useLanguage();
  return (
    <section
      aria-labelledby="collection-cta-title"
      className="bg-cream py-16 sm:py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-3xl px-6 text-center md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-700">
          {t("collection.eyebrow")}
        </p>
        <h2
          id="collection-cta-title"
          className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl"
        >
          {t("collection.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-wood-700 sm:text-base">
          {t("collection.subtitle")}
        </p>

        <TentLink
          href="/catalogue"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-all duration-300 hover:scale-[1.02] hover:bg-tangerine-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40 sm:mt-10"
        >
          {t("collection.cta")}
          <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
        </TentLink>
      </div>
    </section>
  );
}
