"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { LinkPicker } from "@/components/admin/LinkPicker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mono, Small } from "@/components/ui/typography";
import { bannersApi } from "@/lib/api/banners";
import { HttpError } from "@/lib/api/http";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";

/** Strip frontend-only fields for the create/update body. */
function toPayload(b: Banner): Omit<Banner, "id"> {
  const { id: _id, ...rest } = b;
  void _id;
  return rest;
}

export default function BannersPage() {
  const [list, setList] = React.useState<Banner[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [baselineOrder, setBaselineOrder] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const confirm = useConfirm();

  // Initial load + helper for reloading after mutations.
  const reload = React.useCallback(async () => {
    try {
      const data = await bannersApi.listAll();
      setList(data);
      setBaselineOrder(
        [...data]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((b) => b.id)
      );
      setError(null);
    } catch (err) {
      const msg =
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Impossible de charger les bannières.";
      setError(msg);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const currentOrder = React.useMemo(() => {
    if (!list) return [];
    return [...list]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((b) => b.id);
  }, [list]);

  const isDirty = React.useMemo(() => {
    if (currentOrder.length !== baselineOrder.length) return false;
    return currentOrder.some((id, i) => id !== baselineOrder[i]);
  }, [currentOrder, baselineOrder]);

  // Local-only reorder for the up/down arrows. Persisted by `saveOrder`.
  const reorder = (id: string, direction: -1 | 1) => {
    if (!list) return;
    const sorted = [...list].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[target]] = [next[target], next[idx]];
    setList(next.map((b, i) => ({ ...b, displayOrder: i })));
  };

  // Drag-and-drop reordering — local only, persisted by `saveOrder`.
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const endDrag = () => {
    setDragId(null);
    setDragOverId(null);
  };

  const reorderTo = (movedId: string, targetId: string) => {
    if (!list || movedId === targetId) return;
    const sorted = [...list].sort((a, b) => a.displayOrder - b.displayOrder);
    const from = sorted.findIndex((b) => b.id === movedId);
    const to = sorted.findIndex((b) => b.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...sorted];
    const [pulled] = next.splice(from, 1);
    if (pulled) next.splice(to, 0, pulled);
    setList(next.map((b, i) => ({ ...b, displayOrder: i })));
  };

  // Walk the diff baseline → current via the swap-only move() endpoint.
  // Process targets left-to-right, bubble each into place with "up" moves.
  const saveOrder = async () => {
    if (!isDirty || isSaving) return;
    const working = [...baselineOrder];
    const ops: Array<{ id: string; direction: "up" | "down" }> = [];
    for (let i = 0; i < currentOrder.length; i++) {
      const targetId = currentOrder[i];
      let idx = working.indexOf(targetId);
      while (idx > i) {
        ops.push({ id: targetId, direction: "up" });
        [working[idx - 1], working[idx]] = [working[idx], working[idx - 1]];
        idx--;
      }
    }
    setIsSaving(true);
    try {
      for (const op of ops) {
        await bannersApi.move(op.id, op.direction);
      }
      await reload();
      toast.success("Ordre enregistré");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
      await reload();
    } finally {
      setIsSaving(false);
    }
  };

  const cancelOrder = async () => {
    await reload();
  };

  const toggleActive = async (b: Banner) => {
    try {
      await bannersApi.update(b.id, toPayload({ ...b, isActive: !b.isActive }));
      await reload();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "Supprimer cette bannière ?",
      message:
        "La bannière disparaîtra immédiatement du carrousel d'accueil. Cette action est irréversible.",
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await bannersApi.destroy(id);
      await reload();
      toast.success("Bannière supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const onSubmitCreate = async (payload: Omit<Banner, "id">) => {
    try {
      await bannersApi.create(payload);
      await reload();
      toast.success("Bannière créée");
    } catch (err) {
      toast.error(extractMessage(err, "Erreur lors de la création"));
      throw err;
    }
  };

  const onSubmitUpdate = async (id: string, payload: Omit<Banner, "id">) => {
    try {
      await bannersApi.update(id, payload);
      await reload();
      toast.success("Bannière mise à jour");
    } catch (err) {
      toast.error(extractMessage(err, "Erreur lors de la mise à jour"));
      throw err;
    }
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing"
        title="Hero — bannières d'accueil"
        subtitle="Slides du carrousel principal. Bilingue FR / AR."
        actions={<BannerEditorTrigger onSubmit={onSubmitCreate} disabled={isDirty} />}
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isDirty ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">
            Changements d'ordre non enregistrés. Enregistrez ou annulez avant
            d'autres modifications.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void cancelOrder()}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void saveOrder()}
              disabled={isSaving}
            >
              {isSaving ? "Enregistrement…" : "Enregistrer l'ordre"}
            </Button>
          </div>
        </div>
      ) : null}

      {list === null ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
          Chargement…
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
          Aucune bannière pour le moment. Cliquez sur «&nbsp;Ajouter une
          bannière&nbsp;» pour créer la première slide.
        </div>
      ) : (
      <ul className="space-y-3">
        {list
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((b) => {
            const titleFr = b.titleFr ?? b.title ?? "";
            const titleAr = b.titleAr ?? "";
            const subtitleFr = b.subtitleFr ?? b.subtitle ?? "";
            const isDragging = dragId === b.id;
            const isOver = dragOverId === b.id && dragId !== b.id;
            return (
              <li
                key={b.id}
                draggable={!isSaving}
                onDragStart={(e) => {
                  if (isSaving) return;
                  e.dataTransfer.effectAllowed = "move";
                  setDragId(b.id);
                  setDragOverId(null);
                }}
                onDragOver={(e) => {
                  if (!dragId || dragId === b.id) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverId !== b.id) setDragOverId(b.id);
                }}
                onDragLeave={() => {
                  if (dragOverId === b.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === b.id) {
                    endDrag();
                    return;
                  }
                  const moved = dragId;
                  endDrag();
                  void reorderTo(moved, b.id);
                }}
                onDragEnd={endDrag}
                className={cn(
                  "rounded-md border bg-zinc-50 p-4 transition-colors",
                  isDragging
                    ? "border-blue-300 opacity-50"
                    : isOver
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-zinc-200"
                )}
              >
                {/* Top control bar */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="cursor-grab text-zinc-400 active:cursor-grabbing"
                      title="Glisser pour réordonner"
                    >
                      <GripVertical className="size-4" />
                    </span>
                    <Mono className="text-zinc-500">Ordre {b.displayOrder}</Mono>
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={b.isActive}
                        onCheckedChange={() => void toggleActive(b)}
                        disabled={isDirty}
                      />
                      <span>Actif</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBtn
                      label="Monter"
                      onClick={() => reorder(b.id, -1)}
                      disabled={isSaving}
                    >
                      <ArrowUp className="size-3.5" />
                    </IconBtn>
                    <IconBtn
                      label="Descendre"
                      onClick={() => reorder(b.id, 1)}
                      disabled={isSaving}
                    >
                      <ArrowDown className="size-3.5" />
                    </IconBtn>
                    <BannerEditorTrigger
                      banner={b}
                      onSubmit={(updated) => onSubmitUpdate(b.id, updated)}
                      disabled={isDirty}
                      triggerEl={
                        <button
                          type="button"
                          aria-label="Éditer"
                          disabled={isDirty}
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded text-zinc-700 hover:bg-zinc-100",
                            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          )}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      }
                    />
                    <IconBtn
                      label="Supprimer"
                      onClick={() => void remove(b.id)}
                      destructive
                      disabled={isDirty}
                    >
                      <Trash2 className="size-3.5" />
                    </IconBtn>
                  </div>
                </div>

                {/* Body: image — FR | AR — image */}
                <div className="flex flex-wrap items-center gap-4">
                  <BannerThumb src={b.image} alt={titleFr || titleAr || ""} />

                  <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <h3 className="font-sans text-md font-semibold text-zinc-900 line-clamp-1">
                        {titleFr || "—"}
                      </h3>
                      <Small className="line-clamp-2">{subtitleFr || ""}</Small>
                    </div>
                    <div className="min-w-0" dir="rtl" lang="ar">
                      <h3 className="font-sans text-md font-semibold text-zinc-900 line-clamp-1">
                        {titleAr || "—"}
                      </h3>
                      <Small className="line-clamp-2">{b.subtitleAr || ""}</Small>
                    </div>
                  </div>

                  <BannerThumb src={b.image} alt="" />
                </div>

                {b.link ? (
                  <p className="mt-3 border-t border-zinc-200 pt-2 font-mono text-2xs text-zinc-700 line-clamp-1">
                    {b.link}
                  </p>
                ) : null}
              </li>
            );
          })}
      </ul>
      )}
    </>
  );
}

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError) {
    const body = err.body as { message?: string; errors?: Record<string, string[]> } | null;
    if (body?.errors) {
      const first = Object.values(body.errors)[0]?.[0];
      if (first) return first;
    }
    if (body?.message) return body.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function BannerThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-white">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="128px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-zinc-300">
          <ImageIcon className="size-6" />
        </span>
      )}
    </span>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  destructive,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded text-zinc-700 hover:bg-zinc-100",
        destructive && "hover:bg-red-50 hover:text-red-600",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-700"
      )}
    >
      {children}
    </button>
  );
}

function BannerEditorTrigger({
  banner,
  triggerEl,
  onSubmit,
  disabled,
}: {
  banner?: Banner;
  triggerEl?: React.ReactNode;
  onSubmit: (banner: Omit<Banner, "id">) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const isEdit = !!banner;

  // Local form state — falls back through new bilingual fields → legacy
  // single-language fields when editing an old banner.
  const [titleFr, setTitleFr] = React.useState(banner?.titleFr ?? banner?.title ?? "");
  const [titleAr, setTitleAr] = React.useState(banner?.titleAr ?? "");
  const [subtitleFr, setSubtitleFr] = React.useState(
    banner?.subtitleFr ?? banner?.subtitle ?? ""
  );
  const [subtitleAr, setSubtitleAr] = React.useState(banner?.subtitleAr ?? "");
  const [ctaFr, setCtaFr] = React.useState(banner?.ctaLabelFr ?? banner?.ctaLabel ?? "");
  const [ctaAr, setCtaAr] = React.useState(banner?.ctaLabelAr ?? "");
  const [link, setLink] = React.useState(banner?.link ?? "");
  const [image, setImage] = React.useState(banner?.image ?? "");

  // Real upload — sends the file to /api/admin/uploads/banner-image and
  // swaps the preview to the returned absolute URL.
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await bannersApi.uploadImage(file);
      setImage(url);
      toast.success("Image téléversée");
    } catch (err) {
      toast.error(extractMessage(err, "Échec du téléversement"));
    } finally {
      setUploading(false);
    }
  };

  const trigger = triggerEl ?? (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        buttonVariants({ variant: "primary", size: "sm" }),
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <Plus className="size-3.5" /> Ajouter une bannière
    </button>
  );

  const save = async () => {
    if (!titleFr.trim() && !titleAr.trim()) {
      toast.error("Renseignez au moins un titre (FR ou AR)");
      return;
    }
    if (!image.trim()) {
      toast.error("Ajoutez une image");
      return;
    }
    const payload: Omit<Banner, "id"> = {
      image,
      titleFr: titleFr.trim() || undefined,
      titleAr: titleAr.trim() || undefined,
      subtitleFr: subtitleFr.trim() || undefined,
      subtitleAr: subtitleAr.trim() || undefined,
      ctaLabelFr: ctaFr.trim() || undefined,
      ctaLabelAr: ctaAr.trim() || undefined,
      link: link || undefined,
      isActive: banner?.isActive ?? true,
      displayOrder: banner?.displayOrder ?? 0,
    };
    setSaving(true);
    try {
      await onSubmit(payload);
      setOpen(false);
    } catch {
      /* parent shows the toast */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="w-[min(100vw-2rem,56rem)] max-w-none sm:max-w-none">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Éditer la bannière" : "Nouvelle bannière"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Image */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-700">
              Image
            </Label>
            <div className="flex gap-3">
              <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt="Aperçu"
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-zinc-300">
                    <ImageIcon className="size-7" />
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "cursor-pointer",
                    uploading && "pointer-events-none opacity-60"
                  )}
                >
                  <Upload className="size-3.5" />
                  {uploading ? "Téléversement…" : "Téléverser une image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => void onFile(e.target.files?.[0])}
                    disabled={uploading}
                  />
                </label>
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/storage/banners/… ou URL absolue"
                  className="font-mono text-xs"
                />
                <Small className="text-zinc-500">
                  PNG / JPG / WebP / AVIF, max 5 Mo. Téléversé sur Laravel.
                </Small>
              </div>
            </div>
          </div>

          {/* Bilingual title */}
          <BilingualField
            labelFr="Titre (FR)"
            labelAr="العنوان (AR)"
            valueFr={titleFr}
            valueAr={titleAr}
            onChangeFr={setTitleFr}
            onChangeAr={setTitleAr}
            placeholderFr="Le printemps en montagne"
            placeholderAr="الربيع في الجبال"
          />

          {/* Bilingual subtitle (textarea) */}
          <BilingualField
            multiline
            labelFr="Paragraphe (FR)"
            labelAr="الفقرة (AR)"
            valueFr={subtitleFr}
            valueAr={subtitleAr}
            onChangeFr={setSubtitleFr}
            onChangeAr={setSubtitleAr}
            placeholderFr="Découvrez la sélection randonnée…"
            placeholderAr="اكتشف تشكيلة المشي…"
          />

          {/* Bilingual CTA label */}
          <BilingualField
            labelFr="Libellé du bouton (FR)"
            labelAr="نص الزر (AR)"
            valueFr={ctaFr}
            valueAr={ctaAr}
            onChangeFr={setCtaFr}
            onChangeAr={setCtaAr}
            placeholderFr="Voir la sélection"
            placeholderAr="عرض التشكيلة"
          />

          {/* Link picker */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-700">
              Destination du bouton
            </Label>
            <LinkPicker
              value={link}
              onChange={setLink}
              placeholder="Choisir un produit, une catégorie ou un filtre…"
            />
            <Small className="text-zinc-500">
              Cherchez par nom de produit, SKU ou catégorie. Les filtres
              rapides linkent vers Catalogue / Promotions / Nouveautés / Best
              sellers.
            </Small>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void save()}
            disabled={saving || uploading}
          >
            {saving
              ? isEdit
                ? "Enregistrement…"
                : "Création…"
              : isEdit
                ? "Enregistrer"
                : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Side-by-side French / Arabic pair. Defaults to single-line `Input`;
 * `multiline` swaps to `Textarea` for paragraphs.
 */
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
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-zinc-700">{labelFr}</Label>
        {multiline ? (
          <Textarea
            rows={3}
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
            rows={3}
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
