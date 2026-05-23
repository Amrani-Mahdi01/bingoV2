"use client";

import * as React from "react";
import { Check, Heart, ShoppingBag } from "lucide-react";

import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * Floating favorite + add-to-cart action cluster for product cards.
 *
 * Mount as a child of the card's absolute-positioning context (the
 * card image wrapper). Positions itself at the top-end of that
 * wrapper. Clicks call preventDefault + stopPropagation so the
 * surrounding link/TentLink doesn't navigate, and the cart button
 * pushes the product into the shared cart via `useCart()`.
 */
export function ProductActions({
  product,
  className,
}: {
  /** Required for the cart button to actually add anything. */
  product?: Product;
  className?: string;
}) {
  const { addItem } = useCart();
  const { has, toggle } = useFavorites();
  const favorited = product ? has(product.slug) : false;
  const [added, setAdded] = React.useState(false);
  const addedTimeoutRef = React.useRef<number | null>(null);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onFavorite = (e: React.MouseEvent) => {
    stop(e);
    if (!product) return;
    toggle(product.slug);
  };

  const onAdd = (e: React.MouseEvent) => {
    stop(e);
    if (!product) return;
    addItem(product, 1);
    setAdded(true);
    if (addedTimeoutRef.current) window.clearTimeout(addedTimeoutRef.current);
    addedTimeoutRef.current = window.setTimeout(() => setAdded(false), 1500);
  };

  React.useEffect(
    () => () => {
      if (addedTimeoutRef.current) window.clearTimeout(addedTimeoutRef.current);
    },
    []
  );

  return (
    <div
      className={cn(
        "absolute end-3 top-3 z-10 flex flex-col gap-1.5 sm:end-4 sm:top-4",
        className
      )}
    >
      {/* Favorite */}
      <button
        type="button"
        onClick={onFavorite}
        aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
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

      {/* Add to cart */}
      <button
        type="button"
        onClick={onAdd}
        aria-label={added ? "Ajouté au panier" : "Ajouter au panier"}
        aria-pressed={added}
        className={cn(
          "grid size-8 place-items-center rounded-full shadow-sm backdrop-blur-sm",
          "transition-all duration-200 hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500",
          added
            ? "bg-forest-900 text-cream"
            : "bg-cream/95 text-forest-900 hover:bg-cream hover:text-tangerine-700"
        )}
      >
        {added ? (
          <Check className="size-4" strokeWidth={2.4} />
        ) : (
          <ShoppingBag className="size-4" strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}
