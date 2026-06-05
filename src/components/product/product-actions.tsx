"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useLocalizedRouter } from "@/components/ui/locale-link";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { useLanguage, useProductName } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * Floating favorite action for product cards. Mounted as a child of
 * the card's absolute-positioning context (the card image wrapper),
 * pinned to its top-end corner. Click toggles the product in the
 * shared favorites store and stops propagation so the surrounding
 * link/TentLink doesn't navigate.
 */
export function ProductActions({
  product,
  className,
}: {
  product?: Product;
  className?: string;
}) {
  const { has, toggle } = useFavorites();
  const { customer } = useAuth();
  const router = useLocalizedRouter();
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const productName = useProductName();
  const favorited = product ? has(product.slug) : false;

  const onFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;
    // Favorites are a logged-in-only feature: anonymous users get
    // bounced to /login with a `next` param so they land back on the
    // page they were browsing after authenticating.
    if (!customer) {
      const next = pathname && pathname.startsWith("/") ? pathname : "/";
      toast(
        lang === "ar"
          ? "سجّل الدخول لحفظ المفضلة"
          : "Connectez-vous pour enregistrer vos favoris",
      );
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    // Toggle BEFORE checking — `favorited` reflects state-as-of-render,
    // and after toggle() the new state is the opposite.
    toggle(product);
    const name = productName(product);
    const wasFavorited = favorited;
    if (wasFavorited) {
      toast(
        lang === "ar"
          ? `تم حذف ${name} من المفضلة`
          : `${name} retiré des favoris`,
      );
    } else {
      toast.success(
        lang === "ar"
          ? `تم إضافة ${name} إلى المفضلة`
          : `${name} ajouté aux favoris`,
      );
    }
  };

  return (
    <div
      className={cn(
        "absolute end-3 top-3 z-10 flex flex-col gap-1.5 sm:end-4 sm:top-4",
        className
      )}
    >
      <button
        type="button"
        onClick={onFavorite}
        aria-label={
          favorited ? t("actions.favorite.remove") : t("actions.favorite.add")
        }
        aria-pressed={favorited}
        className={cn(
          "grid size-8 place-items-center rounded-full bg-cream/95 shadow-sm backdrop-blur-sm",
          "transition-all duration-200 hover:bg-cream hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500",
          favorited
            ? "text-tangerine-600"
            : "text-forest-900 hover:text-tangerine-700"
        )}
      >
        <Heart
          className="size-4"
          strokeWidth={1.8}
          fill={favorited ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
}
