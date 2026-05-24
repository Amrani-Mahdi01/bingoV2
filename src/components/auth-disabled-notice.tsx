"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

import { useLanguage } from "@/lib/i18n";

/**
 * Placeholder rendered by /login and /register when the auth flow is
 * feature-gated off (NEXT_PUBLIC_AUTH_ENABLED !== "true"). Lets us ship
 * the storefront to Vercel without the Laravel backend wired up.
 */
export function AuthDisabledNotice() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <main className="flex flex-1 items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-forest-900 text-cream">
          <Lock className="size-6" strokeWidth={1.8} />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-[-0.01em] text-forest-900 sm:text-3xl">
          {isAr ? "قريباً" : "Bientôt disponible"}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-wood-700 sm:text-base">
          {isAr
            ? "تسجيل الحسابات سيكون متاحاً قريباً. بإمكانك تصفّح المتجر وإتمام طلباتك كزائر في غضون ذلك."
            : "La création de compte arrive prochainement. En attendant, vous pouvez parcourir la boutique et passer commande en tant qu'invité."}
        </p>
        <Link
          href="/catalogue"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-6 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-colors hover:bg-tangerine-600"
        >
          {isAr ? "تصفّح الكتالوج" : "Explorer le catalogue"}
          <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
        </Link>
      </div>
    </main>
  );
}
