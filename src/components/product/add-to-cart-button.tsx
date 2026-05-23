"use client";

import * as React from "react";
import { Check, ShoppingCart } from "lucide-react";

import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * Add-to-cart pill button for product cards. Click adds the product
 * to the shared cart (via useCart) and stops propagation so the
 * surrounding card link doesn't navigate. Briefly flashes a check on
 * success.
 */
export function AddToCartButton({
  product,
  className,
}: {
  product?: Product;
  className?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;
    addItem(product, 1);
    setAdded(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setAdded(false), 1500);
  };

  React.useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    []
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={added ? "Ajouté au panier" : "Ajouter au panier"}
      aria-pressed={added}
      className={cn(
        "inline-flex h-7 w-full items-center justify-center gap-2 rounded-2xl px-3 sm:h-9",
        "border border-forest-900 text-forest-900",
        "font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-900/15",
        added
          ? "border-tangerine-500 bg-tangerine-500 text-cream"
          : "bg-cream hover:bg-forest-900 hover:text-cream",
        className
      )}
    >
      {added ? (
        <>
          <Check className="size-3" strokeWidth={2.6} />
          <span>Ajouté</span>
        </>
      ) : (
        <>
          <ShoppingCart className="size-3" strokeWidth={2.2} />
          <span className="sm:hidden">Ajouter</span>
          <span className="hidden sm:inline">Ajouter au panier</span>
        </>
      )}
    </button>
  );
}
