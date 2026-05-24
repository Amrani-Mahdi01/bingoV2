"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

import { WILAYAS } from "@/lib/algeria";
import { useCart } from "@/lib/cart";
import { useFormatPrice, useLanguage, useProductName } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Delivery = "home" | "stop";

const DELIVERY_FEE: Record<Delivery, number> = {
  home: 800,
  stop: 400,
};

// Algerian phone: starts with +213 or 0, then 2-7 (landline 2-4 /
// mobile 5-7), then 7-12 more digits/separators.
const PHONE_RE = /^(\+213|0)\s?[2-7][0-9\s.\-]{7,12}$/;

type FormErrors = Partial<
  Record<"firstName" | "lastName" | "phone" | "wilayaCode" | "commune", string>
>;

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { items, subtotal, itemCount, clear } = useCart();
  const formatPrice = useFormatPrice();
  const productName = useProductName();

  // Shipping form state
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [wilayaCode, setWilayaCode] = React.useState("");
  const [commune, setCommune] = React.useState("");
  const [delivery, setDelivery] = React.useState<Delivery>("home");

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitted, setSubmitted] = React.useState(false);

  const selectedWilaya = WILAYAS.find((w) => w.code === wilayaCode);
  const communes = selectedWilaya?.communes ?? [];

  const deliveryFee = DELIVERY_FEE[delivery];
  const total = subtotal + (items.length > 0 ? deliveryFee : 0);

  // Clear a field's error as soon as the user touches it again.
  const clearError = React.useCallback((field: keyof FormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = React.useCallback((): FormErrors => {
    const e: FormErrors = {};
    if (!firstName.trim()) e.firstName = t("checkout.error.firstName");
    if (!lastName.trim()) e.lastName = t("checkout.error.lastName");
    if (!phone.trim()) {
      e.phone = t("checkout.error.phone");
    } else if (!PHONE_RE.test(phone.trim())) {
      e.phone = t("checkout.error.phoneInvalid");
    }
    if (!wilayaCode) e.wilayaCode = t("checkout.error.wilaya");
    if (!commune) e.commune = t("checkout.error.commune");
    return e;
  }, [firstName, lastName, phone, wilayaCode, commune, t]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // TODO: POST the order to the backend
    setSubmitted(true);
    clear();
  };

  if (submitted) {
    return (
      <main className="flex flex-1 flex-col bg-cream py-20 md:py-28">
        <div className="mx-auto w-full max-w-2xl px-6 text-center md:px-10">
          <span className="inline-grid size-14 place-items-center rounded-full bg-forest-900 text-cream">
            <Check className="size-7" strokeWidth={2.4} />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-[-0.02em] text-forest-900 sm:text-4xl">
            {t("checkout.success.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-wood-700 sm:text-base">
            {t("checkout.success.subtitle")}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-6 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-colors hover:bg-tangerine-600"
          >
            {t("checkout.back")}
            <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-cream py-12 pb-24 md:py-16 lg:pb-16">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-700 transition-colors hover:text-tangerine-700"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" strokeWidth={2.2} />
          {t("checkout.back")}
        </Link>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-[-0.02em] text-forest-900 rtl:pb-1 rtl:leading-[1.25] sm:text-4xl md:text-[2.5rem]">
          {t("checkout.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wood-700 sm:text-base">
          {itemCount > 0
            ? t("checkout.subtitle", { n: itemCount })
            : t("checkout.subtitleEmpty")}
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
          {/* ─── Left: Shipping form ──────────────────────────── */}
          <form
            id="checkout-form"
            onSubmit={onSubmit}
            noValidate
            className="order-2 flex flex-col gap-8 lg:order-1"
          >
            {/* Shipping info — contact + address in one block */}
            <section className="rounded-2xl border border-wood-300/50 bg-cream-deep/30 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-forest-900 sm:text-xl">
                {t("checkout.shipping.title")}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label={t("register.firstName")}
                  required
                  error={errors.firstName}
                >
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      clearError("firstName");
                    }}
                    type="text"
                    autoComplete="given-name"
                    aria-invalid={!!errors.firstName}
                    className={inputClass(!!errors.firstName)}
                  />
                </Field>
                <Field
                  id="lastName"
                  label={t("register.lastName")}
                  required
                  error={errors.lastName}
                >
                  <input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      clearError("lastName");
                    }}
                    type="text"
                    autoComplete="family-name"
                    aria-invalid={!!errors.lastName}
                    className={inputClass(!!errors.lastName)}
                  />
                </Field>
                <Field
                  id="phone"
                  label={t("checkout.phone")}
                  required
                  error={errors.phone}
                  className="sm:col-span-2"
                >
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearError("phone");
                    }}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={t("checkout.phone.placeholder")}
                    maxLength={20}
                    aria-invalid={!!errors.phone}
                    className={inputClass(!!errors.phone)}
                  />
                </Field>
                <Field
                  id="wilaya"
                  label={t("checkout.wilaya")}
                  required
                  error={errors.wilayaCode}
                >
                  <Combobox
                    id="wilaya"
                    value={wilayaCode}
                    onChange={(v) => {
                      setWilayaCode(v);
                      setCommune("");
                      clearError("wilayaCode");
                      clearError("commune");
                    }}
                    options={WILAYAS.map((w) => ({
                      value: w.code,
                      label: `${w.code} · ${w.name}`,
                    }))}
                    placeholder={t("checkout.wilaya.placeholder")}
                    error={!!errors.wilayaCode}
                  />
                </Field>
                <Field
                  id="commune"
                  label={t("checkout.commune")}
                  required
                  error={errors.commune}
                >
                  <Combobox
                    id="commune"
                    value={commune}
                    onChange={(v) => {
                      setCommune(v);
                      clearError("commune");
                    }}
                    options={communes.map((c) => ({ value: c, label: c }))}
                    placeholder={
                      communes.length
                        ? t("checkout.commune.placeholder")
                        : t("checkout.commune.placeholderEmpty")
                    }
                    disabled={communes.length === 0}
                    error={!!errors.commune}
                  />
                </Field>
              </div>
            </section>

            {/* Delivery method */}
            <section className="rounded-2xl border border-wood-300/50 bg-cream-deep/30 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-forest-900 sm:text-xl">
                {t("checkout.delivery.title")}
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DeliveryOption
                  active={delivery === "home"}
                  onSelect={() => setDelivery("home")}
                  icon={<Truck className="size-5" strokeWidth={1.8} />}
                  title={t("checkout.delivery.home.title")}
                  description={t("checkout.delivery.home.description")}
                  price={DELIVERY_FEE.home}
                />
                <DeliveryOption
                  active={delivery === "stop"}
                  onSelect={() => setDelivery("stop")}
                  icon={<Store className="size-5" strokeWidth={1.8} />}
                  title={t("checkout.delivery.stop.title")}
                  description={t("checkout.delivery.stop.description")}
                  price={DELIVERY_FEE.stop}
                />
              </div>
            </section>

            {/* Submit (desktop) */}
            <button
              type="submit"
              disabled={items.length === 0}
              className={cn(
                "hidden items-center justify-center gap-2 rounded-full px-6 py-4 lg:inline-flex",
                "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
                "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
                "transition-all duration-200",
                items.length === 0
                  ? "cursor-not-allowed bg-wood-400"
                  : "bg-tangerine-500 hover:-translate-y-0.5 hover:bg-tangerine-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40"
              )}
            >
              {t("checkout.submit")} · {formatPrice(total)}
              <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
            </button>
          </form>

          {/* ─── Right: Order summary (shown first on mobile) ──── */}
          <aside className="order-1 self-start rounded-2xl border border-wood-300/50 bg-cream-deep/30 p-5 lg:sticky lg:top-32 lg:order-2 sm:p-6">
            <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-forest-900 sm:text-xl">
              {t("checkout.summary.title")}
            </h2>

            {items.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
                <ShoppingBag className="size-8 text-wood-400" strokeWidth={1.5} />
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wood-600">
                  {t("checkout.summary.empty")}
                </p>
                <Link
                  href="/catalogue"
                  className="mt-2 font-display text-sm font-semibold text-tangerine-700 underline-offset-4 hover:underline"
                >
                  {t("checkout.summary.browse")}
                </Link>
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-wood-300/40">
                {items.map(({ product, qty }) => (
                  <li
                    key={product.slug}
                    className="flex gap-2.5 py-3 first:pt-0 last:pb-0 sm:gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="size-12 shrink-0 rounded-md object-cover ring-1 ring-wood-300/60 sm:size-14"
                    />
                    {/* Body — stacks vertically on narrow widths so the
                        price drops below the text instead of squeezing
                        the title. Flips to a row on sm+ with the price
                        anchored to the right. */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                      <div className="flex min-w-0 flex-1 flex-col leading-tight">
                        <p className="truncate font-display text-[12px] font-semibold text-forest-900 sm:text-[13px]">
                          {productName(product)}
                        </p>
                        <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-wood-600 sm:text-[10px] sm:tracking-[0.16em]">
                          {product.categorySlug
                            ? t(`category.${product.categorySlug}`)
                            : product.brand}
                        </p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-wood-700 sm:text-[10.5px]">
                          {t("checkout.summary.qty", { n: qty })}
                        </p>
                      </div>
                      <span className="whitespace-nowrap font-display text-[13px] font-semibold text-forest-900 sm:shrink-0 sm:self-start">
                        {formatPrice(product.price * qty)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <dl className="mt-5 space-y-2 border-t border-wood-300/40 pt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-wood-700">
              <SummaryRow label={t("checkout.summary.subtotal")} value={formatPrice(subtotal)} />
              <SummaryRow
                label={t("checkout.summary.shipping")}
                value={items.length > 0 ? formatPrice(deliveryFee) : "—"}
              />
              <div className="flex items-baseline justify-between border-t border-wood-300/40 pt-3 font-display text-base font-bold tracking-[-0.01em] text-forest-900">
                <span>{t("checkout.summary.total")}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </dl>
          </aside>
        </div>
      </div>

      {/* Mobile-only sticky submit */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-wood-300/40 bg-cream/95 backdrop-blur-md shadow-[0_-8px_24px_-12px_rgba(31,58,30,0.18)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-col">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-wood-600">
              {t("checkout.summary.total")}
            </span>
            <span className="font-display text-base font-bold text-forest-900">
              {formatPrice(total)}
            </span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={items.length === 0}
            className={cn(
              "ms-auto inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3",
              "font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-cream",
              "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)]",
              "transition-colors duration-200",
              items.length === 0
                ? "cursor-not-allowed bg-wood-400"
                : "bg-tangerine-500 hover:bg-tangerine-600"
            )}
          >
            {t("checkout.submitShort")}
            <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </main>
  );
}

/* ───── Helpers ───────────────────────────────────────────────── */

const INPUT_BASE = [
  "h-11 w-full rounded-md border bg-cream px-3",
  "font-mono text-[13px] text-wood-800 placeholder:text-wood-500",
  // Numeric placeholders default to LTR-like rendering and end up
  // left-aligned in RTL contexts — force right-alignment so AR users
  // see the placeholder + typed digits start from the right edge.
  "rtl:text-right",
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

/* ───── Combobox — custom dropdown (no native <select>).
        Cream trigger that opens a panel of options below. Scrollable,
        click-outside / ESC closes, chevron rotates when open. ───── */
type ComboOption = { value: string; label: string };

function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: ComboOption[];
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-md border bg-cream ps-3 pe-1.5 text-start",
          "font-mono text-[13px] transition-[border-color,box-shadow] duration-200",
          "focus-visible:outline-none",
          disabled
            ? "cursor-not-allowed border-wood-300 text-wood-500 opacity-60"
            : error
              ? "border-red-600 text-wood-800 focus-visible:border-red-700 focus-visible:ring-4 focus-visible:ring-red-600/15"
              : open
                ? "border-tangerine-500 text-wood-800 ring-4 ring-tangerine-500/15"
                : "border-wood-300 text-wood-800 hover:border-wood-500 focus-visible:border-tangerine-500 focus-visible:ring-4 focus-visible:ring-tangerine-500/15"
        )}
      >
        <span
          className={cn("truncate", !selected && "text-wood-500")}
        >
          {selected?.label ?? placeholder}
        </span>
        <span
          aria-hidden
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md text-cream transition-all duration-200",
            disabled
              ? "bg-wood-400"
              : open
                ? "bg-tangerine-500"
                : "bg-forest-900"
          )}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              open && "rotate-180"
            )}
            strokeWidth={2.4}
          />
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-wood-300 bg-cream shadow-[0_18px_40px_-14px_rgba(31,58,30,0.3)]"
        >
          <ul className="max-h-[260px] overflow-y-auto py-1">
            {options.length === 0 ? (
              <li className="px-3 py-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-wood-500">
                {t("combobox.noOptions")}
              </li>
            ) : (
              options.map((opt) => {
                const active = opt.value === value;
                return (
                  <li key={opt.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start font-mono text-[13px] transition-colors",
                        active
                          ? "bg-forest-900 text-cream"
                          : "text-wood-800 hover:bg-cream-deep hover:text-forest-900"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {active ? (
                        <Check
                          className="size-4 shrink-0 text-tangerine-300"
                          strokeWidth={2.4}
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

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
  const errorId = error ? `${id}-error` : undefined;
  return (
    <label
      htmlFor={id}
      className={cn("flex flex-col gap-1.5", className)}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-wood-700">
        {label}
        {required ? <span className="ms-1 text-tangerine-700">*</span> : null}
      </span>
      {children}
      {error ? (
        <span
          id={errorId}
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

function DeliveryOption({
  active,
  onSelect,
  icon,
  title,
  description,
  price,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  price: number;
}) {
  const formatPrice = useFormatPrice();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border p-4 text-start",
        "transition-all duration-200",
        active
          ? "border-forest-900 bg-cream shadow-[0_8px_24px_-12px_rgba(31,58,30,0.25)]"
          : "border-wood-300 bg-cream/60 hover:border-wood-500 hover:bg-cream",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500"
      )}
    >
      <span className="flex w-full items-center justify-between">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-full",
            active
              ? "bg-forest-900 text-cream"
              : "bg-cream-deep text-forest-900"
          )}
        >
          {icon}
        </span>
        <span className="font-display text-sm font-bold text-tangerine-700">
          {formatPrice(price)}
        </span>
      </span>
      <span className="font-display text-sm font-semibold text-forest-900">
        {title}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-wood-600">
        {description}
      </span>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt>{label}</dt>
      <dd className="font-display text-[13px] font-semibold normal-case tracking-normal text-forest-900">
        {value}
      </dd>
    </div>
  );
}
