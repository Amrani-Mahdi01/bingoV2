"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  Mail,
  RotateCcw,
  Sparkles,
  Truck,
  User,
} from "lucide-react";

import { ApiError, AUTH_ENABLED } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
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
    | "firstName"
    | "lastName"
    | "email"
    | "password"
    | "confirm"
    | "terms"
    | "form",
    string
  >
>;

export default function RegisterPage() {
  const { t, lang } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const clearError = (k: keyof Errors) =>
    setErrors((p) => {
      if (!p[k]) return p;
      const n = { ...p };
      delete n[k];
      return n;
    });

  const validate = (): Errors => {
    const e: Errors = {};
    if (!firstName.trim()) e.firstName = t("register.error.firstName");
    if (!lastName.trim()) e.lastName = t("register.error.lastName");
    if (!email.trim()) e.email = t("register.error.emailMissing");
    else if (!EMAIL_RE.test(email.trim())) e.email = t("register.error.emailInvalid");
    if (!password) e.password = t("register.error.passwordMissing");
    else if (password.length < 6) e.password = t("register.error.passwordShort");
    if (!confirm) e.confirm = t("register.error.confirmMissing");
    else if (confirm !== password) e.confirm = t("register.error.confirmMismatch");
    if (!acceptedTerms) e.terms = t("register.error.terms");
    return e;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!AUTH_ENABLED) {
      setErrors({
        form:
          lang === "ar"
            ? "إنشاء الحسابات سيكون متاحاً قريباً."
            : "La création de compte sera disponible prochainement.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors: Errors = {};
        if (err.errors?.first_name?.[0]) fieldErrors.firstName = err.errors.first_name[0];
        if (err.errors?.last_name?.[0]) fieldErrors.lastName = err.errors.last_name[0];
        if (err.errors?.email?.[0]) fieldErrors.email = err.errors.email[0];
        if (err.errors?.password?.[0]) fieldErrors.password = err.errors.password[0];
        if (Object.keys(fieldErrors).length === 0) fieldErrors.form = err.message;
        setErrors(fieldErrors);
      } else {
        setErrors({ form: (err as Error).message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col lg:min-h-screen lg:flex-row">
      <BrandPanel
        eyebrow={t("register.brand.eyebrow")}
        title={
          <>
            {t("register.brand.title1")}
            <br />
            {t("register.brand.title2")}
          </>
        }
        lead={t("register.brand.lead")}
        bullets={[
          { Icon: Sparkles, text: t("register.brand.bullet1") },
          { Icon: Truck, text: t("register.brand.bullet2") },
          { Icon: RotateCcw, text: t("register.brand.bullet3") },
        ]}
      />

      <FormPanel>
        <header className="text-center lg:text-start">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            {t("register.eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl">
            {t("register.title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-wood-700">
            {t("register.haveAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-tangerine-700 underline-offset-4 hover:text-tangerine-600 hover:underline"
            >
              {t("register.signIn")}
            </Link>
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="reg-firstName"
              label={t("register.firstName")}
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
              label={t("register.lastName")}
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

          <Field id="reg-email" label={t("auth.email")} required error={errors.email}>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              placeholder={t("auth.emailPlaceholder")}
              icon={<Mail className="size-4" strokeWidth={2} />}
              invalid={!!errors.email}
            />
          </Field>

          <Field
            id="reg-password"
            label={t("auth.password")}
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
              placeholder={t("register.passwordPlaceholder")}
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
            label={t("register.confirm")}
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
              placeholder={t("register.confirmPlaceholder")}
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
                  {t("register.acceptTermsPrefix")}{" "}
                  <Link
                    href="/cgv"
                    className="font-semibold text-tangerine-700 hover:underline"
                  >
                    {t("register.acceptTermsLink")}
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

          {errors.form ? (
            <p
              role="alert"
              className="rounded-md border border-red-600/30 bg-red-600/5 px-3 py-2 font-mono text-[11px] text-red-700"
            >
              {errors.form}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5",
              "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
              "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
              "transition-all duration-200 hover:-translate-y-0.5 hover:bg-tangerine-600",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            )}
          >
            {t("register.submit")}
            <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
          </button>
        </form>

        {/* Decorative divider */}
        <div className="mt-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-wood-300/60" />
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-wood-500">
            {t("auth.divider")}
          </span>
          <span className="h-px flex-1 bg-wood-300/60" />
        </div>

        <Link
          href="/catalogue"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-wood-300 bg-cream px-6 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-forest-900 transition-colors hover:border-forest-900 hover:bg-cream-deep"
        >
          {t("auth.guest")}
        </Link>
      </FormPanel>
    </main>
  );
}
