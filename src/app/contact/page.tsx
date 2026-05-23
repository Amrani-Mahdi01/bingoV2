"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  MapPin,
  Phone,
} from "lucide-react";

import { WhatsappIcon } from "@/components/icons/social";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

export default function ContactPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitted, setSubmitted] = React.useState(false);

  const clearError = (k: keyof Errors) =>
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Votre nom est requis.";
    if (!email.trim()) e.email = "Votre email est requis.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Email invalide.";
    if (!subject.trim()) e.subject = "L'objet est requis.";
    if (!message.trim()) e.message = "Le message est requis.";
    else if (message.trim().length < 10)
      e.message = "Votre message est un peu court (10 caractères minimum).";
    return e;
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // TODO: POST to a backend endpoint
    setSubmitted(true);
  };

  return (
    <main className="flex flex-1 flex-col bg-cream py-10 md:py-14">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-wood-700"
        >
          <Link href="/" className="transition-colors hover:text-tangerine-700">
            Accueil
          </Link>
          <ChevronRight
            className="size-3 text-wood-500 rtl:rotate-180"
            strokeWidth={2.2}
          />
          <span className="text-forest-900">Contact</span>
        </nav>

        {/* Header */}
        <header className="mt-6 max-w-2xl md:mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            Une question
          </p>
          <h1 className="mt-3 font-display text-[40px] font-bold leading-[1] tracking-[-0.03em] text-forest-900 sm:text-[56px] md:text-[64px]">
            Contactez-nous
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wood-700 sm:text-base">
            Une question sur un produit, une commande ou un conseil
            terrain ? Écrivez-nous — l&apos;équipe BINGO vous répond sous
            24 h.
          </p>
        </header>

        {/* Body */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
          {/* Form */}
          {submitted ? (
            <SuccessCard
              onReset={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setSubject("");
                setMessage("");
                setErrors({});
              }}
            />
          ) : (
            <form
              onSubmit={onSubmit}
              noValidate
              className="rounded-2xl border border-wood-300/50 bg-cream-deep/30 p-5 sm:p-6"
            >
              <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-forest-900 sm:text-xl">
                Écrivez-nous
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field id="contact-name" label="Nom" required error={errors.name}>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError("name");
                    }}
                    aria-invalid={!!errors.name}
                    className={inputClass(!!errors.name)}
                  />
                </Field>
                <Field
                  id="contact-email"
                  label="Email"
                  required
                  error={errors.email}
                >
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                    aria-invalid={!!errors.email}
                    placeholder="vous@email.dz"
                    className={inputClass(!!errors.email)}
                  />
                </Field>
                <Field
                  id="contact-subject"
                  label="Objet"
                  required
                  error={errors.subject}
                  className="sm:col-span-2"
                >
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      clearError("subject");
                    }}
                    aria-invalid={!!errors.subject}
                    placeholder="Question sur une commande, demande de conseil, …"
                    className={inputClass(!!errors.subject)}
                  />
                </Field>
                <Field
                  id="contact-message"
                  label="Message"
                  required
                  error={errors.message}
                  className="sm:col-span-2"
                >
                  <textarea
                    id="contact-message"
                    rows={6}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      clearError("message");
                    }}
                    aria-invalid={!!errors.message}
                    placeholder="Détaillez votre demande…"
                    className={cn(
                      inputClass(!!errors.message),
                      "h-auto resize-y py-3 leading-relaxed"
                    )}
                  />
                </Field>
              </div>

              <button
                type="submit"
                className={cn(
                  "mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5",
                  "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
                  "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:bg-tangerine-600",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40"
                )}
              >
                Envoyer le message
                <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
              </button>
            </form>
          )}

          {/* Direct contact panel */}
          <aside className="flex flex-col gap-5 self-start">
            <ContactCard
              accent="forest"
              icon={<Phone className="size-5" strokeWidth={1.8} />}
              label="Par téléphone"
              primary="+213 673 81 28 96"
              note="Samedi — Jeudi · 9 h — 18 h"
              href="tel:+213673812896"
              cta="Appeler"
            />
            <ContactCard
              accent="tangerine"
              icon={<WhatsappIcon className="size-5" />}
              label="Sur WhatsApp"
              primary="Discutons directement"
              note="Réponse moyenne en moins de 2 h"
              href="https://wa.me/213673812896"
              cta="Ouvrir WhatsApp"
              external
            />
            <ContactCard
              accent="cream"
              icon={<MapPin className="size-5" strokeWidth={1.8} />}
              label="À la boutique"
              primary={
                <>
                  Cité Dallas, Bât. 3 (près de LG)
                  <br />
                  19000 Sétif, Algérie
                </>
              }
              note="Samedi — Jeudi · 9 h — 18 h"
              href="/a-propos#notre-histoire"
              cta="Voir l'adresse"
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ───── Field helper (shared with checkout pattern) ────────────── */

const INPUT_BASE = [
  "h-11 w-full rounded-md border bg-cream px-3",
  "font-mono text-[13px] text-wood-800 placeholder:text-wood-500",
  "transition-[border-color,box-shadow] duration-200",
  "focus:outline-none focus:ring-4",
].join(" ");

const inputClass = (hasError?: boolean) =>
  cn(
    INPUT_BASE,
    hasError
      ? "border-red-600 focus:border-red-700 focus:ring-red-600/15"
      : "border-wood-300 focus:border-tangerine-500 focus:ring-tangerine-500/15"
  );

function Field({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className={cn("flex flex-col gap-1.5", className)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-wood-700">
        {label}
        {required ? <span className="ms-1 text-tangerine-700">*</span> : null}
      </span>
      {children}
      {error ? (
        <span
          role="alert"
          className="inline-flex items-center gap-1 font-mono text-[10.5px] text-red-700"
        >
          <span
            aria-hidden
            className="inline-block size-1 rounded-full bg-red-700"
          />
          {error}
        </span>
      ) : null}
    </label>
  );
}

/* ───── Contact info cards ─────────────────────────────────────── */

type Accent = "forest" | "tangerine" | "cream";

function ContactCard({
  accent,
  icon,
  label,
  primary,
  note,
  href,
  cta,
  external,
}: {
  accent: Accent;
  icon: React.ReactNode;
  label: string;
  primary: React.ReactNode;
  note?: string;
  href: string;
  cta: string;
  external?: boolean;
}) {
  const isForest = accent === "forest";
  const isTangerine = accent === "tangerine";

  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : null)}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300",
        "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4",
        isForest &&
          "border-forest-900 bg-forest-900 text-cream hover:bg-forest-700 focus-visible:ring-forest-900/30",
        isTangerine &&
          "border-tangerine-500 bg-tangerine-500 text-cream hover:bg-tangerine-600 focus-visible:ring-tangerine-300/40",
        accent === "cream" &&
          "border-wood-300/60 bg-cream text-forest-900 hover:border-forest-900 focus-visible:ring-forest-900/20"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-full",
            isForest && "bg-cream text-forest-900",
            isTangerine && "bg-cream text-tangerine-700",
            accent === "cream" && "bg-cream-deep text-forest-900"
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.22em]",
            isForest && "text-cream/75",
            isTangerine && "text-cream/85",
            accent === "cream" && "text-wood-600"
          )}
        >
          {label}
        </span>
      </div>
      <p className="font-display text-base font-semibold leading-snug sm:text-[17px]">
        {primary}
      </p>
      {note ? (
        <p
          className={cn(
            "font-mono text-[10.5px] uppercase tracking-[0.16em]",
            isForest || isTangerine ? "text-cream/70" : "text-wood-600"
          )}
        >
          {note}
        </p>
      ) : null}
      <span
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] transition-transform group-hover:translate-x-0.5",
          isForest || isTangerine ? "text-cream" : "text-tangerine-700"
        )}
      >
        {cta}
        <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={2.4} />
      </span>
    </a>
  );
}

/* ───── Success state ──────────────────────────────────────────── */

function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-forest-900/30 bg-forest-900 px-6 py-12 text-center text-cream md:py-16">
      <span className="inline-grid size-14 place-items-center rounded-full bg-cream text-forest-900">
        <Check className="size-7" strokeWidth={2.4} />
      </span>
      <h2 className="font-display text-2xl font-bold tracking-[-0.01em] sm:text-3xl">
        Message envoyé, merci !
      </h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-cream/80 sm:text-base">
        Nous vous répondons sous 24 h ouvrées sur l&apos;email que vous
        nous avez laissé.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-5 py-2.5 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-tangerine-600"
      >
        Envoyer un autre message
      </button>
    </div>
  );
}
