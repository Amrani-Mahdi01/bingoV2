"use client";

import * as React from "react";
import { Palette, Plus, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Small } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------
   Shape sent back to the parent — identical to the payload the
   backend's StoreProductRequest expects under `variants[]`.
   ----------------------------------------------------------- */

export interface VariantRow {
  colorNameFr?: string | null;
  colorNameAr?: string | null;
  colorHex?: string | null;
  sizeLabel?: string | null;
  stock?: number;
  priceDelta?: number;
}

/** Internal model — by color (or "no color"), each with its sizes. */
interface ColorGroup {
  /** Local id for React keys (not persisted). */
  uid: string;
  nameFr: string;
  nameAr: string;
  hex: string;
  /** Stock used when this colour has no sizes (mode "colors-only"). */
  stock: number;
  sizes: SizeRow[];
}
interface SizeRow {
  uid: string;
  label: string;
  stock: number;
}

type Mode = "none" | "sizes" | "colors-only" | "colors";

/**
 * Defaults for the colour picker — quick swatches the admin can click
 * instead of opening the native color input.
 */
const SWATCHES = [
  { hex: "#1A1A1A", nameFr: "Noir", nameAr: "أسود" },
  { hex: "#F5F1E8", nameFr: "Beige", nameAr: "بيج" },
  { hex: "#5C6A45", nameFr: "Olive", nameAr: "زيتي" },
  { hex: "#3D2E1F", nameFr: "Marron", nameAr: "بنّي" },
  { hex: "#7C2D12", nameFr: "Rouille", nameAr: "صدئ" },
  { hex: "#1E3A5F", nameFr: "Bleu marine", nameAr: "أزرق داكن" },
  { hex: "#D97706", nameFr: "Orange", nameAr: "برتقالي" },
  { hex: "#9CA3AF", nameFr: "Gris", nameAr: "رمادي" },
  { hex: "#FFFFFF", nameFr: "Blanc", nameAr: "أبيض" },
] as const;

const uid = () =>
  Math.random().toString(36).slice(2, 9) +
  Date.now().toString(36).slice(-3);

interface VariantManagerProps {
  value: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
}

export function VariantManager({ value, onChange }: VariantManagerProps) {
  // Derive mode + groups from the incoming flat array.
  const initial = React.useMemo(() => deriveState(value), [value]);
  const [mode, setMode] = React.useState<Mode>(initial.mode);
  const [colors, setColors] = React.useState<ColorGroup[]>(initial.colors);
  const [sizesOnly, setSizesOnly] = React.useState<SizeRow[]>(initial.sizesOnly);

  // Flatten state → flat rows → parent any time the user mutates.
  const emit = React.useCallback(
    (
      nextMode: Mode,
      nextColors: ColorGroup[],
      nextSizesOnly: SizeRow[],
    ) => {
      onChange(flatten(nextMode, nextColors, nextSizesOnly));
    },
    [onChange],
  );

  const switchMode = (m: Mode) => {
    setMode(m);
    emit(m, colors, sizesOnly);
  };

  /* ----- COLORS ------------------------------------------------------- */
  const addColor = (preset?: { hex: string; nameFr: string; nameAr: string }) => {
    const color: ColorGroup = {
      uid: uid(),
      nameFr: preset?.nameFr ?? "",
      nameAr: preset?.nameAr ?? "",
      hex: preset?.hex ?? "#1A1A1A",
      stock: 0,
      sizes: [],
    };
    const next = [...colors, color];
    setColors(next);
    emit(mode, next, sizesOnly);
  };

  const updateColor = (i: number, patch: Partial<ColorGroup>) => {
    const next = colors.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    setColors(next);
    emit(mode, next, sizesOnly);
  };

  const removeColor = (i: number) => {
    const next = colors.filter((_, idx) => idx !== i);
    setColors(next);
    emit(mode, next, sizesOnly);
  };

  const addSizeToColor = (i: number, label?: string) => {
    const next = colors.map((c, idx) =>
      idx === i
        ? {
            ...c,
            sizes: [
              ...c.sizes,
              { uid: uid(), label: label ?? "", stock: 0 },
            ],
          }
        : c,
    );
    setColors(next);
    emit(mode, next, sizesOnly);
  };

  const updateColorSize = (
    ci: number,
    si: number,
    patch: Partial<SizeRow>,
  ) => {
    const next = colors.map((c, idx) =>
      idx === ci
        ? {
            ...c,
            sizes: c.sizes.map((s, sIdx) =>
              sIdx === si ? { ...s, ...patch } : s,
            ),
          }
        : c,
    );
    setColors(next);
    emit(mode, next, sizesOnly);
  };

  const removeColorSize = (ci: number, si: number) => {
    const next = colors.map((c, idx) =>
      idx === ci
        ? { ...c, sizes: c.sizes.filter((_, sIdx) => sIdx !== si) }
        : c,
    );
    setColors(next);
    emit(mode, next, sizesOnly);
  };

  /* ----- SIZES ONLY --------------------------------------------------- */
  const addSizeOnly = (preset?: string) => {
    const next = [
      ...sizesOnly,
      { uid: uid(), label: preset ?? "", stock: 0 },
    ];
    setSizesOnly(next);
    emit(mode, colors, next);
  };

  const updateSizeOnly = (i: number, patch: Partial<SizeRow>) => {
    const next = sizesOnly.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    setSizesOnly(next);
    emit(mode, colors, next);
  };

  const removeSizeOnly = (i: number) => {
    const next = sizesOnly.filter((_, idx) => idx !== i);
    setSizesOnly(next);
    emit(mode, colors, next);
  };

  return (
    <div className="space-y-4">
      {/* Mode picker */}
      <div className="flex flex-wrap gap-2">
        <ModeBtn label="Sans variantes" active={mode === "none"} onClick={() => switchMode("none")} />
        <ModeBtn label="Tailles seules" active={mode === "sizes"} onClick={() => switchMode("sizes")} />
        <ModeBtn
          label="Couleurs seules"
          active={mode === "colors-only"}
          onClick={() => switchMode("colors-only")}
        />
        <ModeBtn
          label="Couleurs + tailles"
          active={mode === "colors"}
          onClick={() => switchMode("colors")}
        />
      </div>

      {mode === "none" ? (
        <p className="rounded border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500">
          Un seul SKU pour ce produit. Le stock est géré au niveau du
          produit principal.
        </p>
      ) : null}

      {/* SIZES ONLY ------------------------------------------------------ */}
      {mode === "sizes" ? (
        <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          {sizesOnly.length === 0 ? (
            <p className="text-center text-xs text-zinc-500">
              Ajoutez les tailles disponibles (ex : S / M / L ou 40 / 41 / 42).
            </p>
          ) : (
            <ul className="space-y-2">
              {sizesOnly.map((s, i) => (
                <SizeEditor
                  key={s.uid}
                  value={s}
                  onChange={(patch) => updateSizeOnly(i, patch)}
                  onRemove={() => removeSizeOnly(i)}
                />
              ))}
            </ul>
          )}

          <SizePresetBar onPick={(label) => addSizeOnly(label)} />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSizeOnly()}
          >
            <Plus className="size-3.5" /> Ajouter une taille
          </Button>
        </div>
      ) : null}

      {/* COLORS variants (with or without sizes) ------------------------ */}
      {mode === "colors" || mode === "colors-only" ? (
        <div className="space-y-3">
          {colors.length === 0 ? (
            <p className="rounded border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500">
              {mode === "colors"
                ? "Ajoutez les couleurs disponibles. Pour chaque couleur, vous pourrez ensuite ajouter les tailles avec leur stock."
                : "Ajoutez les couleurs disponibles. Stock géré directement par couleur."}
            </p>
          ) : null}

          {colors.map((c, i) => (
            <ColorGroupEditor
              key={c.uid}
              color={c}
              withSizes={mode === "colors"}
              onChange={(patch) => updateColor(i, patch)}
              onRemove={() => removeColor(i)}
              onAddSize={(label) => addSizeToColor(i, label)}
              onUpdateSize={(si, patch) => updateColorSize(i, si, patch)}
              onRemoveSize={(si) => removeColorSize(i, si)}
            />
          ))}

          <ColorPresetBar onPick={addColor} />
        </div>
      ) : null}
    </div>
  );
}

/* -----------------------------------------------------------
   Sub-components
   ----------------------------------------------------------- */

function ModeBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
      )}
    >
      {label}
    </button>
  );
}

function ColorGroupEditor({
  color,
  withSizes,
  onChange,
  onRemove,
  onAddSize,
  onUpdateSize,
  onRemoveSize,
}: {
  color: ColorGroup;
  withSizes: boolean;
  onChange: (patch: Partial<ColorGroup>) => void;
  onRemove: () => void;
  /** Optional label pre-fills the new size; omit for an empty row. */
  onAddSize: (label?: string) => void;
  onUpdateSize: (i: number, patch: Partial<SizeRow>) => void;
  onRemoveSize: (i: number) => void;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Color swatch + native picker */}
        <label
          className="relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-300 shadow-sm"
          style={{ backgroundColor: color.hex }}
        >
          <span className="sr-only">Choisir une couleur</span>
          <input
            type="color"
            value={color.hex}
            onChange={(e) => onChange({ hex: e.target.value })}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          value={color.hex}
          onChange={(e) => onChange({ hex: e.target.value })}
          className="w-28 font-mono text-xs uppercase"
          maxLength={9}
        />
        <Input
          value={color.nameFr}
          onChange={(e) => onChange({ nameFr: e.target.value })}
          placeholder="Nom FR (Olive, Noir…)"
          className="min-w-0 flex-1"
        />
        <Input
          value={color.nameAr}
          onChange={(e) => onChange({ nameAr: e.target.value })}
          placeholder="الاسم AR"
          className="min-w-0 flex-1"
          dir="rtl"
          lang="ar"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Supprimer la couleur"
          className="inline-flex size-8 items-center justify-center rounded-md text-red-700 hover:bg-red-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 border-t border-zinc-200 pt-3">
        {withSizes ? (
          <div className="space-y-2">
            <Small className="text-zinc-600">Tailles pour cette couleur</Small>
            {color.sizes.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Aucune taille — ajoutez S / M / L, 40 / 41 / 42…
              </p>
            ) : (
              <ul className="space-y-2">
                {color.sizes.map((s, si) => (
                  <SizeEditor
                    key={s.uid}
                    value={s}
                    onChange={(patch) => onUpdateSize(si, patch)}
                    onRemove={() => onRemoveSize(si)}
                  />
                ))}
              </ul>
            )}
            <SizePresetBar onPick={(label) => onAddSize(label)} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddSize()}
            >
              <Plus className="size-3.5" /> Ajouter une taille
            </Button>
          </div>
        ) : (
          // colors-only mode: single stock input per colour
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-2xs text-zinc-500">Stock pour cette couleur</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={String(color.stock)}
                onChange={(e) =>
                  onChange({ stock: parseInt(e.target.value || "0", 10) || 0 })
                }
                className="h-9 w-32 font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SizeEditor({
  value,
  onChange,
  onRemove,
}: {
  value: SizeRow;
  onChange: (patch: Partial<SizeRow>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2">
      <div className="space-y-0.5">
        <Label className="text-2xs text-zinc-500">Taille</Label>
        <Input
          value={value.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="h-9 w-24 text-sm"
          placeholder="M / 42"
        />
      </div>
      <div className="space-y-0.5">
        <Label className="text-2xs text-zinc-500">Stock</Label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={String(value.stock)}
          onChange={(e) =>
            onChange({ stock: parseInt(e.target.value || "0", 10) || 0 })
          }
          className="h-9 w-24 font-mono text-sm"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Supprimer la taille"
        className="ms-auto inline-flex size-8 items-center justify-center rounded-md text-red-700 hover:bg-red-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}

function SizePresetBar({ onPick }: { onPick: (label: string) => void }) {
  const presets = [
    ["XS", "S", "M", "L", "XL", "XXL"],
    ["38", "39", "40", "41", "42", "43", "44", "45", "46"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-2xs text-zinc-500">
      <span className="font-medium uppercase tracking-wide">Raccourcis :</span>
      {presets.map((row, ri) => (
        <div key={ri} className="flex flex-wrap gap-1">
          {row.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onPick(label)}
              className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-2xs text-zinc-700 hover:border-zinc-400"
            >
              + {label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function ColorPresetBar({
  onPick,
}: {
  onPick: (preset?: { hex: string; nameFr: string; nameAr: string }) => void;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-600">
        <Palette className="size-3.5" />
        <span className="font-medium">Ajouter une couleur</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {SWATCHES.map((s) => (
          <button
            key={s.hex}
            type="button"
            onClick={() => onPick(s)}
            className="group inline-flex flex-col items-center gap-1"
            title={`${s.nameFr} (${s.hex})`}
          >
            <span
              className="size-8 rounded-full border border-zinc-300 transition-transform group-hover:scale-110"
              style={{ backgroundColor: s.hex }}
            />
            <span className="text-2xs text-zinc-600">{s.nameFr}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPick()}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "ms-2"
          )}
        >
          <Plus className="size-3.5" /> Couleur personnalisée
        </button>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   Derive / flatten — convert between the parent's flat array and our
   internal grouped state.
   ----------------------------------------------------------- */

function deriveState(rows: VariantRow[]): {
  mode: Mode;
  colors: ColorGroup[];
  sizesOnly: SizeRow[];
} {
  if (!rows || rows.length === 0) {
    return { mode: "none", colors: [], sizesOnly: [] };
  }
  const anyColor = rows.some(
    (r) => r.colorNameFr || r.colorNameAr || r.colorHex,
  );
  const anySize = rows.some((r) => r.sizeLabel);
  if (anyColor) {
    // Group by (colorHex + name combination)
    const map = new Map<string, ColorGroup>();
    for (const r of rows) {
      const key = (r.colorHex ?? "") + "|" + (r.colorNameFr ?? "");
      let g = map.get(key);
      if (!g) {
        g = {
          uid: uid(),
          nameFr: r.colorNameFr ?? "",
          nameAr: r.colorNameAr ?? "",
          hex: r.colorHex ?? "#1A1A1A",
          stock: 0,
          sizes: [],
        };
        map.set(key, g);
      }
      if (r.sizeLabel) {
        g.sizes.push({
          uid: uid(),
          label: r.sizeLabel,
          stock: r.stock ?? 0,
        });
      } else {
        // Color-only row → store the stock directly on the group.
        g.stock = r.stock ?? 0;
      }
    }
    return {
      // If no row ever carries a size, this is a colors-only catalog.
      mode: anySize ? "colors" : "colors-only",
      colors: [...map.values()],
      sizesOnly: [],
    };
  }
  if (anySize) {
    return {
      mode: "sizes",
      colors: [],
      sizesOnly: rows.map((r) => ({
        uid: uid(),
        label: r.sizeLabel ?? "",
        stock: r.stock ?? 0,
      })),
    };
  }
  return { mode: "none", colors: [], sizesOnly: [] };
}

function flatten(
  mode: Mode,
  colors: ColorGroup[],
  sizesOnly: SizeRow[],
): VariantRow[] {
  if (mode === "none") return [];
  if (mode === "sizes") {
    return sizesOnly
      .filter((s) => s.label.trim() !== "")
      .map((s) => ({ sizeLabel: s.label.trim(), stock: s.stock }));
  }
  // Both "colors" and "colors-only" produce color-bearing rows; the
  // difference is whether sizes get attached or not.
  const out: VariantRow[] = [];
  const includeSizes = mode === "colors";
  for (const c of colors) {
    const colorBase = {
      colorNameFr: c.nameFr.trim() || null,
      colorNameAr: c.nameAr.trim() || null,
      colorHex: c.hex,
    };
    if (!includeSizes || c.sizes.length === 0) {
      // One row for this color, stock taken from the group itself.
      out.push({ ...colorBase, stock: c.stock });
    } else {
      for (const s of c.sizes) {
        if (s.label.trim() === "") continue;
        out.push({
          ...colorBase,
          sizeLabel: s.label.trim(),
          stock: s.stock,
        });
      }
    }
  }
  return out;
}
