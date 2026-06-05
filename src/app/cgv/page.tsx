"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ChevronRight } from "lucide-react";

import { useLanguage } from "@/lib/i18n";

type Article = { title: string; body: React.ReactNode };

const PHONE = "+213 673 81 28 96";
const PHONE_HREF = "tel:+213673812896";

export default function CGVPage() {
  const { t } = useLanguage();

  const phoneLink = (
    <a
      href={PHONE_HREF}
      dir="ltr"
      className="inline-block text-tangerine-700 hover:underline"
    >
      {PHONE}
    </a>
  );

  const ARTICLES: Article[] = [
    {
      title: t("cgv.art.1.title"),
      body: <p>{t("cgv.art.1.body")}</p>,
    },
    {
      title: t("cgv.art.2.title"),
      body: (
        <>
          <p>
            {t("cgv.art.2.body.p1.before")}
            <strong>{t("cgv.art.2.body.p1.brand")}</strong>
            {t("cgv.art.2.body.p1.after")}
          </p>
          <p>
            {t("cgv.art.2.body.p2.before")}
            {phoneLink}.
          </p>
        </>
      ),
    },
    {
      title: t("cgv.art.3.title"),
      body: <p>{t("cgv.art.3.body")}</p>,
    },
    {
      title: t("cgv.art.4.title"),
      body: (
        <>
          <p>{t("cgv.art.4.body.p1")}</p>
          <p>{t("cgv.art.4.body.p2")}</p>
        </>
      ),
    },
    {
      title: t("cgv.art.5.title"),
      body: <p>{t("cgv.art.5.body")}</p>,
    },
    {
      title: t("cgv.art.6.title"),
      body: <p>{t("cgv.art.6.body")}</p>,
    },
    {
      title: t("cgv.art.7.title"),
      body: <p>{t("cgv.art.7.body")}</p>,
    },
  ];

  return (
    <main className="flex flex-1 flex-col bg-cream py-10 md:py-14">
      <div className="mx-auto w-full max-w-4xl px-6 md:px-10">
        {/* Breadcrumb */}
        <nav
          aria-label={t("breadcrumb.aria")}
          className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700"
        >
          <Link href="/" className="transition-colors hover:text-tangerine-700">
            {t("breadcrumb.home")}
          </Link>
          <ChevronRight
            className="size-3 text-wood-500 rtl:rotate-180"
            strokeWidth={2.2}
          />
          <span className="text-forest-900">{t("footer.about.cgv")}</span>
        </nav>

        {/* Header */}
        <header className="mt-6 md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            {t("cgv.eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-[40px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 rtl:pb-2 rtl:leading-[1.25] sm:text-[56px] md:text-[64px]">
            {t("cgv.title")}
          </h1>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-wood-600">
            {t("cgv.updated")} · {t("cgv.updatedAt")}
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
                {t("cgv.artPrefix")} {String(i + 1).padStart(2, "0")}
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
          {t("cgv.footer.question")}{" "}
          <a
            href={PHONE_HREF}
            dir="ltr"
            className="inline-block text-tangerine-700 transition-colors hover:text-tangerine-600"
          >
            {PHONE}
          </a>
        </p>
      </div>
    </main>
  );
}
