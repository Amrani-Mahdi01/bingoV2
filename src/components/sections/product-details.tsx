"use client";

import * as React from "react";
import { useLocalizedRouter } from "@/components/ui/locale-link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  PlayCircle,
  Plus,
  ShoppingBag,
  X,
  ZoomIn,
} from "lucide-react";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ProductActions } from "@/components/product/product-actions";
import { ProductVideoPlayer } from "@/components/product/product-video-player";
import {
  MIN_ORDER_DZD,
  QuickOrderDialog,
} from "@/components/product/quick-order-dialog";
import { TentLink } from "@/components/ui/tent-link";
import { productHref } from "@/lib/catalogue";
import { useCart } from "@/lib/cart";
import {
  useFormatPrice,
  useLanguage,
  useProductDescription,
  useProductName,
} from "@/lib/i18n";
import {
  discountPercent,
  isProductOutOfStock,
  type Product,
  type ProductVariant,
} from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * Product details page — Embla image slider, title, price, truncated
 * description with "lire la suite…" toggle, quantity stepper, two CTAs,
 * and a Similar Products grid.
 */
export function ProductDetails({
  product,
  similar = [],
}: {
  product: Product;
  /** Optional pre-fetched "Produits similaires" list. When omitted /
   *  empty the SimilarProducts component falls back to the local mock
   *  catalogue so the section never renders blank. */
  similar?: Product[];
}) {
  const router = useLocalizedRouter();
  const { t, lang } = useLanguage();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
  const productDescription = useProductDescription();
  const description = productDescription(product);
  const [qty, setQty] = React.useState(1);
  const [expanded, setExpanded] = React.useState(false);
  // Direct-order popup — only used when this product already meets the
  // 1000 DA minimum; otherwise "Commander" routes through the cart.
  const [orderOpen, setOrderOpen] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const { addItem } = useCart();

  /* ─── Variant picker state ────────────────────────────────────────
     Color is picked first; the available size list is filtered to the
     selected color. Variants might lack one axis (e.g. size-only or
     color-only products) — pickers render only for the axis present. */
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  // Unique color list, preserving display order. A variant with no
  // colorNameFr is treated as a single "—" bucket (sizes-only flow).
  const colorOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const out: { hex: string | null; nameFr: string; nameAr: string }[] = [];
    for (const v of variants) {
      const key = (v.colorNameFr ?? "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        hex: v.colorHex,
        nameFr: v.colorNameFr ?? "",
        nameAr: v.colorNameAr ?? v.colorNameFr ?? "",
      });
    }
    return out.filter((c) => c.nameFr.length > 0);
  }, [variants]);

  const sizeOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of variants) {
      if (!v.sizeLabel) continue;
      if (seen.has(v.sizeLabel)) continue;
      seen.add(v.sizeLabel);
      out.push(v.sizeLabel);
    }
    return out;
  }, [variants]);

  const [selectedColor, setSelectedColor] = React.useState<string>(
    () => colorOptions[0]?.nameFr ?? "",
  );

  /** Sizes actually available for the currently selected color. */
  const sizesForColor = React.useMemo(() => {
    if (!selectedColor) return sizeOptions;
    return variants
      .filter((v) => (v.colorNameFr ?? "") === selectedColor)
      .map((v) => v.sizeLabel ?? "")
      .filter((s) => s.length > 0);
  }, [selectedColor, variants, sizeOptions]);

  const [selectedSize, setSelectedSize] = React.useState<string>(
    () => sizesForColor[0] ?? "",
  );

  // When the color changes, snap to the first size that exists for it
  // (avoids picking an unavailable combo from the previous color).
  React.useEffect(() => {
    if (sizesForColor.length === 0) return;
    if (!sizesForColor.includes(selectedSize)) {
      setSelectedSize(sizesForColor[0]);
    }
  }, [selectedColor, sizesForColor, selectedSize]);

  /** The variant currently matching color + size. Null when the
   *  product has no variants or no combo matches yet. */
  const selectedVariant: ProductVariant | null = React.useMemo(() => {
    if (!hasVariants) return null;
    return (
      variants.find(
        (v) =>
          (selectedColor ? (v.colorNameFr ?? "") === selectedColor : true) &&
          (selectedSize ? (v.sizeLabel ?? "") === selectedSize : true),
      ) ?? null
    );
  }, [hasVariants, variants, selectedColor, selectedSize]);

  // Effective price = base + variant delta. Falls back to product.price
  // when no variant is selected (no variants on this product).
  const effectivePrice = selectedVariant
    ? Math.max(0, product.price + selectedVariant.priceDelta)
    : product.price;
  const pct = discountPercent(effectivePrice, product.oldPrice);
  const stockForSelection = selectedVariant ? selectedVariant.stock : null;
  // Use the shared rule so it also blocks no-variant products that
  // are tracked + at zero stock + no backorder. The variant-stock
  // path is unchanged (selectedVariant takes priority over top-level).
  const outOfStock = isProductOutOfStock(product, selectedVariant);

  // Keep qty within the selected variant's stock (Bug #005). The stepper's
  // "+" already caps, but switching to a lower-stock variant after raising
  // the quantity would otherwise leave qty above what's available — re-clamp
  // here so the value can never exceed stock before it reaches the cart/order.
  React.useEffect(() => {
    if (stockForSelection == null) return;
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, stockForSelection)));
  }, [stockForSelection]);

  // Length probe runs against the visible text only — the raw HTML
  // includes tags that would skew the count.
  const plainLength = React.useMemo(
    () => description.replace(/<[^>]*>/g, "").length,
    [description],
  );
  const isLong = plainLength > 160;
  // Detect HTML content (admin-edited via RichEditor) vs plain text
  // (local mock catalogue). Rendering policy diverges between them.
  const isHtml = /<[a-z][^>]*>/i.test(description);

  // Snapshot of the variant for the cart line — captures the chosen
  // color + size + price delta at add-time so it persists even if the
  // product is later edited.
  const cartVariant = React.useMemo(() => {
    if (!selectedVariant) return undefined;
    return {
      id: selectedVariant.id,
      colorNameFr: selectedVariant.colorNameFr,
      colorNameAr: selectedVariant.colorNameAr,
      colorHex: selectedVariant.colorHex,
      sizeLabel: selectedVariant.sizeLabel,
      priceDelta: selectedVariant.priceDelta,
    };
  }, [selectedVariant]);

  // Push the current product (× qty × variant) into the shared cart
  // and flash the buttons to "Ajouté ✓" for a moment as confirmation.
  const addedTimeoutRef = React.useRef<number | null>(null);
  const handleAddToCart = React.useCallback(() => {
    addItem(product, qty, cartVariant);
    setAdded(true);
    if (addedTimeoutRef.current) window.clearTimeout(addedTimeoutRef.current);
    addedTimeoutRef.current = window.setTimeout(() => setAdded(false), 1500);
    const name = productName(product);
    // Build a "Color · Size" suffix so the toast disambiguates which
    // variant landed in the cart (matches the chip pair in the drawer).
    const variantBits = [
      cartVariant && (lang === "ar" ? cartVariant.colorNameAr : cartVariant.colorNameFr),
      cartVariant?.sizeLabel,
    ].filter(Boolean);
    const suffix = variantBits.length ? ` · ${variantBits.join(" · ")}` : "";
    const qtyBit = qty > 1 ? ` × ${qty}` : "";
    toast.success(
      lang === "ar"
        ? `تم إضافة ${name}${suffix}${qtyBit} إلى السلة`
        : `${name}${suffix}${qtyBit} ajouté au panier`,
    );
  }, [addItem, product, qty, cartVariant, productName, lang]);

  // "Commander maintenant": if this product alone already meets the 1000 DA
  // minimum, open the order popup directly. Otherwise add it to the cart and
  // go to checkout, where the customer builds the cart up to the minimum.
  const handleBuyNow = React.useCallback(() => {
    if (effectivePrice * qty >= MIN_ORDER_DZD) {
      setOrderOpen(true);
    } else {
      addItem(product, qty, cartVariant);
      router.push("/commander");
    }
  }, [effectivePrice, qty, addItem, product, cartVariant, router]);

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
          <ArrowLeft className="size-3.5 rtl:rotate-180" strokeWidth={2.2} />
          {t("product.back")}
        </TentLink>

        <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-2 md:gap-10 lg:gap-16">
          {/* Image + video slider */}
          <ProductImageSlider
            images={sliderImages}
            video={product.video}
            name={productName(product)}
            discount={pct}
          />

          {/* Body */}
          <div className="flex min-w-0 flex-col">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-tangerine-700">
              {product.brand}
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-3xl md:text-4xl">
              {productName(product)}
            </h1>

            <div className="mt-6 flex flex-col leading-tight">
              <span className="font-display text-3xl font-bold tracking-tight text-tangerine-700 md:text-4xl">
                {formatPrice(effectivePrice)}
              </span>
              {product.oldPrice && product.oldPrice > effectivePrice ? (
                <span className="mt-1 font-mono text-sm text-wood-500 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              ) : null}
              {pct ? (
                <span className="mt-1 inline-flex w-fit items-center rounded-full bg-tangerine-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cream">
                  -{pct}%
                </span>
              ) : null}
            </div>

            {/* Description + read-more.
                When the description came from the admin's RichEditor
                it's HTML — bold, italic, lists, headings, line breaks
                must survive. We render via dangerouslySetInnerHTML and
                style inline with Tailwind arbitrary child selectors so
                we don't need the @tailwindcss/typography plugin.
                Collapse is `max-height + overflow-hidden` (not
                line-clamp) because line-clamp only works on inline
                content and breaks for HTML with block children. */}
            <div className="mt-6">
              <div
                className={cn(
                  // Prose-ish defaults: spacing between paragraphs,
                  // bulleted / numbered lists, headings, strong/em,
                  // line breaks (<br>) and link styling. All scoped to
                  // the description container.
                  // Base text reduced to 14 px (text-sm) — easier on
                  // the eyes for long product copy; headings scale
                  // down proportionally below.
                  "text-sm leading-relaxed text-wood-700",
                  "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
                  "[&_br]:block [&_br]:content-['']",
                  "[&_strong]:font-semibold [&_strong]:text-forest-900",
                  "[&_b]:font-semibold [&_b]:text-forest-900",
                  "[&_em]:italic [&_i]:italic",
                  "[&_u]:underline",
                  "[&_s]:line-through [&_strike]:line-through",
                  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:space-y-1",
                  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:space-y-1",
                  "[&_li]:leading-relaxed",
                  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-display [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-forest-900",
                  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-forest-900",
                  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-display [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-forest-900",
                  "[&_a]:text-tangerine-700 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-tangerine-600",
                  "[&_blockquote]:my-3 [&_blockquote]:border-s-4 [&_blockquote]:border-wood-300 [&_blockquote]:ps-3 [&_blockquote]:italic [&_blockquote]:text-wood-600",
                  // Collapse / expand. `max-h-28` ≈ 4 lines at the
                  // smaller font; expanded removes the cap.
                  "relative overflow-hidden transition-[max-height] duration-300 ease-out",
                  isLong && !expanded ? "max-h-28" : "max-h-[10000px]",
                )}
              >
                {isHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: description }} />
                ) : (
                  // Plain text from the local mock — preserve the
                  // current single-paragraph rendering so existing
                  // products look the same as before.
                  <p>{description}</p>
                )}
                {/* Fade-out gradient at the bottom while collapsed —
                    cues that there's more content below the cut. */}
                {isLong && !expanded ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-cream to-transparent"
                  />
                ) : null}
              </div>
              {isLong ? (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  aria-expanded={expanded}
                  className="mt-2 font-display text-sm font-semibold text-tangerine-700 underline-offset-4 transition-colors hover:text-tangerine-600 hover:underline"
                >
                  {expanded ? t("product.readLess") : t("product.readMore")}
                </button>
              ) : null}
            </div>

            {/* Color picker — circular swatches with hex fill */}
            {colorOptions.length > 0 ? (
              <div className="mt-7">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-700">
                    {lang === "ar" ? "اللون" : "Couleur"}
                  </span>
                  {selectedColor ? (
                    <span className="font-display text-[12px] font-semibold text-forest-900">
                      {lang === "ar"
                        ? colorOptions.find((c) => c.nameFr === selectedColor)?.nameAr ?? selectedColor
                        : selectedColor}
                    </span>
                  ) : null}
                </div>
                <ul className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => {
                    const active = c.nameFr === selectedColor;
                    const label = lang === "ar" ? c.nameAr || c.nameFr : c.nameFr;
                    return (
                      <li key={c.nameFr}>
                        <button
                          type="button"
                          onClick={() => setSelectedColor(c.nameFr)}
                          aria-pressed={active}
                          aria-label={label}
                          title={label}
                          className={cn(
                            "grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-cream transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500",
                            active
                              ? "ring-2 ring-forest-900"
                              : "ring-1 ring-wood-300 hover:ring-wood-500",
                          )}
                        >
                          <span
                            aria-hidden
                            className="size-7 rounded-full border border-wood-300/60"
                            style={{ backgroundColor: c.hex ?? "#e5e5e5" }}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {/* Size picker — pill buttons; disabled for combos not in stock */}
            {sizeOptions.length > 0 ? (
              <div className="mt-5">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-700">
                    {lang === "ar" ? "المقاس" : "Taille"}
                  </span>
                  {stockForSelection != null ? (
                    // Generic availability only — the exact remaining count is
                    // confidential (Bug #004), so never surface the number.
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-[0.18em]",
                        outOfStock ? "text-red-700" : "text-wood-600",
                      )}
                    >
                      {outOfStock
                        ? lang === "ar" ? "نفد المخزون" : "Rupture de stock"
                        : lang === "ar" ? "متوفر" : "En stock"}
                    </span>
                  ) : null}
                </div>
                <ul className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => {
                    const available = sizesForColor.includes(size);
                    const active = size === selectedSize && available;
                    return (
                      <li key={size}>
                        <button
                          type="button"
                          onClick={() => available && setSelectedSize(size)}
                          aria-pressed={active}
                          disabled={!available}
                          className={cn(
                            "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3",
                            "font-display text-[12px] font-semibold tracking-tight transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500",
                            active
                              ? "border-forest-900 bg-forest-900 text-cream"
                              : available
                                ? "border-wood-300 bg-cream text-forest-900 hover:border-forest-900"
                                : "cursor-not-allowed border-wood-200 bg-wood-100/50 text-wood-400 line-through",
                          )}
                        >
                          {size}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {/* Quantity stepper */}
            <div className="mt-7 flex items-center gap-4">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-700">
                {t("product.qty.label")}
              </span>
              <div className="inline-flex items-center rounded-full border border-wood-300 bg-cream">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label={t("product.qty.dec")}
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
                  onClick={() =>
                    setQty((q) =>
                      stockForSelection != null
                        ? Math.min(q + 1, Math.max(1, stockForSelection))
                        : q + 1,
                    )
                  }
                  aria-label={t("product.qty.inc")}
                  disabled={stockForSelection != null && qty >= stockForSelection}
                  className="grid size-10 place-items-center rounded-full text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Plus className="size-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* CTAs — inline (desktop). On mobile the same actions
                live in the fixed bottom bar at the page edge. Both
                disable when the selected variant is out of stock. */}
            <div className="mt-8 hidden flex-col gap-3 sm:flex-row lg:flex">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={outOfStock}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5",
                  "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
                  "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:bg-tangerine-600",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                )}
              >
                {outOfStock
                  ? lang === "ar" ? "نفد المخزون" : "Épuisé"
                  : t("product.buyNow")}
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-6 py-3.5",
                  "font-display text-[13px] font-semibold uppercase tracking-[0.16em]",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900/30",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  added
                    ? "border-forest-900 bg-forest-900 text-cream"
                    : "border-wood-300 bg-cream text-forest-900 hover:border-forest-900 hover:bg-cream-deep"
                )}
              >
                {added ? (
                  <>
                    <Check className="size-4" strokeWidth={2.4} />
                    {t("card.added")}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="size-4" strokeWidth={2} />
                    {t("card.addToCart")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Similar products */}
        <SimilarProducts currentSlug={product.slug} items={similar} />
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
            disabled={outOfStock}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-4 py-3",
              "font-display text-[12px] font-semibold uppercase tracking-[0.14em]",
              "transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
              added
                ? "border-forest-900 bg-forest-900 text-cream"
                : "border-wood-300 bg-cream text-forest-900 hover:border-forest-900 hover:bg-cream-deep"
            )}
          >
            {added ? (
              <>
                <Check className="size-4" strokeWidth={2.4} />
                {t("card.added")}
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" strokeWidth={2} />
                {t("card.addShort")}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-tangerine-500 px-4 py-3",
              "font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-cream",
              "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
              "transition-all duration-200 hover:bg-tangerine-600",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {t("card.order")}
          </button>
        </div>
      </div>

      {/* Direct-order popup — opened by "Commander" when this product alone
          already meets the 1000 DA minimum. */}
      <QuickOrderDialog
        open={orderOpen}
        onOpenChange={setOrderOpen}
        showCartLink
        items={[
          {
            productSlug: product.slug,
            variantLabel: cartVariant
              ? [cartVariant.colorNameFr, cartVariant.sizeLabel]
                  .filter(Boolean)
                  .join(" · ") || null
              : null,
            variantId: cartVariant ? Number(cartVariant.id) : null,
            quantity: qty,
            name: productName(product),
            image: product.image,
            unitPrice: effectivePrice,
          },
        ]}
      />
    </main>
  );
}

/* ───── Image + video slider — Embla carousel. When the product has a
       video it becomes the first slide (and first thumbnail, with a play
       badge); autoplay is dropped so it never advances off the video.
       Image-only products keep the autoplay carousel. ─────────────── */
function ProductImageSlider({
  images,
  video,
  name,
  discount,
}: {
  images: string[];
  video?: string | null;
  name: string;
  discount: number | null;
}) {
  const { t, lang } = useLanguage();
  // Falls back to the first image whenever a secondary URL fails to
  // load (Unsplash hot-link failure, 404, rate-limit). Without this,
  // failed images render as a blank white box because the parent
  // button has no background.
  const fallbackSrc = images[0];
  const handleImgError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.src !== fallbackSrc) img.src = fallbackSrc;
    },
    [fallbackSrc],
  );
  const hasVideo = !!video;

  // Autoplay: continues after user interaction (timer resets), pauses
  // while the mouse is over the slider. Dropped entirely when a video is
  // the first slide so the carousel never auto-advances off it.
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
      // Embla offsets its slides based on this — without it the RTL
      // tree shows the first slide off-screen and the viewport sits
      // empty (only the side arrows + thumbs prove it's there).
      direction: lang === "ar" ? "rtl" : "ltr",
    },
    hasVideo ? [] : [autoplay.current]
  );
  const [selected, setSelected] = React.useState(0);
  // Index currently open in the fullscreen zoom lightbox; null = closed.
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  // When the user toggles the language after mount, Embla doesn't
  // pick up the new `direction` option on its own — force a reInit
  // so the slides are repositioned for the new writing direction.
  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({ direction: lang === "ar" ? "rtl" : "ltr" });
  }, [emblaApi, lang]);

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

  // Slide 0 is the video when present, then the images.
  const slideCount = images.length + (hasVideo ? 1 : 0);
  const hasMany = slideCount > 1;
  const isVideoSlide = (i: number) => hasVideo && i === 0;
  const imageIndexForSlide = (i: number) => (hasVideo ? i - 1 : i);

  return (
    <div className="min-w-0">
      {/* Main slider */}
      <div className="relative">
        <div
          ref={emblaRef}
          className="overflow-hidden rounded-2xl border border-wood-300/50 bg-wood-100"
        >
          <div className="flex touch-pan-y select-none">
            {hasVideo ? (
              <div className="relative aspect-square w-full shrink-0 basis-full bg-black">
                <ProductVideoPlayer
                  src={video as string}
                  poster={images[0] || undefined}
                />
              </div>
            ) : null}
            {images.map((src, i) => (
              <div
                key={i}
                className="relative aspect-square w-full shrink-0 basis-full bg-wood-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${name} — ${i + 1}`}
                  draggable={false}
                  onError={handleImgError}
                  className="block size-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Discount badge — top-left (zoom owns the top-right corner) */}
        {discount ? (
          <span className="pointer-events-none absolute start-4 top-4 z-10 inline-flex items-center rounded-full bg-tangerine-500 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-cream shadow-lg">
            -{discount}%
          </span>
        ) : null}

        {/* Zoom — top-right. Hidden on the video slide (the video has its
            own fullscreen control and isn't "zoomed" like a photo). */}
        {!isVideoSlide(selected) ? (
          <button
            type="button"
            onClick={() => setLightbox(imageIndexForSlide(selected))}
            aria-label={t("product.image.zoom")}
            title={t("product.image.zoom")}
            className="absolute end-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-cream/85 text-forest-900 backdrop-blur transition-all hover:bg-cream hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
          >
            <ZoomIn className="size-4" strokeWidth={2.2} />
          </button>
        ) : null}

        {/* Side arrows */}
        {hasMany ? (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label={t("product.image.prev")}
              className="absolute start-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-cream/85 text-forest-900 backdrop-blur transition-all hover:bg-cream hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label={t("product.image.next")}
              className="absolute end-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-cream/85 text-forest-900 backdrop-blur transition-all hover:bg-cream hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
            >
              <ChevronRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
            </button>
          </>
        ) : null}
      </div>

      {/* Thumbnail strip — under the main image, aligned to the start
          (left in LTR / right in RTL). Horizontally scrollable so
          products with 5+ images don't have thumbs clipped past the
          row width on narrow screens. `pb-1` leaves room for the
          native scrollbar without overlapping the bottom edge of the
          thumbs. */}
      {hasMany ? (
        <div className="mt-4 flex snap-x items-center gap-2 overflow-x-auto scroll-smooth px-1 py-1 sm:gap-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Video thumbnail — first, with a play badge over the poster */}
          {hasVideo ? (
            <button
              type="button"
              onClick={() => emblaApi?.scrollTo(0)}
              aria-label={t("product.video.title")}
              aria-current={selected === 0}
              className={cn(
                "relative size-14 shrink-0 snap-start overflow-hidden rounded-md bg-black sm:size-16",
                "transition-all duration-200 ease-out",
                selected === 0
                  ? "ring-2 ring-tangerine-500 ring-offset-2 ring-offset-cream"
                  : "opacity-65 ring-1 ring-wood-300/70 hover:opacity-100 hover:ring-wood-500",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
              )}
            >
              {images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[0]}
                  alt=""
                  aria-hidden
                  onError={handleImgError}
                  className="block size-full object-cover opacity-80"
                />
              ) : null}
              <span className="absolute inset-0 grid place-items-center bg-forest-900/35">
                <PlayCircle
                  className="size-6 text-cream drop-shadow"
                  strokeWidth={2}
                />
              </span>
            </button>
          ) : null}
          {images.map((src, i) => {
            const slideIndex = hasVideo ? i + 1 : i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(slideIndex)}
                aria-label={t("product.image.view", { n: i + 1 })}
                aria-current={slideIndex === selected}
                className={cn(
                  "relative size-14 shrink-0 snap-start overflow-hidden rounded-md bg-wood-100 sm:size-16",
                  "transition-all duration-200 ease-out",
                  slideIndex === selected
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
                  onError={handleImgError}
                  className="block size-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Fullscreen zoom lightbox */}
      {lightbox !== null ? (
        <ImageLightbox
          images={images}
          index={lightbox}
          name={name}
          onClose={() => setLightbox(null)}
          onImgError={handleImgError}
        />
      ) : null}
    </div>
  );
}

/* ───── Fullscreen image lightbox — a swipeable Embla slider (great on
       mobile), plus arrows / ← → keys on desktop. Tap an image to toggle
       2× zoom (mouse-pan on desktop); swiping is disabled while zoomed so
       the two gestures don't fight. Esc or a tap outside closes. ────── */
function ImageLightbox({
  images,
  index,
  name,
  onClose,
  onImgError,
}: {
  images: string[];
  index: number;
  name: string;
  onClose: () => void;
  onImgError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const { t, lang } = useLanguage();
  const ZOOM = 2.3;
  const [zoomed, setZoomed] = React.useState(false);
  // Mirror zoom in a ref so Embla's watchDrag callback reads the live value.
  const zoomedRef = React.useRef(false);
  // Two pan models, picked by pointer type:
  //  • desktop (mouse): magnifier follows the cursor → transform-origin %.
  //  • mobile (touch/pen): grab-to-drag → translate offset (px).
  const [usingTouch, setUsingTouch] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 50, y: 50 });
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
  } | null>(null);
  const movedRef = React.useRef(false);
  const [selected, setSelected] = React.useState(index);
  const hasMany = images.length > 1;

  const setZoom = React.useCallback((v: boolean) => {
    zoomedRef.current = v;
    setZoomed(v);
    // Re-centre both models on zoom in / out.
    setOrigin({ x: 50, y: 50 });
    setOffset({ x: 0, y: 0 });
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: index,
    loop: hasMany,
    align: "center",
    direction: lang === "ar" ? "rtl" : "ltr",
    // Block dragging (swipe) while an image is zoomed in.
    watchDrag: () => !zoomedRef.current,
  });

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelected(emblaApi.selectedScrollSnap());
      setZoom(false); // reset zoom whenever the slide changes
    };
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, setZoom]);

  // Keyboard: Esc closes, ←/→ navigate. Lock body scroll while open.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") emblaApi?.scrollNext();
      else if (e.key === "ArrowLeft") emblaApi?.scrollPrev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [emblaApi, onClose]);

  // Grab-to-drag bounds (mobile): clamp the translate so every edge is
  // reachable but the image can't be flung off-screen.
  const clampPan = (img: HTMLImageElement, x: number, y: number) => {
    const bw = img.clientWidth;
    const bh = img.clientHeight;
    const nw = img.naturalWidth || bw;
    const nh = img.naturalHeight || bh;
    const fit = Math.min(bw / nw, bh / nh) || 1; // object-contain scale factor
    const maxX = Math.max(0, (nw * fit * ZOOM - bw) / 2);
    const maxY = Math.max(0, (nh * fit * ZOOM - bh) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLImageElement>, i: number) => {
    if (!zoomedRef.current || i !== selected) return;
    // Desktop (mouse) pans by hovering — no drag needed; let the click toggle
    // zoom. Only touch / pen start a grab-drag.
    if (e.pointerType === "mouse") return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setUsingTouch(true);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    movedRef.current = false;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.pointerType === "mouse") {
      // Desktop: magnifier follows the cursor while zoomed.
      if (!zoomedRef.current) return;
      if (usingTouch) setUsingTouch(false);
      const r = e.currentTarget.getBoundingClientRect();
      setOrigin({
        x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
        y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
      });
      return;
    }
    // Touch / pen: grab-to-drag.
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
    setOffset(clampPan(e.currentTarget, d.ox + dx, d.oy + dy));
  };

  const endDrag = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-forest-900/95 backdrop-blur-sm"
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("product.image.close")}
        className="absolute end-4 top-4 z-20 grid size-11 place-items-center rounded-full bg-cream/10 text-cream backdrop-blur transition-colors hover:bg-cream/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
      >
        <X className="size-5" strokeWidth={2.2} />
      </button>

      {/* Counter */}
      {hasMany ? (
        <span className="pointer-events-none absolute start-4 top-5 z-20 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/80">
          {selected + 1} / {images.length}
        </span>
      ) : null}

      {/* Swipeable carousel */}
      <div ref={emblaRef} className="size-full overflow-hidden">
        <div className="flex size-full">
          {images.map((src, i) => (
            <div
              key={i}
              className="flex size-full min-w-0 shrink-0 basis-full items-center justify-center p-4 sm:p-10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${name} — ${i + 1}`}
                onError={onImgError}
                draggable={false}
                onClick={(e) => {
                  // Only the active slide reacts; taps elsewhere fall through
                  // to the backdrop and close the lightbox.
                  if (i !== selected) return;
                  // A drag just panned the image — don't also toggle zoom.
                  if (movedRef.current) {
                    movedRef.current = false;
                    return;
                  }
                  e.stopPropagation();
                  setZoom(!zoomedRef.current);
                }}
                onPointerDown={(e) => onPointerDown(e, i)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={
                  zoomed && i === selected
                    ? usingTouch
                      ? {
                          transform: `translate(${offset.x}px, ${offset.y}px) scale(${ZOOM})`,
                        }
                      : {
                          transform: `scale(${ZOOM})`,
                          transformOrigin: `${origin.x}% ${origin.y}%`,
                        }
                    : undefined
                }
                className={cn(
                  "max-h-[88vh] max-w-[92vw] select-none object-contain",
                  // Animate zoom in/out, but pan instantly while dragging.
                  dragging ? "" : "transition-transform duration-200 ease-out",
                  zoomed && i === selected
                    ? // touch-none so a finger-drag pans instead of the browser
                      // hijacking the gesture for scrolling.
                      "cursor-zoom-out touch-none"
                    : "cursor-zoom-in",
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Prev / next — work on desktop + as tap targets on mobile */}
      {hasMany ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              emblaApi?.scrollPrev();
            }}
            aria-label={t("product.image.prev")}
            className="absolute start-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream backdrop-blur transition-colors hover:bg-cream/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 sm:start-5"
          >
            <ChevronLeft className="size-5 rtl:rotate-180" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              emblaApi?.scrollNext();
            }}
            aria-label={t("product.image.next")}
            className="absolute end-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream backdrop-blur transition-colors hover:bg-cream/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 sm:end-5"
          >
            <ChevronRight className="size-5 rtl:rotate-180" strokeWidth={2.2} />
          </button>
        </>
      ) : null}
    </div>
  );
}

/* ───── Similar products — same card design as the best-sellers
       section (cf. best-sellers.tsx::ProductCard), minus the rank
       badge since these aren't ranked. ──────────────────────────── */
function SimilarProducts({
  currentSlug,
  items: itemsProp,
}: {
  currentSlug: string;
  /** Server-fetched picks. Falls back to the local mock catalogue
   *  (excluding the current product) when empty so the section keeps
   *  rendering during local-only development. */
  items?: Product[];
}) {
  const { t } = useLanguage();
  // Hide the section entirely when the backend returned no similar
  // products — we don't want to fall back to unrelated mock rows
  // ("Sac de couchage en duvet" etc.) because they'd misrepresent the
  // catalogue as if those products were genuine recommendations.
  const items = itemsProp ?? [];
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="similar-title"
      className="mt-16 border-t border-wood-300/40 pt-12 md:mt-20 md:pt-16"
    >
      <header className="mb-8 md:mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-tangerine-700">
          {t("product.similar.eyebrow")}
        </p>
        <h2
          id="similar-title"
          className="mt-2 font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-forest-900 sm:text-3xl md:text-[2rem]"
        >
          {t("product.similar.title")}
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
  const { t } = useLanguage();
  const formatPrice = useFormatPrice();
  const productName = useProductName();
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
          {productName(product)}
        </h3>
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-wood-600">
          {product.brand}
        </p>
        <div className="mt-3 flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight text-tangerine-700 sm:text-xl">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="mt-0.5 block font-mono text-[11px] text-wood-500 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          ) : null}
        </div>

        {/* Commander pill + labeled add-to-cart — side-by-side on
            desktop, stacked on mobile */}
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:pt-4">
          <span className="inline-flex h-7 items-center justify-center gap-1.5 rounded-2xl border border-forest-900 bg-forest-900 px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cream transition-colors duration-300 hover:bg-tangerine-500 sm:h-9 sm:flex-1 sm:gap-2 sm:px-3 sm:text-[10px] sm:tracking-[0.2em]">
            <ShoppingBag className="size-3" strokeWidth={2.2} />
            {t("card.order")}
          </span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </TentLink>
  );
}
