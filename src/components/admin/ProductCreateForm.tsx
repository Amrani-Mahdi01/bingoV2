"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Small } from "@/components/ui/typography";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { RichEditor } from "@/components/admin/RichEditor";
import { VariantManager, type VariantRow } from "@/components/admin/VariantManager";
import { brandsApi, type ApiBrand } from "@/lib/api/brands";
import { categoriesApi, type ApiCategory } from "@/lib/api/categories";
import { HttpError } from "@/lib/api/http";
import {
  productsApi,
  type ApiProduct,
  type ProductPayload,
} from "@/lib/api/products";
import { cn } from "@/lib/utils";

/**
 * Snapshots window scroll position when a popover opens and restores it
 * for the next several frames. Necessary because cmdk's `CommandInput`
 * auto-focuses on mount, and the browser then scrolls the focused input
 * into view — yanking the page when a combobox is opened.
 *
 * Returns a `captureScroll` callback the caller should invoke right
 * before flipping `open` to true.
 */
function useFreezeScrollOnOpen(open: boolean): () => void {
  const yRef = React.useRef(0);

  const captureScroll = React.useCallback(() => {
    yRef.current = window.scrollY;
  }, []);

  React.useEffect(() => {
    const y = yRef.current;
    if (!open) {
      // On close: restore once. Base-ui's finalFocus={false} stops the
      // built-in trigger refocus, but cmdk may still have nudged the page.
      window.scrollTo({ top: y, behavior: "instant" });
      return;
    }
    // On open: restore over the next ~6 frames to overpower any focus
    // side-effects from cmdk / base-ui / browser auto-scroll.
    let frames = 6;
    const tick = () => {
      window.scrollTo({ top: y, behavior: "instant" });
      if (--frames > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [open]);

  return captureScroll;
}

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError) {
    const body = err.body as
      | { message?: string; errors?: Record<string, string[]> }
      | null;
    if (body?.errors) {
      const first = Object.values(body.errors)[0]?.[0];
      if (first) return first;
    }
    if (body?.message) return body.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Human-readable file size in FR units (o / Ko / Mo). */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface ProductImageDraft {
  /** Absolute URL of an already-uploaded image. */
  url: string;
  altFr?: string;
  altAr?: string;
}

interface ProductCreateFormProps {
  /** When set, the form initializes from this product and saves via PUT. */
  initialProduct?: ApiProduct;
}

/* ───── Field validation patterns ───────────────────────────────
   Used by save() to reject malformed input client-side before it
   ever hits the API. Keep these conservative — Laravel still
   re-validates everything on the server. */

// Must contain at least one Latin letter (otherwise the FR name is
// almost certainly wrong) and stay within the schema's 191-char limit.
const NAME_FR_RE = /^(?=.*[A-Za-zÀ-ſ])[\s\S]{2,191}$/;

// Must contain at least one Arabic letter for the AR name. The
// extended Arabic Unicode blocks cover regular + Arabic Supplement.
const NAME_AR_RE = /^(?=.*[؀-ۿݐ-ݿ])[\s\S]{2,191}$/;

// Bounded plain text for the short descriptions (DB column is 500).
const SHORT_DESC_RE = /^[\s\S]{0,500}$/;

// Long description — generous bound to allow rich content but cap it.
const LONG_DESC_RE = /^[\s\S]{0,5000}$/;

// Helper: rich-editor outputs HTML; this gives us the plain-text size
// so we can validate against character bounds without counting tags.
const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// Positive integer in DA. Digits only, no leading zeros, no decimals.
const PRICE_RE = /^[1-9]\d*$/;

// Non-negative integer for stock counts / thresholds.
const NON_NEG_INT_RE = /^(0|[1-9]\d*)$/;

// Hard cap on product photos. Enforced here in the upload UI and again on
// the backend at product save (StoreProductRequest).
const MAX_IMAGES = 5;

export function ProductCreateForm({ initialProduct }: ProductCreateFormProps = {}) {
  const router = useRouter();
  const confirm = useConfirm();
  const isEdit = !!initialProduct;

  // Lookup data
  const [categories, setCategories] = React.useState<ApiCategory[] | null>(null);
  const [brands, setBrands] = React.useState<ApiBrand[] | null>(null);

  // Form state — seeded from initialProduct in edit mode.
  const [nameFr, setNameFr] = React.useState(initialProduct?.nameFr ?? "");
  const [nameAr, setNameAr] = React.useState(initialProduct?.nameAr ?? "");
  const [shortFr, setShortFr] = React.useState(initialProduct?.descriptionShortFr ?? "");
  const [shortAr, setShortAr] = React.useState(initialProduct?.descriptionShortAr ?? "");
  const [descFr, setDescFr] = React.useState(initialProduct?.descriptionFr ?? "");
  const [descAr, setDescAr] = React.useState(initialProduct?.descriptionAr ?? "");
  const [price, setPrice] = React.useState<string>(
    initialProduct ? String(initialProduct.price) : ""
  );
  const [oldPrice, setOldPrice] = React.useState<string>(
    initialProduct?.oldPrice != null ? String(initialProduct.oldPrice) : ""
  );
  const [stock, setStock] = React.useState<string>(
    initialProduct ? String(initialProduct.stock) : "0"
  );
  const [lowStock, setLowStock] = React.useState<string>(
    initialProduct ? String(initialProduct.lowStockThreshold) : "5"
  );
  const [parentId, setParentId] = React.useState<string | null>(null);
  const [subId, setSubId] = React.useState<string | null>(
    initialProduct?.categoryId ?? null
  );
  const [brandId, setBrandId] = React.useState<string | null>(
    initialProduct?.brandId ?? null
  );
  const [isActive, setIsActive] = React.useState(initialProduct?.isActive ?? true);
  const [isNew, setIsNew] = React.useState(initialProduct?.isNew ?? false);
  const [isPromo, setIsPromo] = React.useState(initialProduct?.isPromo ?? false);
  const [isBestSeller, setIsBestSeller] = React.useState(
    initialProduct?.isBestSeller ?? false
  );
  const [images, setImages] = React.useState<ProductImageDraft[]>(
    initialProduct?.images.map((img) => ({
      url: img.url,
      altFr: img.altFr ?? undefined,
      altAr: img.altAr ?? undefined,
    })) ?? []
  );
  const [variants, setVariants] = React.useState<VariantRow[]>(
    initialProduct?.variants.map((v) => ({
      colorNameFr: v.colorNameFr,
      colorNameAr: v.colorNameAr,
      colorHex: v.colorHex,
      sizeLabel: v.sizeLabel,
      stock: v.stock,
      priceDelta: v.priceDelta,
    })) ?? []
  );

  // One optional product video (absolute URL once uploaded).
  const [video, setVideo] = React.useState<string | null>(
    initialProduct?.video ?? null
  );
  // Compression/upload progress: null = idle, otherwise 0..100.
  const [videoProgress, setVideoProgress] = React.useState<number | null>(null);
  // True when the stored video URL fails to load (e.g. the file was deleted
  // out-of-band) — show a clear message instead of a broken black player.
  const [videoBroken, setVideoBroken] = React.useState(false);

  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Per-field validation errors. Populated by `validate()` before save
  // and cleared on the relevant field's first keystroke so the message
  // disappears as soon as the admin corrects it.
  type FieldError =
    | "nameFr"
    | "nameAr"
    | "shortFr"
    | "shortAr"
    | "descFr"
    | "descAr"
    | "price"
    | "oldPrice"
    | "stock"
    | "lowStock"
    | "catId"
    | "subId"
    | "brandId";
  const [errors, setErrors] = React.useState<Partial<Record<FieldError, string>>>(
    {},
  );
  const clearError = React.useCallback((k: FieldError) => {
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  }, []);

  React.useEffect(() => {
    void categoriesApi.listAll().then((cats) => {
      setCategories(cats);
      // In edit mode, the seeded `subId` is a leaf category; walk the tree
      // to find its parent so the "Catégorie principale" combobox can
      // resolve to a label and so the sub combobox is unlocked.
      if (initialProduct && !parentId) {
        const subCatId = initialProduct.categoryId;
        if (subCatId) {
          for (const top of cats) {
            if (top.id === subCatId) {
              setParentId(top.id);
              setSubId(null);
              break;
            }
            const sub = top.children?.find((c) => c.id === subCatId);
            if (sub) {
              setParentId(top.id);
              break;
            }
          }
        }
      }
    });
    void brandsApi.listAll().then(setBrands);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct]);

  const topCats = (categories ?? []).filter((c) => !c.parentId);
  const currentTop = topCats.find((c) => c.id === parentId) ?? null;
  const subs = currentTop?.children ?? [];

  // When the parent changes, drop any sub selection from a different parent.
  // Important: this must NOT run before a parent has been resolved — in
  // edit mode the form mounts with `subId` already set (from the product
  // being edited) but `parentId` only gets resolved asynchronously by the
  // tree-walk effect above, once `categoriesApi.listAll()` returns. Without
  // the parentId guard, this effect would fire on first render with
  // `subs === []` and wipe the initial sub-category.
  React.useEffect(() => {
    if (!parentId) return;
    if (subId && !subs.some((s) => s.id === subId)) {
      setSubId(null);
    }
  }, [parentId, subId, subs]);

  const currentBrand = brands?.find((b) => b.id === brandId) ?? null;
  const currentSub = subs.find((s) => s.id === subId) ?? null;

  const onUploadFiles = async (files: FileList | File[] | null | undefined) => {
    let list = files
      ? Array.from(files).filter((f) => f.type.startsWith("image/"))
      : [];
    if (list.length === 0) return;

    // Enforce the 5-photo cap. Compute the free slots from the current
    // count and trim the incoming batch (drag-drop can carry many files).
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos par produit.`);
      return;
    }
    if (list.length > remaining) {
      toast.warning(
        `Maximum ${MAX_IMAGES} photos : seules les ${remaining} première(s) ont été retenue(s).`,
      );
      list = list.slice(0, remaining);
    }

    setUploading(true);
    let ok = 0;
    let failed = 0;
    // Upload sequentially so the order matches drop order and the first
    // file consistently becomes the "Principal" image.
    for (const file of list) {
      try {
        const { url } = await productsApi.uploadImage(file);
        setImages((prev) => [...prev, { url }]);
        ok++;
      } catch (err) {
        failed++;
        toast.error(extractMessage(err, `Échec : ${file.name}`));
      }
    }
    if (ok > 0) {
      toast.success(
        ok === 1
          ? "Image téléversée"
          : `${ok} images téléversées${failed ? ` (${failed} échouées)` : ""}`,
      );
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  /** Promote any thumbnail to the principal slot by moving it to index 0. */
  const makePrincipal = (idx: number) => {
    if (idx <= 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(idx, 1);
      if (chosen) next.unshift(chosen);
      return next;
    });
  };

  // Compress the picked video in the browser (ffmpeg.wasm → 720p MP4), then
  // upload the smaller result. Progress covers the compression pass; the
  // short upload that follows just shows the bar pinned near 100%.
  const onSelectVideo = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Choisissez un fichier vidéo.");
      return;
    }
    setVideoBroken(false);
    setVideoProgress(0);
    try {
      const { compressVideo } = await import("@/lib/video-compress");
      const { blob, originalSize, compressedSize } = await compressVideo(
        file,
        (r) => setVideoProgress(Math.round(r * 100)),
      );
      setVideoProgress(100);
      const { url } = await productsApi.uploadVideo(blob);
      setVideo(url);
      const pct = originalSize
        ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
        : 0;
      toast.success(
        `Vidéo compressée (${formatBytes(originalSize)} → ${formatBytes(
          compressedSize,
        )}, −${pct}%)`,
      );
    } catch (err) {
      toast.error(extractMessage(err, "Échec de la compression vidéo."));
    } finally {
      setVideoProgress(null);
    }
  };

  const removeVideo = async () => {
    const ok = await confirm({
      title: "Retirer la vidéo ?",
      message:
        "La vidéo sera retirée de la fiche. La suppression définitive du fichier prend effet après « Enregistrer ».",
      variant: "destructive",
      confirmLabel: "Retirer",
    });
    if (!ok) return;
    setVideo(null);
    setVideoBroken(false);
  };

  const [isDragging, setIsDragging] = React.useState(false);
  const dragDepthRef = React.useRef(0);

  // Drag counters guard against nested dragenter/dragleave flicker when the
  // pointer moves over child elements inside the dropzone.
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types?.includes("Files")) setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    void onUploadFiles(e.dataTransfer.files);
  };

  const validate = (): {
    errs: Partial<Record<FieldError, string>>;
    priceN: number;
    oldN: number | null;
    stockN: number;
    lowN: number;
  } => {
    const errs: Partial<Record<FieldError, string>> = {};

    const nameFrT = nameFr.trim();
    if (!nameFrT) errs.nameFr = "Le nom FR est requis.";
    else if (!NAME_FR_RE.test(nameFrT))
      errs.nameFr =
        "2–191 caractères, doit contenir au moins une lettre latine.";

    const nameArT = nameAr.trim();
    if (!nameArT) errs.nameAr = "Le nom AR est requis.";
    else if (!NAME_AR_RE.test(nameArT))
      errs.nameAr =
        "2–191 caractères, doit contenir au moins une lettre arabe.";

    if (shortFr && !SHORT_DESC_RE.test(shortFr))
      errs.shortFr = "500 caractères maximum.";
    if (shortAr && !SHORT_DESC_RE.test(shortAr))
      errs.shortAr = "500 caractères maximum.";

    // Long descriptions — required for SEO + client clarity. RichEditor
    // produces HTML, so we check the visible text length (tags stripped)
    // and require at least one letter of the expected script.
    const descFrText = stripHtml(descFr);
    if (!descFrText) {
      errs.descFr = "La description FR est requise.";
    } else if (!LONG_DESC_RE.test(descFrText)) {
      errs.descFr = "5000 caractères maximum.";
    } else if (descFrText.length < 10) {
      errs.descFr = "Au moins 10 caractères.";
    } else if (!/[A-Za-zÀ-ſ]/.test(descFrText)) {
      errs.descFr = "Doit contenir au moins une lettre latine.";
    }
    const descArText = stripHtml(descAr);
    if (!descArText) {
      errs.descAr = "La description AR est requise.";
    } else if (!LONG_DESC_RE.test(descArText)) {
      errs.descAr = "5000 caractères maximum.";
    } else if (descArText.length < 10) {
      errs.descAr = "Au moins 10 caractères.";
    } else if (!/[؀-ۿݐ-ݿ]/.test(descArText)) {
      errs.descAr = "Doit contenir au moins une lettre arabe.";
    }

    if (!parentId) errs.catId = "Choisissez une catégorie principale.";
    if (!subId) errs.subId = "Choisissez une sous-catégorie.";
    if (!brandId) errs.brandId = "Choisissez une marque.";

    if (!price.trim()) errs.price = "Le prix est requis.";
    else if (!PRICE_RE.test(price))
      errs.price = "Entier positif uniquement (sans 0 en tête).";
    const priceN = errs.price ? Number.NaN : parseInt(price, 10);

    const oldRaw = oldPrice.trim();
    let oldN: number | null = null;
    if (oldRaw) {
      if (!PRICE_RE.test(oldRaw))
        errs.oldPrice = "Entier positif uniquement.";
      else {
        oldN = parseInt(oldRaw, 10);
        if (Number.isFinite(priceN) && oldN < priceN)
          errs.oldPrice = "L'ancien prix doit être supérieur au prix actuel.";
      }
    }

    if (stock && !NON_NEG_INT_RE.test(stock))
      errs.stock = "Entier ≥ 0 uniquement.";
    const stockN = errs.stock ? 0 : parseInt(stock || "0", 10) || 0;

    if (lowStock && !NON_NEG_INT_RE.test(lowStock))
      errs.lowStock = "Entier ≥ 0 uniquement.";
    const lowN = errs.lowStock ? 5 : parseInt(lowStock || "5", 10) || 5;

    return { errs, priceN, oldN, stockN, lowN };
  };

  const save = async () => {
    const { errs, priceN, oldN, stockN, lowN } = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Corrigez les champs en rouge avant d'enregistrer.");
      return;
    }

    const payload: ProductPayload = {
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim(),
      descriptionShortFr: shortFr.trim() || null,
      descriptionShortAr: shortAr.trim() || null,
      descriptionFr: descFr.trim() || null,
      descriptionAr: descAr.trim() || null,
      video,
      categoryId: Number(subId),
      brandId: Number(brandId),
      price: priceN,
      oldPrice: oldN,
      stock: stockN,
      lowStockThreshold: lowN,
      isActive,
      isNew,
      isBestSeller,
      isPromo,
      images: images.map((img) => ({
        url: img.url,
        altFr: img.altFr || null,
        altAr: img.altAr || null,
      })),
      variants,
    };

    setSaving(true);
    try {
      if (isEdit && initialProduct) {
        const updated = await productsApi.update(initialProduct.id, payload);
        toast.success(`Produit enregistré · ${updated.sku}`);
        router.push("/admin/products");
      } else {
        const created = await productsApi.create(payload);
        toast.success(`Produit créé · ${created.sku}`);
        router.push("/admin/products");
      }
    } catch (err) {
      toast.error(
        extractMessage(err, isEdit ? "Erreur lors de l'enregistrement" : "Erreur lors de la création"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Identity */}
      <Section title="Identité bilingue">
        <BilingualField
          labelFr="Nom (FR)"
          labelAr="الاسم (AR)"
          valueFr={nameFr}
          valueAr={nameAr}
          onChangeFr={(v) => {
            setNameFr(v);
            clearError("nameFr");
          }}
          onChangeAr={(v) => {
            setNameAr(v);
            clearError("nameAr");
          }}
          placeholderFr="Tente 2 places MH100"
          placeholderAr="خيمة شخصين MH100"
          errorFr={errors.nameFr}
          errorAr={errors.nameAr}
        />
        <BilingualField
          multiline
          rows={2}
          labelFr="Description courte (FR)"
          labelAr="وصف قصير (AR)"
          valueFr={shortFr}
          valueAr={shortAr}
          onChangeFr={(v) => {
            setShortFr(v);
            clearError("shortFr");
          }}
          onChangeAr={(v) => {
            setShortAr(v);
            clearError("shortAr");
          }}
          placeholderFr="Tente dôme légère, étanchéité 2000 mm…"
          placeholderAr="خيمة قبّة خفيفة، عزل ماء 2000 ملم…"
          errorFr={errors.shortFr}
          errorAr={errors.shortAr}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700">
              Description complète (FR)
            </Label>
            <RichEditor
              value={descFr}
              onChange={(v) => {
                setDescFr(v);
                clearError("descFr");
              }}
              placeholder="Caractéristiques, conseils d'usage, montage…"
              className={
                errors.descFr
                  ? "border-red-500 ring-2 ring-red-500/20"
                  : undefined
              }
            />
            {errors.descFr ? <FieldError message={errors.descFr} /> : null}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700" dir="rtl">
              الوصف الكامل (AR)
            </Label>
            <RichEditor
              value={descAr}
              onChange={(v) => {
                setDescAr(v);
                clearError("descAr");
              }}
              placeholder="الخصائص، نصائح الاستعمال، التركيب…"
              rtl
              className={
                errors.descAr
                  ? "border-red-500 ring-2 ring-red-500/20"
                  : undefined
              }
            />
            {errors.descAr ? <FieldError message={errors.descAr} /> : null}
          </div>
        </div>
      </Section>

      {/* Classification */}
      <Section title="Classification">
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldShell label="Catégorie principale" error={errors.catId}>
            <Combobox
              value={currentTop?.id ?? null}
              onChange={(id) => {
                setParentId(id);
                setSubId(null);
                clearError("catId");
                clearError("subId");
              }}
              options={topCats.map((c) => ({
                value: c.id,
                label: c.nameFr,
                subLabel: c.nameAr,
              }))}
              placeholder="Choisir une catégorie"
              empty="Aucune catégorie"
            />
          </FieldShell>
          <FieldShell label="Sous-catégorie" error={errors.subId}>
            <Combobox
              value={currentSub?.id ?? null}
              onChange={(id) => {
                setSubId(id);
                clearError("subId");
              }}
              options={subs.map((c) => ({
                value: c.id,
                label: c.nameFr,
                subLabel: c.nameAr,
              }))}
              placeholder={
                currentTop ? "Choisir une sous-catégorie" : "↑ choisissez d'abord une catégorie"
              }
              empty={
                currentTop
                  ? "Aucune sous-catégorie sous cette catégorie."
                  : "Choisissez d'abord une catégorie."
              }
              disabled={!currentTop}
            />
          </FieldShell>
          <FieldShell label="Marque" error={errors.brandId}>
            <BrandPicker
              value={brandId}
              onChange={(id) => {
                setBrandId(id);
                clearError("brandId");
              }}
              brands={brands ?? []}
              onBrandCreated={(brand) => {
                setBrands((prev) => [...(prev ?? []), brand]);
                setBrandId(brand.id);
                clearError("brandId");
              }}
              onBrandUpdated={(brand) => {
                setBrands((prev) =>
                  (prev ?? []).map((b) => (b.id === brand.id ? brand : b)),
                );
              }}
            />
          </FieldShell>
        </div>
      </Section>

      {/* Pricing + stock */}
      <Section title="Prix & stock">
        <div className="grid gap-4 sm:grid-cols-4">
          <FieldShell label="Prix (DZD)" error={errors.price}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                clearError("price");
                clearError("oldPrice");
              }}
              placeholder="0"
              pattern="[1-9][0-9]*"
              aria-invalid={!!errors.price}
              className={cn(
                "font-mono",
                errors.price &&
                  "border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/20",
              )}
            />
          </FieldShell>
          <FieldShell label="Ancien prix" error={errors.oldPrice}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={oldPrice}
              onChange={(e) => {
                setOldPrice(e.target.value);
                clearError("oldPrice");
              }}
              placeholder="facultatif"
              pattern="[1-9][0-9]*"
              aria-invalid={!!errors.oldPrice}
              className={cn(
                "font-mono",
                errors.oldPrice &&
                  "border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/20",
              )}
            />
          </FieldShell>
          <FieldShell label="Stock" error={errors.stock}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                clearError("stock");
              }}
              pattern="[0-9]*"
              aria-invalid={!!errors.stock}
              className={cn(
                "font-mono",
                errors.stock &&
                  "border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/20",
              )}
            />
          </FieldShell>
          <FieldShell label="Seuil stock bas" error={errors.lowStock}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={lowStock}
              onChange={(e) => {
                setLowStock(e.target.value);
                clearError("lowStock");
              }}
              pattern="[0-9]*"
              aria-invalid={!!errors.lowStock}
              className={cn(
                "font-mono",
                errors.lowStock &&
                  "border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/20",
              )}
            />
          </FieldShell>
        </div>
      </Section>

      {/* Variants */}
      <Section title="Variantes (couleurs &amp; tailles)">
        <VariantManager value={variants} onChange={setVariants} />
        <Small className="text-zinc-500">
          Le stock par variante remplace celui défini ci-dessus pour les
          déclinaisons concernées.
        </Small>
      </Section>

      {/* Flags */}
      <Section title="Mise en avant">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <FlagToggle label="Actif" checked={isActive} onChange={setIsActive} />
          <FlagToggle label="Nouveauté" checked={isNew} onChange={setIsNew} />
          <FlagToggle label="Best-seller" checked={isBestSeller} onChange={setIsBestSeller} />
          <FlagToggle label="Promotion" checked={isPromo} onChange={setIsPromo} />
        </div>
      </Section>

      {/* Images */}
      <Section title="Photos">
        <div className="space-y-3">
          {images.length > 0 ? (
            <>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((img, i) => {
                  const isPrincipal = i === 0;
                  return (
                    <li
                      key={img.url + i}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-md border bg-zinc-50 transition-all",
                        isPrincipal
                          ? "border-emerald-500 ring-2 ring-emerald-300"
                          : "cursor-pointer border-zinc-200 hover:border-emerald-300 hover:ring-2 hover:ring-emerald-200"
                      )}
                      onClick={() => makePrincipal(i)}
                      role={isPrincipal ? undefined : "button"}
                      aria-label={
                        isPrincipal
                          ? undefined
                          : "Définir comme photo principale"
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />

                      {/* Bottom-bar overlay — emerald on the principal,
                          ghost call-to-action on the others ("Définir
                          principale") only visible on hover. */}
                      {isPrincipal ? (
                        <div className="absolute inset-x-0 bottom-0 bg-emerald-600/90 px-2 py-1 text-center font-mono text-2xs uppercase tracking-wide text-white">
                          ✓ Principale
                        </div>
                      ) : (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-zinc-900/85 px-2 py-1 text-center font-mono text-2xs uppercase tracking-wide text-white transition-transform group-hover:translate-y-0">
                          Définir principale
                        </div>
                      )}

                      {/* Trash button — always visible so the admin
                          can remove a photo without hunting for a
                          hover target. `stopPropagation` keeps the
                          tap from also promoting the image to
                          "principal". Slight shadow + white halo so
                          it stays legible on any image. */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        aria-label="Supprimer"
                        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md bg-white/95 text-red-700 shadow-sm ring-1 ring-zinc-200 transition-colors hover:bg-white hover:text-red-800"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Small className="text-zinc-500">
                {images.length} / {MAX_IMAGES} photos · cliquez sur une photo
                pour la définir comme image principale.
              </Small>
            </>
          ) : null}

          {/* Dropzone — click to open file picker OR drag images onto it.
              Accepts multiple files in one drop; first file becomes the
              principal photo. Hidden once the 5-photo cap is reached. */}
          {images.length < MAX_IMAGES ? (
          <label
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-zinc-50 px-4 py-10 text-center transition-colors",
              isDragging
                ? "border-emerald-500 bg-emerald-50/60"
                : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-100",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            <Upload
              className={cn(
                "size-6",
                isDragging ? "text-emerald-600" : "text-zinc-500"
              )}
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-zinc-700">
                {uploading
                  ? "Téléversement en cours…"
                  : isDragging
                    ? "Relâchez pour téléverser"
                    : images.length === 0
                      ? "Glissez vos photos ici, ou cliquez pour parcourir"
                      : "Ajouter d'autres photos (glisser-déposer ou cliquer)"}
              </p>
              <Small className="text-zinc-500">
                PNG / JPG / WebP / AVIF · max 10 Mo · redimensionné à 1600×1600
                · converties en WebP
              </Small>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={(e) => void onUploadFiles(e.target.files)}
              disabled={uploading}
            />
          </label>
          ) : (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center text-xs text-zinc-500">
              Limite de {MAX_IMAGES} photos atteinte. Supprimez-en une pour en
              ajouter une autre.
            </p>
          )}

          {images.length === 0 ? (
            <Small className="text-zinc-500">
              La première image téléversée devient la photo principale.
            </Small>
          ) : null}
        </div>
      </Section>

      {/* Video — at most one per product, compressed in the browser */}
      <Section title="Vidéo">
        <div className="space-y-3">
          {videoProgress !== null ? (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <Loader2 className="size-4 animate-spin text-emerald-600" />
                Compression de la vidéo… {videoProgress}%
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
              <Small className="mt-2 block text-zinc-500">
                La compression se fait dans votre navigateur — gardez cet
                onglet ouvert.
              </Small>
            </div>
          ) : video ? (
            <div className="space-y-2">
              {videoBroken ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  Vidéo introuvable (le fichier a été supprimé). Cliquez sur
                  « Retirer la vidéo » puis « Enregistrer » pour nettoyer la
                  fiche.
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border border-zinc-200 bg-black">
                  <video
                    src={video}
                    controls
                    className="max-h-64 w-full"
                    onError={() => setVideoBroken(true)}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => void removeVideo()}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Retirer la vidéo
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100">
              <Upload className="size-6 text-zinc-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-zinc-700">
                  Ajouter une vidéo (une seule par produit)
                </p>
                <Small className="text-zinc-500">
                  MP4 / WebM / MOV · compressée en 720p dans le navigateur ·
                  max 30 Mo après compression
                </Small>
              </div>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => void onSelectVideo(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-0 -mx-4 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={() => void save()}
            disabled={saving || uploading}
          >
            {saving
              ? isEdit
                ? "Enregistrement…"
                : "Création…"
              : isEdit
                ? "Enregistrer"
                : "Créer le produit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   Section / field wrappers
   ----------------------------------------------------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
      <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-zinc-700">
        {title}
      </h2>
      {children}
    </section>
  );
}

function FieldShell({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-700">{label}</Label>
      {children}
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

/** Tiny red inline error message — reused under inputs that don't go
 *  through FieldShell (price, stock, etc.). */
function FieldError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-1 text-2xs font-medium text-red-600"
    >
      <span aria-hidden className="inline-block size-1 rounded-full bg-red-600" />
      {message}
    </p>
  );
}

function FlagToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <span>{label}</span>
    </label>
  );
}

function BilingualField({
  labelFr,
  labelAr,
  valueFr,
  valueAr,
  onChangeFr,
  onChangeAr,
  placeholderFr,
  placeholderAr,
  multiline,
  rows = 3,
  errorFr,
  errorAr,
}: {
  labelFr: string;
  labelAr: string;
  valueFr: string;
  valueAr: string;
  onChangeFr: (v: string) => void;
  onChangeAr: (v: string) => void;
  placeholderFr?: string;
  placeholderAr?: string;
  multiline?: boolean;
  rows?: number;
  errorFr?: string;
  errorAr?: string;
}) {
  const invalidCls = "border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/20";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-zinc-700">{labelFr}</Label>
        {multiline ? (
          <Textarea
            rows={rows}
            value={valueFr}
            onChange={(e) => onChangeFr(e.target.value)}
            placeholder={placeholderFr}
            aria-invalid={!!errorFr}
            className={errorFr ? invalidCls : undefined}
          />
        ) : (
          <Input
            value={valueFr}
            onChange={(e) => onChangeFr(e.target.value)}
            placeholder={placeholderFr}
            aria-invalid={!!errorFr}
            className={errorFr ? invalidCls : undefined}
          />
        )}
        {errorFr ? <FieldError message={errorFr} /> : null}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-zinc-700" dir="rtl">
          {labelAr}
        </Label>
        {multiline ? (
          <Textarea
            rows={rows}
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            placeholder={placeholderAr}
            dir="rtl"
            lang="ar"
            aria-invalid={!!errorAr}
            className={errorAr ? invalidCls : undefined}
          />
        ) : (
          <Input
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            placeholder={placeholderAr}
            dir="rtl"
            lang="ar"
            aria-invalid={!!errorAr}
            className={errorAr ? invalidCls : undefined}
          />
        )}
        {errorAr ? <FieldError message={errorAr} /> : null}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   Combobox — Popover + cmdk pattern, reusable
   ----------------------------------------------------------- */

interface ComboOption {
  value: string;
  label: string;
  subLabel?: string;
}

function Combobox({
  value,
  onChange,
  options,
  placeholder,
  empty,
  disabled,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  options: ComboOption[];
  placeholder: string;
  empty: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const captureScroll = useFreezeScrollOnOpen(open);
  const current = options.find((o) => o.value === value) ?? null;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) captureScroll();
        setOpen(next);
      }}
    >
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-left text-sm transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60",
          !current && "text-zinc-500"
        )}
      >
        <span className="flex-1 truncate">
          {current ? current.label : placeholder}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0"
        align="start"
        initialFocus={false}
        finalFocus={false}
      >
        <Command>
          <CommandInput placeholder="Rechercher…" />
          <CommandList className="max-h-64">
            <CommandEmpty>{empty}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.subLabel ?? ""}`}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1 truncate text-sm">{o.label}</span>
                  {o.subLabel ? (
                    <span className="truncate text-2xs text-zinc-500" dir="rtl">
                      {o.subLabel}
                    </span>
                  ) : null}
                  {o.value === value ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -----------------------------------------------------------
   Brand picker — Combobox with "Ajouter une marque" inline footer
   ----------------------------------------------------------- */

function BrandPicker({
  value,
  onChange,
  brands,
  onBrandCreated,
  onBrandUpdated,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  brands: ApiBrand[];
  onBrandCreated: (brand: ApiBrand) => void;
  onBrandUpdated: (brand: ApiBrand) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  // Brand currently being edited (null = none). Drives the edit dialog.
  const [editing, setEditing] = React.useState<ApiBrand | null>(null);
  const captureScroll = useFreezeScrollOnOpen(open);
  const current = brands.find((b) => b.id === value) ?? null;

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) captureScroll();
          setOpen(next);
        }}
      >
        <PopoverTrigger
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-left text-sm transition-colors hover:border-zinc-400",
            !current && "text-zinc-500"
          )}
        >
          <span className="flex-1 truncate">
            {current ? current.name : "Choisir une marque"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" />
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0"
          align="start"
          initialFocus={false}
          finalFocus={false}
        >
          <Command>
            <CommandInput placeholder="Rechercher une marque…" />
            <CommandList className="max-h-64">
              <CommandEmpty>Aucune marque.</CommandEmpty>
              <CommandGroup>
                {brands.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={`${b.name} ${b.slug}`}
                    onSelect={() => {
                      onChange(b.id);
                      setOpen(false);
                    }}
                  >
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logo}
                        alt=""
                        className="size-5 rounded object-contain"
                      />
                    ) : (
                      <span className="flex size-5 items-center justify-center rounded bg-zinc-100 text-zinc-400">
                        <ImageIcon className="size-3" />
                      </span>
                    )}
                    <span className="flex-1 truncate text-sm">{b.name}</span>
                    {b.country ? (
                      <span className="font-mono text-2xs uppercase text-zinc-500">
                        {b.country}
                      </span>
                    ) : null}
                    {b.id === value ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : null}
                    {/* Edit — opens the dialog pre-filled. stopPropagation so
                        clicking the pencil doesn't also select the row. */}
                    <button
                      type="button"
                      aria-label={`Modifier ${b.name}`}
                      title="Modifier la marque"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setOpen(false);
                        setEditing(b);
                      }}
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="border-t border-zinc-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCreateOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="size-4" /> Ajouter une marque
              </button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <BrandDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={onBrandCreated}
      />
      <BrandDialog
        open={editing !== null}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        brand={editing}
        onSaved={onBrandUpdated}
      />
    </>
  );
}

function BrandDialog({
  open,
  onOpenChange,
  onSaved,
  brand = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (brand: ApiBrand) => void;
  /** When provided, the dialog edits this brand (PUT). When null, it
   *  creates a new one (POST). */
  brand?: ApiBrand | null;
}) {
  const isEdit = brand !== null;
  const [name, setName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [descFr, setDescFr] = React.useState("");
  const [descAr, setDescAr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Pre-fill from the brand being edited (or reset to blank for create)
  // each time the dialog opens.
  React.useEffect(() => {
    if (open) {
      setName(brand?.name ?? "");
      setCountry(brand?.country ?? "");
      setDescFr(brand?.descriptionFr ?? "");
      setDescAr(brand?.descriptionAr ?? "");
    }
  }, [open, brand]);

  const save = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        country: country.trim().toUpperCase() || null,
        descriptionFr: descFr.trim() || null,
        descriptionAr: descAr.trim() || null,
        isActive: brand?.isActive ?? true,
      };
      const saved = isEdit
        ? await brandsApi.update(brand.id, payload)
        : await brandsApi.create(payload);
      toast.success(
        isEdit ? `Marque modifiée : ${saved.name}` : `Marque créée : ${saved.name}`,
      );
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        extractMessage(
          err,
          isEdit ? "Erreur lors de la modification" : "Erreur lors de la création",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Controlled externally — opened by the "+ Ajouter une marque"
          button or a row's edit pencil inside BrandPicker; no
          DialogTrigger needed. */}
      <DialogContent className="w-[min(100vw-2rem,32rem)] max-w-none sm:max-w-none">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la marque" : "Ajouter une marque"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FieldShell label="Nom de la marque">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Quechua, Salomon, …"
              autoFocus
            />
          </FieldShell>
          <FieldShell label="Pays (code 2 lettres)">
            <Input
              value={country}
              onChange={(e) =>
                setCountry(e.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="FR, DZ, US…"
              maxLength={2}
              className="font-mono uppercase"
            />
          </FieldShell>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldShell label="Description (FR)">
              <Textarea
                rows={2}
                value={descFr}
                onChange={(e) => setDescFr(e.target.value)}
                placeholder="Marque française…"
              />
            </FieldShell>
            <FieldShell label="الوصف (AR)">
              <Textarea
                rows={2}
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                placeholder="علامة تجارية…"
                dir="rtl"
                lang="ar"
              />
            </FieldShell>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving
              ? isEdit
                ? "Enregistrement…"
                : "Création…"
              : isEdit
                ? "Enregistrer"
                : "Créer la marque"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
