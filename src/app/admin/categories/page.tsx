"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
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
import { Mono, Small } from "@/components/ui/typography";
import { categoriesApi, type ApiCategory } from "@/lib/api/categories";
import { HttpError } from "@/lib/api/http";
import { cn } from "@/lib/utils";

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

export default function CategoriesAdminPage() {
  const [tree, setTree] = React.useState<ApiCategory[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const confirm = useConfirm();

  const reload = React.useCallback(async () => {
    try {
      const data = await categoriesApi.listAll();
      setTree(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Impossible de charger les catégories.",
      );
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onCreateTop = async (payload: Parameters<typeof categoriesApi.create>[0]) => {
    try {
      await categoriesApi.create({ ...payload, parentId: null });
      await reload();
      toast.success("Catégorie créée");
    } catch (err) {
      toast.error(extractMessage(err, "Erreur lors de la création"));
      throw err;
    }
  };

  const onCreateSub = async (
    parent: ApiCategory,
    payload: Parameters<typeof categoriesApi.create>[0],
  ) => {
    try {
      await categoriesApi.create({
        ...payload,
        parentId: Number(parent.id),
        image: null,
      });
      await reload();
      setExpanded((prev) => new Set(prev).add(parent.id));
      toast.success("Sous-catégorie créée");
    } catch (err) {
      toast.error(extractMessage(err, "Erreur"));
      throw err;
    }
  };

  const onUpdate = async (
    id: string,
    payload: Parameters<typeof categoriesApi.update>[1],
  ) => {
    try {
      await categoriesApi.update(id, payload);
      await reload();
      toast.success("Catégorie mise à jour");
    } catch (err) {
      toast.error(extractMessage(err, "Erreur"));
      throw err;
    }
  };

  const onDelete = async (cat: ApiCategory) => {
    const isTop = !cat.parentId;
    const childCount = isTop ? (cat.children?.length ?? 0) : 0;
    const title = isTop
      ? `Supprimer « ${cat.nameFr} » ?`
      : `Supprimer la sous-catégorie « ${cat.nameFr} » ?`;
    const message = isTop
      ? childCount > 0
        ? `Cette catégorie et ses ${childCount} sous-catégorie(s) seront supprimées. Les produits liés bloqueront la suppression.`
        : "Les produits liés à cette catégorie bloqueront la suppression."
      : "La sous-catégorie sera supprimée immédiatement.";
    const ok = await confirm({
      title,
      message,
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await categoriesApi.destroy(cat.id);
      await reload();
      toast.success("Catégorie supprimée");
    } catch (err) {
      toast.error(
        extractMessage(
          err,
          "Impossible — déplacez d'abord les produits liés à cette catégorie.",
        ),
      );
    }
  };

  const onMove = async (id: string, direction: "up" | "down") => {
    try {
      await categoriesApi.move(id, direction);
      await reload();
    } catch {
      toast.error("Erreur lors du déplacement");
    }
  };

  /* -----------------------------------------------------------
     Drag-and-drop reordering. Tracks which row is being dragged
     and which one is the drop target (for the indicator line).
     Scope is "top" for the parent list or the parent's id for a
     sub-category list, so cross-list drops are rejected.
     ----------------------------------------------------------- */
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dragScope, setDragScope] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const beginDrag = (id: string, scope: string) => {
    setDragId(id);
    setDragScope(scope);
    setDragOverId(null);
  };
  const endDrag = () => {
    setDragId(null);
    setDragScope(null);
    setDragOverId(null);
  };

  /** Reorder a sibling group and persist via the bulk endpoint. */
  const reorderGroup = async (
    ids: string[],
    movedId: string,
    targetId: string,
  ) => {
    const from = ids.indexOf(movedId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...ids];
    const [pulled] = next.splice(from, 1);
    if (pulled) next.splice(to, 0, pulled);

    // Optimistic UI: rewrite display orders locally so the row jumps in
    // place without waiting for the round-trip. `reload()` re-syncs.
    setTree((prev) => {
      if (!prev) return prev;
      return prev.map((top) => {
        if (next.length && top.id === ids[0] && !top.parentId && false) return top; // noop placeholder
        // Top-level reorder
        const isTopGroup =
          ids.every((id) => prev.some((t) => t.id === id));
        if (isTopGroup) {
          const orderMap = new Map(next.map((id, i) => [id, i]));
          return { ...top, displayOrder: orderMap.get(top.id) ?? top.displayOrder };
        }
        // Sub-category group
        if (top.children && ids.every((id) => top.children!.some((s) => s.id === id))) {
          const orderMap = new Map(next.map((id, i) => [id, i]));
          return {
            ...top,
            children: [...top.children]
              .map((s) => ({
                ...s,
                displayOrder: orderMap.get(s.id) ?? s.displayOrder,
              }))
              .sort((a, b) => a.displayOrder - b.displayOrder),
          };
        }
        return top;
      })
      // Re-sort top-level after potential reorder
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder);
    });

    try {
      await categoriesApi.reorder(next);
      // Quiet reload — refetch to settle any divergence
      void reload();
    } catch (err) {
      toast.error(extractMessage(err, "Erreur lors du réordonnancement"));
      void reload();
    }
  };

  const onToggleActive = async (cat: ApiCategory) => {
    try {
      await categoriesApi.update(cat.id, {
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        slug: cat.slug,
        parentId: cat.parentId ? Number(cat.parentId) : null,
        icon: cat.icon,
        image: cat.image,
        descriptionFr: cat.descriptionFr,
        descriptionAr: cat.descriptionAr,
        displayOrder: cat.displayOrder,
        isActive: !cat.isActive,
      });
      await reload();
    } catch (err) {
      toast.error(extractMessage(err, "Erreur"));
    }
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Catégories"
        subtitle="Catégories principales avec image, sous-catégories sans image. Bilingue FR / AR."
        actions={<CategoryEditorTrigger mode="create-top" onSubmit={onCreateTop} />}
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {tree === null ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
          Chargement…
        </div>
      ) : tree.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
          Aucune catégorie. Cliquez sur « Ajouter une catégorie » pour
          commencer.
        </div>
      ) : (
        <ul className="space-y-3">
          {tree.map((cat) => {
            const isDragging = dragId === cat.id && dragScope === "top";
            const isOver =
              dragOverId === cat.id && dragScope === "top" && dragId !== cat.id;
            return (
            <li
              key={cat.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                beginDrag(cat.id, "top");
              }}
              onDragOver={(e) => {
                if (dragScope !== "top" || !dragId || dragId === cat.id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverId !== cat.id) setDragOverId(cat.id);
              }}
              onDragLeave={() => {
                if (dragOverId === cat.id) setDragOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragScope !== "top" || !dragId || dragId === cat.id) {
                  endDrag();
                  return;
                }
                const ids = (tree ?? []).map((t) => t.id);
                const moved = dragId;
                endDrag();
                void reorderGroup(ids, moved, cat.id);
              }}
              onDragEnd={endDrag}
              className={cn(
                "overflow-hidden rounded-md border bg-white transition-colors",
                isDragging
                  ? "border-blue-300 opacity-50"
                  : isOver
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-zinc-200"
              )}
            >
              <CategoryRow
                category={cat}
                expanded={expanded.has(cat.id)}
                onToggleExpand={() => toggleExpand(cat.id)}
                onMove={onMove}
                onToggleActive={onToggleActive}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
              {expanded.has(cat.id) ? (
                <SubcategorySection
                  parent={cat}
                  onCreate={(payload) => onCreateSub(cat, payload)}
                  onMove={onMove}
                  onToggleActive={onToggleActive}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  dragId={dragId}
                  dragScope={dragScope}
                  dragOverId={dragOverId}
                  beginDrag={beginDrag}
                  endDrag={endDrag}
                  setDragOverId={setDragOverId}
                  reorderGroup={reorderGroup}
                />
              ) : null}
            </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function CategoryRow({
  category,
  expanded,
  onToggleExpand,
  onMove,
  onToggleActive,
  onUpdate,
  onDelete,
}: {
  category: ApiCategory;
  expanded: boolean;
  onToggleExpand: () => void;
  onMove: (id: string, direction: "up" | "down") => Promise<void>;
  onToggleActive: (cat: ApiCategory) => Promise<void>;
  onUpdate: (
    id: string,
    payload: Parameters<typeof categoriesApi.update>[1],
  ) => Promise<void>;
  onDelete: (cat: ApiCategory) => Promise<void>;
}) {
  const subCount = category.children?.length ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <span
        aria-hidden="true"
        title="Glissez pour réordonner"
        className="cursor-grab text-zinc-300 hover:text-zinc-600 active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </span>

      <span className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-zinc-100">
        {category.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.image}
            alt={category.nameFr}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-300">
            <ImageIcon className="size-6" />
          </span>
        )}
      </span>

      <button
        type="button"
        onClick={onToggleExpand}
        className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-start hover:bg-zinc-50"
        aria-expanded={expanded}
      >
        <span className="mt-1 text-zinc-500">
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <Mono className="text-zinc-500">Ordre {category.displayOrder}</Mono>
          <h3 className="font-sans text-md font-semibold text-zinc-900 line-clamp-1">
            {category.nameFr}
          </h3>
          <p className="font-sans text-xs text-zinc-600 line-clamp-1" dir="rtl">
            {category.nameAr}
          </p>
          <p className="mt-0.5 font-mono text-2xs text-zinc-500">
            /{category.slug} · {subCount} sous-cat. · {category.productCount}{" "}
            produit{category.productCount > 1 ? "s" : ""}
          </p>
        </span>
      </button>

      <label className="flex items-center gap-2 text-xs">
        <Checkbox
          checked={category.isActive}
          onCheckedChange={() => void onToggleActive(category)}
        />
        <span>Actif</span>
      </label>

      <div className="flex items-center gap-1">
        <IconBtn label="Monter" onClick={() => void onMove(category.id, "up")}>
          <ArrowUp className="size-3.5" />
        </IconBtn>
        <IconBtn label="Descendre" onClick={() => void onMove(category.id, "down")}>
          <ArrowDown className="size-3.5" />
        </IconBtn>
        <CategoryEditorTrigger
          mode="edit-top"
          category={category}
          onSubmit={(payload) => onUpdate(category.id, payload)}
          triggerEl={
            <button
              type="button"
              aria-label="Éditer"
              className="inline-flex size-7 items-center justify-center rounded text-zinc-700 hover:bg-zinc-100"
            >
              <Pencil className="size-3.5" />
            </button>
          }
        />
        <IconBtn
          label="Supprimer"
          onClick={() => void onDelete(category)}
          destructive
        >
          <Trash2 className="size-3.5" />
        </IconBtn>
      </div>
    </div>
  );
}

function SubcategorySection({
  parent,
  onCreate,
  onMove,
  onToggleActive,
  onUpdate,
  onDelete,
  dragId,
  dragScope,
  dragOverId,
  beginDrag,
  endDrag,
  setDragOverId,
  reorderGroup,
}: {
  parent: ApiCategory;
  onCreate: (
    payload: Parameters<typeof categoriesApi.create>[0],
  ) => Promise<void>;
  onMove: (id: string, direction: "up" | "down") => Promise<void>;
  onToggleActive: (cat: ApiCategory) => Promise<void>;
  onUpdate: (
    id: string,
    payload: Parameters<typeof categoriesApi.update>[1],
  ) => Promise<void>;
  onDelete: (cat: ApiCategory) => Promise<void>;
  dragId: string | null;
  dragScope: string | null;
  dragOverId: string | null;
  beginDrag: (id: string, scope: string) => void;
  endDrag: () => void;
  setDragOverId: (id: string | null) => void;
  reorderGroup: (
    ids: string[],
    movedId: string,
    targetId: string,
  ) => Promise<void>;
}) {
  const subs = parent.children ?? [];
  const scope = `sub:${parent.id}`;
  return (
    <div className="space-y-2 border-t border-zinc-100 bg-zinc-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <Small className="font-medium text-zinc-700">
          Sous-catégories de « {parent.nameFr} »
        </Small>
        <CategoryEditorTrigger
          mode="create-sub"
          parent={parent}
          onSubmit={onCreate}
          triggerEl={
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Plus className="size-3.5" /> Ajouter une sous-catégorie
            </button>
          }
        />
      </div>

      {subs.length === 0 ? (
        <p className="rounded border border-dashed border-zinc-300 bg-white px-3 py-4 text-center text-xs text-zinc-500">
          Aucune sous-catégorie pour le moment.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {subs.map((sub) => {
            const isDragging = dragId === sub.id && dragScope === scope;
            const isOver =
              dragOverId === sub.id && dragScope === scope && dragId !== sub.id;
            return (
            <li
              key={sub.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                beginDrag(sub.id, scope);
              }}
              onDragOver={(e) => {
                if (dragScope !== scope || !dragId || dragId === sub.id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverId !== sub.id) setDragOverId(sub.id);
              }}
              onDragLeave={() => {
                if (dragOverId === sub.id) setDragOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragScope !== scope || !dragId || dragId === sub.id) {
                  endDrag();
                  return;
                }
                const ids = subs.map((s) => s.id);
                const moved = dragId;
                endDrag();
                void reorderGroup(ids, moved, sub.id);
              }}
              onDragEnd={endDrag}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-md border bg-white p-3 transition-colors",
                isDragging
                  ? "border-blue-300 opacity-50"
                  : isOver
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-zinc-200"
              )}
            >
              <span
                aria-hidden="true"
                title="Glissez pour réordonner"
                className="cursor-grab text-zinc-300 hover:text-zinc-600 active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-sans text-sm font-medium text-zinc-900 line-clamp-1">
                  {sub.nameFr}
                </h4>
                <p
                  className="font-sans text-xs text-zinc-600 line-clamp-1"
                  dir="rtl"
                >
                  {sub.nameAr}
                </p>
                <p className="mt-0.5 font-mono text-2xs text-zinc-500">
                  /{sub.slug}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={sub.isActive}
                  onCheckedChange={() => void onToggleActive(sub)}
                />
                <span>Actif</span>
              </label>
              <div className="flex items-center gap-1">
                <IconBtn label="Monter" onClick={() => void onMove(sub.id, "up")}>
                  <ArrowUp className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label="Descendre"
                  onClick={() => void onMove(sub.id, "down")}
                >
                  <ArrowDown className="size-3.5" />
                </IconBtn>
                <CategoryEditorTrigger
                  mode="edit-sub"
                  category={sub}
                  parent={parent}
                  onSubmit={(payload) => onUpdate(sub.id, payload)}
                  triggerEl={
                    <button
                      type="button"
                      aria-label="Éditer"
                      className="inline-flex size-7 items-center justify-center rounded text-zinc-700 hover:bg-zinc-100"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  }
                />
                <IconBtn
                  label="Supprimer"
                  onClick={() => void onDelete(sub)}
                  destructive
                >
                  <Trash2 className="size-3.5" />
                </IconBtn>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type EditorMode = "create-top" | "edit-top" | "create-sub" | "edit-sub";

function CategoryEditorTrigger({
  mode,
  category,
  parent,
  triggerEl,
  onSubmit,
}: {
  mode: EditorMode;
  category?: ApiCategory;
  parent?: ApiCategory;
  triggerEl?: React.ReactNode;
  onSubmit: (
    payload: Parameters<typeof categoriesApi.create>[0],
  ) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const isTopLevel = mode === "create-top" || mode === "edit-top";

  const [nameFr, setNameFr] = React.useState(category?.nameFr ?? "");
  const [nameAr, setNameAr] = React.useState(category?.nameAr ?? "");
  const [slug, setSlug] = React.useState(category?.slug ?? "");
  const [image, setImage] = React.useState(category?.image ?? "");
  const [icon, setIcon] = React.useState(category?.icon ?? "Folder");

  React.useEffect(() => {
    if (open) {
      setNameFr(category?.nameFr ?? "");
      setNameAr(category?.nameAr ?? "");
      setSlug(category?.slug ?? "");
      setImage(category?.image ?? "");
      setIcon(category?.icon ?? "Folder");
    }
  }, [open, category]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await categoriesApi.uploadImage(file);
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
      className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
    >
      <Plus className="size-3.5" /> Ajouter une catégorie
    </button>
  );

  const save = async () => {
    if (!nameFr.trim() || !nameAr.trim()) {
      toast.error("Les noms FR et AR sont requis");
      return;
    }
    if (isTopLevel && !image.trim()) {
      toast.error(
        "Ajoutez une image (obligatoire pour les catégories principales)"
      );
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        nameFr: nameFr.trim(),
        nameAr: nameAr.trim(),
        slug: slug.trim() || null,
        icon: icon.trim() || "Folder",
        image: isTopLevel ? image : null,
        parentId: parent ? Number(parent.id) : null,
        isActive: category?.isActive ?? true,
      });
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
      <DialogContent className="w-[min(100vw-2rem,42rem)] max-w-none sm:max-w-none">
        <DialogHeader>
          <DialogTitle>
            {mode === "create-top" && "Nouvelle catégorie"}
            {mode === "edit-top" && "Éditer la catégorie"}
            {mode === "create-sub" &&
              `Nouvelle sous-catégorie · ${parent?.nameFr}`}
            {mode === "edit-sub" &&
              `Éditer la sous-catégorie · ${parent?.nameFr}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {isTopLevel ? (
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-zinc-700">
                Image de fond
              </Label>
              <div className="flex gap-3">
                <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
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
                      "cursor-pointer self-start",
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
                    placeholder="/storage/categories/… ou URL"
                    className="font-mono text-xs"
                  />
                  <Small className="text-zinc-500">
                    Photo paysage. Affichée en arrière-plan sur la page
                    d&apos;accueil. Max 10 Mo.
                  </Small>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700">
                Nom (FR)
              </Label>
              <Input
                value={nameFr}
                onChange={(e) => setNameFr(e.target.value)}
                placeholder="Tentes & abris"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700" dir="rtl">
                الاسم (AR)
              </Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="الخيام والمآوي"
                dir="rtl"
                lang="ar"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700">
                Slug
                <span className="ms-1 text-zinc-400">(facultatif)</span>
              </Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto depuis le nom FR"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700">
                Icône
                <span className="ms-1 text-zinc-400">(nom lucide)</span>
              </Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Folder"
                className="font-mono text-xs"
              />
            </div>
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
              ? mode.startsWith("create")
                ? "Création…"
                : "Enregistrement…"
              : mode.startsWith("create")
                ? "Créer"
                : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  destructive,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded text-zinc-700 hover:bg-zinc-100",
        destructive && "hover:bg-red-50 hover:text-red-600"
      )}
    >
      {children}
    </button>
  );
}
