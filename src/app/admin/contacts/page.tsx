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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mono, Small } from "@/components/ui/typography";
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

const DAYS = [
  { key: "sam", label: "Sam" },
  { key: "dim", label: "Dim" },
  { key: "lun", label: "Lun" },
  { key: "mar", label: "Mar" },
  { key: "mer", label: "Mer" },
  { key: "jeu", label: "Jeu" },
  { key: "ven", label: "Ven" },
] as const;
type DayKey = (typeof DAYS)[number]["key"];

// Settings keys are flat and dotted, matching the project's existing
// `site.*` / `contact.*` / `social.*` namespace convention.
const K = {
  phone: "contact.phone",
  email: "contact.email",
  whatsapp: "contact.whatsapp",
  addressFr: "contact.address.fr",
  addressAr: "contact.address.ar",
  hours: (d: DayKey) => `contact.hours.${d}`,
  hoursOff: (d: DayKey) => `contact.hours.${d}.off`,
  social: {
    facebook: "social.facebook",
    instagram: "social.instagram",
    tiktok: "social.tiktok",
    youtube: "social.youtube",
    whatsappBusiness: "social.whatsapp_business",
  },
} as const;

const DEFAULT_HOURS: Record<DayKey, string> = {
  sam: "9h-18h",
  dim: "9h-18h",
  lun: "9h-18h",
  mar: "9h-18h",
  mer: "9h-18h",
  jeu: "9h-18h",
  ven: "14h-18h",
};

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
  const [facebook, setFacebook] = React.useState(siteContact.social.facebook);
  const [instagram, setInstagram] = React.useState(siteContact.social.instagram);
  const [tiktok, setTiktok] = React.useState(siteContact.social.tiktok);
  const [youtube, setYoutube] = React.useState(siteContact.social.youtube);
  const [whatsappBusiness, setWhatsappBusiness] = React.useState(
    siteContact.social.whatsappBusiness
  );
  const [hours, setHours] = React.useState<Record<DayKey, string>>(DEFAULT_HOURS);
  const [offDays, setOffDays] = React.useState<Set<DayKey>>(new Set());
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
    setFacebook(pick(K.social.facebook, siteContact.social.facebook));
    setInstagram(pick(K.social.instagram, siteContact.social.instagram));
    setTiktok(pick(K.social.tiktok, siteContact.social.tiktok));
    setYoutube(pick(K.social.youtube, siteContact.social.youtube));
    setWhatsappBusiness(
      pick(K.social.whatsappBusiness, siteContact.social.whatsappBusiness)
    );
    const nextHours = { ...DEFAULT_HOURS };
    const nextOff = new Set<DayKey>();
    for (const { key } of DAYS) {
      nextHours[key] = pick(K.hours(key), DEFAULT_HOURS[key]);
      // off flag: prefer server, fall back to local
      const serverOff = map[K.hoursOff(key)];
      const localOff = local[K.hoursOff(key)];
      const isOff = serverOff === "1" || (serverOff == null && localOff === "1");
      if (isOff) nextOff.add(key);
    }
    setHours(nextHours);
    setOffDays(nextOff);
  }

  const toggleOff = (d: DayKey) =>
    setOffDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  const updateHours = (d: DayKey, v: string) =>
    setHours((prev) => ({ ...prev, [d]: v }));

  const save = async () => {
    setSaving(true);
    const payload: SettingsMap = {
      [K.phone]: phone.trim() || null,
      [K.email]: email.trim() || null,
      [K.whatsapp]: whatsapp.trim() || null,
      [K.addressFr]: addressFr.trim() || null,
      [K.addressAr]: addressAr.trim() || null,
      [K.social.facebook]: facebook.trim() || null,
      [K.social.instagram]: instagram.trim() || null,
      [K.social.tiktok]: tiktok.trim() || null,
      [K.social.youtube]: youtube.trim() || null,
      [K.social.whatsappBusiness]: whatsappBusiness.trim() || null,
    };
    for (const { key } of DAYS) {
      payload[K.hours(key)] = hours[key].trim() || null;
      payload[K.hoursOff(key)] = offDays.has(key) ? "1" : null;
    }
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
        subtitle="Téléphone, email, WhatsApp, adresse, horaires et liens sociaux. Source unique pour le footer et la page contact."
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
        {/* 1. Direct channels */}
        <Section title="Canaux directs">
          <Small className="-mt-3 mb-4 block text-zinc-500">
            Affichés dans le footer et la page contact comme liens cliquables
            (<code className="font-mono text-2xs">tel:</code>,{" "}
            <code className="font-mono text-2xs">mailto:</code>,{" "}
            <code className="font-mono text-2xs">wa.me/…</code>).
          </Small>
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
        </Section>

        {/* 2. Address — bilingual */}
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
        </Section>

        {/* 3. Hours */}
        <Section title="Horaires d'ouverture">
          <ul className="grid gap-2 sm:grid-cols-2">
            {DAYS.map(({ key, label }) => {
              const isOff = offDays.has(key);
              return (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-md bg-white px-3 py-2"
                >
                  <span className="w-12 font-mono text-xs">{label}</span>
                  <Input
                    value={hours[key]}
                    onChange={(e) => updateHours(key, e.target.value)}
                    disabled={isOff || loading || saving}
                    placeholder={isOff ? "Fermé" : undefined}
                    className={cn("h-8 flex-1", isOff && "text-zinc-400")}
                    aria-label={`Horaires ${label}`}
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-600">
                    <Checkbox
                      checked={isOff}
                      onCheckedChange={() => toggleOff(key)}
                      disabled={loading || saving}
                    />
                    Fermé
                  </label>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* 4. Social */}
        <Section title="Réseaux sociaux">
          <Small className="-mt-3 mb-4 block text-zinc-500">
            Laissez vide pour masquer le lien sur le site.
          </Small>
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
            <Field id="sn-wab" label="WhatsApp Business" className="sm:col-span-2">
              <LinkedInput
                id="sn-wab"
                value={whatsappBusiness}
                onChange={setWhatsappBusiness}
                href={waHref(whatsappBusiness)}
                actionLabel="Ouvrir WhatsApp Business"
                icon={<MessageCircle className="size-3.5" />}
                disabled={loading || saving}
              />
              <Mono className="mt-1 block text-2xs text-zinc-500">
                Numéro distinct du WhatsApp principal si besoin.
              </Mono>
            </Field>
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
