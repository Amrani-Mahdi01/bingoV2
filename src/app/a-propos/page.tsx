import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Leaf,
  MapPin,
  Mountain,
  Phone,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { TentLink } from "@/components/ui/tent-link";

export const metadata = {
  title: "À propos — BINGO",
  description:
    "Une boutique outdoor indépendante à Sétif. Notre histoire, nos valeurs, notre sélection.",
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col bg-cream">
      <HeroIntro />
      <OurStory />
      <Values />
      <ShopVisit />
      <BottomCTA />
    </main>
  );
}

/* ───── Hero / intro ─────────────────────────────────────────── */
function HeroIntro() {
  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700"
        >
          <Link href="/" className="transition-colors hover:text-tangerine-700">
            Accueil
          </Link>
          <ChevronRight
            className="size-3 text-wood-500 rtl:rotate-180"
            strokeWidth={2.2}
          />
          <span className="text-forest-900">À propos</span>
        </nav>

        <div className="mt-6 max-w-3xl md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            Qui sommes-nous
          </p>
          <h1 className="mt-3 font-display text-[44px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 sm:text-[64px] md:text-[80px]">
            À propos
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-wood-700 sm:text-lg">
            BINGO est une boutique outdoor née à Sétif, au pied du Djurdjura.
            Nous sélectionnons et testons sur le terrain le matériel
            d&apos;aventure que nous voudrions emporter en bivouac — rien
            d&apos;autre.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───── Our story — split layout (image + copy) ──────────────── */
function OurStory() {
  return (
    <section
      id="notre-histoire"
      aria-labelledby="story-title"
      className="scroll-mt-24 border-y border-wood-300/40 bg-cream-deep/40 py-16 sm:py-20 md:scroll-mt-32 md:py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 md:grid-cols-2 md:items-center md:gap-12 md:px-10 lg:gap-16">
        {/* Photo */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-wood-300/50 bg-wood-100 md:aspect-[3/4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=1400&q=85&fit=crop"
            alt="Tente plantée face aux montagnes au coucher du soleil"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <div
            aria-hidden
            className="absolute inset-0 ring-1 ring-inset ring-forest-900/10"
          />
        </div>

        {/* Copy */}
        <div className="max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-700">
            Notre histoire
          </p>
          <h2
            id="story-title"
            className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl md:text-[2.5rem]"
          >
            Une boutique née sur les sentiers
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-wood-700 sm:text-base">
            <p>
              Tout a commencé dans un bivouac au Tikjda, autour d&apos;un
              réchaud qui refusait de s&apos;allumer. Nous avons cherché du
              matériel sérieux, à des prix justes, livrable partout en
              Algérie. Nous n&apos;avons pas trouvé. Alors nous l&apos;avons
              monté.
            </p>
            <p>
              BINGO est une équipe de trois passionnés — randonnée,
              alpinisme, photo — qui sélectionne les marques qu&apos;elle
              utilise, teste chaque produit sur le terrain, et raconte ses
              choix dans le journal.
            </p>
            <p className="font-display text-base font-semibold italic text-forest-900 sm:text-lg">
              « Le matériel doit servir l&apos;aventure, jamais l&apos;inverse. »
            </p>
          </div>

          {/* Mini stats */}
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-wood-300/50 pt-6">
            <Stat value="2025" label="Année de création" />
            <Stat value="58" label="Wilayas livrées" />
            <Stat value="100+" label="Produits testés" />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-2xl font-bold tracking-tight text-forest-900 sm:text-3xl">
        {value}
      </dt>
      <dd className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-wood-600">
        {label}
      </dd>
    </div>
  );
}

/* ───── Values — 4 cards ─────────────────────────────────────── */
type Value = { Icon: LucideIcon; title: string; text: string };

const VALUES: Value[] = [
  {
    Icon: Mountain,
    title: "Testé sur le terrain",
    text: "Aucun produit n'arrive en vitrine sans avoir traîné dans un sac à dos, dormi sous une tente, encaissé une averse.",
  },
  {
    Icon: Leaf,
    title: "Sélection rigoureuse",
    text: "Moins de références, mieux choisies. Nous préférons une bonne tente à dix moyennes.",
  },
  {
    Icon: Truck,
    title: "Livré partout en Algérie",
    text: "Livraison à domicile ou en agence Stop Desk, sous 48 h dans la plupart des wilayas.",
  },
  {
    Icon: ShieldCheck,
    title: "Service après-vente",
    text: "30 jours pour changer d'avis, garantie fabricant, et un humain au bout du fil.",
  },
];

function Values() {
  return (
    <section
      aria-labelledby="values-title"
      className="bg-cream py-16 sm:py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <header className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-700">
            Ce qu&apos;on défend
          </p>
          <h2
            id="values-title"
            className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl md:text-[2.5rem]"
          >
            Nos quatre engagements
          </h2>
        </header>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-12 md:gap-5 lg:grid-cols-4">
          {VALUES.map(({ Icon, title, text }) => (
            <li
              key={title}
              className="flex flex-col rounded-2xl border border-wood-300/50 bg-cream-deep/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-tangerine-500/40 hover:shadow-[0_14px_28px_-14px_rgba(31,58,30,0.25)] sm:p-6"
            >
              <span className="grid size-10 place-items-center rounded-full bg-forest-900 text-cream">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold leading-snug text-forest-900 sm:text-[17px]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-wood-700">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───── Shop visit — address + hours + phone ─────────────────── */
function ShopVisit() {
  return (
    <section
      aria-labelledby="shop-title"
      className="relative isolate overflow-hidden border-y border-wood-300/40 bg-forest-900 py-16 text-cream sm:py-20 md:py-24"
    >
      {/* Tangerine top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-tangerine-500/40 to-transparent"
      />

      {/* Decorative topographic rings */}
      <svg
        aria-hidden
        viewBox="0 0 600 600"
        fill="none"
        className="pointer-events-none absolute -end-32 -top-32 size-[520px] text-tangerine-300 opacity-[0.1]"
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

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 md:grid-cols-2 md:items-center md:gap-12 md:px-10">
        {/* Copy */}
        <div className="max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-300">
            Venez nous voir
          </p>
          <h2
            id="shop-title"
            className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-4xl md:text-[2.5rem]"
          >
            La boutique de Sétif
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/80 sm:text-base">
            Un espace de 80 m² au centre-ville de Sétif où l&apos;on essaie
            les sacs, on grimpe sur les chaussures, et on partage les guides
            terrain autour d&apos;un café.
          </p>

          <dl className="mt-8 space-y-4">
            <InfoRow Icon={MapPin} label="Adresse">
              Cité Dallas, Bâtiment 3 (près de LG)
              <br />
              19000 Sétif, Algérie
            </InfoRow>
            <InfoRow Icon={Phone} label="Téléphone">
              <a
                href="tel:+213673812896"
                className="transition-colors hover:text-tangerine-300"
              >
                +213 673 81 28 96
              </a>
            </InfoRow>
          </dl>
        </div>

        {/* Map placeholder */}
        <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-forest-800 ring-1 ring-inset ring-cream/10 md:aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1400&q=85&fit=crop"
            alt="Carte de la région de Sétif"
            className="absolute inset-0 size-full object-cover opacity-70"
            loading="lazy"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-forest-900/80 via-forest-900/30 to-transparent"
          />
          <div className="absolute inset-0 grid place-items-center">
            <span className="inline-grid size-14 place-items-center rounded-full bg-tangerine-500 text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.6)]">
              <MapPin className="size-6" strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  Icon,
  label,
  children,
}: {
  Icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-800 text-tangerine-300">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <div className="flex flex-col">
        <dt className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-cream/55">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm leading-relaxed text-cream/90 sm:text-base">
          {children}
        </dd>
      </div>
    </div>
  );
}

/* ───── Bottom CTA ───────────────────────────────────────────── */
function BottomCTA() {
  return (
    <section className="bg-cream py-16 sm:py-20 md:py-24">
      <div className="mx-auto w-full max-w-3xl px-6 text-center md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-700">
          Prêt à partir
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl">
          Découvrez la collection
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-wood-700 sm:text-base">
          Sacs de couchage, tentes, sacs à dos, éclairage — la sélection
          BINGO, livrée partout en Algérie.
        </p>
        <TentLink
          href="/catalogue"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-all duration-300 hover:scale-[1.02] hover:bg-tangerine-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40 sm:mt-10"
        >
          Voir le catalogue
          <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
        </TentLink>
      </div>
    </section>
  );
}
