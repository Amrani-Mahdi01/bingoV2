/**
 * Adapters converting Laravel `Api*` shapes into the storefront's older
 * `Product` / `Category` / `Brand` types so existing pages and components
 * (ProductCard, BannerSlider, FilterSidebar…) keep working unchanged
 * while the data flows from the real backend.
 *
 * The admin dashboard always uses FR labels; the storefront takes both
 * names and lets a client-side toggle pick which one to render.
 */

import type { ApiBrand } from "@/lib/api/brands";
import type { ApiCategory } from "@/lib/api/categories";
import type { ApiProduct } from "@/lib/api/products";
import type { Brand, Category, Product } from "@/lib/types";
import { mediaUrl } from "@/lib/media";

export function adaptBrand(b: ApiBrand): Brand {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
  };
}

export function adaptCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    slug: c.slug,
    name: c.nameFr,
    nameAr: c.nameAr,
    icon: c.icon,
    parentId: c.parentId ?? undefined,
    productCount: c.productCount,
    displayOrder: c.displayOrder ?? 0,
  };
}

export function adaptProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.nameFr,
    nameAr: p.nameAr,
    description: p.descriptionFr ?? "",
    descriptionAr: p.descriptionAr ?? undefined,
    descriptionShort: p.descriptionShortFr ?? "",
    descriptionShortAr: p.descriptionShortAr ?? undefined,
    brand: p.brand
      ? adaptBrand(p.brand)
      : ({ id: "", slug: "", name: "" } as Brand),
    category: p.category
      ? adaptCategory(p.category)
      : ({ id: "", slug: "", name: "" } as Category),
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    sku: p.sku,
    stock: p.stock,
    stockStatus: p.stockStatus,
    images: p.images.map((img) => ({
      id: img.id,
      url: mediaUrl(img.url),
      alt: img.altFr ?? "",
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
    attributes: [],
    variants: p.variants.map((v) => {
      const hasColor = !!v.colorNameFr;
      const hasSize = !!v.sizeLabel;
      const name = hasColor && hasSize
        ? "Couleur / Taille"
        : hasColor
          ? "Couleur"
          : "Taille";
      const value = hasColor && hasSize
        ? `${v.colorNameFr} / ${v.sizeLabel}`
        : (v.colorNameFr ?? v.sizeLabel ?? "");
      return {
        id: v.id,
        name,
        value,
        sku: v.skuSuffix ?? "",
        stock: v.stock,
        priceModifier: v.priceDelta,
        colorName: v.colorNameFr ?? null,
        colorHex: v.colorHex ?? null,
        sizeLabel: v.sizeLabel ?? null,
      };
    }),
    rating: p.rating,
    reviewCount: p.reviewCount,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    isPromo: p.isPromo,
    viewCount: p.viewCount,
    soldCount: p.soldCount,
    createdAt: "",
    updatedAt: "",
  };
}
