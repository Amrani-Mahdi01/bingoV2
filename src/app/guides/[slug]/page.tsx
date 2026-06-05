import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, Clock } from "lucide-react";

import { getGuide } from "@/lib/guides/guides";
import { getServerCategories } from "@/lib/server/site-contact";
import { withLocale } from "@/lib/locale";
import { pageMetadata, currentLocale } from "@/lib/seo/metadata";
import { absUrl } from "@/lib/seo/config";
import {
  JsonLd,
  article as articleJsonLd,
  faqPage,
  breadcrumb,
} from "@/lib/seo/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide introuvable", robots: { index: false } };
  return pageMetadata({
    cleanPath: `/guides/${slug}`,
    fr: { title: guide.title.fr, description: guide.description.fr },
    ar: { title: guide.title.ar, description: guide.description.ar },
    images: guide.image ? [absUrl(guide.image)] : undefined,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const locale = await currentLocale();
  const isAr = locale === "ar";
  const url = absUrl(withLocale(`/guides/${slug}`, locale));

  // Resolve related-category display names for internal links.
  const { list: categories } = await getServerCategories();
  const catName = new Map<string, string>();
  for (const c of categories) {
    catName.set(c.slug, isAr ? c.nameAr : c.nameFr);
    for (const sc of c.children ?? [])
      catName.set(sc.slug, isAr ? sc.nameAr : sc.nameFr);
  }
  const related = (guide.relatedCategories ?? [])
    .map((s) => ({ slug: s, name: catName.get(s) }))
    .filter((c): c is { slug: string; name: string } => !!c.name);

  const t = {
    home: isAr ? "الرئيسية" : "Accueil",
    guides: isAr ? "الأدلة" : "Guides",
    allGuides: isAr ? "كل الأدلة" : "Tous les guides",
    min: isAr ? "دقائق قراءة" : "min de lecture",
    faqTitle: isAr ? "الأسئلة الشائعة" : "Questions fréquentes",
    relatedTitle: isAr ? "في نفس الموضوع" : "Sur le même thème",
    catalogueCta: isAr ? "تصفّح الكتالوج" : "Voir le catalogue",
  };
  const publishedLabel = new Date(guide.datePublished).toLocaleDateString(
    isAr ? "ar-DZ" : "fr-DZ",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd
        data={[
          articleJsonLd({
            url,
            headline: guide.title[locale],
            description: guide.description[locale],
            image: guide.image ? absUrl(guide.image) : undefined,
            datePublished: guide.datePublished,
            dateModified: guide.dateModified,
            locale,
          }),
          breadcrumb([
            { name: t.home, path: withLocale("/", locale) },
            { name: t.guides, path: withLocale("/guides", locale) },
            { name: guide.title[locale], path: withLocale(`/guides/${slug}`, locale) },
          ]),
          ...(guide.faq?.length
            ? [
                faqPage(
                  guide.faq.map((f) => ({ q: f.q[locale], a: f.a[locale] }))
                ),
              ]
            : []),
        ]}
      />

      <Link
        href={withLocale("/guides", locale)}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-wood-600 transition-colors hover:text-tangerine-700"
      >
        <ArrowLeft className="size-3.5 rtl:rotate-180" strokeWidth={2.2} />
        {t.allGuides}
      </Link>

      <article className="mt-6">
        <header className="mb-8 border-b border-wood-200 pb-6">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-forest-900 sm:text-[40px]">
            {guide.title[locale]}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-wood-500">
            <span>{publishedLabel}</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3" strokeWidth={2} />
              {guide.readingMinutes} {t.min}
            </span>
          </div>
        </header>

        <div className="space-y-5 text-[15px] leading-[1.75] text-wood-800">
          {guide.blocks.map((block, i) => {
            if (block.type === "h2")
              return (
                <h2
                  key={i}
                  className="pt-3 font-display text-xl font-semibold text-forest-900"
                >
                  {block.text[locale]}
                </h2>
              );
            if (block.type === "ul")
              return (
                <ul key={i} className="space-y-2 ps-5">
                  {block.items.map((it, j) => (
                    <li key={j} className="list-disc marker:text-tangerine-500">
                      {it[locale]}
                    </li>
                  ))}
                </ul>
              );
            return <p key={i}>{block.text[locale]}</p>;
          })}
        </div>

        {guide.faq?.length ? (
          <section className="mt-12">
            <h2 className="mb-5 font-display text-2xl font-bold text-forest-900">
              {t.faqTitle}
            </h2>
            <div className="space-y-4">
              {guide.faq.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-wood-200 bg-white p-4 open:border-tangerine-300"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display font-semibold text-forest-900 [&::-webkit-details-marker]:hidden">
                    <span>{f.q[locale]}</span>
                    <ChevronDown
                      aria-hidden
                      strokeWidth={2.2}
                      className="size-5 shrink-0 text-tangerine-600 transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-wood-700">
                    {f.a[locale]}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {related.length ? (
          <section className="mt-12 rounded-2xl bg-forest-900 p-6 text-cream sm:p-8">
            <h2 className="font-display text-lg font-semibold">
              {t.relatedTitle}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {related.map((c) => (
                <Link
                  key={c.slug}
                  href={withLocale(`/catalogue?category=${c.slug}`, locale)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cream/10 px-4 py-2 font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:bg-tangerine-500"
                >
                  {c.name}
                  <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={2.2} />
                </Link>
              ))}
              <Link
                href={withLocale("/catalogue", locale)}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-4 py-2 font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:border-tangerine-400 hover:text-tangerine-300"
              >
                {t.catalogueCta}
              </Link>
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
