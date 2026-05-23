"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";

import { ProductActions } from "@/components/product/product-actions";
import { TentLink } from "@/components/ui/tent-link";
import { productHref } from "@/lib/catalogue";
import { useCart } from "@/lib/cart";
import {
  discountPercent,
  formatDA,
  PRODUCTS,
  type Product,
} from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * Product details page — Embla image slider, title, price, truncated
 * description with "lire la suite…" toggle, quantity stepper, two CTAs,
 * and a Similar Products grid.
 */
export function ProductDetails({ product }: { product: Product }) {
  const router = useRouter();
  const pct = discountPercent(product.price, product.oldPrice);
  const [qty, setQty] = React.useState(1);
  const [expanded, setExpanded] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const { addItem } = useCart();

  const isLong = product.description.length > 160;

  // Push the current product (× qty) into the shared cart and flash
  // the buttons to "Ajouté ✓" for a moment as confirmation.
  const addedTimeoutRef = React.useRef<number | null>(null);
  const handleAddToCart = React.useCallback(() => {
    addItem(product, qty);
    setAdded(true);
    if (addedTimeoutRef.current) window.clearTimeout(addedTimeoutRef.current);
    addedTimeoutRef.current = window.setTimeout(() => setAdded(false), 1500);
  }, [addItem, product, qty]);

  // "Commander maintenant" = add the current product to the cart and
  // jump straight to the checkout page.
  const handleBuyNow = React.useCallback(() => {
    addItem(product, qty);
    router.push("/commander");
  }, [addItem, product, qty, router]);

  React.useEffect(
    () => () => {
      if (addedTimeoutRef.current) window.clearTimeout(addedTimeoutRef.current);
    },
    []
  );

  // Real gallery from the product. Falls back to the single image
  // when `images` isn't populated.
  const sliderImages: string[] =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  return (
    <main className="relative flex flex-1 flex-col bg-cream py-12 pb-28 md:py-16 lg:pb-16">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <TentLink
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-700 transition-colors hover:text-tangerine-700"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2.2} />
          Retour à l&apos;accueil
        </TentLink>

        <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-2 md:gap-10 lg:gap-16">
          {/* Image slider */}
          <ProductImageSlider
            images={sliderImages}
            name={product.name}
            discount={pct}
          />

          {/* Body */}
          <div className="flex flex-col">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-tangerine-700">
              {product.brand}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl md:text-5xl">
              {product.name}
            </h1>

            <div className="mt-6 flex flex-col leading-tight">
              <span className="font-display text-3xl font-bold tracking-tight text-tangerine-700 md:text-4xl">
                {formatDA(product.price)}
              </span>
              {product.oldPrice ? (
                <span className="mt-1 font-mono text-sm text-wood-500 line-through">
                  {formatDA(product.oldPrice)}
                </span>
              ) : null}
            </div>

            {/* Description + read-more */}
            <div className="mt-6">
              <p
                className={cn(
                  "text-base leading-relaxed text-wood-700",
                  isLong && !expanded && "line-clamp-3"
                )}
              >
                {product.description}
              </p>
              {isLong ? (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  aria-expanded={expanded}
                  className="mt-2 font-display text-sm font-semibold text-tangerine-700 underline-offset-4 transition-colors hover:text-tangerine-600 hover:underline"
                >
                  {expanded ? "Lire moins" : "Lire la suite…"}
                </button>
              ) : null}
            </div>

            {/* Quantity stepper */}
            <div className="mt-7 flex items-center gap-4">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-700">
                Quantité
              </span>
              <div className="inline-flex items-center rounded-full border border-wood-300 bg-cream">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Diminuer la quantité"
                  className="grid size-10 place-items-center rounded-full text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
                >
                  <Minus className="size-4" strokeWidth={2.2} />
                </button>
                <span
                  aria-live="polite"
                  className="min-w-8 px-2 text-center font-display text-base font-semibold text-forest-900"
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Augmenter la quantité"
                  className="grid size-10 place-items-center rounded-full text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
                >
                  <Plus className="size-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* CTAs — inline (desktop). On mobile the same actions
                live in the fixed bottom bar at the page edge. */}
            <div className="mt-8 hidden flex-col gap-3 sm:flex-row lg:flex">
              <button
                type="button"
                onClick={handleBuyNow}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5",
                  "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
                  "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:bg-tangerine-600",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40"
                )}
              >
                Commander maintenant
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-6 py-3.5",
                  "font-display text-[13px] font-semibold uppercase tracking-[0.16em]",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900/30",
                  added
                    ? "border-forest-900 bg-forest-900 text-cream"
                    : "border-wood-300 bg-cream text-forest-900 hover:border-forest-900 hover:bg-cream-deep"
                )}
              >
                {added ? (
                  <>
                    <Check className="size-4" strokeWidth={2.4} />
                    Ajouté
                  </>
                ) : (
                  <>
                    <ShoppingBag className="size-4" strokeWidth={2} />
                    Ajouter au panier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Similar products */}
        <SimilarProducts currentSlug={product.slug} />
      </div>

      {/* Fixed mobile action bar — Commander + Ajouter au panier.
          Pinned to the bottom edge of the viewport so the actions stay
          reachable from any scroll position. Hidden on lg+ where the
          inline CTAs are visible. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-wood-300/40 bg-cream/95 backdrop-blur-md shadow-[0_-8px_24px_-12px_rgba(31,58,30,0.18)] lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={handleAddToCart}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-4 py-3",
              "font-display text-[12px] font-semibold uppercase tracking-[0.14em]",
              "transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900/30",
              added
                ? "border-forest-900 bg-forest-900 text-cream"
                : "border-wood-300 bg-cream text-forest-900 hover:border-forest-900 hover:bg-cream-deep"
            )}
          >
            {added ? (
              <>
                <Check className="size-4" strokeWidth={2.4} />
                Ajouté
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" strokeWidth={2} />
                Ajouter
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-tangerine-500 px-4 py-3",
              "font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-cream",
              "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
              "transition-all duration-200 hover:bg-tangerine-600",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40"
            )}
          >
            Commander
          </button>
        </div>
      </div>
    </main>
  );
}

/* ───── Image slider — Embla autoplay carousel, thumbnail rail
       on the left (desktop) / under the image (mobile) ──────────── */
function ProductImageSlider({
  images,
  name,
  discount,
}: {
  images: string[];
  name: string;
  discount: number | null;
}) {
  // Autoplay: continues after user interaction (timer resets), pauses
  // while the mouse is over the slider.
  const autoplay = React.useRef(
    Autoplay({
      delay: 4500,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      duration: 22,
    },
    [autoplay.current]
  );
  const [selected, setSelected] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const hasMany = images.length > 1;

  return (
    <div>
      {/* Main slider */}
      <div className="relative">
        <div
          ref={emblaRef}
          className="overflow-hidden rounded-2xl border border-wood-300/50 bg-wood-100"
        >
          <div className="flex touch-pan-y select-none">
            {images.map((src, i) => (
              <div
                key={i}
                className="relative aspect-square w-full shrink-0 basis-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${name} — ${i + 1}`}
                  draggable={false}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Discount badge */}
        {discount ? (
          <span className="pointer-events-none absolute end-4 top-4 z-10 inline-flex items-center rounded-full bg-tangerine-500 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-cream shadow-lg">
            -{discount}%
          </span>
        ) : null}

        {/* Side arrows */}
        {hasMany ? (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Image précédente"
              className="absolute start-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-cream/85 text-forest-900 backdrop-blur transition-all hover:bg-cream hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Image suivante"
              className="absolute end-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-cream/85 text-forest-900 backdrop-blur transition-all hover:bg-cream hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
            >
              <ChevronRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
            </button>
          </>
        ) : null}
      </div>

      {/* Thumbnail strip — under the main image, aligned to the start
          (left in LTR / right in RTL) */}
      {hasMany ? (
        <div className="mt-4 flex items-center justify-start gap-2 sm:gap-2.5">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Voir l'image ${i + 1}`}
              aria-current={i === selected}
              className={cn(
                "relative size-14 shrink-0 overflow-hidden rounded-md sm:size-16",
                "transition-all duration-200 ease-out",
                i === selected
                  ? "ring-2 ring-tangerine-500 ring-offset-2 ring-offset-cream"
                  : "opacity-65 ring-1 ring-wood-300/70 hover:opacity-100 hover:ring-wood-500",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                aria-hidden
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ───── Similar products — same card design as the best-sellers
       section (cf. best-sellers.tsx::ProductCard), minus the rank
       badge since these aren't ranked. ──────────────────────────── */
function SimilarProducts({ currentSlug }: { currentSlug: string }) {
  const items = PRODUCTS.filter((p) => p.slug !== currentSlug).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="similar-title"
      className="mt-16 border-t border-wood-300/40 pt-12 md:mt-20 md:pt-16"
    >
      <header className="mb-8 md:mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-700">
          Découvrir aussi
        </p>
        <h2
          id="similar-title"
          className="mt-2 font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-forest-900 sm:text-3xl md:text-[2rem]"
        >
          Produits similaires
        </h2>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5">
        {items.map((p) => (
          <li key={p.slug}>
            <SimilarProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SimilarProductCard({ product }: { product: Product }) {
  const pct = discountPercent(product.price, product.oldPrice);

  return (
    <TentLink
      href={productHref(product.slug)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-wood-300/50 bg-cream",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-14px_rgba(31,58,30,0.22)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-wood-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />

        {pct ? (
          <span className="absolute start-3 top-3 inline-flex items-center rounded-full bg-tangerine-500 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cream shadow-sm sm:start-4 sm:top-4">
            -{pct}%
          </span>
        ) : null}

        <ProductActions product={product} />
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="truncate font-display text-[14.5px] font-semibold leading-snug text-forest-900 sm:text-base">
          {product.name}
        </h3>
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-wood-600">
          {product.brand}
        </p>
        <div className="mt-3 flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight text-tangerine-700 sm:text-xl">
            {formatDA(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="mt-0.5 block font-mono text-[11px] text-wood-500 line-through">
              {formatDA(product.oldPrice)}
            </span>
          ) : null}
        </div>

        {/* Commander pill — anchored to the bottom */}
        <div className="mt-auto pt-3 sm:pt-4">
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-900 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cream transition-colors duration-300 group-hover:bg-tangerine-500 sm:py-2.5">
            <ShoppingBag className="size-3" strokeWidth={2.2} />
            Commander
          </span>
        </div>
      </div>
    </TentLink>
  );
}
