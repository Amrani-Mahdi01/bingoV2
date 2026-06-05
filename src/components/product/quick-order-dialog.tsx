"use client";

import * as React from "react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import ReCAPTCHA from "react-google-recaptcha";
import { Check, ChevronDown, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HttpError } from "@/lib/api/http";
import { ordersApi } from "@/lib/api/orders";
import { wilayasApi } from "@/lib/api/wilayas";
import { refreshPendingOrders } from "@/lib/hooks/usePendingOrders";
import { useFormatPrice, useLanguage } from "@/lib/i18n";
import type { Commune, Wilaya } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Algerian mobile validation — mirrors /commander exactly. */
const PHONE_RE = /^(\+213|0)\s?[2-7][0-9\s.\-]{7,12}$/;
const PHONE_NORMALIZED_RE = /^0[567]\d{8}$/;
function normalizeAlgerianPhone(raw: string): string {
  const cleaned = raw.replace(/[\s.\-]/g, "");
  if (cleaned.startsWith("+213")) return "0" + cleaned.slice(4);
  if (cleaned.startsWith("213")) return "0" + cleaned.slice(3);
  return cleaned;
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

/** Minimum merchandise total (DZD, shipping excluded) to place an order.
 *  Enforced here, on the Commander buttons, and on the backend. */
export const MIN_ORDER_DZD = 1000;

type Delivery = "home" | "stop";
type Errors = Partial<
  Record<"firstName" | "lastName" | "phone" | "wilaya" | "commune" | "recaptcha", string>
>;

/** One line to order, with the bits needed to display + submit it. */
export interface QuickOrderItem {
  productSlug: string;
  /** Free-text variant label for the order line (color · size), or null. */
  variantLabel: string | null;
  quantity: number;
  name: string;
  image: string;
  /** Effective unit price (base + variant delta). */
  unitPrice: number;
}

/**
 * Quick-order popup — the /commander checkout form in a dialog. Works for a
 * single product (product page) OR the whole cart (/commander) via `items`.
 * Posts the order through ordersApi.create, shows a success state with the
 * order number, and calls `onSuccess` (e.g. to clear the cart).
 */
export function QuickOrderDialog({
  items,
  open,
  onOpenChange,
  onSuccess,
  showCartLink = false,
}: {
  items: QuickOrderItem[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Fired once after a successful order (before the success screen shows). */
  onSuccess?: () => void;
  /** Show the "ou via le panier" footer link (product page only). */
  showCartLink?: boolean;
}) {
  const { t, lang } = useLanguage();
  const formatPrice = useFormatPrice();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [wilayaCode, setWilayaCode] = React.useState("");
  const [commune, setCommune] = React.useState("");
  const [delivery, setDelivery] = React.useState<Delivery>("home");

  const [errors, setErrors] = React.useState<Errors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [orderNumber, setOrderNumber] = React.useState<string | null>(null);

  const [recaptchaToken, setRecaptchaToken] = React.useState<string | null>(null);
  const recaptchaRef = React.useRef<ReCAPTCHA | null>(null);

  const [wilayas, setWilayas] = React.useState<Wilaya[] | null>(null);
  const [communes, setCommunes] = React.useState<Commune[]>([]);
  const [loadingCommunes, setLoadingCommunes] = React.useState(false);

  // Reset everything each time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    setFirstName("");
    setLastName("");
    setPhone("");
    setWilayaCode("");
    setCommune("");
    setDelivery("home");
    setErrors({});
    setServerError(null);
    setOrderNumber(null);
    setRecaptchaToken(null);
    recaptchaRef.current?.reset();
  }, [open]);

  // Load wilayas when the dialog first opens.
  React.useEffect(() => {
    if (!open || wilayas !== null) return;
    const ctrl = new AbortController();
    wilayasApi
      .list()
      .then((rows) => {
        if (ctrl.signal.aborted) return;
        setWilayas(rows.slice().sort((a, b) => a.code.localeCompare(b.code)));
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setWilayas([]);
      });
    return () => ctrl.abort();
  }, [open, wilayas]);

  const selectedWilaya = React.useMemo(
    () => (wilayas ?? []).find((w) => w.code === wilayaCode) ?? null,
    [wilayas, wilayaCode],
  );

  // Load communes whenever the picked wilaya changes.
  React.useEffect(() => {
    if (!selectedWilaya) {
      setCommunes([]);
      return;
    }
    const ctrl = new AbortController();
    setLoadingCommunes(true);
    wilayasApi
      .listCommunesPublic(selectedWilaya.id)
      .then((rows) => {
        if (!ctrl.signal.aborted) setCommunes(rows);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setCommunes([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoadingCommunes(false);
      });
    return () => ctrl.abort();
  }, [selectedWilaya]);

  const homeFee = selectedWilaya?.shippingPrice ?? null;
  const stopFee = selectedWilaya?.stopDeskPrice ?? null;
  const pickedFee = delivery === "home" ? homeFee : stopFee;
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const total = subtotal + (pickedFee ?? 0);
  const belowMin = subtotal < MIN_ORDER_DZD;
  const remaining = Math.max(0, MIN_ORDER_DZD - subtotal);

  const clearError = (k: keyof Errors) =>
    setErrors((p) => {
      if (!p[k]) return p;
      const n = { ...p };
      delete n[k];
      return n;
    });

  const validate = (): Errors => {
    const e: Errors = {};
    if (!firstName.trim()) e.firstName = t("checkout.error.firstName");
    if (!lastName.trim()) e.lastName = t("checkout.error.lastName");
    const phoneTrim = phone.trim();
    if (!phoneTrim) e.phone = t("checkout.error.phone");
    else if (
      !PHONE_RE.test(phoneTrim) ||
      !PHONE_NORMALIZED_RE.test(normalizeAlgerianPhone(phoneTrim))
    )
      e.phone = t("checkout.error.phoneInvalid");
    if (!wilayaCode) e.wilaya = t("checkout.error.wilaya");
    if (!commune) e.commune = t("checkout.error.commune");
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) e.recaptcha = t("checkout.error.recaptcha");
    return e;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting || items.length === 0 || belowMin) return;
    setServerError(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: normalizeAlgerianPhone(phone.trim()),
        },
        shipping: {
          wilayaId: wilayaCode,
          commune,
          // Structured choice — drives the server-side fee + the ZR parcel
          // delivery type. The note is kept for human-readable history.
          deliveryType: delivery === "stop" ? "stopdesk" : "home",
          notes: delivery === "stop" ? "Livraison stop desk" : "Livraison à domicile",
        },
        lines: items.map((it) => ({
          productSlug: it.productSlug,
          variant: it.variantLabel,
          quantity: it.quantity,
        })),
        recaptchaToken: recaptchaToken ?? undefined,
      });
      setOrderNumber(order.orderNumber);
      onSuccess?.();
      refreshPendingOrders();
    } catch (err) {
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
      let message =
        err instanceof Error && err.message ? err.message : t("checkout.error.server");
      const body = (err as { body?: unknown }).body as
        | { errors?: Record<string, string[]> }
        | undefined;
      if (body?.errors) {
        const lines: string[] = [];
        for (const [field, msgs] of Object.entries(body.errors)) {
          if (Array.isArray(msgs) && msgs[0]) lines.push(`${field}: ${msgs[0]}`);
        }
        if (lines.length) message = `${message} — ${lines.join(" · ")}`;
      }
      setServerError(message);
      if (!(err instanceof HttpError)) {
        console.error("[quick-order] order POST failed", err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (invalid?: boolean) =>
    cn(
      "h-11 w-full rounded-md border bg-cream px-3 font-mono text-[13px] text-wood-800 transition-colors",
      "placeholder:text-wood-500 focus:outline-none focus:ring-4 rtl:text-right",
      invalid
        ? "border-red-600 focus:border-red-700 focus:ring-red-600/15"
        : "border-wood-300 focus:border-tangerine-500 focus:ring-tangerine-500/15",
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100vw-1.5rem,34rem)] max-w-none border border-wood-300/60 bg-cream p-0 text-wood-800 sm:max-w-none">
        <div className="scrollbar-cream max-h-[88vh] overflow-y-auto px-5 py-5 sm:px-6">
          {orderNumber ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="inline-grid size-14 place-items-center rounded-full bg-forest-900 text-cream">
                <Check className="size-7" strokeWidth={2.4} />
              </span>
              <h2 className="font-display text-2xl font-bold tracking-[-0.01em] text-forest-900">
                {t("checkout.success.title")}
              </h2>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-wood-700">
                {t("checkout.success.subtitle")}
              </p>
              <div className="inline-flex items-baseline gap-2 rounded-full border border-wood-300/70 bg-cream-deep/40 px-5 py-2">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-wood-600">
                  {t("checkout.success.orderNumber")}
                </span>
                <span className="font-display text-base font-bold tracking-[-0.01em] text-forest-900">
                  {orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-6 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-tangerine-600"
              >
                {lang === "ar" ? "إغلاق" : "Fermer"}
              </button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-bold tracking-[-0.01em] text-forest-900">
                  {t("product.buyNow")}
                </DialogTitle>
              </DialogHeader>

              {/* Items recap */}
              <div className="scrollbar-cream mt-4 max-h-40 space-y-2.5 overflow-y-auto rounded-xl border border-wood-300/50 bg-cream-deep/30 p-3">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.image}
                      alt=""
                      aria-hidden
                      className="size-12 shrink-0 rounded-md object-cover ring-1 ring-wood-300/60"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[13px] font-semibold text-forest-900">
                        {it.name}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-wood-600">
                        {it.variantLabel ? `${it.variantLabel} · ` : ""}×{it.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-[13px] font-bold text-forest-900">
                      {formatPrice(it.unitPrice * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("register.firstName")} error={errors.firstName}>
                    <input
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        clearError("firstName");
                      }}
                      type="text"
                      autoComplete="given-name"
                      placeholder={t("register.firstNamePlaceholder")}
                      className={inputCls(!!errors.firstName)}
                    />
                  </Field>
                  <Field label={t("register.lastName")} error={errors.lastName}>
                    <input
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        clearError("lastName");
                      }}
                      type="text"
                      autoComplete="family-name"
                      placeholder={t("register.lastNamePlaceholder")}
                      className={inputCls(!!errors.lastName)}
                    />
                  </Field>
                </div>

                <Field label={t("checkout.phone")} error={errors.phone}>
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      clearError("phone");
                    }}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder={t("checkout.phone.placeholder")}
                    className={inputCls(!!errors.phone)}
                  />
                </Field>

                <Field label={t("checkout.wilaya")} error={errors.wilaya}>
                  <SelectShell disabled={wilayas === null || wilayas.length === 0}>
                    <select
                      value={wilayaCode}
                      onChange={(e) => {
                        setWilayaCode(e.target.value);
                        setCommune("");
                        clearError("wilaya");
                        clearError("commune");
                      }}
                      className={cn(
                        inputCls(!!errors.wilaya),
                        "cursor-pointer appearance-none pe-10",
                        "disabled:cursor-not-allowed disabled:bg-cream-deep/40 disabled:text-wood-400 disabled:opacity-70",
                      )}
                      disabled={wilayas === null || wilayas.length === 0}
                    >
                      <option value="">
                        {wilayas === null
                          ? lang === "ar" ? "تحميل…" : "Chargement…"
                          : t("checkout.wilaya.placeholder")}
                      </option>
                      {(wilayas ?? []).map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} · {lang === "ar" && w.nameAr ? w.nameAr : w.name}
                        </option>
                      ))}
                    </select>
                  </SelectShell>
                </Field>

                <Field label={t("checkout.commune")} error={errors.commune}>
                  <SelectShell
                    disabled={
                      loadingCommunes || !selectedWilaya || communes.length === 0
                    }
                  >
                    <select
                      value={commune}
                      onChange={(e) => {
                        setCommune(e.target.value);
                        clearError("commune");
                      }}
                      className={cn(
                        inputCls(!!errors.commune),
                        "cursor-pointer appearance-none pe-10",
                        "disabled:cursor-not-allowed disabled:bg-cream-deep/40 disabled:text-wood-400 disabled:opacity-70",
                      )}
                      disabled={loadingCommunes || !selectedWilaya || communes.length === 0}
                    >
                      <option value="">
                        {loadingCommunes
                          ? lang === "ar" ? "تحميل…" : "Chargement…"
                          : communes.length
                            ? t("checkout.commune.placeholder")
                            : t("checkout.commune.placeholderEmpty")}
                      </option>
                      {communes.map((c) => (
                        <option key={c.id} value={c.name}>
                          {lang === "ar" && c.nameAr ? c.nameAr : c.name}
                        </option>
                      ))}
                    </select>
                  </SelectShell>
                </Field>

                {/* Delivery method */}
                <div className="grid grid-cols-2 gap-2.5">
                  <DeliveryOption
                    active={delivery === "home"}
                    onSelect={() => setDelivery("home")}
                    title={t("checkout.delivery.home.title")}
                    price={homeFee}
                    formatPrice={formatPrice}
                  />
                  <DeliveryOption
                    active={delivery === "stop"}
                    onSelect={() => setDelivery("stop")}
                    title={t("checkout.delivery.stop.title")}
                    price={stopFee}
                    formatPrice={formatPrice}
                  />
                </div>

                {RECAPTCHA_SITE_KEY ? (
                  <div className="mt-1">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      hl={lang === "ar" ? "ar" : "fr"}
                      onChange={(token) => {
                        setRecaptchaToken(token);
                        if (token) clearError("recaptcha");
                      }}
                      onExpired={() => setRecaptchaToken(null)}
                      onErrored={() => setRecaptchaToken(null)}
                    />
                    {errors.recaptcha ? (
                      <p className="mt-1 font-mono text-[10.5px] text-red-700">
                        {errors.recaptcha}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Totals */}
                <dl className="mt-1 space-y-1.5 border-t border-wood-300/40 pt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-wood-700">
                  <Row label={t("checkout.summary.subtotal")} value={formatPrice(subtotal)} />
                  <Row label={t("checkout.summary.shipping")} value={pickedFee != null ? formatPrice(pickedFee) : "—"} />
                  <div className="flex items-baseline justify-between border-t border-wood-300/40 pt-2 font-display text-base font-bold normal-case tracking-[-0.01em] text-forest-900">
                    <span>{t("checkout.summary.total")}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </dl>

                {belowMin ? (
                  <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                    {lang === "ar"
                      ? `الحد الأدنى للطلب ${formatPrice(MIN_ORDER_DZD)}. أضف ${formatPrice(remaining)} لإتمام الطلب.`
                      : `Commande minimum ${formatPrice(MIN_ORDER_DZD)}. Ajoutez encore ${formatPrice(remaining)} pour commander.`}
                  </p>
                ) : null}

                {serverError ? (
                  <p
                    role="alert"
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
                  >
                    {serverError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || items.length === 0 || belowMin}
                  className={cn(
                    "mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-tangerine-500 px-6 py-3.5",
                    "font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cream",
                    "shadow-[0_10px_28px_-10px_rgba(234,108,29,0.55)] transition-all duration-200",
                    "hover:bg-tangerine-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/40",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" strokeWidth={2.2} />
                      {t("checkout.submitting")}
                    </>
                  ) : (
                    <>
                      {t("checkout.submit")} · {formatPrice(total)}
                    </>
                  )}
                </button>

                {showCartLink ? (
                  <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-wood-500">
                    <Link href="/commander" className="underline-offset-2 hover:text-tangerine-700 hover:underline">
                      {lang === "ar" ? "أو عبر السلة" : "ou via le panier"}
                    </Link>
                  </p>
                ) : null}
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Wraps a native <select> to show a branded chevron in place of the
 *  browser's default arrow (the select uses appearance-none + pe-10).
 *  When `disabled`, the chevron greys out to match the muted control. */
function SelectShell({
  disabled,
  children,
}: {
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute end-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md",
          disabled ? "bg-wood-200 text-wood-400" : "bg-forest-900 text-cream",
        )}
      >
        <ChevronDown className="size-4" strokeWidth={2.4} />
      </span>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-wood-700">
        {label}
        <span className="ms-1 text-tangerine-700">*</span>
      </span>
      {children}
      {error ? (
        <span role="alert" className="font-mono text-[10.5px] text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function DeliveryOption({
  active,
  onSelect,
  title,
  price,
  formatPrice,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  price: number | null;
  formatPrice: (n: number) => string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition-all duration-200",
        active
          ? "border-forest-900 bg-cream shadow-[0_8px_24px_-12px_rgba(31,58,30,0.25)]"
          : "border-wood-300 bg-cream/60 hover:border-wood-500",
      )}
    >
      <span className="font-display text-[13px] font-semibold text-forest-900">{title}</span>
      <span className="font-display text-sm font-bold text-tangerine-700">
        {price != null ? formatPrice(price) : "—"}
      </span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt>{label}</dt>
      <dd className="font-display text-[13px] font-semibold normal-case tracking-normal text-forest-900">
        {value}
      </dd>
    </div>
  );
}
