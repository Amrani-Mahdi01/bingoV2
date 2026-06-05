"use client";

import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ArrowRight, Compass, MapPin } from "lucide-react";

import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Storefront 404 — fired by Next.js whenever a route or notFound()
 * helper kicks in. Lives at app/not-found.tsx so the layout chrome
 * (header / footer / providers) renders around it.
 *
 * Brand metaphor: "Hors piste" / "خارج المسار" — off-trail. Fits
 * the outdoor identity and reads less like a system error and more
 * like a polite redirect. RTL is handled by the i18n provider on
 * <html dir>; we just use start/end utilities so layouts mirror.
 */
export default function NotFound() {
  const { t, lang } = useLanguage();

  return (
    <main className="flex flex-1 items-center justify-center bg-cream px-6 py-20 md:py-28">
      <div className="relative mx-auto w-full max-w-3xl">
        {/* Decorative topo lines — subtle, evocative of a map.
            Pointer-events-none so they don't interfere with clicks. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-[0.07]"
        >
          <TopoSwirl />
        </div>

        <div className="relative text-center">
          {/* Big 404 with a tent-peak accent over the middle "0" */}
          <div className="relative inline-flex items-end justify-center font-display text-[112px] font-black leading-none tracking-[-0.04em] text-forest-900 sm:text-[160px] md:text-[200px]">
            <span>4</span>
            <span className="relative mx-1">
              {/* Tent / mountain peak nested inside the zero so the
                  number doubles as a tiny outdoor scene. */}
              <span className="relative inline-block">
                0
                <span
                  aria-hidden
                  className="absolute inset-x-[18%] bottom-[18%] grid h-[34%] place-items-end"
                >
                  <span className="block size-full origin-bottom-left rotate-[24deg] border-b-[3px] border-l-[3px] border-tangerine-500" />
                </span>
              </span>
            </span>
            <span>4</span>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-wood-300/70 bg-cream-deep/30 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            <MapPin className="size-3" strokeWidth={2.2} />
            {t("notFound.eyebrow")}
          </p>

          <h1
            className={cn(
              "mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-5xl md:text-6xl",
              // Cairo (Arabic display font) sits lower on the baseline
              // than DM Sans, so its descenders clip without extra room.
              lang === "ar" && "leading-[1.3] pb-1",
            )}
          >
            {t("notFound.title")}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-wood-700 sm:text-base">
            {t("notFound.lead")}
          </p>

          {/* CTAs — primary tangerine, secondary outline */}
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className={cn(
                "group inline-flex items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5",
                "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
                "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
                "transition-all duration-200 hover:-translate-y-0.5 hover:bg-tangerine-600",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40",
              )}
            >
              {t("notFound.home")}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>
            <Link
              href="/catalogue"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full border border-wood-300 bg-cream px-6 py-3",
                "font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-forest-900",
                "transition-colors hover:border-forest-900 hover:bg-cream-deep",
              )}
            >
              <Compass className="size-4" strokeWidth={2} />
              {t("notFound.catalogue")}
            </Link>
          </div>

          {/* Divider + help line */}
          <div className="mx-auto mt-12 flex max-w-sm items-center gap-3">
            <span className="h-px flex-1 bg-wood-300/60" />
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-wood-500">
              {t("notFound.coords")}
            </span>
            <span className="h-px flex-1 bg-wood-300/60" />
          </div>
          <p className="mt-4 text-xs text-wood-600">
            {t("notFound.helpPrefix")}{" "}
            <Link
              href="/contact"
              className="font-semibold text-tangerine-700 underline-offset-4 hover:underline"
            >
              {t("notFound.helpLink")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

/** Faint topographic-style background lines. Drawn as concentric
 *  rounded paths so it reads as a contour map without needing an
 *  image asset. */
function TopoSwirl() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="size-[480px] sm:size-[620px] md:size-[760px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <g className="text-forest-900">
        {[160, 130, 100, 72, 46].map((r, i) => (
          <ellipse
            key={r}
            cx="200"
            cy="200"
            rx={r}
            ry={r * 0.78}
            transform={`rotate(${i * 8} 200 200)`}
          />
        ))}
      </g>
    </svg>
  );
}
