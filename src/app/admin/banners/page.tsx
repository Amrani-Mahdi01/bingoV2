"use client";

import * as React from "react";
import { mediaUrl } from "@/lib/media";
import {
  Check,
  ChevronsUpDown,
  GripVertical,
  ImageIcon,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LinkPicker } from "@/components/admin/LinkPicker";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Mono, Small } from "@/components/ui/typography";
import { categoriesApi, type ApiCategory } from "@/lib/api/categories";
import { HttpError } from "@/lib/api/http";
import { productsApi, type ApiProduct } from "@/lib/api/products";
import { settingsApi, type SettingsMap } from "@/lib/api/settings";
import { cn } from "@/lib/utils";

/* ─────────────────────────── Settings keys ─────────────────────────── */
/** Slot count for the homepage featured grid. The storefront reads
 *  exactly these N keys, in this order. Each value is a token of the
 *  form `"<type>:<slug>"` where type is `product` or `category`. */
const FEATURED_COUNT = 6;
const K = {
  featuredSlug: (i: number) => `home.featured.slug.${i}`,
  promo: {
    titleFr: "home.promo.title.fr",
    titleAr: "home.promo.title.ar",
    ctaFr: "home.promo.cta.fr",
    ctaAr: "home.promo.cta.ar",
    link: "home.promo.link",
  },
} as const;

type FeaturedKind = "product" | "category";
interface FeaturedRef {
  kind: FeaturedKind;
  slug: string;
}

/** Promo banner defaults — used when the matching setting isn't yet
 *  saved on the server. Match what the storefront's Promotions section
 *  shows out of the box. */
const PROMO_DEFAULTS = {
  titleFr: "Jusqu'à −30 % sur la collection automne",
  titleAr: "حتى −30٪ على تشكيلة الخريف",
  ctaFr: "Voir les promotions",
  ctaAr: "عرض العروض",
} as const;

/** Encode a slot pick to the wire format stored in settings. */
function encodeRef(r: FeaturedRef | null): string | null {
  if (!r) return null;
  return `${r.kind}:${r.slug}`;
}
/** Parse a stored value back into a slot pick. Tolerates the legacy
 *  format (bare slug = product) so existing data isn't lost. */
function decodeRef(raw: string | null | undefined): FeaturedRef | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const idx = raw.indexOf(":");
  if (idx === -1) return { kind: "product", slug: raw };
  const kind = raw.slice(0, idx);
  const slug = raw.slice(idx + 1);
  if (!slug) return null;
  if (kind === "product" || kind === "category") return { kind, slug };
  return null;
}
const sameRef = (a: FeaturedRef | null, b: FeaturedRef | null) =>
  (a?.kind ?? null) === (b?.kind ?? null) &&
  (a?.slug ?? null) === (b?.slug ?? null);

/* ─────────────────────────── Page ─────────────────────────── */
export default function BannersPage() {
  // Loaded once on mount.
  const [products, setProducts] = React.useState<ApiProduct[] | null>(null);
  const [categories, setCategories] = React.useState<ApiCategory[] | null>(
    null,
  );

  // 6 slots. Each slot can hold either a product or a category, or be empty.
  const [slots, setSlots] = React.useState<(FeaturedRef | null)[]>(
    Array.from({ length: FEATURED_COUNT }, () => null),
  );

  // Promo banner — bilingual text + CTA + link.
  // Default to the storefront's out-of-box copy so the form isn't
  // blank on first load; saved values from the server replace these
  // in the load effect below.
  // Explicit <string> annotations — without them, `useState` would
  // infer the literal type from `PROMO_DEFAULTS.*` (frozen via
  // `as const` above), and the input onChange handlers couldn't
  // assign arbitrary strings back.
  const [promoTitleFr, setPromoTitleFr] = React.useState<string>(
    PROMO_DEFAULTS.titleFr,
  );
  const [promoTitleAr, setPromoTitleAr] = React.useState<string>(
    PROMO_DEFAULTS.titleAr,
  );
  const [promoCtaFr, setPromoCtaFr] = React.useState<string>(
    PROMO_DEFAULTS.ctaFr,
  );
  const [promoCtaAr, setPromoCtaAr] = React.useState<string>(
    PROMO_DEFAULTS.ctaAr,
  );
  const [promoLink, setPromoLink] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Drag-and-drop reordering of slots.
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      productsApi.listAll({ perPage: 100 }),
      categoriesApi.listAll(),
      settingsApi.listAll(),
    ])
      .then(([listRes, cats, map]) => {
        if (cancelled) return;
        setProducts(listRes.data);
        // Flatten the parent/child tree so sub-categories are pickable too.
        const flat: ApiCategory[] = [];
        for (const top of cats) {
          flat.push(top);
          for (const sub of top.children ?? []) flat.push(sub);
        }
        setCategories(flat);
        const next = Array.from({ length: FEATURED_COUNT }, (_, i) =>
          decodeRef(map[K.featuredSlug(i)]),
        );
        setSlots(next);
        setPromoTitleFr(strOr(map[K.promo.titleFr], PROMO_DEFAULTS.titleFr));
        setPromoTitleAr(strOr(map[K.promo.titleAr], PROMO_DEFAULTS.titleAr));
        setPromoCtaFr(strOr(map[K.promo.ctaFr], PROMO_DEFAULTS.ctaFr));
        setPromoCtaAr(strOr(map[K.promo.ctaAr], PROMO_DEFAULTS.ctaAr));
        setPromoLink(strOr(map[K.promo.link], ""));
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof HttpError && err.status === 401
            ? "Session expirée. Reconnectez-vous."
            : "Impossible de charger la configuration.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setSlot = (i: number, ref: FeaturedRef | null) =>
    setSlots((prev) => {
      const next = [...prev];
      next[i] = ref;
      return next;
    });

  const endDrag = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const reorderSlots = (from: number, to: number) => {
    if (from === to) return;
    setSlots((prev) => {
      const next = [...prev];
      const [pulled] = next.splice(from, 1);
      if (pulled !== undefined) next.splice(to, 0, pulled);
      return next;
    });
  };

  const productBySlug = React.useMemo(() => {
    const m = new Map<string, ApiProduct>();
    for (const p of products ?? []) m.set(p.slug, p);
    return m;
  }, [products]);

  const categoryBySlug = React.useMemo(() => {
    const m = new Map<string, ApiCategory>();
    for (const c of categories ?? []) m.set(c.slug, c);
    return m;
  }, [categories]);

  const save = async () => {
    setSaving(true);
    const payload: SettingsMap = {};
    for (let i = 0; i < FEATURED_COUNT; i++) {
      payload[K.featuredSlug(i)] = encodeRef(slots[i]);
    }
    payload[K.promo.titleFr] = promoTitleFr.trim() || null;
    payload[K.promo.titleAr] = promoTitleAr.trim() || null;
    payload[K.promo.ctaFr] = promoCtaFr.trim() || null;
    payload[K.promo.ctaAr] = promoCtaAr.trim() || null;
    payload[K.promo.link] = promoLink.trim() || null;
    try {
      const updated = await settingsApi.update(payload);
      const sent = Object.keys(payload).filter((k) => payload[k] !== null);
      const dropped = sent.filter((k) => typeof updated[k] !== "string");
      if (dropped.length > 0) {
        toast.warning(
          `Le serveur n'a pas accepté ${dropped.length} clé(s). Vérifiez l'allow-list back-end.`,
          { duration: 6000 },
        );
      } else {
        toast.success("Configuration enregistrée");
      }
    } catch (err) {
      toast.error(
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Échec de l'enregistrement",
      );
    } finally {
      setSaving(false);
    }
  };

  const filledSlots = slots.filter(Boolean).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Accueil"
        title="Bannières & sélection produits"
        subtitle="Choisissez les 6 produits mis en avant sur la page d'accueil et personnalisez le bandeau promotion."
      />

      {loadError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <form
        className="space-y-6 pb-32"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {/* ── Section 1: 6 featured products ───────────────────────── */}
        <Section
          title="Sélection (6 emplacements)"
          description={
            <>
              Chaque emplacement peut afficher un produit du catalogue
              <strong className="text-zinc-800"> ou </strong>
              une catégorie. Glissez-déposez pour réorganiser. Les
              emplacements vides n&apos;apparaissent pas sur la page
              d&apos;accueil.
              <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-zinc-200/70 px-2 py-0.5 font-mono text-2xs uppercase tracking-wide text-zinc-700">
                {filledSlots} / {FEATURED_COUNT} rempli
                {filledSlots > 1 ? "s" : ""}
              </span>
            </>
          }
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((ref, i) => {
              const resolved = resolveRef(ref, productBySlug, categoryBySlug);
              const isDragging = dragIdx === i;
              const isOver = dragOverIdx === i && dragIdx !== i;
              return (
                <li
                  key={i}
                  // `draggable` lives on the grip handle below — not
                  // the whole card — so taps on the thumb, the
                  // "Changer" picker, or the X button don't start a
                  // drag. The <li> stays a drop target.
                  onDragOver={(e) => {
                    if (dragIdx === null || dragIdx === i) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverIdx !== i) setDragOverIdx(i);
                  }}
                  onDragLeave={() => {
                    if (dragOverIdx === i) setDragOverIdx(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIdx === null || dragIdx === i) {
                      endDrag();
                      return;
                    }
                    const from = dragIdx;
                    endDrag();
                    reorderSlots(from, i);
                  }}
                  onDragEnd={endDrag}
                  className={cn(
                    // `min-w-0` lets the truncate inside the body
                    // actually shrink instead of forcing the card
                    // wider than its grid column.
                    "relative min-w-0 rounded-md border bg-white p-2.5 transition-colors sm:p-3",
                    isDragging
                      ? "border-blue-300 opacity-50"
                      : isOver
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : ref
                          ? "border-zinc-200"
                          : "border-dashed border-zinc-300",
                  )}
                >
                  <div className="mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span
                      draggable
                      onDragStart={(e) => {
                        // Loading / save guards stay in the handler —
                        // putting them on the `draggable` attribute
                        // would render `draggable="false"` during
                        // those transient states and the touch
                        // polyfill skips elements where the property
                        // is false (it walks up the DOM looking for
                        // the nearest draggable=true ancestor), which
                        // meant the grip stopped responding to taps
                        // mid-save on mobile.
                        if (loading || saving) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.effectAllowed = "move";
                        setDragIdx(i);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Glisser pour réordonner"
                      title="Glisser pour réordonner"
                      className="-m-2 cursor-grab touch-none p-2 text-zinc-300 hover:text-zinc-600 active:cursor-grabbing"
                    >
                      <GripVertical className="size-4" />
                    </span>
                    <Mono className="text-[10px] text-zinc-500 sm:text-2xs">
                      Emplacement {i + 1}
                    </Mono>
                    {ref ? (
                      <KindBadge kind={ref.kind} />
                    ) : null}
                    {ref ? (
                      <button
                        type="button"
                        onClick={() => setSlot(i, null)}
                        aria-label="Vider"
                        className="ms-auto inline-flex size-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {resolved ? (
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <Thumb src={resolved.image} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-900 sm:text-sm">
                          {resolved.nameFr}
                        </p>
                        <p className="truncate text-[10px] text-zinc-500 sm:text-2xs">
                          {resolved.subLabel}
                        </p>
                      </div>
                    </div>
                  ) : ref ? (
                    <div className="flex items-center gap-2.5 text-amber-700 sm:gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded bg-amber-100 sm:size-12">
                        <ImageIcon className="size-4 sm:size-5" />
                      </span>
                      <span className="min-w-0 truncate text-[11px] italic sm:text-xs">
                        Référence introuvable : {ref.kind} / {ref.slug}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-zinc-400 sm:gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded bg-zinc-100 sm:size-12">
                        <ImageIcon className="size-4 sm:size-5" />
                      </span>
                      <span className="text-[11px] italic sm:text-xs">Vide</span>
                    </div>
                  )}

                  <div className="mt-3">
                    <FeaturedPicker
                      value={ref}
                      products={products ?? []}
                      categories={categories ?? []}
                      excludeRefs={slots.filter(
                        (s, j): s is FeaturedRef => s !== null && j !== i,
                      )}
                      onChange={(r) => setSlot(i, r)}
                      disabled={loading || saving || !products || !categories}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* ── Section 2: Promo banner ──────────────────────────────── */}
        <Section
          title="Bandeau promotion"
          description="Le bandeau forêt-vert sur la page d'accueil. Bilingue FR / AR. Laissez vide pour cacher le texte ou le bouton."
        >
          {/* Live-ish preview */}
          <PromoPreview titleFr={promoTitleFr} ctaFr={promoCtaFr} />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FieldShell id="promo-title-fr" label="Titre (FR)">
              <Input
                id="promo-title-fr"
                value={promoTitleFr}
                onChange={(e) => setPromoTitleFr(e.target.value)}
                placeholder="Jusqu'à -30 % sur la collection automne"
                disabled={loading || saving}
              />
            </FieldShell>
            <FieldShell id="promo-title-ar" label="العنوان (AR)">
              <Input
                id="promo-title-ar"
                value={promoTitleAr}
                onChange={(e) => setPromoTitleAr(e.target.value)}
                placeholder="حتى -30٪ على تشكيلة الخريف"
                dir="rtl"
                lang="ar"
                disabled={loading || saving}
              />
            </FieldShell>
            <FieldShell id="promo-cta-fr" label="Libellé du bouton (FR)">
              <Input
                id="promo-cta-fr"
                value={promoCtaFr}
                onChange={(e) => setPromoCtaFr(e.target.value)}
                placeholder="Voir les promotions"
                disabled={loading || saving}
              />
            </FieldShell>
            <FieldShell id="promo-cta-ar" label="نص الزر (AR)">
              <Input
                id="promo-cta-ar"
                value={promoCtaAr}
                onChange={(e) => setPromoCtaAr(e.target.value)}
                placeholder="عرض العروض"
                dir="rtl"
                lang="ar"
                disabled={loading || saving}
              />
            </FieldShell>
          </div>

          <div className="mt-3 space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700">
              Destination du bouton
            </Label>
            <LinkPicker
              value={promoLink}
              onChange={setPromoLink}
              placeholder="Choisir un produit, une catégorie ou un filtre…"
            />
            <Small className="text-zinc-500">
              Par défaut, le bouton pointe vers les promotions
              (/catalogue?promo=1).
            </Small>
          </div>
        </Section>

        {/* ── Sticky save bar ──────────────────────────────────────── */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={loading || saving}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="default"
              disabled={loading || saving}
            >
              {saving
                ? "Enregistrement…"
                : loading
                  ? "Chargement…"
                  : "Enregistrer les modifications"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function strOr(v: string | null | undefined, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
      <h2 className="font-sans text-lg font-semibold text-zinc-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldShell({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-zinc-700">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Single thumbnail used by both slot cards and dropdown rows. Falls
 *  back to a placeholder icon when no image is set. */
function Thumb({
  src,
  size = 12,
}: {
  src: string | null;
  size?: 8 | 10 | 12;
}) {
  const dim = size === 8 ? "size-8" : size === 10 ? "size-10" : "size-12";
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded bg-zinc-100",
        dim,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(src)}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <ImageIcon className="size-5 text-zinc-300" />
      )}
    </span>
  );
}

/** Small chip showing whether a slot holds a product or a category. */
function KindBadge({ kind }: { kind: FeaturedKind }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-2xs uppercase tracking-wide",
        kind === "product"
          ? "bg-tangerine-50 text-tangerine-700"
          : "bg-forest-100 text-forest-900",
      )}
    >
      {kind === "product" ? "Produit" : "Catégorie"}
    </span>
  );
}

/** Resolve a slot ref to displayable fields (or null if the underlying
 *  product / category has since been deleted). */
function resolveRef(
  ref: FeaturedRef | null,
  productBySlug: Map<string, ApiProduct>,
  categoryBySlug: Map<string, ApiCategory>,
): { nameFr: string; image: string | null; subLabel: string } | null {
  if (!ref) return null;
  if (ref.kind === "product") {
    const p = productBySlug.get(ref.slug);
    if (!p) return null;
    return {
      nameFr: p.nameFr,
      image: p.images?.[0]?.url ?? null,
      subLabel: `${p.sku} · ${p.price.toLocaleString("fr-FR")} DZD`,
    };
  }
  const c = categoryBySlug.get(ref.slug);
  if (!c) return null;
  return {
    nameFr: c.nameFr,
    image: c.image,
    subLabel: c.parentId ? "Sous-catégorie" : "Catégorie principale",
  };
}

/* ─────────────────────────── Promo preview ───────────────────────────
   Mirrors the storefront's tangerine pill CTA so the merchant sees
   roughly what the homepage will render. Falls back to placeholders
   when fields are empty.
*/
function PromoPreview({
  titleFr,
  ctaFr,
}: {
  titleFr: string;
  ctaFr: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-forest-900 p-6 text-cream">
      <p className="font-display text-lg font-semibold leading-tight">
        {titleFr.trim() || (
          <span className="italic text-cream/40">Titre FR…</span>
        )}
      </p>
      <span className="mt-3 inline-flex items-center rounded-full bg-tangerine-500 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow">
        {ctaFr.trim() || "VOIR LES PROMOTIONS"}
      </span>
    </div>
  );
}

/* ─────────────────────────── Featured picker ───────────────────────────
   Lets the merchant pick a product OR a category for a single slot.
   • Two groups in the dropdown — "Catégories" then "Produits" — with a
     thumbnail and the FR / AR names per row.
   • An item already chosen in another slot is dimmed + tagged "déjà
     choisi" so the same ref can't appear twice.
*/
function FeaturedPicker({
  value,
  products,
  categories,
  excludeRefs,
  onChange,
  disabled,
}: {
  value: FeaturedRef | null;
  products: ApiProduct[];
  categories: ApiCategory[];
  excludeRefs: FeaturedRef[];
  onChange: (r: FeaturedRef | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  // Stops the page from auto-scrolling to the top when the popover
  // opens — cmdk's CommandInput auto-focuses on mount, which makes
  // the browser scroll the focused input into view and yanks the
  // page. Capture the scroll position at the moment we open, then
  // restore it for a few frames to overpower the focus side-effects.
  const captureScroll = useFreezeScrollOnOpen(open);

  const isTaken = (ref: FeaturedRef) =>
    excludeRefs.some((r) => sameRef(r, ref));

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
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full justify-between font-normal disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <Search className="size-3.5" />
          {value ? "Changer" : "Choisir un produit ou une catégorie"}
        </span>
        <ChevronsUpDown className="size-3.5 text-zinc-400" />
      </PopoverTrigger>
      <PopoverContent
        // Mobile: use `min(20rem, 100vw - 1.5rem)` — caps at 320 px
        // or the viewport minus a 12 px gutter on each side,
        // whichever is smaller. Prevents the popover from bleeding
        // off the right edge on narrow phones. md+ restores the
        // original 360 px floor for the wider desktop layout.
        // (`var(--radix-popover-trigger-width)` was a Radix-only
        // hint that this Base-UI wrapper ignores, which is why the
        // previous cap wasn't doing anything.)
        className="w-[min(20rem,calc(100vw-1.5rem))] p-0 md:w-auto md:min-w-[360px] md:max-w-none"
        align="start"
        initialFocus={false}
      >
        <Command>
          <CommandInput placeholder="Nom, SKU, marque, catégorie…" />
          <CommandList className="max-h-80">
            <CommandEmpty>Aucun résultat.</CommandEmpty>

            {categories.length > 0 ? (
              <CommandGroup heading="Catégories">
                {categories.map((c) => {
                  const ref: FeaturedRef = { kind: "category", slug: c.slug };
                  const taken = isTaken(ref);
                  const current = sameRef(value, ref);
                  return (
                    <CommandItem
                      key={`cat-${c.id}`}
                      value={`cat ${c.nameFr} ${c.nameAr} ${c.slug}`}
                      disabled={taken}
                      onSelect={() => {
                        if (taken) return;
                        onChange(ref);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 py-2",
                        taken && "opacity-40",
                      )}
                    >
                      <Thumb src={c.image} size={10} />
                      <span
                        className="flex min-w-0 flex-1 flex-col leading-tight"
                        dir="ltr"
                      >
                        <span className="truncate text-sm">{c.nameFr}</span>
                        {c.nameAr ? (
                          <span
                            className="truncate text-2xs text-zinc-500"
                            dir="rtl"
                          >
                            {c.nameAr}
                          </span>
                        ) : null}
                      </span>
                      {taken ? (
                        <span className="text-2xs text-zinc-400">
                          déjà choisi
                        </span>
                      ) : current ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}

            {categories.length > 0 && products.length > 0 ? (
              <CommandSeparator />
            ) : null}

            {products.length > 0 ? (
              <CommandGroup heading="Produits">
                {products.map((p) => {
                  const ref: FeaturedRef = { kind: "product", slug: p.slug };
                  const taken = isTaken(ref);
                  const current = sameRef(value, ref);
                  const brand = p.brand?.name ?? "";
                  return (
                    <CommandItem
                      key={`prod-${p.id}`}
                      value={`prod ${p.nameFr} ${p.nameAr} ${p.sku} ${brand}`}
                      disabled={taken}
                      onSelect={() => {
                        if (taken) return;
                        onChange(ref);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 py-2",
                        taken && "opacity-40",
                      )}
                    >
                      <Thumb src={p.images?.[0]?.url ?? null} size={10} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm">{p.nameFr}</span>
                        <span className="truncate text-2xs text-zinc-500">
                          {p.sku} · {brand || "—"}
                        </span>
                      </span>
                      {taken ? (
                        <span className="text-2xs text-zinc-400">
                          déjà choisi
                        </span>
                      ) : current ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Captures the current scroll position when called, then on the next
 * `open === true` transition holds the window pinned to it for a few
 * frames. Counteracts the browser's auto-scroll-on-focus behaviour
 * that fires when cmdk's CommandInput mounts inside the popover.
 *
 * (Same hook lives in LinkPicker — duplicated here to avoid a
 * cross-cutting refactor.)
 */
function useFreezeScrollOnOpen(open: boolean): () => void {
  const yRef = React.useRef(0);
  const captureScroll = React.useCallback(() => {
    yRef.current = window.scrollY;
  }, []);
  React.useEffect(() => {
    const y = yRef.current;
    if (!open) {
      window.scrollTo({ top: y, behavior: "instant" });
      return;
    }
    let frames = 6;
    const tick = () => {
      window.scrollTo({ top: y, behavior: "instant" });
      if (--frames > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [open]);
  return captureScroll;
}
