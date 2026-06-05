import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

import { GUIDES } from "@/lib/guides/guides";
import { withLocale } from "@/lib/locale";
import { pageMetadata, currentLocale } from "@/lib/seo/metadata";
import { JsonLd, breadcrumb } from "@/lib/seo/jsonld";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    cleanPath: "/guides",
    fr: {
      title: "Guides & conseils camping",
      description:
        "Nos guides d'achat pour bien choisir votre matériel de camping et d'aventure : tentes, sacs de couchage, et plus — adaptés au terrain algérien.",
    },
    ar: {
      title: "أدلة ونصائح التخييم",
      description:
        "أدلة الشراء لدينا لاختيار معدات التخييم والمغامرة بشكل صحيح: الخيام، أكياس النوم وأكثر — مناسبة للتضاريس الجزائرية.",
    },
  });
}

export default async function GuidesIndexPage() {
  const locale = await currentLocale();
  const isAr = locale === "ar";
  const heading = isAr ? "أدلة ونصائح" : "Guides & conseils";
  const intro = isAr
    ? "نصائح بسيطة وعملية لاختيار معدات التخييم والمغامرة المناسبة لك."
    : "Des conseils simples et concrets pour bien choisir votre matériel de camping et d'aventure.";
  const readLabel = isAr ? "اقرأ الدليل" : "Lire le guide";
  const minLabel = isAr ? "دقائق قراءة" : "min de lecture";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <JsonLd
        data={breadcrumb([
          { name: isAr ? "الرئيسية" : "Accueil", path: withLocale("/", locale) },
          { name: heading, path: withLocale("/guides", locale) },
        ])}
      />

      <header className="mb-10 max-w-2xl">
        <p className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-tangerine-700">
          <BookOpen className="size-3.5" strokeWidth={2.2} />
          {isAr ? "المدوّنة" : "Le journal"}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-forest-900 sm:text-4xl">
          {heading}
        </h1>
        <p className="mt-3 text-wood-700">{intro}</p>
      </header>

      <ul className="grid gap-5 sm:grid-cols-2">
        {GUIDES.map((g) => {
          const href = withLocale(`/guides/${g.slug}`, locale);
          return (
            <li key={g.slug}>
              <Link
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-wood-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-tangerine-300 hover:shadow-[0_18px_40px_-20px_rgba(31,58,30,0.35)]"
              >
                <span className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wood-500">
                  <Clock className="size-3" strokeWidth={2} />
                  {g.readingMinutes} {minLabel}
                </span>
                <h2 className="font-display text-lg font-semibold leading-snug text-forest-900 group-hover:text-tangerine-700">
                  {g.title[locale]}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-wood-700">
                  {g.excerpt[locale]}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-tangerine-600">
                  {readLabel}
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    strokeWidth={2.2}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
