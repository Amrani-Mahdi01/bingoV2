"use client";

import * as React from "react";
import { useLocalizedRouter } from "@/components/ui/locale-link";
import { ShoppingCart } from "lucide-react";

import { useLanguage } from "@/lib/i18n";
import { isProductOutOfStock, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * "Ajouter au panier" pill button for product cards.
 *
 * Clicks navigate to the product's detail page (`/produit/[slug]`)
 * instead of pushing straight to the cart — that page is where the
 * customer picks the color + size variant. Adding to cart from a card
 * would skip the variant selection and silently land an
 * un-disambiguated line in their basket. Stops propagation so the
 * outer card link doesn't also navigate (same URL, but a single
 * router push is cleaner).
 *
 * When the product is out of stock (top-level stock = 0, tracked, no
 * backorder) the button renders disabled with an "Épuisé" label — the
 * product stays visible in the catalogue, it just can't be ordered.
 * Variants override at the detail page so we only block here when the
 * no-variant rule says so.
 */
export function AddToCartButton({
  product,
  className,
}: {
  product?: Product;
  className?: string;
}) {
  const router = useLocalizedRouter();
  const { t, lang } = useLanguage();
  const outOfStock = product
    ? isProductOutOfStock(product)
    : false;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product || outOfStock) return;
    router.push(`/produit/${product.slug}`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={outOfStock}
      aria-label={outOfStock ? (lang === "ar" ? "نفد المخزون" : "Épuisé") : t("card.addToCart")}
      className={cn(
        "inline-flex h-7 w-full items-center justify-center gap-2 rounded-2xl px-3 sm:h-9 sm:flex-1",
        "border border-forest-900 text-forest-900",
        "font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-900/15",
        outOfStock
          ? "cursor-not-allowed border-wood-300 bg-cream-deep/40 text-wood-500"
          : "bg-cream hover:bg-forest-900 hover:text-cream",
        className
      )}
    >
      <ShoppingCart className="size-3" strokeWidth={2.2} />
      {outOfStock
        ? lang === "ar" ? "نفد" : "Épuisé"
        : t("card.addShort")}
    </button>
  );
}
