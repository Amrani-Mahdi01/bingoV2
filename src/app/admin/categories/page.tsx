"use client";

import * as React from "react";
import { mediaUrl } from "@/lib/media";
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

/** URL-safe slug from a free-form string. Strips accents, lowercases,
 *  collapses everything non-alphanumeric into single dashes. */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export default function CategoriesAdminPage() {
  const [tree, setTree] = React.useState<ApiCategory[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  // Pending reorder per sibling group. Key: "top" or `sub:<parentId>`.
  // Value: the new ordered list of category IDs. Empty when there's
  // nothing to save.
  const [pendingOrders, setPendingOrders] = React.useState<
    Map<string, string[]>
  >(() => new Map());
  // Pending cross-parent moves. Key: sub id. Value: new parent id.
  // Persisted as a separate map because they hit a different endpoint
  // (categoriesApi.update with parentId) than the reorder bulk.
  const [pendingMoves, setPendingMoves] = React.useState<
    Map<string, string>
  >(() => new Map());
  const [savingOrder, setSavingOrder] = React.useState(false);
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
      // Backend returns 422 with product_count when products still link
      // here. Offer a cascade-delete confirm so the admin can wipe them
      // in one shot without leaving the page.
      const status = (err as { status?: number })?.status;
      const body = (err as { body?: { product_count?: number; message?: string } })?.body;
      if (status === 422 && typeof body?.product_count === "number" && body.product_count > 0) {
        const n = body.product_count;
        const cascadeOk = await confirm({
          title: `Supprimer aussi ${n} produit${n > 1 ? "s" : ""} ?`,
          message:
            body.message ??
            `Cette catégorie est liée à ${n} produit${n > 1 ? "s" : ""}. ` +
              "Confirmez pour les supprimer définitivement avec la catégorie. " +
              "Cette action est irréversible.",
          confirmLabel: `Tout supprimer (${n})`,
          variant: "destructive",
        });
        if (!cascadeOk) return;
        try {
          await categoriesApi.destroy(cat.id, { cascade: true });
          await reload();
          toast.success(
            `Catégorie et ${n} produit${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}`,
          );
        } catch (err2) {
          toast.error(extractMessage(err2, "Suppression en cascade impossible."));
        }
        return;
      }
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

  /**
   * Local-only reorder. Rewrites the tree state + records the new ID
   * order for this sibling group in `pendingOrders`. The actual API
   * write happens when the admin clicks "Enregistrer".
   */
  const reorderGroup = (
    ids: string[],
    movedId: string,
    targetId: string,
  ) => {
    if (!tree) return;
    const from = ids.indexOf(movedId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...ids];
    const [pulled] = next.splice(from, 1);
    if (pulled) next.splice(to, 0, pulled);

    // Determine which sibling group this is, BEFORE state updates,
    // so we can both update local tree and record the pending order
    // using the same key.
    let groupKey: string;
    let parentId: string | null = null;
    const isTopGroup = ids.every((id) => tree.some((t) => t.id === id));
    if (isTopGroup) {
      groupKey = "top";
    } else {
      const parent = tree.find(
        (t) => t.children && ids.every((id) => t.children!.some((s) => s.id === id)),
      );
      if (!parent) return;
      parentId = parent.id;
      groupKey = `sub:${parent.id}`;
    }

    setTree((prev) => {
      if (!prev) return prev;
      const orderMap = new Map(next.map((id, i) => [id, i]));
      if (isTopGroup) {
        return [...prev]
          .map((top) => ({
            ...top,
            displayOrder: orderMap.get(top.id) ?? top.displayOrder,
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder);
      }
      return prev.map((top) =>
        top.id === parentId
          ? {
              ...top,
              children: [...(top.children ?? [])]
                .map((s) => ({
                  ...s,
                  displayOrder: orderMap.get(s.id) ?? s.displayOrder,
                }))
                .sort((a, b) => a.displayOrder - b.displayOrder),
            }
          : top,
      );
    });

    setPendingOrders((prev) => {
      const out = new Map(prev);
      out.set(groupKey, next);
      return out;
    });
  };

  /**
   * Move a sub-category to a different parent (drag-drop across parents).
   * Local-only; persisted alongside reorders when the admin saves.
   * If `targetParentId === current parent` it's a no-op.
   */
  const moveSubToParent = (subId: string, targetParentId: string) => {
    if (!tree) return;
    // Locate the sub + its current parent.
    let currentParent: ApiCategory | null = null;
    let movedSub: ApiCategory | null = null;
    for (const top of tree) {
      const found = top.children?.find((s) => s.id === subId);
      if (found) {
        currentParent = top;
        movedSub = found;
        break;
      }
    }
    if (!movedSub || !currentParent) return;
    if (currentParent.id === targetParentId) return;
    if (!tree.some((t) => t.id === targetParentId)) return;

    // Optimistic local move + record pending parent change. Also reset
    // pending order entries for both parents since they're stale.
    setTree((prev) => {
      if (!prev) return prev;
      return prev.map((top) => {
        if (top.id === currentParent!.id) {
          return {
            ...top,
            children: (top.children ?? []).filter((s) => s.id !== subId),
          };
        }
        if (top.id === targetParentId) {
          const movedWithParent = {
            ...movedSub!,
            parentId: targetParentId,
            displayOrder: (top.children?.length ?? 0) + 1,
          };
          return {
            ...top,
            children: [...(top.children ?? []), movedWithParent],
          };
        }
        return top;
      });
    });

    setPendingMoves((prev) => {
      const out = new Map(prev);
      out.set(subId, targetParentId);
      return out;
    });
    setPendingOrders((prev) => {
      const out = new Map(prev);
      // Order entries for the old/new parent groups don't reflect the
      // move yet; drop them so the save loop doesn't push stale data.
      out.delete(`sub:${currentParent!.id}`);
      out.delete(`sub:${targetParentId}`);
      return out;
    });
  };

  const hasPending = pendingOrders.size > 0 || pendingMoves.size > 0;

  const saveOrder = async () => {
    if (!hasPending) return;
    setSavingOrder(true);
    try {
      // 1. Cross-parent moves first — they change the membership of
      //    sibling groups, so reorders can land on the fresh groups.
      for (const [subId, newParentId] of pendingMoves.entries()) {
        const sub = tree
          ?.flatMap((t) => t.children ?? [])
          .find((s) => s.id === subId);
        if (!sub) continue;
        await categoriesApi.update(subId, {
          nameFr: sub.nameFr,
          nameAr: sub.nameAr,
          slug: sub.slug,
          icon: sub.icon,
          image: sub.image,
          descriptionFr: sub.descriptionFr,
          descriptionAr: sub.descriptionAr,
          displayOrder: sub.displayOrder,
          isActive: sub.isActive,
          parentId: Number(newParentId),
        });
      }
      // 2. Bulk reorders per sibling group.
      for (const ids of pendingOrders.values()) {
        await categoriesApi.reorder(ids);
      }
      setPendingOrders(new Map());
      setPendingMoves(new Map());
      toast.success("Changements enregistrés");
      void reload();
    } catch (err) {
      toast.error(extractMessage(err, "Échec de l'enregistrement"));
    } finally {
      setSavingOrder(false);
    }
  };

  const discardOrder = () => {
    setPendingOrders(new Map());
    setPendingMoves(new Map());
    void reload();
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

      {/* Pending-order save bar — shows after a drag-and-drop, only
          persists when the admin confirms. */}
      {hasPending ? (
        <div className="sticky top-4 z-30 mb-4 flex items-center justify-between gap-3 rounded-md border border-blue-300 bg-blue-50 px-4 py-2.5 shadow-md">
          <span className="text-xs font-medium text-blue-900">
            {pendingOrders.size + pendingMoves.size} changement
            {pendingOrders.size + pendingMoves.size > 1 ? "s" : ""} non
            enregistré
            {pendingOrders.size + pendingMoves.size > 1 ? "s" : ""}.
            {pendingMoves.size > 0 ? (
              <span className="ms-1 text-blue-700/80">
                ({pendingMoves.size} déplacement
                {pendingMoves.size > 1 ? "s" : ""})
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={discardOrder}
              disabled={savingOrder}
              className="h-7 border-blue-300 bg-white text-xs text-blue-900 hover:bg-blue-100"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void saveOrder()}
              disabled={savingOrder}
              className="h-7 text-xs"
            >
              {savingOrder ? "Enregistrement…" : "Enregistrer l'ordre"}
            </Button>
          </div>
        </div>
      ) : null}

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
            // Parent row lights up when a top-level sibling is dragged
            // OVER it (reorder) OR when a sub-cat from a different
            // parent is dragged over it (cross-parent move).
            const isCrossParentTarget =
              !!dragId &&
              !!dragScope &&
              dragScope.startsWith("sub:") &&
              dragScope !== `sub:${cat.id}` &&
              dragOverId === cat.id;
            const isOver =
              (dragOverId === cat.id &&
                dragScope === "top" &&
                dragId !== cat.id) ||
              isCrossParentTarget;
            return (
            <li
              key={cat.id}
              // `draggable` lives on the grip handle inside CategoryRow,
              // not the whole row, so taps on the image / checkboxes /
              // buttons don't accidentally start a drag. The <li>
              // remains the drop target.
              onDragOver={(e) => {
                const isTopReorder =
                  dragScope === "top" && !!dragId && dragId !== cat.id;
                const isSubMove =
                  !!dragScope &&
                  dragScope.startsWith("sub:") &&
                  dragScope !== `sub:${cat.id}` &&
                  !!dragId;
                if (!isTopReorder && !isSubMove) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverId !== cat.id) setDragOverId(cat.id);
              }}
              onDragLeave={() => {
                if (dragOverId === cat.id) setDragOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = dragId;
                if (!id) {
                  endDrag();
                  return;
                }
                // Top-level reorder: a top sibling dropped on another top sibling.
                if (dragScope === "top" && id !== cat.id) {
                  const ids = (tree ?? []).map((t) => t.id);
                  endDrag();
                  void reorderGroup(ids, id, cat.id);
                  return;
                }
                // Cross-parent move: a sub from another parent dropped here.
                if (
                  dragScope &&
                  dragScope.startsWith("sub:") &&
                  dragScope !== `sub:${cat.id}`
                ) {
                  endDrag();
                  moveSubToParent(id, cat.id);
                  return;
                }
                endDrag();
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
                onHandleDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  beginDrag(cat.id, "top");
                }}
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
                  moveSubToParent={moveSubToParent}
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
  onHandleDragStart,
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
  /** Drag-start handler bound to the grip handle. Only the handle is
   *  `draggable` so taps on the image / buttons don't lift the row. */
  onHandleDragStart: (e: React.DragEvent<HTMLSpanElement>) => void;
}) {
  const subCount = category.children?.length ?? 0;
  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Top row — image (left) + active + action buttons (right).
          On narrow mobile the image shrinks and the "Actif" word hides
          so all four action buttons stay on the card. */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-start gap-2 sm:gap-3">
          <span
            draggable
            onDragStart={onHandleDragStart}
            role="button"
            tabIndex={0}
            aria-label="Glisser pour réordonner"
            title="Glissez pour réordonner"
            className="-m-2 mt-1 cursor-grab touch-none p-2 text-zinc-300 hover:text-zinc-600 active:cursor-grabbing"
          >
            <GripVertical className="size-5" />
          </span>
          <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 sm:h-20 sm:w-32">
            {category.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(category.image)}
                alt={category.nameFr}
                className="absolute inset-0 size-full object-contain p-2"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-zinc-300">
                <ImageIcon className="size-6" />
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <label
            className="flex items-center gap-2 text-xs"
            aria-label="Actif"
          >
            <Checkbox
              checked={category.isActive}
              onCheckedChange={() => void onToggleActive(category)}
            />
            <span className="hidden sm:inline">Actif</span>
          </label>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <IconBtn label="Monter" onClick={() => void onMove(category.id, "up")}>
              <ArrowUp className="size-3.5" />
            </IconBtn>
            <IconBtn
              label="Descendre"
              onClick={() => void onMove(category.id, "down")}
            >
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
      </div>

      {/* Bottom row — FR (start) | AR (end), click to expand.
          Always 2 columns. Names get `line-clamp-2` so narrow widths
          wrap to a second line instead of being chopped. A vertical
          hairline between the two columns helps the bilingual content
          read as paired rather than smeared. */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex min-w-0 items-start gap-2 rounded-md text-start hover:bg-zinc-50"
        aria-expanded={expanded}
      >
        <span className="mt-1 text-zinc-500">
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </span>
        <span className="grid min-w-0 flex-1 grid-cols-2 items-start gap-3 sm:gap-4">
          {/* French */}
          <span className="min-w-0">
            <Mono className="text-[10px] text-zinc-500 sm:text-2xs">
              Ordre {category.displayOrder}
            </Mono>
            <h3 className="font-sans text-sm font-semibold text-zinc-900 line-clamp-2 leading-tight sm:text-md">
              {category.nameFr}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] leading-tight text-zinc-500 sm:text-2xs">
              {subCount} sous-cat. · {category.productCount}{" "}
              produit{category.productCount > 1 ? "s" : ""}
            </p>
          </span>

          {/* Arabic */}
          <span
            dir="rtl"
            className="min-w-0 border-s border-zinc-100 ps-3 text-right sm:ps-4"
          >
            <Mono className="text-[10px] text-zinc-500 sm:text-2xs">
              ترتيب {category.displayOrder}
            </Mono>
            <h3 className="font-sans text-sm font-semibold text-zinc-700 line-clamp-2 leading-tight sm:text-md">
              {category.nameAr}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] leading-tight text-zinc-500 sm:text-2xs">
              {subCount} فئات فرعية · {category.productCount} منتجات
            </p>
          </span>
        </span>
      </button>
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
  moveSubToParent,
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
  reorderGroup: (ids: string[], movedId: string, targetId: string) => void;
  moveSubToParent: (subId: string, targetParentId: string) => void;
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
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                // Shrink slightly on mobile so it doesn't dwarf the
                // wrapping heading next to it.
                "h-7 gap-1 px-2 text-[11px] sm:h-8 sm:gap-1.5 sm:px-3 sm:text-xs",
              )}
            >
              <Plus className="size-3 sm:size-3.5" /> Ajouter une sous-catégorie
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
            // Accept drops from the same parent (reorder) OR from a
            // different parent (cross-parent move into this parent).
            const isOver =
              !!dragId &&
              dragId !== sub.id &&
              !!dragScope &&
              dragScope.startsWith("sub:") &&
              dragOverId === sub.id;
            return (
            <li
              key={sub.id}
              // `draggable` lives on the grip handle below, not the
              // whole row — taps on the checkbox / buttons / titles
              // shouldn't lift the sub-category. The <li> remains the
              // drop target so other sub-cats (same parent or another
              // parent) can be dropped on it.
              onDragOver={(e) => {
                if (
                  !dragId ||
                  dragId === sub.id ||
                  !dragScope ||
                  !dragScope.startsWith("sub:")
                )
                  return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";
                if (dragOverId !== sub.id) setDragOverId(sub.id);
              }}
              onDragLeave={(e) => {
                e.stopPropagation();
                if (dragOverId === sub.id) setDragOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = dragId;
                if (!id || id === sub.id) {
                  endDrag();
                  return;
                }
                // Same parent → reorder.
                if (dragScope === scope) {
                  const ids = subs.map((s) => s.id);
                  endDrag();
                  void reorderGroup(ids, id, sub.id);
                  return;
                }
                // Different parent → move sub into THIS parent.
                if (dragScope && dragScope.startsWith("sub:")) {
                  endDrag();
                  moveSubToParent(id, parent.id);
                  return;
                }
                endDrag();
              }}
              onDragEnd={(e) => {
                e.stopPropagation();
                endDrag();
              }}
              className={cn(
                "flex flex-col gap-2 rounded-md border bg-white p-3 transition-colors",
                isDragging
                  ? "border-blue-300 opacity-50"
                  : isOver
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-zinc-200"
              )}
            >
              {/* Top row — grip on the left, settings + actions on the right */}
              <div className="flex items-center justify-between gap-3">
                <span
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = "move";
                    beginDrag(sub.id, scope);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Glisser pour réordonner"
                  title="Glissez pour réordonner"
                  className="-m-2 cursor-grab touch-none p-2 text-zinc-300 hover:text-zinc-600 active:cursor-grabbing"
                >
                  <GripVertical className="size-4" />
                </span>
                <div className="flex items-center gap-3">
                  <label
                    className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-zinc-500"
                    title="Visible sur la boutique"
                  >
                    <Checkbox
                      checked={sub.isActive}
                      onCheckedChange={() => void onToggleActive(sub)}
                    />
                    <span>Actif</span>
                  </label>
                  <div className="flex items-center gap-0.5 rounded border border-zinc-200 bg-white p-0.5">
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
                </div>
              </div>

              {/* Bottom row — FR (left) | AR (right). Stacks vertically
                  on mobile so neither name gets truncated mid-word. */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-sans text-xs font-semibold text-zinc-900 sm:text-sm">
                    {sub.nameFr}
                  </h4>
                </div>
                <div dir="rtl" className="min-w-0 flex-1 text-right">
                  <h4 className="truncate font-sans text-xs font-semibold text-zinc-700 sm:text-sm">
                    {sub.nameAr}
                  </h4>
                </div>
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
  // Tracks whether the user has manually typed in the slug field. When
  // false (and we're creating), the slug auto-derives from the FR name
  // so admins don't have to type it twice.
  const [slugDirty, setSlugDirty] = React.useState(Boolean(category?.slug));
  type FormError = "nameFr" | "nameAr" | "image";
  const [errors, setErrors] = React.useState<Partial<Record<FormError, string>>>(
    {},
  );
  const clearError = (k: FormError) =>
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });

  React.useEffect(() => {
    if (open) {
      setNameFr(category?.nameFr ?? "");
      setNameAr(category?.nameAr ?? "");
      setSlug(category?.slug ?? "");
      setImage(category?.image ?? "");
      setSlugDirty(Boolean(category?.slug));
      setErrors({});
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
    const next: Partial<Record<FormError, string>> = {};
    if (!nameFr.trim()) next.nameFr = "Le nom FR est requis.";
    if (!nameAr.trim()) next.nameAr = "Le nom AR est requis.";
    if (isTopLevel && !image.trim()) next.image = "L'image est requise.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Corrigez les champs en rouge avant d'enregistrer.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        nameFr: nameFr.trim(),
        nameAr: nameAr.trim(),
        slug: slug.trim() || null,
        // Icon was previously editable; the form no longer exposes it.
        // We still send a default so the backend column stays populated.
        icon: "Folder",
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
                <span className="ms-1 text-red-600">*</span>
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div
                  className={cn(
                    "relative h-24 w-full shrink-0 overflow-hidden rounded-md border bg-zinc-50 sm:w-36",
                    errors.image
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-zinc-200",
                  )}
                >
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(image)}
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
                      "min-w-0 cursor-pointer self-stretch sm:self-start",
                      uploading && "pointer-events-none opacity-60"
                    )}
                  >
                    <Upload className="size-3.5" />
                    <span className="truncate">
                      {uploading ? "Téléversement…" : "Téléverser une image"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        void onFile(e.target.files?.[0]);
                        clearError("image");
                      }}
                      disabled={uploading}
                    />
                  </label>
                  <Input
                    value={image}
                    onChange={(e) => {
                      setImage(e.target.value);
                      if (e.target.value.trim()) clearError("image");
                    }}
                    placeholder="/storage/categories/… ou URL"
                    className={cn(
                      "w-full min-w-0 font-mono text-xs",
                      errors.image && "border-red-500 ring-2 ring-red-500/20",
                    )}
                  />
                  {errors.image ? (
                    <p
                      role="alert"
                      className="flex items-center gap-1 text-2xs font-medium text-red-600"
                    >
                      <span
                        aria-hidden
                        className="inline-block size-1 rounded-full bg-red-600"
                      />
                      {errors.image}
                    </p>
                  ) : (
                    <Small className="text-zinc-500">
                      Photo paysage. Affichée en arrière-plan sur la page
                      d&apos;accueil. Max 10 Mo.
                    </Small>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700">
                Nom (FR)
                <span className="ms-1 text-red-600">*</span>
              </Label>
              <Input
                value={nameFr}
                onChange={(e) => {
                  const next = e.target.value;
                  setNameFr(next);
                  // Auto-derive slug from the FR name until the admin
                  // manually edits the slug field.
                  if (!slugDirty) setSlug(slugify(next));
                  if (next.trim()) clearError("nameFr");
                }}
                placeholder="Tentes & abris"
                aria-invalid={!!errors.nameFr}
                className={cn(
                  errors.nameFr && "border-red-500 ring-2 ring-red-500/20",
                )}
              />
              {errors.nameFr ? (
                <p
                  role="alert"
                  className="flex items-center gap-1 text-2xs font-medium text-red-600"
                >
                  <span
                    aria-hidden
                    className="inline-block size-1 rounded-full bg-red-600"
                  />
                  {errors.nameFr}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700" dir="rtl">
                <span dir="rtl">الاسم (AR)</span>
                <span className="ms-1 text-red-600">*</span>
              </Label>
              <Input
                value={nameAr}
                onChange={(e) => {
                  setNameAr(e.target.value);
                  if (e.target.value.trim()) clearError("nameAr");
                }}
                placeholder="الخيام والمآوي"
                dir="rtl"
                lang="ar"
                aria-invalid={!!errors.nameAr}
                className={cn(
                  errors.nameAr && "border-red-500 ring-2 ring-red-500/20",
                )}
              />
              {errors.nameAr ? (
                <p
                  role="alert"
                  className="flex items-center gap-1 text-2xs font-medium text-red-600"
                >
                  <span
                    aria-hidden
                    className="inline-block size-1 rounded-full bg-red-600"
                  />
                  {errors.nameAr}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700">
              Slug
              <span className="ms-1 text-zinc-400">(auto, modifiable)</span>
            </Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugDirty(true);
              }}
              placeholder="auto depuis le nom FR"
              className="font-mono text-xs"
            />
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
