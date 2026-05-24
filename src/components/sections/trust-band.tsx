"use client";

import * as React from "react";
import {
  MapPin,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { useLanguage } from "@/lib/i18n";

type Feature = { Icon: LucideIcon; titleKey: string; textKey: string };

const FEATURES: Feature[] = [
  {
    Icon: Truck,
    titleKey: "trust.delivery.title",
    textKey: "trust.delivery.text",
  },
  {
    Icon: RotateCcw,
    titleKey: "trust.returns.title",
    textKey: "trust.returns.text",
  },
  {
    Icon: ShieldCheck,
    titleKey: "trust.payment.title",
    textKey: "trust.payment.text",
  },
  {
    Icon: MapPin,
    titleKey: "trust.shop.title",
    textKey: "trust.shop.text",
  },
];

/**
 * Trust band — 4 quick reassurance points (delivery, returns, payment,
 * physical store) in a compact cream-deep strip.
 */
export function TrustBand() {
  const { t } = useLanguage();
  return (
    <section
      aria-label={t("trust.aria")}
      className="border-y border-wood-300/40 bg-cream-deep/40 py-10 sm:py-12 md:py-14"
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-x-8">
          {FEATURES.map(({ Icon, titleKey, textKey }) => (
            <li
              key={titleKey}
              className="flex flex-col items-center text-center sm:items-start sm:text-start"
            >
              <span className="grid size-10 place-items-center rounded-full bg-cream text-forest-900 ring-1 ring-wood-300/60">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <p className="mt-3 font-display text-sm font-semibold text-forest-900">
                {t(titleKey)}
              </p>
              <p className="mt-1 max-w-[18ch] text-xs leading-snug text-wood-700 sm:max-w-none">
                {t(textKey)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
