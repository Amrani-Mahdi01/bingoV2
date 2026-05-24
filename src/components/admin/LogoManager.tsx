"use client";

import * as React from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Small } from "@/components/ui/typography";
import { HttpError } from "@/lib/api/http";
import { settingsApi, type SettingsMap } from "@/lib/api/settings";
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

/**
 * Admin widget for managing the site header logo + bilingual alt text.
 *
 * Reads /api/admin/settings on mount, lets the admin upload a new image
 * (POST /api/admin/uploads/logo → /api/admin/settings PUT), or clears the
 * existing one. Storefront picks up the change on the next public-settings
 * revalidation tick (60s).
 */
// Defaults match the SettingSeeder so nothing has to load before sliders
// render.
const DEFAULT_HEIGHT = 36;
const DEFAULT_MAX_WIDTH = 180;
const DEFAULT_RADIUS = 0;

const HEIGHT_RANGE = { min: 20, max: 96, step: 1 } as const;
const WIDTH_RANGE = { min: 60, max: 320, step: 4 } as const;
const RADIUS_RANGE = { min: 0, max: 50, step: 1 } as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseIntSetting(raw: string | null | undefined, fallback: number): number {
  if (raw === null || raw === undefined) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function LogoManager() {
  const [settings, setSettings] = React.useState<SettingsMap | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [altFr, setAltFr] = React.useState("");
  const [altAr, setAltAr] = React.useState("");
  const [height, setHeight] = React.useState(DEFAULT_HEIGHT);
  const [maxWidth, setMaxWidth] = React.useState(DEFAULT_MAX_WIDTH);
  const [radius, setRadius] = React.useState(DEFAULT_RADIUS);
  const [error, setError] = React.useState<string | null>(null);
  const confirm = useConfirm();

  const load = React.useCallback(async () => {
    try {
      const data = await settingsApi.listAll();
      setSettings(data);
      setAltFr(data["site.logo_alt_fr"] ?? "BINGO");
      setAltAr(data["site.logo_alt_ar"] ?? "بينغو");
      setHeight(parseIntSetting(data["site.logo_height"], DEFAULT_HEIGHT));
      setMaxWidth(parseIntSetting(data["site.logo_max_width"], DEFAULT_MAX_WIDTH));
      setRadius(parseIntSetting(data["site.logo_radius"], DEFAULT_RADIUS));
      setError(null);
    } catch (err) {
      setError(
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Impossible de charger les paramètres."
      );
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const logoUrl = settings?.["site.logo"] ?? null;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await settingsApi.uploadLogo(file);
      const next = await settingsApi.update({ "site.logo": url });
      setSettings(next);
      toast.success("Logo mis à jour");
    } catch (err) {
      toast.error(extractMessage(err, "Échec du téléversement"));
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    const ok = await confirm({
      title: "Supprimer le logo ?",
      message:
        "L'en-tête de la boutique reviendra au texte BINGO jusqu'à ce qu'un nouveau logo soit téléversé.",
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    setSaving(true);
    try {
      const next = await settingsApi.update({ "site.logo": null });
      setSettings(next);
      toast.success("Logo supprimé");
    } catch (err) {
      toast.error(extractMessage(err, "Erreur"));
    } finally {
      setSaving(false);
    }
  };

  const saveAlts = async () => {
    setSaving(true);
    try {
      const next = await settingsApi.update({
        "site.logo_alt_fr": altFr.trim() || null,
        "site.logo_alt_ar": altAr.trim() || null,
      });
      setSettings(next);
      toast.success("Texte alternatif enregistré");
    } catch (err) {
      toast.error(extractMessage(err, "Erreur"));
    } finally {
      setSaving(false);
    }
  };

  const saveDisplay = async () => {
    setSaving(true);
    try {
      const next = await settingsApi.update({
        "site.logo_height": String(
          clamp(height, HEIGHT_RANGE.min, HEIGHT_RANGE.max)
        ),
        "site.logo_max_width": String(
          clamp(maxWidth, WIDTH_RANGE.min, WIDTH_RANGE.max)
        ),
        "site.logo_radius": String(
          clamp(radius, RADIUS_RANGE.min, RADIUS_RANGE.max)
        ),
      });
      setSettings(next);
      toast.success("Affichage enregistré");
    } catch (err) {
      toast.error(extractMessage(err, "Erreur"));
    } finally {
      setSaving(false);
    }
  };

  const resetDisplay = () => {
    setHeight(DEFAULT_HEIGHT);
    setMaxWidth(DEFAULT_MAX_WIDTH);
    setRadius(DEFAULT_RADIUS);
  };

  return (
    <section
      id="logo"
      className="space-y-4 rounded-md border border-zinc-200 bg-white p-5 sm:p-6"
    >
      <header className="space-y-0.5">
        <h2 className="font-sans text-lg font-semibold text-zinc-900">
          Logo du site
        </h2>
        <Small className="text-zinc-500">
          Image affichée dans l&apos;en-tête de la boutique. PNG transparent
          recommandé. Max 4 Mo. Redimensionné automatiquement à 600×200.
        </Small>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <div className="relative flex h-24 w-64 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 p-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo BINGO"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="flex items-center gap-2 text-zinc-400">
              <ImageIcon className="size-5" />
              <span className="text-xs">Pas de logo</span>
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
            {uploading
              ? "Téléversement…"
              : logoUrl
                ? "Remplacer le logo"
                : "Téléverser un logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
              disabled={uploading}
            />
          </label>

          {logoUrl ? (
            <button
              type="button"
              onClick={() => void removeLogo()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-red-700 hover:text-red-800 disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
              Supprimer le logo
            </button>
          ) : null}

          {logoUrl ? (
            <p className="break-all font-mono text-2xs text-zinc-500">
              {logoUrl}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="logo-alt-fr" className="text-xs">
            Texte alternatif (FR)
          </Label>
          <Input
            id="logo-alt-fr"
            value={altFr}
            onChange={(e) => setAltFr(e.target.value)}
            placeholder="BINGO"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="logo-alt-ar" className="text-xs" dir="rtl">
            النص البديل (AR)
          </Label>
          <Input
            id="logo-alt-ar"
            value={altAr}
            onChange={(e) => setAltAr(e.target.value)}
            placeholder="بينغو"
            dir="rtl"
            lang="ar"
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void saveAlts()}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer le texte alternatif"}
          </Button>
        </div>
      </div>

      {/* Display tuning — height / max width / border radius */}
      <div className="space-y-4 border-t border-zinc-100 pt-4">
        <div className="space-y-0.5">
          <h3 className="font-sans text-sm font-semibold text-zinc-900">
            Affichage dans l&apos;en-tête
          </h3>
          <Small className="text-zinc-500">
            Ajustez la hauteur, la largeur maximale et l&apos;arrondi pour
            voir exactement comment le logo apparaîtra dans la barre du site.
          </Small>
        </div>

        {/* Live preview — mimics the storefront header. */}
        <div className="overflow-hidden rounded-md border border-zinc-200">
          <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-2xs uppercase tracking-wide text-zinc-500">
            Aperçu en-tête
          </div>
          <div className="flex items-center gap-3 bg-[#FAF6EF] px-4 py-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Aperçu logo"
                style={{
                  height: `${height}px`,
                  maxWidth: `${maxWidth}px`,
                  borderRadius:
                    radius >= RADIUS_RANGE.max ? "9999px" : `${radius}px`,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            ) : (
              <span
                className="font-display font-semibold tracking-tight text-forest-700"
                style={{ fontSize: `${Math.max(14, height * 0.55)}px` }}
              >
                {altFr || "BINGO"}
              </span>
            )}
            <span className="ms-auto font-mono text-2xs text-zinc-500">
              {height}px · {maxWidth}px ·{" "}
              {radius >= RADIUS_RANGE.max ? "rond" : `${radius}px`}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SliderField
            label="Hauteur"
            unit="px"
            min={HEIGHT_RANGE.min}
            max={HEIGHT_RANGE.max}
            step={HEIGHT_RANGE.step}
            value={height}
            onChange={setHeight}
          />
          <SliderField
            label="Largeur max."
            unit="px"
            min={WIDTH_RANGE.min}
            max={WIDTH_RANGE.max}
            step={WIDTH_RANGE.step}
            value={maxWidth}
            onChange={setMaxWidth}
          />
          <SliderField
            label="Arrondi"
            unit={radius >= RADIUS_RANGE.max ? "rond" : "px"}
            min={RADIUS_RANGE.min}
            max={RADIUS_RANGE.max}
            step={RADIUS_RANGE.step}
            value={radius}
            onChange={setRadius}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void saveDisplay()}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer l'affichage"}
          </Button>
          <button
            type="button"
            onClick={resetDisplay}
            disabled={saving}
            className="text-xs font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline disabled:opacity-60"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </section>
  );
}

function SliderField({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="font-mono text-2xs text-zinc-500">
          {value}
          {unit === "px" ? " px" : ` ${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || min)}
        className="block w-full accent-emerald-700"
      />
    </div>
  );
}
