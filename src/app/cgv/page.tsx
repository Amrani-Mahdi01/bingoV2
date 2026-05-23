import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Conditions Générales de Vente — BINGO",
  description:
    "Les conditions générales de vente applicables aux commandes passées sur le site BINGO.",
};

const UPDATED_AT = "Octobre 2026";

type Article = { title: string; body: React.ReactNode };

const ARTICLES: Article[] = [
  {
    title: "Objet",
    body: (
      <p>
        Les présentes Conditions Générales de Vente (CGV) régissent toute
        commande passée sur le site BINGO. Elles s&apos;appliquent dès la
        validation de la commande, sans réserve d&apos;aucune autre
        condition.
      </p>
    ),
  },
  {
    title: "Vendeur",
    body: (
      <>
        <p>
          Le vendeur est <strong>BINGO Camping</strong>, boutique outdoor
          basée à Sétif (Algérie).
        </p>
        <p>
          Cité Dallas, Bâtiment 3 (près de LG) — 19000 Sétif, Algérie.
          Téléphone : <a href="tel:+213673812896" className="text-tangerine-700 hover:underline">+213 673 81 28 96</a>.
        </p>
      </>
    ),
  },
  {
    title: "Commande",
    body: (
      <p>
        Toute commande implique l&apos;acceptation pleine et entière des
        présentes CGV. Une commande est considérée comme ferme et définitive
        après confirmation téléphonique par notre équipe.
      </p>
    ),
  },
  {
    title: "Prix et paiement",
    body: (
      <>
        <p>
          Les prix sont indiqués en dinars algériens (DA), toutes taxes
          comprises. Les frais de livraison sont précisés avant validation
          de la commande.
        </p>
        <p>
          Le paiement s&apos;effectue à la livraison, en espèces ou par
          carte bancaire, sauf indication contraire.
        </p>
      </>
    ),
  },
  {
    title: "Garantie",
    body: (
      <p>
        Les produits vendus bénéficient de la garantie légale de
        conformité ainsi que de la garantie commerciale du fabricant
        lorsque celle-ci s&apos;applique. Les conditions précises de
        chaque garantie sont disponibles sur demande.
      </p>
    ),
  },
  {
    title: "Données personnelles",
    body: (
      <p>
        Vos informations (nom, téléphone, adresse) sont utilisées
        uniquement pour traiter votre commande. Elles ne sont jamais
        revendues à des tiers. Vous pouvez demander leur suppression à
        tout moment.
      </p>
    ),
  },
  {
    title: "Litiges et droit applicable",
    body: (
      <p>
        Les présentes CGV sont régies par le droit algérien. En cas de
        litige, une solution amiable sera recherchée en priorité avant
        toute action judiciaire.
      </p>
    ),
  },
];

export default function CGVPage() {
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
          <span className="text-forest-900">CGV</span>
        </nav>

        {/* Header */}
        <header className="mt-6 md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            Mentions légales
          </p>
          <h1 className="mt-3 font-display text-[40px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 sm:text-[56px] md:text-[64px]">
            Conditions générales de vente
          </h1>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-wood-600">
            Dernière mise à jour · {UPDATED_AT}
          </p>
        </header>

        {/* Articles */}
        <ol className="mt-10 flex flex-col gap-8 md:mt-14 md:gap-10">
          {ARTICLES.map((article, i) => (
            <li key={article.title} className="grid gap-3 md:grid-cols-[auto_1fr] md:gap-6">
              <span
                aria-hidden
                className="inline-grid h-9 w-fit place-items-center rounded-full bg-forest-900 px-3 font-mono text-[11px] font-bold tracking-[0.15em] text-cream md:mt-1"
              >
                Art. {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-xl font-bold leading-tight tracking-[-0.01em] text-forest-900 sm:text-2xl">
                  {article.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-wood-700 sm:text-[15px]">
                  {article.body}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Footer note */}
        <p className="mt-14 border-t border-wood-300/40 pt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-wood-600 md:mt-20">
          Pour toute question : <a href="tel:+213673812896" className="text-tangerine-700 transition-colors hover:text-tangerine-600">+213 673 81 28 96</a>
        </p>
      </div>
    </main>
  );
}
