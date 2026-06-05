"use client";

import * as React from "react";
import { MapPin, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mono, Small } from "@/components/ui/typography";
import { HttpError } from "@/lib/api/http";
import {
  wilayasApi,
  type CommuneCreate,
  type WilayaCreate,
} from "@/lib/api/wilayas";
import { zrApi } from "@/lib/api/zr";
import { cn } from "@/lib/utils";
import type { Commune, Wilaya, WilayaRegion } from "@/lib/types";

const REGIONS: WilayaRegion[] = ["Nord", "Centre", "Est", "Ouest", "Sud"];

/* ─── Form validation regexes ────────────────────────────────────
   Shared by both NewWilayaDialog and CommunesDialog. The backend
   re-validates everything; these mirror the user-facing constraints
   so we can show inline errors instead of waiting for the server. */
// Wilaya code: 1 or 2 digits (we pad to 2 on save). "0" / "00" are
// rejected by the parseInt check at the call site.
const CODE_RE = /^[0-9]{1,2}$/;
// Algerian postal codes are 5 digits, but admin refs can vary
// (4-digit older codes, 6-digit composite). Permissive 4–6.
const POSTAL_RE = /^[0-9]{4,6}$/;
// FR name: 2–100 chars, must contain at least one Latin letter
// (covers Basic Latin + Latin-1 Supplement + Latin Extended-A).
const NAME_FR_RE = /^(?=.*[A-Za-zÀ-ſ])[\s\S]{2,100}$/;
// AR name: 2–100 chars, must contain at least one Arabic letter.
const NAME_AR_RE = /^(?=.*[؀-ۿݐ-ݿ])[\s\S]{2,100}$/;
// Non-negative integer (allows "0"). For shipping price / days.
const POS_INT_RE = /^(0|[1-9][0-9]*)$/;
type RegionFilter = WilayaRegion | "all";

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

type Draft = {
  shippingPrice: string; // home delivery
  stopDeskPrice: string; // point-relais
  deliveryDays: string;
};

export default function ShippingPage() {
  const [list, setList] = React.useState<Wilaya[] | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({});
  const [bulkSaving, setBulkSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [region, setRegion] = React.useState<RegionFilter>("all");
  const [importing, setImporting] = React.useState(false);
  const confirm = useConfirm();

  const reload = React.useCallback(async () => {
    try {
      const data = await wilayasApi.listAll();
      setList(data);
      const next: Record<string, Draft> = {};
      for (const w of data) {
        next[w.id] = {
          shippingPrice: String(w.shippingPrice),
          stopDeskPrice: String(w.stopDeskPrice),
          deliveryDays: String(w.deliveryDays),
        };
      }
      setDrafts(next);
      setError(null);
    } catch (err) {
      setError(
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Impossible de charger les wilayas."
      );
    }
  }, []);

  // Import wilayas + communes (+ prices) straight from ZR Express, then
  // refresh the table — so the admin never has to leave /shipping.
  const importFromZr = async () => {
    const ok = await confirm({
      title: "Importer les territoires depuis ZR Express ?",
      message:
        "Les wilayas et communes seront remplacées par celles de ZR Express et " +
        "les tarifs mis à jour depuis ZR. Les modifications de prix non " +
        "enregistrées seront perdues.",
      confirmLabel: "Importer",
    });
    if (!ok) return;
    setImporting(true);
    try {
      const res = await zrApi.syncTerritories();
      toast.success(res.message ?? "Territoires importés depuis ZR Express.");
      await reload();
    } catch (err) {
      toast.error(extractMessage(err, "Échec de l'import depuis ZR Express."));
    } finally {
      setImporting(false);
    }
  };

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const isDirty = React.useCallback(
    (w: Wilaya) => {
      const d = drafts[w.id];
      if (!d) return false;
      return (
        d.shippingPrice !== String(w.shippingPrice) ||
        d.stopDeskPrice !== String(w.stopDeskPrice) ||
        d.deliveryDays !== String(w.deliveryDays)
      );
    },
    [drafts]
  );

  const setDraftField = (id: string, key: keyof Draft, value: string) =>
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { shippingPrice: "", stopDeskPrice: "", deliveryDays: "" }),
        [key]: value,
      },
    }));

  const filtered = React.useMemo(() => {
    if (!list) return [];
    const q = search.trim().toLowerCase();
    return list.filter((w) => {
      if (region !== "all" && w.region !== region) return false;
      if (!q) return true;
      return (
        w.code.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.nameAr.includes(q)
      );
    });
  }, [list, region, search]);

  const dirtyRows = React.useMemo(() => {
    if (!list) return [];
    return list.filter(isDirty);
  }, [list, isDirty]);

  const saveAllDirty = async () => {
    if (dirtyRows.length === 0) return;
    setBulkSaving(true);
    let okCount = 0;
    let errCount = 0;
    for (const w of dirtyRows) {
      const d = drafts[w.id];
      const shippingPrice = parseInt(d.shippingPrice, 10);
      const stopDeskPrice = parseInt(d.stopDeskPrice, 10);
      const deliveryDays = parseInt(d.deliveryDays, 10);
      if (
        !Number.isFinite(shippingPrice) ||
        shippingPrice < 0 ||
        !Number.isFinite(stopDeskPrice) ||
        stopDeskPrice < 0 ||
        !Number.isFinite(deliveryDays) ||
        deliveryDays < 1
      ) {
        errCount++;
        continue;
      }
      try {
        const updated = await wilayasApi.update(w.id, {
          shippingPrice,
          stopDeskPrice,
          deliveryDays,
        });
        setList((prev) =>
          prev ? prev.map((row) => (row.id === w.id ? updated : row)) : prev
        );
        setDrafts((prev) => ({
          ...prev,
          [w.id]: {
            shippingPrice: String(updated.shippingPrice),
            stopDeskPrice: String(updated.stopDeskPrice),
            deliveryDays: String(updated.deliveryDays),
          },
        }));
        okCount++;
      } catch {
        errCount++;
      }
    }
    setBulkSaving(false);
    if (errCount === 0) toast.success(`${okCount} wilaya(s) enregistrée(s)`);
    else toast.warning(`${okCount} enregistrée(s), ${errCount} en échec`);
  };

  const resetAll = () => {
    if (!list) return;
    const next: Record<string, Draft> = {};
    for (const w of list) {
      next[w.id] = {
        shippingPrice: String(w.shippingPrice),
        stopDeskPrice: String(w.stopDeskPrice),
        deliveryDays: String(w.deliveryDays),
      };
    }
    setDrafts(next);
  };

  // Count per region (used in the filter pills).
  const counts = React.useMemo(() => {
    const out: Record<RegionFilter, number> = {
      all: list?.length ?? 0,
      Nord: 0,
      Centre: 0,
      Est: 0,
      Ouest: 0,
      Sud: 0,
    };
    if (list) {
      for (const w of list) out[w.region] = (out[w.region] ?? 0) + 1;
    }
    return out;
  }, [list]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Logistique"
        title="Livraison"
        subtitle="Tarifs et délais par wilaya. Les territoires (wilayas et communes) sont importés depuis ZR Express ; modifiez les prix puis enregistrez."
        actions={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void importFromZr()}
            disabled={importing}
          >
            <RefreshCw className={cn("size-3.5", importing && "animate-spin")} />
            {importing ? "Import en cours…" : "Importer depuis ZR Express"}
          </Button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Filter bar */}
      <section className="mb-4 rounded-md border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher par code, nom français ou arabe…"
              className="pl-9"
              aria-label="Rechercher une wilaya"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <RegionPill
              active={region === "all"}
              count={counts.all}
              onClick={() => setRegion("all")}
            >
              Toutes
            </RegionPill>
            {REGIONS.map((r) => (
              <RegionPill
                key={r}
                active={region === r}
                count={counts[r]}
                onClick={() => setRegion(r)}
              >
                {r}
              </RegionPill>
            ))}
          </div>
        </div>
        <Small className="mt-3 block text-zinc-500">
          {list === null
            ? "Chargement…"
            : `${filtered.length} wilaya${filtered.length > 1 ? "s" : ""} affichée${filtered.length > 1 ? "s" : ""}${
                dirtyRows.length > 0
                  ? ` · ${dirtyRows.length} modifiée${dirtyRows.length > 1 ? "s" : ""}`
                  : ""
              }`}
        </Small>
      </section>

      {/* Table */}
      {list === null ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
          Aucune wilaya ne correspond à ces filtres.
        </div>
      ) : (
        <section
          className={cn(
            "overflow-hidden rounded-md border border-zinc-200 bg-white",
            dirtyRows.length > 0 && "pb-20"
          )}
        >
          {/* Mobile (< md): card list — desktop's 7-column table doesn't
              fit on a phone, so each wilaya becomes a card with the
              same editable fields stacked. */}
          <ul className="divide-y divide-zinc-100 md:hidden">
            {filtered.map((w) => {
              const d = drafts[w.id] ?? {
                shippingPrice: String(w.shippingPrice),
                stopDeskPrice: String(w.stopDeskPrice),
                deliveryDays: String(w.deliveryDays),
              };
              const dirty = isDirty(w);
              return (
                <li
                  key={w.id}
                  className={cn(
                    "flex flex-col gap-2.5 px-3 py-3",
                    dirty && "border-l-2 border-l-amber-400 bg-amber-50/40",
                  )}
                >
                  {/* Header — code badge + FR/AR name + region pill. */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 shrink-0 rounded-full bg-zinc-100 px-1.5 py-0 font-mono text-[10px] text-zinc-600">
                        #{w.code}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-zinc-900">
                          {w.name}
                        </p>
                        <p
                          className="truncate text-[10px] text-zinc-500"
                          dir="rtl"
                          lang="ar"
                        >
                          {w.nameAr}
                        </p>
                      </div>
                    </div>
                    <RegionChip region={w.region} />
                  </div>

                  {/* Editable fields — label/value rows. Each input gets
                      a fixed width (~104px) so they all line up vertically
                      on the right edge, which makes the prices easy to
                      compare across rows. */}
                  <dl className="flex flex-col gap-1.5">
                    <ShippingField
                      label="Domicile"
                      value={d.shippingPrice}
                      onChange={(v) => setDraftField(w.id, "shippingPrice", v)}
                      suffix="DZD"
                      min={0}
                      max={100000}
                      step={50}
                      ariaLabel={`Prix domicile ${w.name}`}
                      disabled={bulkSaving}
                    />
                    <ShippingField
                      label="Point relais"
                      value={d.stopDeskPrice}
                      onChange={(v) => setDraftField(w.id, "stopDeskPrice", v)}
                      suffix="DZD"
                      min={0}
                      max={100000}
                      step={50}
                      ariaLabel={`Prix point relais ${w.name}`}
                      disabled={bulkSaving}
                    />
                    <ShippingField
                      label="Délai"
                      value={d.deliveryDays}
                      onChange={(v) => setDraftField(w.id, "deliveryDays", v)}
                      suffix="j"
                      min={1}
                      max={30}
                      step={1}
                      ariaLabel={`Délai ${w.name}`}
                      disabled={bulkSaving}
                    />
                  </dl>

                  <div className="flex justify-end">
                    <CommunesDialog wilaya={w} />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-50">
                <tr className="border-b border-zinc-200 text-left text-2xs uppercase tracking-wide text-zinc-600">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Wilaya</th>
                  <th className="px-4 py-2.5 font-medium">Région</th>
                  <th className="px-4 py-2.5 font-medium text-right">
                    Domicile
                    <span className="ms-1 font-normal text-zinc-400">DZD</span>
                  </th>
                  <th className="px-4 py-2.5 font-medium text-right">
                    Point relais
                    <span className="ms-1 font-normal text-zinc-400">DZD</span>
                  </th>
                  <th className="px-4 py-2.5 font-medium text-right">Délai</th>
                  <th className="px-4 py-2.5 font-medium text-right">Communes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const d = drafts[w.id] ?? {
                    shippingPrice: String(w.shippingPrice),
                    stopDeskPrice: String(w.stopDeskPrice),
                    deliveryDays: String(w.deliveryDays),
                  };
                  const dirty = isDirty(w);
                  return (
                    <tr
                      key={w.id}
                      className={cn(
                        "border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60",
                        dirty &&
                          "border-l-2 border-l-amber-400 bg-amber-50/40 hover:bg-amber-50/60"
                      )}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-zinc-500">
                        {w.code}
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium text-zinc-900">{w.name}</div>
                        <div
                          className="text-2xs text-zinc-500"
                          dir="rtl"
                          lang="ar"
                        >
                          {w.nameAr}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <RegionChip region={w.region} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <FieldWithSuffix
                          value={d.shippingPrice}
                          onChange={(v) => setDraftField(w.id, "shippingPrice", v)}
                          suffix="DZD"
                          min={0}
                          max={100000}
                          step={50}
                          width="w-28"
                          ariaLabel={`Prix domicile ${w.name}`}
                          disabled={bulkSaving}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <FieldWithSuffix
                          value={d.stopDeskPrice}
                          onChange={(v) => setDraftField(w.id, "stopDeskPrice", v)}
                          suffix="DZD"
                          min={0}
                          max={100000}
                          step={50}
                          width="w-28"
                          ariaLabel={`Prix point relais ${w.name}`}
                          disabled={bulkSaving}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <FieldWithSuffix
                          value={d.deliveryDays}
                          onChange={(v) => setDraftField(w.id, "deliveryDays", v)}
                          suffix="j"
                          min={1}
                          max={30}
                          step={1}
                          width="w-20"
                          ariaLabel={`Délai ${w.name}`}
                          disabled={bulkSaving}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <CommunesDialog wilaya={w} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sticky bulk save */}
      {dirtyRows.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-900">
              <span className="inline-flex size-2 rounded-full bg-amber-500 align-middle" />{" "}
              {dirtyRows.length} wilaya
              {dirtyRows.length > 1 ? "s" : ""} non enregistrée
              {dirtyRows.length > 1 ? "s" : ""}.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetAll}
                disabled={bulkSaving}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                size="default"
                onClick={() => void saveAllDirty()}
                disabled={bulkSaving}
              >
                {bulkSaving
                  ? "Enregistrement…"
                  : `Enregistrer ${dirtyRows.length} ligne${dirtyRows.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ───── Small UI helpers ───── */

/** Tiny inline error message shown under an invalid form input —
 *  red dot + text, dismissed automatically as the field is edited. */
function InlineErr({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-1 flex items-center gap-1 text-2xs font-medium text-red-600"
    >
      <span
        aria-hidden
        className="inline-block size-1 rounded-full bg-red-600"
      />
      {message}
    </p>
  );
}

function RegionPill({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-zinc-900 bg-zinc-900 text-zinc-50"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
      )}
    >
      <span>{children}</span>
      <Mono
        className={cn(
          "text-2xs",
          active ? "text-zinc-300" : "text-zinc-400"
        )}
      >
        {count}
      </Mono>
    </button>
  );
}

const REGION_STYLES: Record<WilayaRegion, string> = {
  Nord: "bg-sky-50 text-sky-700 ring-sky-200",
  Centre: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Est: "bg-violet-50 text-violet-700 ring-violet-200",
  Ouest: "bg-orange-50 text-orange-700 ring-orange-200",
  Sud: "bg-amber-50 text-amber-700 ring-amber-200",
};

function RegionChip({ region }: { region: WilayaRegion }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ring-1 ring-inset",
        REGION_STYLES[region]
      )}
    >
      {region}
    </span>
  );
}

function FieldWithSuffix({
  value,
  onChange,
  suffix,
  min,
  max,
  step,
  width,
  ariaLabel,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  min: number;
  max: number;
  step: number;
  width: string;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn("h-8 text-right font-mono", width)}
        aria-label={ariaLabel}
      />
      <Mono className="w-8 text-left text-zinc-500">{suffix}</Mono>
    </div>
  );
}

/** Mobile label/value row used inside the shipping cards. Lays the
 *  field name on the left and the editable number + suffix on the
 *  right, with a fixed input width so prices line up across the list.
 *  Built on top of FieldWithSuffix so validation + keyboard behaviour
 *  stay identical to the desktop table. */
function ShippingField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  min: number;
  max: number;
  step: number;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {props.label}
      </dt>
      <dd>
        <FieldWithSuffix
          value={props.value}
          onChange={props.onChange}
          suffix={props.suffix}
          min={props.min}
          max={props.max}
          step={props.step}
          width="w-24"
          ariaLabel={props.ariaLabel}
          disabled={props.disabled}
        />
      </dd>
    </div>
  );
}

function NewWilayaDialog({
  onCreated,
}: {
  onCreated: (w: Wilaya) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [nameAr, setNameAr] = React.useState("");
  const [region, setRegion] = React.useState<WilayaRegion>("Nord");
  const [shippingPrice, setShippingPrice] = React.useState("600");
  const [stopDeskPrice, setStopDeskPrice] = React.useState("300");
  const [deliveryDays, setDeliveryDays] = React.useState("3");
  const [saving, setSaving] = React.useState(false);

  type WilayaErr = "code" | "name" | "nameAr" | "price" | "stopPrice" | "days";
  const [errors, setErrors] = React.useState<Partial<Record<WilayaErr, string>>>(
    {},
  );
  const clearWErr = (k: WilayaErr) =>
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });

  const reset = () => {
    setCode("");
    setName("");
    setNameAr("");
    setRegion("Nord");
    setShippingPrice("600");
    setStopDeskPrice("300");
    setDeliveryDays("3");
    setErrors({});
  };

  const submit = async () => {
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const trimmedNameAr = nameAr.trim();
    const next: Partial<Record<WilayaErr, string>> = {};

    // Code: 1–2 digits, value 1–99 (not "0" or "00").
    if (!CODE_RE.test(trimmedCode) || parseInt(trimmedCode, 10) <= 0) {
      next.code = "1 ou 2 chiffres entre 1 et 99 (ex. 59).";
    }
    // FR name: 2–100 chars, must contain at least one Latin letter.
    if (!NAME_FR_RE.test(trimmedName)) {
      next.name = "2 à 100 caractères, doit contenir au moins une lettre latine.";
    }
    // AR name: 2–100 chars, must contain at least one Arabic letter.
    if (!NAME_AR_RE.test(trimmedNameAr)) {
      next.nameAr = "2 à 100 caractères, doit contenir au moins une lettre arabe.";
    }

    const price = parseInt(shippingPrice, 10);
    if (!POS_INT_RE.test(shippingPrice.trim()) || price > 100000) {
      next.price = "Entier ≥ 0 et ≤ 100 000.";
    }
    const stopPrice = parseInt(stopDeskPrice, 10);
    if (!POS_INT_RE.test(stopDeskPrice.trim()) || stopPrice > 100000) {
      next.stopPrice = "Entier ≥ 0 et ≤ 100 000.";
    } else if (
      POS_INT_RE.test(shippingPrice.trim()) &&
      Number.isFinite(price) &&
      stopPrice > price
    ) {
      // Stop-desk should never exceed home delivery — if it did, the
      // merchant would charge clients more to come pick up the parcel.
      next.stopPrice = "Le prix point relais doit être ≤ au prix domicile.";
    }
    const days = parseInt(deliveryDays, 10);
    if (
      !POS_INT_RE.test(deliveryDays.trim()) ||
      !Number.isFinite(days) ||
      days < 1 ||
      days > 30
    ) {
      next.days = "Entier entre 1 et 30.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Corrigez les champs en rouge avant d'enregistrer.");
      return;
    }

    const padded = trimmedCode.padStart(2, "0");
    const payload: WilayaCreate = {
      code: padded,
      name: trimmedName,
      nameAr: trimmedNameAr,
      region,
      shippingPrice: price,
      stopDeskPrice: stopPrice,
      deliveryDays: days,
    };
    setSaving(true);
    try {
      const created = await wilayasApi.create(payload);
      toast.success(`Wilaya ${created.code} — ${created.name} ajoutée`);
      onCreated(created);
      reset();
      setOpen(false);
    } catch (err) {
      const msg =
        err instanceof HttpError && err.status === 422
          ? extractMessage(err, "Données invalides")
          : extractMessage(err, "Erreur lors de la création");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="primary" size="sm">
            <Plus className="size-3.5" /> Ajouter une wilaya
          </Button>
        }
      />
      <DialogContent className="w-[min(100vw-2rem,32rem)] max-w-none sm:max-w-none">
        <DialogHeader>
          <DialogTitle>Nouvelle wilaya</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="nw-code" className="text-xs">
                Code <span className="text-red-600">*</span>
              </Label>
              <Input
                id="nw-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  clearWErr("code");
                }}
                placeholder="59"
                maxLength={2}
                inputMode="numeric"
                aria-invalid={!!errors.code}
                className={cn(
                  "font-mono",
                  errors.code && "border-red-500 ring-2 ring-red-500/20",
                )}
                disabled={saving}
              />
              <InlineErr message={errors.code} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nw-region" className="text-xs">
                Région
              </Label>
              <Select
                value={region}
                onValueChange={(v) => v && setRegion(v as WilayaRegion)}
                disabled={saving}
              >
                <SelectTrigger id="nw-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nw-name" className="text-xs">
                Nom (FR) <span className="text-red-600">*</span>
              </Label>
              <Input
                id="nw-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearWErr("name");
                }}
                placeholder="In Salah"
                aria-invalid={!!errors.name}
                className={cn(
                  errors.name && "border-red-500 ring-2 ring-red-500/20",
                )}
                disabled={saving}
              />
              <InlineErr message={errors.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nw-name-ar" className="text-xs" dir="rtl">
                <span dir="rtl">الاسم (AR)</span>
                <span className="ms-1 text-red-600">*</span>
              </Label>
              <Input
                id="nw-name-ar"
                value={nameAr}
                onChange={(e) => {
                  setNameAr(e.target.value);
                  clearWErr("nameAr");
                }}
                placeholder="عين صالح"
                dir="rtl"
                lang="ar"
                aria-invalid={!!errors.nameAr}
                className={cn(
                  errors.nameAr && "border-red-500 ring-2 ring-red-500/20",
                )}
                disabled={saving}
              />
              <InlineErr message={errors.nameAr} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="nw-price" className="text-xs">
                Prix domicile (DZD) <span className="text-red-600">*</span>
              </Label>
              <Input
                id="nw-price"
                type="number"
                min={0}
                max={100000}
                step={50}
                value={shippingPrice}
                onChange={(e) => {
                  setShippingPrice(e.target.value);
                  clearWErr("price");
                  // Re-validating stop-desk on home change is overkill;
                  // we'll re-check at submit. Just clear stale errors.
                  clearWErr("stopPrice");
                }}
                aria-invalid={!!errors.price}
                className={cn(
                  "font-mono",
                  errors.price && "border-red-500 ring-2 ring-red-500/20",
                )}
                disabled={saving}
              />
              <InlineErr message={errors.price} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nw-stop-price" className="text-xs">
                Prix point relais (DZD){" "}
                <span className="text-red-600">*</span>
              </Label>
              <Input
                id="nw-stop-price"
                type="number"
                min={0}
                max={100000}
                step={50}
                value={stopDeskPrice}
                onChange={(e) => {
                  setStopDeskPrice(e.target.value);
                  clearWErr("stopPrice");
                }}
                aria-invalid={!!errors.stopPrice}
                className={cn(
                  "font-mono",
                  errors.stopPrice && "border-red-500 ring-2 ring-red-500/20",
                )}
                disabled={saving}
              />
              <InlineErr message={errors.stopPrice} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nw-days" className="text-xs">
                Délai (jours) <span className="text-red-600">*</span>
              </Label>
              <Input
                id="nw-days"
                type="number"
                min={1}
                max={30}
                step={1}
                value={deliveryDays}
                onChange={(e) => {
                  setDeliveryDays(e.target.value);
                  clearWErr("days");
                }}
                aria-invalid={!!errors.days}
                className={cn(
                  "font-mono",
                  errors.days && "border-red-500 ring-2 ring-red-500/20",
                )}
                disabled={saving}
              />
              <InlineErr message={errors.days} />
            </div>
          </div>

          <Small className="block text-zinc-500">
            Le code sera complété par un zéro à gauche au besoin (ex. « 5 » → « 05 »).
          </Small>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void submit()}
            disabled={saving}
          >
            {saving ? "Création…" : "Créer la wilaya"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommunesDialog({ wilaya }: { wilaya: Wilaya }) {
  const [open, setOpen] = React.useState(false);
  const [list, setList] = React.useState<Commune[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [nameAr, setNameAr] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  type CommuneErr = "code" | "name" | "nameAr";
  const [errors, setErrors] = React.useState<Partial<Record<CommuneErr, string>>>(
    {},
  );
  const clearCErr = (k: CommuneErr) =>
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });

  const reset = () => {
    setCode("");
    setName("");
    setNameAr("");
    setErrors({});
  };

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    wilayasApi
      .listCommunes(wilaya.id)
      .then((data) => {
        if (cancelled) return;
        setList(data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(extractMessage(err, "Impossible de charger les communes"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, wilaya.id]);

  const add = async () => {
    const c = code.trim();
    const n = name.trim();
    const nAr = nameAr.trim();
    const next: Partial<Record<CommuneErr, string>> = {};

    // Algerian postal codes are exactly 5 digits, but admin refs can
    // vary — accept 4 to 6 digits to be permissive.
    if (!POSTAL_RE.test(c)) {
      next.code = "Code postal : 4 à 6 chiffres (ex. 19000).";
    }
    if (!NAME_FR_RE.test(n)) {
      next.name = "2 à 100 caractères, doit contenir au moins une lettre latine.";
    }
    if (!NAME_AR_RE.test(nAr)) {
      next.nameAr = "2 à 100 caractères, doit contenir au moins une lettre arabe.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Corrigez les champs en rouge avant d'ajouter.");
      return;
    }

    const payload: CommuneCreate = { code: c, name: n, nameAr: nAr };
    setAdding(true);
    try {
      const created = await wilayasApi.createCommune(wilaya.id, payload);
      setList((prev) =>
        prev ? [...prev, created].sort((a, b) => a.name.localeCompare(b.name)) : [created]
      );
      toast.success(`${created.name} ajoutée`);
      reset();
    } catch (err) {
      toast.error(extractMessage(err, "Erreur lors de la création"));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (commune: Commune) => {
    setDeletingId(commune.id);
    try {
      await wilayasApi.deleteCommune(wilaya.id, commune.id);
      setList((prev) => (prev ? prev.filter((c) => c.id !== commune.id) : prev));
      toast.success(`${commune.name} supprimée`);
    } catch (err) {
      toast.error(extractMessage(err, "Erreur lors de la suppression"));
    } finally {
      setDeletingId(null);
    }
  };

  const count = list?.length ?? 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <MapPin className="size-3.5" />
            <span>
              Communes{" "}
              {list !== null ? (
                <Mono className="text-2xs text-zinc-500">({count})</Mono>
              ) : null}
            </span>
          </Button>
        }
      />
      <DialogContent className="w-[min(100vw-2rem,40rem)] max-w-none sm:max-w-none">
        <DialogHeader>
          <DialogTitle>
            Communes — {wilaya.code} · {wilaya.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Existing list */}
          <div>
            <Small className="text-zinc-500">
              {loading
                ? "Chargement…"
                : count === 0
                  ? "Aucune commune. Lancez « Synchroniser les territoires » dans les réglages ZR Express."
                  : `${count} commune${count > 1 ? "s" : ""} — importées depuis ZR Express (lecture seule).`}
            </Small>
            {list && list.length > 0 ? (
              <ul className="mt-3 max-h-[min(16rem,30dvh)] space-y-1 overflow-y-auto rounded-md border border-zinc-200 bg-white p-2">
                {list.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    <Mono className="w-16 shrink-0 text-zinc-500">{c.code}</Mono>
                    <span className="flex-1 truncate text-zinc-900">{c.name}</span>
                    <span
                      className="text-xs text-zinc-500"
                      dir="rtl"
                      lang="ar"
                    >
                      {c.nameAr}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
