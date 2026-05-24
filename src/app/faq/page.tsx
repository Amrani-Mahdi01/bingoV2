"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { useLanguage } from "@/lib/i18n";

type QA = { q: string; a: React.ReactNode };
type Topic = { slug: string; title: string; items: QA[] };

const PHONE = "+213 673 81 28 96";
const PHONE_HREF = "tel:+213673812896";

export default function FaqPage() {
  const { t } = useLanguage();

  const TOPICS: Topic[] = [
    {
      slug: "commande",
      title: t("faq.cat.order"),
      items: [
        { q: t("faq.q.order.1"), a: t("faq.a.order.1") },
        {
          q: t("faq.q.order.2"),
          a: (
            <>
              {t("faq.a.order.2.before")}
              <a
                href={PHONE_HREF}
                dir="ltr"
                className="inline-block text-tangerine-700 hover:underline"
              >
                {PHONE}
              </a>
              {t("faq.a.order.2.after")}
            </>
          ),
        },
        { q: t("faq.q.order.3"), a: t("faq.a.order.3") },
      ],
    },
    {
      slug: "livraison",
      title: t("faq.cat.delivery"),
      items: [
        { q: t("faq.q.delivery.1"), a: t("faq.a.delivery.1") },
        { q: t("faq.q.delivery.2"), a: t("faq.a.delivery.2") },
        { q: t("faq.q.delivery.3"), a: t("faq.a.delivery.3") },
      ],
    },
    {
      slug: "paiement",
      title: t("faq.cat.payment"),
      items: [
        { q: t("faq.q.payment.1"), a: t("faq.a.payment.1") },
        { q: t("faq.q.payment.2"), a: t("faq.a.payment.2") },
      ],
    },
    {
      slug: "retours",
      title: t("faq.cat.returns"),
      items: [
        { q: t("faq.q.returns.1"), a: t("faq.a.returns.1") },
        { q: t("faq.q.returns.2"), a: t("faq.a.returns.2") },
      ],
    },
    {
      slug: "compte",
      title: t("faq.cat.account"),
      items: [
        { q: t("faq.q.account.1"), a: t("faq.a.account.1") },
        { q: t("faq.q.account.2"), a: t("faq.a.account.2") },
      ],
    },
    {
      slug: "contact",
      title: t("faq.cat.contact"),
      items: [
        {
          q: t("faq.q.contact.1"),
          a: (
            <>
              {t("faq.a.contact.1.before")}
              <a
                href={PHONE_HREF}
                dir="ltr"
                className="inline-block text-tangerine-700 hover:underline"
              >
                {PHONE}
              </a>
              {t("faq.a.contact.1.middle")}
              <Link
                href="/contact"
                className="text-tangerine-700 hover:underline"
              >
                {t("faq.a.contact.1.link")}
              </Link>
              .
            </>
          ),
        },
      ],
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
          <span className="text-forest-900">{t("footer.help.faq")}</span>
        </nav>

        {/* Header */}
        <header className="mt-6 max-w-2xl md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            {t("faq.eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-[40px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 rtl:pb-2 rtl:leading-[1.25] sm:text-[56px] md:text-[64px]">
            {t("faq.title")}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wood-700 sm:text-base">
            {t("faq.subtitle.before")}
            <a
              href={PHONE_HREF}
              dir="ltr"
              className="inline-block font-semibold text-tangerine-700 hover:underline"
            >
              {PHONE}
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
            {t("faq.cta.eyebrow")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.01em] sm:text-3xl">
            {t("faq.cta.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream/80 sm:text-base">
            {t("faq.cta.subtitle")}
          </p>
          <a
            href={PHONE_HREF}
            dir="ltr"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-6 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-colors hover:bg-tangerine-600"
          >
            {PHONE}
          </a>
        </div>
      </div>
    </main>
  );
}
