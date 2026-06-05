"use client";

import * as React from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/decorative/SocialIcons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Small } from "@/components/ui/typography";
import { HttpError } from "@/lib/api/http";
import { settingsApi, type SettingsMap } from "@/lib/api/settings";
import {
  mailHref,
  readLocalSettings,
  siteContact,
  telHref,
  waHref,
  writeLocalSettings,
} from "@/lib/site-contact";
import { cn } from "@/lib/utils";

// Settings keys are flat and dotted, matching the project's existing
// `site.*` / `contact.*` / `social.*` namespace convention.
const K = {
  phone: "contact.phone",
  email: "contact.email",
  whatsapp: "contact.whatsapp",
  addressFr: "contact.address.fr",
  addressAr: "contact.address.ar",
  mapsUrl: "contact.maps_url",
  mapsPlaceFr: "contact.maps_place.fr",
  mapsPlaceAr: "contact.maps_place.ar",
  social: {
    facebook: "social.facebook",
    instagram: "social.instagram",
    tiktok: "social.tiktok",
    youtube: "social.youtube",
  },
} as const;

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

export default function ContactsPage() {
  const [phone, setPhone] = React.useState(siteContact.phone);
  const [email, setEmail] = React.useState(siteContact.email);
  const [whatsapp, setWhatsapp] = React.useState(siteContact.whatsapp);
  const [addressFr, setAddressFr] = React.useState(siteContact.addressFr);
  const [addressAr, setAddressAr] = React.useState(siteContact.addressAr);
  const [mapsUrl, setMapsUrl] = React.useState("");
  const [mapsUrlError, setMapsUrlError] = React.useState<string | null>(null);
  const [mapsPlaceFr, setMapsPlaceFr] = React.useState("");
  const [mapsPlaceAr, setMapsPlaceAr] = React.useState("");
  const [facebook, setFacebook] = React.useState(siteContact.social.facebook);
  const [instagram, setInstagram] = React.useState(siteContact.social.instagram);
  const [tiktok, setTiktok] = React.useState(siteContact.social.tiktok);
  const [youtube, setYoutube] = React.useState(siteContact.social.youtube);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Merge server map (best source) with localStorage cache (always
    // available, persists when the backend allow-list isn't ready).
    // Server values win when present; otherwise local; otherwise default.
    const local = readLocalSettings();
    settingsApi
      .listAll()
      .then((map) => {
        if (cancelled) return;
        applyMap(map, local);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        // Even if the server fetch fails, hydrate from localStorage so
        // the admin's prior edits don't disappear.
        applyMap({}, local);
        setError(
          err instanceof HttpError && err.status === 401
            ? "Session expirée. Reconnectez-vous."
            : "Impossible de charger les coordonnées du serveur. Cache local utilisé."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // applyMap is intentionally inlined; the linter is OK with this list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: hydrate state from a server map + local cache. Falls back to
  // hardcoded defaults when neither has a value.
  function applyMap(map: SettingsMap, local: Record<string, string>) {
    const pick = (key: string, fallback: string) => {
      const s = map[key];
      if (typeof s === "string" && s.length > 0) return s;
      const l = local[key];
      if (typeof l === "string" && l.length > 0) return l;
      return fallback;
    };
    setPhone(pick(K.phone, siteContact.phone));
    setEmail(pick(K.email, siteContact.email));
    setWhatsapp(pick(K.whatsapp, siteContact.whatsapp));
    setAddressFr(pick(K.addressFr, siteContact.addressFr));
    setAddressAr(pick(K.addressAr, siteContact.addressAr));
    setMapsUrl(pick(K.mapsUrl, ""));
    setMapsUrlError(null);
    setMapsPlaceFr(pick(K.mapsPlaceFr, ""));
    setMapsPlaceAr(pick(K.mapsPlaceAr, ""));
    setFacebook(pick(K.social.facebook, siteContact.social.facebook));
    setInstagram(pick(K.social.instagram, siteContact.social.instagram));
    setTiktok(pick(K.social.tiktok, siteContact.social.tiktok));
    setYoutube(pick(K.social.youtube, siteContact.social.youtube));
  }

  const save = async () => {
    // Cheap URL validation — must start with https:// (or http://) and
    // look like a Google Maps host so a paste from the browser address
    // bar is the only thing that passes.
    const mapsTrimmed = mapsUrl.trim();
    if (mapsTrimmed) {
      const ok =
        /^https?:\/\/(www\.|maps\.)?google\.[a-z.]+\/maps|^https?:\/\/(www\.|maps\.)?google\.[a-z.]+\/.*[?&]q=|^https?:\/\/maps\.app\.goo\.gl\/|^https?:\/\/goo\.gl\/maps\//i.test(
          mapsTrimmed,
        );
      if (!ok) {
        setMapsUrlError(
          "Collez un lien Google Maps (google.com/maps/… ou maps.app.goo.gl/…).",
        );
        toast.error("Lien Google Maps invalide.");
        return;
      }
    }
    setMapsUrlError(null);
    setSaving(true);
    const payload: SettingsMap = {
      [K.phone]: phone.trim() || null,
      [K.email]: email.trim() || null,
      [K.whatsapp]: whatsapp.trim() || null,
      [K.addressFr]: addressFr.trim() || null,
      [K.addressAr]: addressAr.trim() || null,
      [K.mapsUrl]: mapsTrimmed || null,
      [K.mapsPlaceFr]: mapsPlaceFr.trim() || null,
      [K.mapsPlaceAr]: mapsPlaceAr.trim() || null,
      [K.social.facebook]: facebook.trim() || null,
      [K.social.instagram]: instagram.trim() || null,
      [K.social.tiktok]: tiktok.trim() || null,
      [K.social.youtube]: youtube.trim() || null,
    };
    // Mirror to localStorage first so the edit is guaranteed to persist
    // on this device, regardless of whether the server allow-list accepts
    // these keys yet.
    writeLocalSettings(payload);
    try {
      const updated = await settingsApi.update(payload);
      // Verify the server actually persisted what we sent. If keys are
      // missing from the response, the Laravel allow-list probably hasn't
      // been widened to cover contact.* / social.* yet.
      const sent = Object.keys(payload).filter((k) => payload[k] !== null);
      const dropped = sent.filter((k) => typeof updated[k] !== "string");
      if (dropped.length > 0) {
        toast.warning(
          `Enregistré localement. Le serveur n'a pas accepté ${dropped.length} clé(s) — vérifiez l'allow-list back-end.`,
          { duration: 6000 }
        );
      } else {
        toast.success("Coordonnées enregistrées");
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
        eyebrow="Configuration"
        title="Coordonnées & réseaux"
        subtitle="Téléphone, email, WhatsApp, adresse et liens sociaux. Source unique pour le footer et la page contact."
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
        {/* 1. Direct channels + social networks */}
        <Section title="Canaux directs & réseaux sociaux">
          <Small className="-mt-3 mb-5 block text-zinc-500">
            Canaux directs : liens cliquables dans le footer et la page contact
            (<code className="font-mono text-2xs">tel:</code>,{" "}
            <code className="font-mono text-2xs">mailto:</code>,{" "}
            <code className="font-mono text-2xs">wa.me/…</code>). Réseaux
            sociaux : laissez vide pour masquer le lien.
          </Small>

          <SubHeading>Canaux directs</SubHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="phone" label="Téléphone">
              <LinkedInput
                id="phone"
                value={phone}
                onChange={setPhone}
                href={telHref(phone)}
                actionLabel="Tester l'appel"
                icon={<Phone className="size-3.5" />}
                disabled={loading || saving}
              />
            </Field>
            <Field id="email" label="Email">
              <LinkedInput
                id="email"
                type="email"
                value={email}
                onChange={setEmail}
                href={mailHref(email)}
                actionLabel="Tester l'email"
                icon={<Mail className="size-3.5" />}
                disabled={loading || saving}
              />
            </Field>
            <Field id="wa" label="WhatsApp">
              <LinkedInput
                id="wa"
                value={whatsapp}
                onChange={setWhatsapp}
                href={waHref(whatsapp)}
                actionLabel="Ouvrir WhatsApp"
                icon={<MessageCircle className="size-3.5" />}
                disabled={loading || saving}
              />
            </Field>
          </div>

          <SubHeading className="mt-6">Réseaux sociaux</SubHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="sn-fb" label="Facebook">
              <LinkedInput
                id="sn-fb"
                value={facebook}
                onChange={setFacebook}
                href={facebook || "#"}
                actionLabel="Ouvrir Facebook"
                icon={<FacebookIcon width={14} height={14} />}
                disabled={loading || saving}
              />
            </Field>
            <Field id="sn-ig" label="Instagram">
              <LinkedInput
                id="sn-ig"
                value={instagram}
                onChange={setInstagram}
                href={instagram || "#"}
                actionLabel="Ouvrir Instagram"
                icon={<InstagramIcon width={14} height={14} />}
                disabled={loading || saving}
              />
            </Field>
            <Field id="sn-tt" label="TikTok">
              <LinkedInput
                id="sn-tt"
                value={tiktok}
                onChange={setTiktok}
                href={tiktok || "#"}
                actionLabel="Ouvrir TikTok"
                icon={<TikTokIcon width={14} height={14} />}
                disabled={loading || saving}
              />
            </Field>
            <Field id="sn-yt" label="YouTube">
              <LinkedInput
                id="sn-yt"
                value={youtube}
                onChange={setYoutube}
                href={youtube || "#"}
                actionLabel="Ouvrir YouTube"
                icon={<YouTubeIcon width={14} height={14} />}
                disabled={loading || saving}
              />
            </Field>
          </div>
        </Section>

        {/* 2. Address — bilingual + Google Maps URL */}
        <Section title="Adresse">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="addr-fr" label="Adresse (FR)">
              <Textarea
                id="addr-fr"
                rows={2}
                value={addressFr}
                onChange={(e) => setAddressFr(e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field id="addr-ar" label="العنوان (AR)">
              <Textarea
                id="addr-ar"
                rows={2}
                value={addressAr}
                onChange={(e) => setAddressAr(e.target.value)}
                disabled={loading || saving}
                dir="rtl"
                lang="ar"
              />
            </Field>
          </div>

          <div className="mt-4 space-y-3">
            <Field id="maps-url" label="Lien Google Maps">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
                <Input
                  id="maps-url"
                  value={mapsUrl}
                  onChange={(e) => {
                    setMapsUrl(e.target.value);
                    if (mapsUrlError) setMapsUrlError(null);
                  }}
                  placeholder="https://www.google.com/maps/place/…"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  disabled={loading || saving}
                  aria-invalid={!!mapsUrlError}
                  className={cn(
                    "flex-1 font-mono text-xs",
                    mapsUrlError && "border-red-500 ring-2 ring-red-500/20",
                  )}
                />
                {mapsUrl.trim() && !mapsUrlError ? (
                  <a
                    href={mapsUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "shrink-0",
                    )}
                  >
                    Tester
                  </a>
                ) : null}
              </div>
              {mapsUrlError ? (
                <p
                  role="alert"
                  className="mt-1 flex items-center gap-1 text-2xs font-medium text-red-600"
                >
                  <span
                    aria-hidden
                    className="inline-block size-1 rounded-full bg-red-600"
                  />
                  {mapsUrlError}
                </p>
              ) : (
                <Small className="mt-1 block text-zinc-500">
                  Sur Google Maps, ouvrez votre fiche → « Partager » →
                  « Copier le lien », puis collez ici.
                </Small>
              )}
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="maps-place-fr" label="Nom du lieu (FR)">
                <Input
                  id="maps-place-fr"
                  value={mapsPlaceFr}
                  onChange={(e) => setMapsPlaceFr(e.target.value)}
                  placeholder="Bingo Camping, Sétif"
                  autoComplete="off"
                  disabled={loading || saving}
                />
              </Field>
              <Field id="maps-place-ar" label="اسم المكان (AR)">
                <Input
                  id="maps-place-ar"
                  value={mapsPlaceAr}
                  onChange={(e) => setMapsPlaceAr(e.target.value)}
                  placeholder="بينغو كامبينغ، سطيف"
                  autoComplete="off"
                  disabled={loading || saving}
                  dir="rtl"
                  lang="ar"
                />
              </Field>
            </div>
            <Small className="block text-zinc-500">
              Court libellé affiché à côté du lien (ex. nom du magasin
              ou repère visible sur la carte). Bilingue FR / AR.
            </Small>
          </div>
        </Section>

        {/* Sticky save */}
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
      <h2 className="font-sans text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SubHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "mb-3 border-b border-zinc-200 pb-1.5 font-sans text-2xs font-semibold uppercase tracking-wider text-zinc-500",
        className,
      )}
    >
      {children}
    </h3>
  );
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function LinkedInput({
  id,
  value,
  onChange,
  href,
  actionLabel,
  icon,
  type,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  href: string;
  actionLabel: string;
  icon: React.ReactNode;
  type?: string;
  disabled?: boolean;
}) {
  const enabled = href && href !== "#";
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1"
      />
      <a
        href={enabled ? href : undefined}
        target={enabled ? "_blank" : undefined}
        rel="noopener noreferrer"
        aria-label={actionLabel}
        title={actionLabel}
        aria-disabled={!enabled}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "shrink-0",
          !enabled && "pointer-events-none opacity-40"
        )}
      >
        {icon}
      </a>
    </div>
  );
}
