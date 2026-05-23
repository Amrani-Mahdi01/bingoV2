import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

export const metadata = {
  title: "FAQ — BINGO",
  description:
    "Réponses aux questions les plus fréquentes sur la commande, la livraison, le paiement et les retours.",
};

type QA = { q: string; a: React.ReactNode };
type Topic = { slug: string; title: string; items: QA[] };

const TOPICS: Topic[] = [
  {
    slug: "commande",
    title: "Commande",
    items: [
      {
        q: "Comment passer une commande ?",
        a: (
          <>
            Parcourez le catalogue, ajoutez les produits qui vous
            intéressent au panier, puis cliquez sur <strong>Commander</strong>.
            Vous renseignez vos informations de livraison et nous vous
            rappelons sous 24 h pour confirmer.
          </>
        ),
      },
      {
        q: "Puis-je commander par téléphone ?",
        a: (
          <>
            Bien sûr — appelez-nous au{" "}
            <a
              href="tel:+213673812896"
              className="text-tangerine-700 hover:underline"
            >
              +213 673 81 28 96
            </a>{" "}
            du samedi au jeudi entre 9 h et 18 h. Vous pouvez aussi nous
            écrire sur WhatsApp.
          </>
        ),
      },
      {
        q: "Comment modifier ou annuler ma commande ?",
        a: (
          <>
            Contactez-nous le plus rapidement possible. Tant que la commande
            n&apos;est pas expédiée, nous pouvons la modifier ou
            l&apos;annuler sans frais.
          </>
        ),
      },
    ],
  },
  {
    slug: "livraison",
    title: "Livraison",
    items: [
      {
        q: "Quels sont les délais de livraison ?",
        a: <>Entre 48 h et 72 h ouvrées dans la plupart des wilayas, parfois plus pour les régions éloignées du Sud.</>,
      },
      {
        q: "Livrez-vous dans toutes les wilayas ?",
        a: <>Oui — nous livrons dans les 58 wilayas d&apos;Algérie.</>,
      },
      {
        q: "Qu'est-ce que le Stop Desk ?",
        a: (
          <>
            C&apos;est un point relais : le colis arrive dans une agence
            partenaire de votre commune, et vous passez le récupérer
            quand cela vous arrange. C&apos;est l&apos;option la plus
            économique.
          </>
        ),
      },
    ],
  },
  {
    slug: "paiement",
    title: "Paiement",
    items: [
      {
        q: "Quels modes de paiement acceptez-vous ?",
        a: <>Paiement à la livraison, en espèces uniquement.</>,
      },
      {
        q: "Le paiement à la livraison est-il sécurisé ?",
        a: <>Oui. Vous ne payez qu&apos;une fois le colis remis et inspecté.</>,
      },
    ],
  },
  {
    slug: "retours",
    title: "Retours et garantie",
    items: [
      {
        q: "Comment retourner un produit ?",
        a: (
          <>
            Vous avez 30 jours à compter de la réception pour nous
            retourner un produit non utilisé, dans son emballage
            d&apos;origine. Contactez-nous pour organiser le retour.
          </>
        ),
      },
      {
        q: "Mon produit est défectueux, que faire ?",
        a: (
          <>
            Contactez-nous avec une photo ou une vidéo du défaut. Nous
            organisons l&apos;échange ou le remboursement selon la
            situation, sans frais pour vous.
          </>
        ),
      },
    ],
  },
  {
    slug: "compte",
    title: "Compte et données",
    items: [
      {
        q: "Dois-je créer un compte pour commander ?",
        a: <>Non. Vous pouvez commander sans créer de compte — il suffit de remplir le formulaire de livraison.</>,
      },
      {
        q: "Comment sont utilisées mes données ?",
        a: <>Uniquement pour traiter votre commande. Nous ne revendons jamais vos informations à des tiers.</>,
      },
    ],
  },
  {
    slug: "contact",
    title: "Boutique et contact",
    items: [
      {
        q: "Comment vous contacter ?",
        a: (
          <>
            Par téléphone au{" "}
            <a
              href="tel:+213673812896"
              className="text-tangerine-700 hover:underline"
            >
              +213 673 81 28 96
            </a>
            , sur WhatsApp, ou via notre formulaire de{" "}
            <Link
              href="/contact"
              className="text-tangerine-700 hover:underline"
            >
              contact
            </Link>
            .
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="flex flex-1 flex-col bg-cream py-10 md:py-14">
      <div className="mx-auto w-full max-w-4xl px-6 md:px-10">
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
          <span className="text-forest-900">FAQ</span>
        </nav>

        {/* Header */}
        <header className="mt-6 max-w-2xl md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            Aide
          </p>
          <h1 className="mt-3 font-display text-[40px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 sm:text-[56px] md:text-[64px]">
            Questions fréquentes
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wood-700 sm:text-base">
            Les réponses aux questions qu&apos;on nous pose le plus
            souvent. Vous ne trouvez pas la vôtre ? Appelez-nous au{" "}
            <a
              href="tel:+213673812896"
              className="font-semibold text-tangerine-700 hover:underline"
            >
              +213 673 81 28 96
            </a>
            .
          </p>
        </header>

        {/* Topics */}
        <div className="mt-10 flex flex-col gap-10 md:mt-14 md:gap-14">
          {TOPICS.map((topic) => (
            <section
              key={topic.slug}
              id={topic.slug}
              className="scroll-mt-24 md:scroll-mt-32"
            >
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine-700">
                {topic.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-2">
                {topic.items.map((item) => (
                  <li key={item.q}>
                    <details className="group rounded-xl border border-wood-300/50 bg-cream-deep/30 transition-colors hover:border-wood-400/70 open:border-tangerine-500/60 open:bg-cream">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-5">
                        <span className="font-display text-[15px] font-semibold leading-snug text-forest-900 sm:text-base">
                          {item.q}
                        </span>
                        <span
                          aria-hidden
                          className="grid size-7 shrink-0 place-items-center rounded-full bg-cream text-forest-900 ring-1 ring-wood-300/70 transition-all duration-300 group-open:bg-forest-900 group-open:text-cream group-open:ring-forest-900"
                        >
                          <ChevronDown
                            className="size-4 transition-transform duration-300 group-open:rotate-180"
                            strokeWidth={2.2}
                          />
                        </span>
                      </summary>
                      <div className="border-t border-wood-300/40 px-4 py-4 text-sm leading-relaxed text-wood-700 sm:px-5 sm:py-5 sm:text-[15px]">
                        {item.a}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 rounded-2xl border border-wood-300/50 bg-forest-900 px-6 py-8 text-center text-cream md:mt-20 md:px-10 md:py-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-tangerine-300">
            Toujours bloqué·e
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.01em] sm:text-3xl">
            On vous répond en direct.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream/80 sm:text-base">
            Notre équipe est disponible du samedi au jeudi, de 9 h à 18 h.
          </p>
          <a
            href="tel:+213673812896"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-6 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-colors hover:bg-tangerine-600"
          >
            +213 673 81 28 96
          </a>
        </div>
      </div>
    </main>
  );
}
