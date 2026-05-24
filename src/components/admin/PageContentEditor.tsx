"use client";

import * as React from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HttpError } from "@/lib/api/http";
import { settingsApi, type SettingsMap } from "@/lib/api/settings";
import { readLocalSettings, writeLocalSettings } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

export interface PageEditorField {
  id: string;
  label: string;
  /** "input" for short strings, "textarea" for paragraphs. */
  type?: "input" | "textarea";
  rows?: number;
  fr: string;
  ar: string;
}

export interface PageEditorSection {
  title: string;
  fields: PageEditorField[];
}

export interface PageEditorDef {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: PageEditorSection[];
}

/** Settings key for a given field + locale. Field ids like
 *  `info-delivery-eyebrow` map to `page.info.delivery.eyebrow.fr`. */
function settingKey(fieldId: string, locale: "fr" | "ar"): string {
  return `page.${fieldId.replace(/-/g, ".")}.${locale}`;
}

type Values = Record<string, { fr: string; ar: string }>;

function buildInitialValues(def: PageEditorDef): Values {
  const init: Values = {};
  for (const section of def.sections) {
    for (const field of section.fields) {
      init[field.id] = { fr: field.fr, ar: field.ar };
    }
  }
  return init;
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

/**
 * Bilingual (FR / AR) editor for static-page content. Loads existing
 * overrides from the `/api/admin/settings` key/value store, falls back
 * to the def's defaults, and persists every field on submit.
 */
export function PageContentEditor({ def }: { def: PageEditorDef }) {
  const initial = React.useMemo(() => buildInitialValues(def), [def]);
  const [values, setValues] = React.useState<Values>(initial);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const local = readLocalSettings();
    const merge = (map: SettingsMap) => {
      const next: Values = { ...initial };
      for (const section of def.sections) {
        for (const field of section.fields) {
          const frKey = settingKey(field.id, "fr");
          const arKey = settingKey(field.id, "ar");
          const pick = (key: string, fb: string) => {
            const s = map[key];
            if (typeof s === "string" && s.length > 0) return s;
            const l = local[key];
            if (typeof l === "string" && l.length > 0) return l;
            return fb;
          };
          next[field.id] = {
            fr: pick(frKey, field.fr),
            ar: pick(arKey, field.ar),
          };
        }
      }
      setValues(next);
    };
    settingsApi
      .listAll()
      .then((map) => {
        if (cancelled) return;
        merge(map);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        merge({});
        setError(
          err instanceof HttpError && err.status === 401
            ? "Session expirée. Reconnectez-vous."
            : "Impossible de charger depuis le serveur. Cache local utilisé."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [def, initial]);

  const updateValue = (
    fieldId: string,
    locale: "fr" | "ar",
    next: string
  ) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], [locale]: next },
    }));
  };

  const resetToDefaults = () => setValues(initial);

  const save = async () => {
    setSaving(true);
    const payload: SettingsMap = {};
    for (const section of def.sections) {
      for (const field of section.fields) {
        const v = values[field.id] ?? { fr: field.fr, ar: field.ar };
        payload[settingKey(field.id, "fr")] = v.fr.trim() || null;
        payload[settingKey(field.id, "ar")] = v.ar.trim() || null;
      }
    }
    // Local cache first — guaranteed persistence even if the server
    // allow-list doesn't accept page.* keys yet.
    writeLocalSettings(payload);
    try {
      const updated = await settingsApi.update(payload);
      const sent = Object.keys(payload).filter((k) => payload[k] !== null);
      const dropped = sent.filter((k) => typeof updated[k] !== "string");
      if (dropped.length > 0) {
        toast.warning(
          `Enregistré localement. Le serveur n'a pas accepté ${dropped.length} clé(s) — vérifiez l'allow-list back-end.`,
          { duration: 6000 }
        );
      } else {
        toast.success("Contenu enregistré");
      }
    } catch (err) {
      toast.warning(
        `Enregistré localement. Échec serveur : ${extractMessage(err, "erreur réseau")}.`,
        { duration: 6000 }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        eyebrow={def.eyebrow}
        title={def.title}
        subtitle={def.subtitle}
      />

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-6 pb-32"
      >
        {def.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-md border border-zinc-200 bg-zinc-50 p-5 sm:p-6"
          >
            <h2 className="font-sans text-lg font-semibold text-zinc-900">
              {section.title}
            </h2>
            <div className="mt-5 space-y-5">
              {section.fields.map((f) => (
                <BilingualField
                  key={f.id}
                  field={f}
                  value={values[f.id] ?? { fr: f.fr, ar: f.ar }}
                  onChangeFr={(v) => updateValue(f.id, "fr", v)}
                  onChangeAr={(v) => updateValue(f.id, "ar", v)}
                  disabled={loading || saving}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Sticky save */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              disabled={loading || saving}
            >
              Restaurer les valeurs par défaut
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

function BilingualField({
  field,
  value,
  onChangeFr,
  onChangeAr,
  disabled,
}: {
  field: PageEditorField;
  value: { fr: string; ar: string };
  onChangeFr: (v: string) => void;
  onChangeAr: (v: string) => void;
  disabled: boolean;
}) {
  const idFr = `${field.id}-fr`;
  const idAr = `${field.id}-ar`;
  const isTextarea = field.type === "textarea";
  const rows = field.rows ?? 3;

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase tracking-wide text-zinc-700">
        {field.label}
      </Label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={idFr} className="text-xs text-zinc-600">
            Français
          </Label>
          {isTextarea ? (
            <Textarea
              id={idFr}
              rows={rows}
              value={value.fr}
              onChange={(e) => onChangeFr(e.target.value)}
              disabled={disabled}
              className={cn("text-sm")}
            />
          ) : (
            <Input
              id={idFr}
              value={value.fr}
              onChange={(e) => onChangeFr(e.target.value)}
              disabled={disabled}
            />
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor={idAr} className="text-xs text-zinc-600" dir="rtl">
            العربية
          </Label>
          {isTextarea ? (
            <Textarea
              id={idAr}
              rows={rows}
              value={value.ar}
              onChange={(e) => onChangeAr(e.target.value)}
              disabled={disabled}
              dir="rtl"
              lang="ar"
              className={cn("text-sm")}
            />
          ) : (
            <Input
              id={idAr}
              value={value.ar}
              onChange={(e) => onChangeAr(e.target.value)}
              disabled={disabled}
              dir="rtl"
              lang="ar"
            />
          )}
        </div>
      </div>
    </div>
  );
}
