"use client";

import * as React from "react";
import {
  Loader2,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Mono } from "@/components/ui/typography";
import { HttpError } from "@/lib/api/http";
import {
  ordersApi,
  type ApiOrder,
  type UpdateOrderPayload,
} from "@/lib/api/orders";
import {
  productsApi,
  type ApiProduct,
  type ApiProductVariant,
} from "@/lib/api/products";
import { wilayasApi } from "@/lib/api/wilayas";
import { formatDZD } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { Commune, Wilaya } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Editable working copy of an order line. */
interface LineDraft {
  key: string;
  productId: string | null;
  variantId: number | null;
  productName: string;
  sku: string;
  image: string | null;
  variant: string | null;
  quantity: number;
  unitPrice: number;
}

interface Props {
  order: ApiOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired with the fresh order returned by the backend after a save. */
  onSaved: (order: ApiOrder) => void;
}

function variantLabel(v: ApiProductVariant): string {
  const parts = [v.colorNameFr, v.sizeLabel].filter(Boolean);
  return parts.join(" · ") || v.skuSuffix || "Variante";
}

function primaryImage(p: ApiProduct): string | null {
  return p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null;
}

export function OrderEditSheet({ order, open, onOpenChange, onSaved }: Props) {
  const keyRef = React.useRef(0);
  const nextKey = () => `l${keyRef.current++}`;

  // ── Draft state ────────────────────────────────────────────────
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [wilayaId, setWilayaId] = React.useState("");
  const [commune, setCommune] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [deliveryType, setDeliveryType] =
    React.useState<"home" | "stopdesk">("home");
  const [notes, setNotes] = React.useState("");

  const [lines, setLines] = React.useState<LineDraft[]>([]);
  const [shippingFee, setShippingFee] = React.useState(0);
  const [feeManual, setFeeManual] = React.useState(false);

  const [wilayas, setWilayas] = React.useState<Wilaya[]>([]);
  const [communes, setCommunes] = React.useState<Commune[]>([]);
  const [communesLoading, setCommunesLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Product picker
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ApiProduct[]>([]);
  const [searching, setSearching] = React.useState(false);

  // Re-seed the draft each time the sheet opens for a (possibly new) order.
  React.useEffect(() => {
    if (!open) return;
    setFirstName(order.customer.firstName);
    setLastName(order.customer.lastName);
    setPhone(order.customer.phone);
    setEmail(order.customer.email ?? "");
    setWilayaId(order.shipping.wilayaId);
    setCommune(order.shipping.commune);
    setAddress(order.shipping.address ?? "");
    setDeliveryType(order.shipping.deliveryType);
    setNotes(order.shipping.notes ?? "");
    setShippingFee(order.shippingFee);
    setFeeManual(false);
    setQuery("");
    setResults([]);
    setLines(
      order.lines.map((l) => ({
        key: nextKey(),
        productId: l.productId,
        variantId: null, // existing lines keep their snapshot; qty/price editable
        productName: l.productName,
        sku: l.sku,
        image: l.image,
        variant: l.variant,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order]);

  // Load wilayas once.
  React.useEffect(() => {
    let active = true;
    wilayasApi
      .listAll()
      .then((w) => {
        if (active) setWilayas(w);
      })
      .catch(() => {
        /* fee stays whatever it was; select still shows the current wilaya */
      });
    return () => {
      active = false;
    };
  }, []);

  // Load the selected wilaya's communes for the commune dropdown. Keeps the
  // current commune value untouched — the init effect owns that — so the
  // order's existing commune stays selected even before this resolves.
  React.useEffect(() => {
    if (!open || !wilayaId) {
      setCommunes([]);
      setCommunesLoading(false);
      return;
    }
    let active = true;
    setCommunesLoading(true);
    wilayasApi
      .listCommunes(wilayaId)
      .then((c) => {
        if (active) setCommunes(c);
      })
      .catch(() => {
        if (active) setCommunes([]);
      })
      .finally(() => {
        if (active) setCommunesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, wilayaId]);

  // Debounced product search for the "add product" picker.
  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await productsApi.listAll({ q, perPage: 8 });
        if (active) setResults(res.data);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const selectedWilaya = wilayas.find((w) => w.id === wilayaId);

  /** Wilaya's rate for the given delivery type — the auto (non-override) fee. */
  const computeFee = React.useCallback(
    (wid: string, dt: "home" | "stopdesk"): number | null => {
      const w = wilayas.find((x) => x.id === wid);
      if (!w) return null;
      return dt === "stopdesk" && w.stopDeskPrice > 0
        ? w.stopDeskPrice
        : w.shippingPrice;
    },
    [wilayas],
  );

  const onWilayaChange = (wid: string) => {
    setWilayaId(wid);
    // The old commune belongs to the old wilaya — force a fresh pick.
    setCommune("");
    if (!feeManual) {
      const f = computeFee(wid, deliveryType);
      if (f !== null) setShippingFee(f);
    }
  };

  const onDeliveryTypeChange = (dt: "home" | "stopdesk") => {
    setDeliveryType(dt);
    if (!feeManual) {
      const f = computeFee(wilayaId, dt);
      if (f !== null) setShippingFee(f);
    }
  };

  const resetFeeToAuto = () => {
    const f = computeFee(wilayaId, deliveryType);
    if (f !== null) setShippingFee(f);
    setFeeManual(false);
  };

  // ── Line mutations ─────────────────────────────────────────────
  const patchLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );

  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key));

  const addProduct = (product: ApiProduct, variant?: ApiProductVariant) => {
    const variantId = variant ? Number(variant.id) : null;
    const label = variant ? variantLabel(variant) : null;
    // Merge into an identical existing line rather than duplicating it.
    const existing = lines.find(
      (l) => l.productId === product.id && l.variantId === variantId,
    );
    if (existing) {
      patchLine(existing.key, { quantity: existing.quantity + 1 });
      toast.success(`Quantité +1 — ${product.nameFr}`);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        productId: product.id,
        variantId,
        productName: product.nameFr,
        sku: product.sku,
        image: primaryImage(product),
        variant: label,
        quantity: 1,
        unitPrice: product.price + (variant?.priceDelta ?? 0),
      },
    ]);
    toast.success(`Ajouté — ${product.nameFr}${label ? ` (${label})` : ""}`);
  };

  // ── Totals (preview; the backend is authoritative on save) ─────
  const subtotal = lines.reduce(
    (s, l) => s + l.unitPrice * l.quantity,
    0,
  );
  const total = subtotal + shippingFee;

  const canSave =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    phone.trim() !== "" &&
    wilayaId !== "" &&
    commune.trim() !== "" &&
    lines.length > 0 &&
    !saving;

  const save = async () => {
    if (lines.length === 0) {
      toast.error("Ajoutez au moins un article.");
      return;
    }
    const payload: UpdateOrderPayload = {
      customer: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
      },
      shipping: {
        wilayaId,
        commune: commune.trim(),
        address: address.trim() || null,
        deliveryType,
        notes: notes.trim() || null,
      },
      // Null lets the backend bill the wilaya's rate; a number is an override.
      shippingFee: feeManual ? shippingFee : null,
      lines: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        productName: l.productName,
        sku: l.sku,
        image: l.image,
        variant: l.variant,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    };
    setSaving(true);
    try {
      const updated = await ordersApi.update(order.id, payload);
      toast.success("Commande mise à jour.");
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof HttpError
          ? ((err.body as { message?: string } | null)?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : "Échec de la mise à jour.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-zinc-100 px-4 py-3.5 sm:px-5">
          <SheetTitle className="text-base">
            Modifier la commande
          </SheetTitle>
          <SheetDescription>
            <Mono className="text-2xs text-zinc-500">{order.orderNumber}</Mono>
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5">
          {/* ── Articles ─────────────────────────────────── */}
          <section className="space-y-3">
            <SectionTitle>Articles</SectionTitle>

            {lines.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-5 text-center text-xs text-zinc-500">
                Aucun article. Ajoutez-en un ci-dessous.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {lines.map((line) => (
                  <li
                    key={line.key}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                        {line.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaUrl(line.image)}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                          />
                        ) : (
                          <span className="grid size-full place-items-center text-zinc-300">
                            <Package className="size-5" strokeWidth={1.6} />
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-900">
                          {line.productName}
                        </p>
                        <p className="mt-0.5 font-mono text-2xs uppercase tracking-wide text-zinc-500">
                          {line.sku}
                          {line.variant ? ` · ${line.variant}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        aria-label="Retirer l'article"
                        className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Qty stepper + unit price + line total */}
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-md border border-zinc-200">
                        <button
                          type="button"
                          aria-label="Diminuer"
                          onClick={() =>
                            patchLine(line.key, {
                              quantity: Math.max(1, line.quantity - 1),
                            })
                          }
                          className="grid size-8 place-items-center text-zinc-600 hover:bg-zinc-50"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            patchLine(line.key, {
                              quantity: Math.max(
                                1,
                                Math.floor(Number(e.target.value) || 1),
                              ),
                            })
                          }
                          className="h-8 w-11 border-x border-zinc-200 text-center font-mono text-xs outline-none focus:bg-zinc-50"
                        />
                        <button
                          type="button"
                          aria-label="Augmenter"
                          onClick={() =>
                            patchLine(line.key, {
                              quantity: line.quantity + 1,
                            })
                          }
                          className="grid size-8 place-items-center text-zinc-600 hover:bg-zinc-50"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          value={line.unitPrice}
                          onChange={(e) =>
                            patchLine(line.key, {
                              unitPrice: Math.max(
                                0,
                                Math.floor(Number(e.target.value) || 0),
                              ),
                            })
                          }
                          className="h-8 w-24 rounded-md border border-zinc-200 px-2 text-right font-mono text-xs outline-none focus:border-zinc-400"
                        />
                        <span className="font-mono text-2xs text-zinc-400">
                          DA
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 text-right font-mono text-2xs text-zinc-500">
                      = {formatDZD(line.unitPrice * line.quantity, "fr")}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Add-product picker */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ajouter un produit — nom ou SKU…"
                  className="h-9 ps-8 text-xs"
                />
                {searching ? (
                  <Loader2 className="absolute end-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-zinc-400" />
                ) : null}
              </div>

              {results.length > 0 ? (
                <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                  {results.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-md border border-zinc-200 bg-white p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="relative size-8 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                          {primaryImage(p) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaUrl(primaryImage(p)!)}
                              alt=""
                              className="absolute inset-0 size-full object-cover"
                            />
                          ) : (
                            <span className="grid size-full place-items-center text-zinc-300">
                              <Package className="size-4" strokeWidth={1.6} />
                            </span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-zinc-900">
                            {p.nameFr}
                          </p>
                          <p className="font-mono text-2xs text-zinc-500">
                            {formatDZD(p.price, "fr")} · stock {p.stock}
                          </p>
                        </div>
                        {p.variants.length === 0 ? (
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => addProduct(p)}
                          >
                            <Plus className="size-3.5" />
                            Ajouter
                          </Button>
                        ) : null}
                      </div>

                      {/* Variant chips — pick which colour/size to add. */}
                      {p.variants.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => addProduct(p, v)}
                              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-2xs text-zinc-700 hover:border-forest-600 hover:bg-forest-50"
                            >
                              <Plus className="size-3" />
                              {variantLabel(v)}
                              {v.priceDelta !== 0
                                ? ` (${v.priceDelta > 0 ? "+" : ""}${v.priceDelta})`
                                : ""}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : query.trim() && !searching ? (
                <p className="mt-2 px-1 text-2xs text-zinc-400">
                  Aucun produit trouvé.
                </p>
              ) : null}
            </div>
          </section>

          {/* ── Livraison ────────────────────────────────── */}
          <section className="space-y-3">
            <SectionTitle>Livraison</SectionTitle>

            <Field label="Wilaya">
              {/* Native select — 58 options render faster than a popup list. */}
              <select
                value={wilayaId}
                onChange={(e) => onWilayaChange(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
              >
                {!wilayas.some((w) => w.id === wilayaId) && wilayaId ? (
                  <option value={wilayaId}>
                    {order.shipping.wilayaName} ({wilayaId})
                  </option>
                ) : null}
                {wilayas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} · {w.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Commune">
              {communesLoading || communes.length > 0 ? (
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  disabled={communesLoading && communes.length === 0}
                  className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
                >
                  <option value="" disabled>
                    {communesLoading ? "Chargement…" : "Choisir une commune"}
                  </option>
                  {/* Preserve a current value that isn't in the list. */}
                  {commune && !communes.some((c) => c.name === commune) ? (
                    <option value={commune}>{commune}</option>
                  ) : null}
                  {communes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                // Wilaya has no communes seeded — free text so we never block.
                <Input
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Commune"
                />
              )}
            </Field>

            <Field label="Adresse">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse (optionnel)"
              />
            </Field>

            <Field label="Type de livraison">
              <div className="grid grid-cols-2 gap-2">
                {(["home", "stopdesk"] as const).map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => onDeliveryTypeChange(dt)}
                    className={cn(
                      "h-10 rounded-lg border text-xs font-medium transition-colors",
                      deliveryType === dt
                        ? "border-forest-600 bg-forest-50 text-forest-800"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                    )}
                  >
                    {dt === "home" ? "À domicile" : "Stop-desk"}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Note client">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note (optionnel)"
                rows={2}
              />
            </Field>
          </section>

          {/* ── Client ───────────────────────────────────── */}
          <section className="space-y-3">
            <SectionTitle>Client</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Prénom">
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Nom">
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Téléphone">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optionnel)"
                dir="ltr"
              />
            </Field>
          </section>
        </div>

        {/* ── Totals + save ──────────────────────────────── */}
        <SheetFooter className="gap-3 border-t border-zinc-100 px-4 py-3.5 sm:px-5">
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-600">
              <dt>Sous-total</dt>
              <dd className="font-mono tabular-nums">
                {formatDZD(subtotal, "fr")}
              </dd>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <dt className="flex items-center gap-1.5">
                Livraison
                {feeManual ? (
                  <button
                    type="button"
                    onClick={resetFeeToAuto}
                    className="inline-flex items-center gap-0.5 text-2xs text-forest-700 hover:underline"
                  >
                    <RotateCcw className="size-3" />
                    auto
                  </button>
                ) : selectedWilaya ? (
                  <span className="text-2xs text-zinc-400">(tarif wilaya)</span>
                ) : null}
              </dt>
              <dd className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={shippingFee}
                  onChange={(e) => {
                    setShippingFee(
                      Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    );
                    setFeeManual(true);
                  }}
                  className="h-7 w-24 rounded-md border border-zinc-200 px-2 text-right font-mono text-xs outline-none focus:border-zinc-400"
                />
                <span className="font-mono text-2xs text-zinc-400">DA</span>
              </dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-sm font-semibold text-zinc-900">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">
                {formatDZD(total, "fr")}
              </dd>
            </div>
          </dl>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => void save()}
              disabled={!canSave}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Mono className="text-2xs uppercase tracking-wide text-zinc-500">
      {children}
    </Mono>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-2xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </Label>
      {children}
    </div>
  );
}
