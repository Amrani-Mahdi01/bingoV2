"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Mail,
  RotateCcw,
  Sparkles,
  Truck,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  BrandPanel,
  CheckRow,
  Field,
  FormPanel,
  Input,
  PasswordToggle,
} from "@/app/login/page";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<
  Record<
    "firstName" | "lastName" | "email" | "password" | "confirm" | "terms",
    string
  >
>;

export default function RegisterPage() {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});

  const clearError = (k: keyof Errors) =>
    setErrors((p) => {
      if (!p[k]) return p;
      const n = { ...p };
      delete n[k];
      return n;
    });

  const validate = (): Errors => {
    const e: Errors = {};
    if (!firstName.trim()) e.firstName = "Votre prénom est requis.";
    if (!lastName.trim()) e.lastName = "Votre nom est requis.";
    if (!email.trim()) e.email = "Votre email est requis.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Email invalide.";
    if (!password) e.password = "Mot de passe requis.";
    else if (password.length < 6) e.password = "6 caractères minimum.";
    if (!confirm) e.confirm = "Veuillez confirmer le mot de passe.";
    else if (confirm !== password)
      e.confirm = "Les mots de passe ne correspondent pas.";
    if (!acceptedTerms) e.terms = "Vous devez accepter les CGV.";
    return e;
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // TODO: POST to auth endpoint
  };

  return (
    <main className="flex flex-1 flex-col lg:min-h-screen lg:flex-row">
      <BrandPanel
        eyebrow="Rejoignez la base"
        title={
          <>
            Une équipe
            <br />
            d&apos;aventure.
          </>
        }
        lead="Un compte BINGO = des commandes plus rapides, vos favoris à portée de main, et nos guides terrain en avant-première."
        bullets={[
          { Icon: Sparkles, text: "Nouveautés en avant-première" },
          { Icon: Truck, text: "Adresses sauvegardées, commande en un clic" },
          { Icon: RotateCcw, text: "Retours sous 30 jours, garantis" },
        ]}
      />

      <FormPanel>
        <header className="text-center lg:text-start">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            Nouveau client
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl">
            Créer un compte
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-wood-700">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-semibold text-tangerine-700 underline-offset-4 hover:text-tangerine-600 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="reg-firstName"
              label="Prénom"
              required
              error={errors.firstName}
            >
              <Input
                id="reg-firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearError("firstName");
                }}
                icon={<User className="size-4" strokeWidth={2} />}
                invalid={!!errors.firstName}
              />
            </Field>
            <Field
              id="reg-lastName"
              label="Nom"
              required
              error={errors.lastName}
            >
              <Input
                id="reg-lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearError("lastName");
                }}
                invalid={!!errors.lastName}
              />
            </Field>
          </div>

          <Field id="reg-email" label="Email" required error={errors.email}>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              placeholder="vous@email.dz"
              icon={<Mail className="size-4" strokeWidth={2} />}
              invalid={!!errors.email}
            />
          </Field>

          <Field
            id="reg-password"
            label="Mot de passe"
            required
            error={errors.password}
          >
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
                clearError("confirm");
              }}
              placeholder="6 caractères minimum"
              icon={<Lock className="size-4" strokeWidth={2} />}
              invalid={!!errors.password}
              trailing={
                <PasswordToggle
                  shown={showPassword}
                  onToggle={() => setShowPassword((s) => !s)}
                />
              }
            />
          </Field>

          <Field
            id="reg-confirm"
            label="Confirmation"
            required
            error={errors.confirm}
          >
            <Input
              id="reg-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                clearError("confirm");
              }}
              placeholder="Retapez votre mot de passe"
              icon={<Lock className="size-4" strokeWidth={2} />}
              invalid={!!errors.confirm}
            />
          </Field>

          {/* Terms */}
          <div className="mt-2">
            <CheckRow
              checked={acceptedTerms}
              onChange={(v) => {
                setAcceptedTerms(v);
                if (v) clearError("terms");
              }}
              hasError={!!errors.terms}
              label={
                <>
                  J&apos;accepte les{" "}
                  <Link
                    href="/cgv"
                    className="font-semibold text-tangerine-700 hover:underline"
                  >
                    conditions générales de vente
                  </Link>
                  .
                </>
              }
            />
            {errors.terms ? (
              <p
                role="alert"
                className="mt-1 inline-flex items-center gap-1 ps-7 font-mono text-[10.5px] text-red-700"
              >
                <span
                  aria-hidden
                  className="inline-block size-1 rounded-full bg-red-700"
                />
                {errors.terms}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className={cn(
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5",
              "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
              "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
              "transition-all duration-200 hover:-translate-y-0.5 hover:bg-tangerine-600",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40"
            )}
          >
            Créer mon compte
            <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
          </button>
        </form>

        {/* Decorative divider */}
        <div className="mt-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-wood-300/60" />
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-wood-500">
            ou
          </span>
          <span className="h-px flex-1 bg-wood-300/60" />
        </div>

        <Link
          href="/catalogue"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-wood-300 bg-cream px-6 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-forest-900 transition-colors hover:border-forest-900 hover:bg-cream-deep"
        >
          Continuer sans compte
        </Link>
      </FormPanel>
    </main>
  );
}
