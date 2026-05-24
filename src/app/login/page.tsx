"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Compass,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  Mountain,
  Package,
} from "lucide-react";

import { ApiError, AUTH_ENABLED } from "@/lib/api-client";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails that should authenticate against the admin guard instead of
 *  the customer guard. Extend as more admin accounts come online. */
const ADMIN_EMAILS = new Set(["admin@admin.com"]);
function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

type Errors = Partial<Record<"email" | "password" | "form", string>>;

export default function LoginPage() {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const { login: adminLogin } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
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
    if (!email.trim()) e.email = t("login.error.emailMissing");
    else if (!EMAIL_RE.test(email.trim())) e.email = t("login.error.emailInvalid");
    if (!password) e.password = t("login.error.passwordMissing");
    else if (password.length < 6) e.password = t("login.error.passwordShort");
    return e;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Auth is feature-gated off until the backend is live in production.
    // Validate locally so the UI still feels responsive, then show a
    // "coming soon" message instead of firing the API request.
    if (!AUTH_ENABLED) {
      setErrors({
        form:
          lang === "ar"
            ? "تسجيل الحسابات سيكون متاحاً قريباً."
            : "La connexion sera disponible prochainement.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const trimmed = email.trim();
      if (isAdminEmail(trimmed)) {
        await adminLogin(trimmed, password);
        router.push("/admin");
      } else {
        await login(trimmed, password);
        router.push("/");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Laravel returns { errors: { field: [msg, …] } } for 422.
        const fieldErrors: Errors = {};
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
      {/* ───── Brand panel — desktop only ───── */}
      <BrandPanel
        eyebrow={t("login.brand.eyebrow")}
        title={
          <>
            {t("login.brand.title1")}
            <br />
            {t("login.brand.title2")}
          </>
        }
        lead={t("login.brand.lead")}
        bullets={[
          { Icon: Package, text: t("login.brand.bullet1") },
          { Icon: Heart, text: t("login.brand.bullet2") },
          { Icon: Compass, text: t("login.brand.bullet3") },
        ]}
      />

      {/* ───── Form panel ───── */}
      <FormPanel>
        <header className="text-center lg:text-start">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
            {t("login.eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-4xl">
            {t("login.title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-wood-700">
            {t("login.noAccount")}{" "}
            <Link
              href="/register"
              className="font-semibold text-tangerine-700 underline-offset-4 hover:text-tangerine-600 hover:underline"
            >
              {t("login.createAccount")}
            </Link>
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
          <Field id="login-email" label={t("auth.email")} required error={errors.email}>
            <Input
              id="login-email"
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
            id="login-password"
            label={t("auth.password")}
            required
            error={errors.password}
          >
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              placeholder="••••••••"
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

          <CheckRow
            checked={remember}
            onChange={setRemember}
            label={t("login.remember")}
          />

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
            {t("login.submit")}
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

        {/* Guest checkout option */}
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

/* ───── Shared shell: brand panel (left) ──────────────────────── */

type Bullet = {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
};

export function BrandPanel({
  eyebrow,
  title,
  lead,
  bullets,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  bullets: Bullet[];
}) {
  const { t } = useLanguage();
  return (
    <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-forest-900 p-10 text-cream lg:flex lg:w-[44%] xl:w-[40%] xl:p-14">
      {/* Tangerine hairline at the top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-tangerine-500/50 to-transparent"
      />

      {/* Topographic rings — far corner */}
      <svg
        aria-hidden
        viewBox="0 0 600 600"
        fill="none"
        className="pointer-events-none absolute -end-40 -top-40 size-[640px] text-tangerine-300 opacity-[0.10]"
      >
        {[180, 220, 260, 300, 340, 380, 420, 460, 500].map((r) => (
          <circle
            key={r}
            cx="300"
            cy="300"
            r={r}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* Wavy contour lines — bottom corner */}
      <svg
        aria-hidden
        viewBox="0 0 700 280"
        fill="none"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-10 -start-12 h-72 w-[720px] text-cream opacity-[0.08]"
      >
        {[0, 18, 36, 56, 78, 102].map((dy, i) => (
          <path
            key={i}
            d={`M -20 ${140 + dy} Q 120 ${100 + dy} 250 ${135 + dy} T 520 ${130 + dy} T 820 ${140 + dy}`}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* Soft tangerine radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(234,108,29,0.10),transparent_60%)]"
      />

      {/* Top: brand */}
      <Link
        href="/"
        aria-label={t("brand.home")}
        className="relative z-10 flex w-fit items-center gap-2"
      >
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-md bg-cream text-forest-900"
        >
          <Mountain className="size-5" strokeWidth={2.2} />
        </span>
        <span className="flex items-baseline font-display text-[24px] font-bold leading-none tracking-[-0.04em]">
          BINGO
          <span
            aria-hidden
            className="ms-0.5 size-1.5 rounded-full bg-tangerine-400"
          />
        </span>
      </Link>

      {/* Middle: copy + bullets */}
      <div className="relative z-10 max-w-md">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-tangerine-300">
          {eyebrow}
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold leading-[1] tracking-[-0.03em] rtl:pb-1 rtl:leading-[1.2] xl:text-5xl">
          {title}
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/75 xl:text-base">
          {lead}
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {bullets.map(({ Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 text-sm text-cream/85"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-forest-800 text-tangerine-300">
                <Icon className="size-3.5" strokeWidth={2} />
              </span>
              <span className="font-display">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: signature */}
      <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.22em] text-cream/45">
        {t("auth.brandSignature")}
      </p>
    </aside>
  );
}

/* ───── Form panel (right) ─────────────────────────────────────── */

export function FormPanel({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <section className="flex flex-1 items-center justify-center bg-cream px-6 py-12 sm:px-10 md:py-20">
      <div className="w-full max-w-md">
        {/* Mobile brand — only when the side panel is hidden */}
        <Link
          href="/"
          aria-label={t("brand.home")}
          className="mx-auto mb-10 flex w-fit items-center gap-2 lg:hidden"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-md bg-forest-900 text-cream"
          >
            <Mountain className="size-4" strokeWidth={2.2} />
          </span>
          <span className="flex items-baseline font-display text-[22px] font-bold leading-none tracking-[-0.04em] text-forest-900">
            BINGO
            <span
              aria-hidden
              className="ms-0.5 size-1.5 rounded-full bg-tangerine-500"
            />
          </span>
        </Link>

        {children}
      </div>
    </section>
  );
}

/* ───── Field + input helpers ──────────────────────────────────── */

export function Field({
  id,
  label,
  required,
  error,
  trailingLabel,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  trailingLabel?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-wood-700"
        >
          {label}
          {required ? (
            <span className="ms-1 text-tangerine-700">*</span>
          ) : null}
        </label>
        {trailingLabel}
      </div>
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
    </div>
  );
}

export function Input({
  icon,
  trailing,
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <div className="relative flex items-center">
      {icon ? (
        <span className="pointer-events-none absolute start-3 text-wood-600">
          {icon}
        </span>
      ) : null}
      <input
        {...props}
        aria-invalid={invalid}
        className={cn(
          "h-12 w-full rounded-lg border bg-cream",
          icon ? "ps-10" : "ps-3",
          trailing ? "pe-11" : "pe-3",
          "font-mono text-[13px] text-wood-800 placeholder:text-wood-500",
          "transition-[border-color,box-shadow,background-color] duration-200",
          "focus:outline-none focus:ring-4",
          invalid
            ? "border-red-600 focus:border-red-700 focus:ring-red-600/15"
            : "border-wood-300 hover:border-wood-400 focus:border-tangerine-500 focus:ring-tangerine-500/15",
          className
        )}
      />
      {trailing ? (
        <span className="absolute end-1.5">{trailing}</span>
      ) : null}
    </div>
  );
}

export function PasswordToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? t("auth.password.hide") : t("auth.password.show")}
      className="grid size-8 place-items-center rounded-md text-wood-700 transition-colors hover:bg-wood-100 hover:text-forest-900"
    >
      {shown ? (
        <EyeOff className="size-4" strokeWidth={1.8} />
      ) : (
        <Eye className="size-4" strokeWidth={1.8} />
      )}
    </button>
  );
}

export function CheckRow({
  checked,
  onChange,
  label,
  hasError,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  hasError?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1">
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded border transition-colors",
          checked
            ? "border-forest-900 bg-forest-900 text-cream"
            : "border-wood-400 bg-cream",
          hasError && !checked && "border-red-600"
        )}
      >
        {checked ? <Check className="size-2.5" strokeWidth={3.5} /> : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-display text-[13px] text-wood-700">{label}</span>
    </label>
  );
}
