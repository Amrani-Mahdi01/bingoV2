import * as React from "react";
import {
  MapPin,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

type Feature = { Icon: LucideIcon; title: string; text: string };

const FEATURES: Feature[] = [
  {
    Icon: Truck,
    title: "Livraison gratuite",
    text: "Dès 12 000 DA partout en Algérie",
  },
  {
    Icon: RotateCcw,
    title: "Retours sous 30 jours",
    text: "Sans question, en boutique ou par envoi",
  },
  {
    Icon: ShieldCheck,
    title: "Paiement sécurisé",
    text: "À la livraison ou en ligne",
  },
  {
    Icon: MapPin,
    title: "Boutique à Sétif",
    text: "36.2°N · 5.4°E — rendez-vous sur place",
  },
];

/**
 * Trust band — 4 quick reassurance points (delivery, returns, payment,
 * physical store) in a compact cream-deep strip.
 */
export function TrustBand() {
  return (
    <section
      aria-label="Nos engagements"
      className="border-y border-wood-300/40 bg-cream-deep/40 py-10 sm:py-12 md:py-14"
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-x-8">
          {FEATURES.map(({ Icon, title, text }) => (
            <li
              key={title}
              className="flex flex-col items-center text-center sm:items-start sm:text-start"
            >
              <span className="grid size-10 place-items-center rounded-full bg-cream text-forest-900 ring-1 ring-wood-300/60">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <p className="mt-3 font-display text-sm font-semibold text-forest-900">
                {title}
              </p>
              <p className="mt-1 max-w-[18ch] text-xs leading-snug text-wood-700 sm:max-w-none">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
