"use client";

import * as React from "react";
import {
  CheckCircle2,
  KeyRound,
  MapPin,
  RefreshCw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Small } from "@/components/ui/typography";
import { HttpError } from "@/lib/api/http";
import { zrApi, type ZrSettings } from "@/lib/api/zr";
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

export default function ZrExpressPage() {
  const [settings, setSettings] = React.useState<ZrSettings | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Form state. apiKey stays empty unless the admin types a new one; the
  // stored token is shown only as a masked placeholder.
  const [apiKey, setApiKey] = React.useState("");
  const [tenant, setTenant] = React.useState("");
  const [enabled, setEnabled] = React.useState(false);
  const [autoSend, setAutoSend] = React.useState(false);
  const [baseUrl, setBaseUrl] = React.useState("");
  const [version, setVersion] = React.useState("");
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [busy, setBusy] = React.useState<
    null | "territories" | "rates" | "statuses"
  >(null);

  const hydrate = React.useCallback((s: ZrSettings) => {
    setSettings(s);
    setApiKey("");
    setTenant(s.tenant ?? "");
    setEnabled(s.enabled);
    setAutoSend(s.autoSend);
    setBaseUrl(s.baseUrl ?? "");
    setVersion(s.version ?? "");
  }, []);

  const reload = React.useCallback(async () => {
    try {
      hydrate(await zrApi.getSettings());
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Impossible de charger la configuration ZR Express.",
      );
    }
  }, [hydrate]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  /** Persist the form. Returns true on success. */
  const save = React.useCallback(
    async (opts: { silent?: boolean } = {}): Promise<boolean> => {
      setSaving(true);
      try {
        const updated = await zrApi.updateSettings({
          // Only send the key when the admin actually typed one.
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
          tenant: tenant.trim() || null,
          enabled,
          autoSend,
          baseUrl: baseUrl.trim() || null,
          version: version.trim() || null,
        });
        hydrate(updated);
        if (!opts.silent) toast.success("Configuration ZR Express enregistrée.");
        return true;
      } catch (err) {
        toast.error(extractMessage(err, "Échec de l'enregistrement."));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiKey, tenant, enabled, autoSend, baseUrl, version, hydrate],
  );

  /** Save first (so the test reflects what's on screen), then test. */
  const handleTest = async () => {
    setTesting(true);
    try {
      const ok = await save({ silent: true });
      if (!ok) return;
      const res = await zrApi.test();
      toast.success(res.message ?? "Connexion réussie.");
    } catch (err) {
      toast.error(extractMessage(err, "Connexion à ZR Express échouée."));
    } finally {
      setTesting(false);
    }
  };

  const runSync = async (
    kind: "territories" | "rates" | "statuses",
    fn: () => Promise<{ message: string }>,
  ) => {
    setBusy(kind);
    try {
      const res = await fn();
      toast.success(res.message ?? "Terminé.");
      // Territory/rate syncs change the mapping counters — refresh them.
      await reload();
    } catch (err) {
      toast.error(extractMessage(err, "La synchronisation a échoué."));
    } finally {
      setBusy(null);
    }
  };

  const anyBusy = saving || testing || busy !== null;
  const mapping = settings?.mapping;
  const territoriesMapped =
    mapping !== undefined && mapping.wilayasMapped >= mapping.wilayasTotal && mapping.wilayasTotal > 0;

  return (
    <>
      <AdminPageHeader
        eyebrow="Livraison"
        title="ZR Express"
        subtitle="Connexion à l'API ZR Express : token, envoi automatique des commandes, suivi et tarifs."
      />

      {loadError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="max-w-3xl space-y-6 pb-12">
        {/* 1. Connexion / token */}
        <Section
          title="Connexion"
          icon={<KeyRound className="size-4 text-zinc-500" />}
        >
          <div className="grid gap-4">
            <Field
              id="zr-token"
              label="Token API (Secret API Key)"
              hint={
                settings?.apiKeyConfigured
                  ? `Un token est enregistré (${settings.apiKeyMasked}). Laissez vide pour le conserver, ou saisissez-en un nouveau.`
                  : "Collez ici le token généré dans le portail ZR Express."
              }
            >
              <Input
                id="zr-token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  settings?.apiKeyConfigured
                    ? (settings.apiKeyMasked ?? "••••••••")
                    : "ZR-XXXX-XXXX-XXXX"
                }
                className="font-mono"
                disabled={anyBusy}
              />
            </Field>

            <Field
              id="zr-tenant"
              label="Tenant (X-Tenant) — optionnel"
              hint="Laissez vide si votre token n'exige pas d'identifiant de tenant."
            >
              <Input
                id="zr-tenant"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                placeholder="ex. mon-magasin"
                className="font-mono"
                disabled={anyBusy}
              />
            </Field>

            {/* Advanced: base URL + version */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                {showAdvanced ? "Masquer les options avancées" : "Options avancées"}
              </button>
              {showAdvanced ? (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field id="zr-base-url" label="URL de base de l'API">
                    <Input
                      id="zr-base-url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.zrexpress.app"
                      className="font-mono"
                      disabled={anyBusy}
                    />
                  </Field>
                  <Field
                    id="zr-version"
                    label="Version de l'API"
                    hint="ex. v1.0 — à ajuster si ZR renvoie une erreur de version."
                  >
                    <Input
                      id="zr-version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="v1.0"
                      className="font-mono"
                      disabled={anyBusy}
                    />
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="primary"
                size="default"
                onClick={() => void save()}
                disabled={anyBusy}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => void handleTest()}
                disabled={anyBusy || (!settings?.apiKeyConfigured && !apiKey.trim())}
              >
                {testing ? "Test en cours…" : "Tester la connexion"}
              </Button>
            </div>
          </div>
        </Section>

        {/* 2. Activation */}
        <Section
          title="Activation"
          icon={<Truck className="size-4 text-zinc-500" />}
        >
          <div className="space-y-3">
            <ToggleRow
              checked={enabled}
              onChange={setEnabled}
              disabled={anyBusy}
              title="Activer l'intégration ZR Express"
              description="Active l'envoi, le suivi et la synchronisation des statuts. Sans ça, rien n'est envoyé à ZR."
            />
            <ToggleRow
              checked={autoSend}
              onChange={setAutoSend}
              disabled={anyBusy || !enabled}
              title="Envoi automatique à la confirmation (ZR-01)"
              description="Quand une commande passe en « confirmée », elle est automatiquement créée comme colis chez ZR Express."
            />
            <Small className="block text-zinc-500">
              Pensez à cliquer sur « Enregistrer » après avoir modifié ces options.
            </Small>
          </div>
        </Section>

        {/* 3. Territoires & tarifs */}
        <Section
          title="Territoires & tarifs"
          icon={<MapPin className="size-4 text-zinc-500" />}
        >
          <div className="space-y-4">
            <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm">
              {mapping ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    {territoriesMapped ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <span className="inline-block size-2 rounded-full bg-amber-500" />
                    )}
                    <span className="text-zinc-700">
                      Wilayas liées :{" "}
                      <strong>
                        {mapping.wilayasMapped}/{mapping.wilayasTotal}
                      </strong>
                    </span>
                  </span>
                  <span className="text-zinc-700">
                    Communes liées :{" "}
                    <strong>
                      {mapping.communesMapped}/{mapping.communesTotal}
                    </strong>
                  </span>
                </div>
              ) : (
                <span className="text-zinc-500">Chargement…</span>
              )}
              <Small className="mt-2 block text-zinc-500">
                Les colis ne peuvent être créés qu&apos;une fois les wilayas et
                communes liées aux territoires ZR. Lancez la synchronisation une
                première fois, puis après chaque ajout de commune.
              </Small>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() =>
                  void runSync("territories", zrApi.syncTerritories)
                }
                disabled={anyBusy}
              >
                <RefreshCw
                  className={cn("size-4", busy === "territories" && "animate-spin")}
                />
                {busy === "territories"
                  ? "Synchronisation…"
                  : "Synchroniser les territoires"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => void runSync("rates", zrApi.syncRates)}
                disabled={anyBusy}
              >
                <RefreshCw
                  className={cn("size-4", busy === "rates" && "animate-spin")}
                />
                {busy === "rates"
                  ? "Synchronisation…"
                  : "Synchroniser les tarifs (ZR-04)"}
              </Button>
            </div>
          </div>
        </Section>

        {/* 4. Statuts */}
        <Section
          title="Suivi des statuts (ZR-03)"
          icon={<RefreshCw className="size-4 text-zinc-500" />}
        >
          <div className="space-y-3">
            <Small className="block text-zinc-500">
              Les statuts de livraison sont synchronisés automatiquement toutes
              les 10 minutes. Utilisez ce bouton pour forcer une mise à jour
              immédiate.
            </Small>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => void runSync("statuses", zrApi.syncStatuses)}
              disabled={anyBusy}
            >
              <RefreshCw
                className={cn("size-4", busy === "statuses" && "animate-spin")}
              />
              {busy === "statuses"
                ? "Synchronisation…"
                : "Synchroniser les statuts maintenant"}
            </Button>
          </div>
        </Section>
      </div>
    </>
  );
}

/* ───── Small UI helpers ───── */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-zinc-900">
        {icon}
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <Small className="block text-zinc-500">{hint}</Small> : null}
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  disabled,
  title,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 bg-white p-3",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-900">{title}</span>
        <span className="block text-xs text-zinc-500">{description}</span>
      </span>
    </label>
  );
}
