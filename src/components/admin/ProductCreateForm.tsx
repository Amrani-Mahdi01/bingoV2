"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  ImageIcon,
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

export function ProductCreateForm({ initialProduct }: ProductCreateFormProps = {}) {
  const router = useRouter();
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
  const [isFeatured, setIsFeatured] = React.useState(initialProduct?.isFeatured ?? false);
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

  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

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
  React.useEffect(() => {
    if (subId && !subs.some((s) => s.id === subId)) {
      setSubId(null);
    }
  }, [parentId, subId, subs]);

  const currentBrand = brands?.find((b) => b.id === brandId) ?? null;
  const currentSub = subs.find((s) => s.id === subId) ?? null;

  const onUploadFiles = async (files: FileList | File[] | null | undefined) => {
    const list = files
      ? Array.from(files).filter((f) => f.type.startsWith("image/"))
      : [];
    if (list.length === 0) return;
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

  const save = async () => {
    if (!nameFr.trim() || !nameAr.trim()) {
      toast.error("Renseignez les noms FR et AR");
      return;
    }
    if (!subId) {
      toast.error("Choisissez une sous-catégorie");
      return;
    }
    if (!brandId) {
      toast.error("Choisissez une marque");
      return;
    }
    const priceN = parseInt(price, 10);
    if (!Number.isFinite(priceN) || priceN < 0) {
      toast.error("Prix invalide");
      return;
    }

    const oldN = oldPrice.trim() === "" ? null : parseInt(oldPrice, 10);
    if (oldN !== null && (!Number.isFinite(oldN) || oldN < priceN)) {
      toast.error("L'ancien prix doit être ≥ prix actuel");
      return;
    }

    const payload: ProductPayload = {
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim(),
      descriptionShortFr: shortFr.trim() || null,
      descriptionShortAr: shortAr.trim() || null,
      descriptionFr: descFr.trim() || null,
      descriptionAr: descAr.trim() || null,
      categoryId: Number(subId),
      brandId: Number(brandId),
      price: priceN,
      oldPrice: oldN,
      stock: parseInt(stock || "0", 10) || 0,
      lowStockThreshold: parseInt(lowStock || "5", 10) || 5,
      isActive,
      isFeatured,
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
          onChangeFr={setNameFr}
          onChangeAr={setNameAr}
          placeholderFr="Tente 2 places MH100"
          placeholderAr="خيمة شخصين MH100"
        />
        <BilingualField
          multiline
          rows={2}
          labelFr="Description courte (FR)"
          labelAr="وصف قصير (AR)"
          valueFr={shortFr}
          valueAr={shortAr}
          onChangeFr={setShortFr}
          onChangeAr={setShortAr}
          placeholderFr="Tente dôme légère, étanchéité 2000 mm…"
          placeholderAr="خيمة قبّة خفيفة، عزل ماء 2000 ملم…"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700">
              Description complète (FR)
            </Label>
            <RichEditor
              value={descFr}
              onChange={setDescFr}
              placeholder="Caractéristiques, conseils d'usage, montage…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700" dir="rtl">
              الوصف الكامل (AR)
            </Label>
            <RichEditor
              value={descAr}
              onChange={setDescAr}
              placeholder="الخصائص، نصائح الاستعمال، التركيب…"
              rtl
            />
          </div>
        </div>
      </Section>

      {/* Classification */}
      <Section title="Classification">
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldShell label="Catégorie principale">
            <Combobox
              value={currentTop?.id ?? null}
              onChange={(id) => {
                setParentId(id);
                setSubId(null);
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
          <FieldShell label="Sous-catégorie">
            <Combobox
              value={currentSub?.id ?? null}
              onChange={setSubId}
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
          <FieldShell label="Marque">
            <BrandPicker
              value={brandId}
              onChange={setBrandId}
              brands={brands ?? []}
              onBrandCreated={(brand) => {
                setBrands((prev) => [...(prev ?? []), brand]);
                setBrandId(brand.id);
              }}
            />
          </FieldShell>
        </div>
      </Section>

      {/* Pricing + stock */}
      <Section title="Prix & stock">
        <div className="grid gap-4 sm:grid-cols-4">
          <FieldShell label="Prix (DZD)">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="font-mono"
            />
          </FieldShell>
          <FieldShell label="Ancien prix">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              placeholder="facultatif"
              className="font-mono"
            />
          </FieldShell>
          <FieldShell label="Stock">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="font-mono"
            />
          </FieldShell>
          <FieldShell label="Seuil stock bas">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={lowStock}
              onChange={(e) => setLowStock(e.target.value)}
              className="font-mono"
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
          <FlagToggle label="En vedette" checked={isFeatured} onChange={setIsFeatured} />
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

                      {/* Trash button — stopPropagation so clicking it
                          doesn't also promote the image. */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        aria-label="Supprimer"
                        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md bg-white/90 text-red-700 opacity-0 transition-opacity hover:bg-white hover:text-red-800 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Small className="text-zinc-500">
                Cliquez sur une photo pour la définir comme image principale.
              </Small>
            </>
          ) : null}

          {/* Dropzone — click to open file picker OR drag images onto it.
              Accepts multiple files in one drop; first file becomes the
              principal photo. */}
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

          {images.length === 0 ? (
            <Small className="text-zinc-500">
              La première image téléversée devient la photo principale.
            </Small>
          ) : null}
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-700">{label}</Label>
      {children}
    </div>
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
}) {
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
          />
        ) : (
          <Input
            value={valueFr}
            onChange={(e) => onChangeFr(e.target.value)}
            placeholder={placeholderFr}
          />
        )}
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
          />
        ) : (
          <Input
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            placeholder={placeholderAr}
            dir="rtl"
            lang="ar"
          />
        )}
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
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  brands: ApiBrand[];
  onBrandCreated: (brand: ApiBrand) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
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

      <CreateBrandDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onBrandCreated}
      />
    </>
  );
}

function CreateBrandDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (brand: ApiBrand) => void;
}) {
  const [name, setName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [descFr, setDescFr] = React.useState("");
  const [descAr, setDescAr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setCountry("");
      setDescFr("");
      setDescAr("");
    }
  }, [open]);

  const save = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setSaving(true);
    try {
      const brand = await brandsApi.create({
        name: name.trim(),
        country: country.trim().toUpperCase() || null,
        descriptionFr: descFr.trim() || null,
        descriptionAr: descAr.trim() || null,
        isActive: true,
      });
      toast.success(`Marque créée : ${brand.name}`);
      onCreated(brand);
      onOpenChange(false);
    } catch (err) {
      toast.error(extractMessage(err, "Erreur lors de la création"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Controlled externally — opened by the "+ Ajouter une marque"
          button inside BrandPicker; no DialogTrigger needed. */}
      <DialogContent className="w-[min(100vw-2rem,32rem)] max-w-none sm:max-w-none">
        <DialogHeader>
          <DialogTitle>Ajouter une marque</DialogTitle>
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
            {saving ? "Création…" : "Créer la marque"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
