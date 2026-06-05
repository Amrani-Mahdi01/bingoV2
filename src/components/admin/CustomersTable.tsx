"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Mono } from "@/components/ui/typography";
import {
  customersApi,
  type ApiCustomerRow,
  type CustomerTypeFilter,
} from "@/lib/api/customers";
import { formatDZD } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * Shared customers table used by both /admin/customers/accounts
 * (registered users — including those who haven't ordered) and
 * /admin/customers/guests (anonymous checkouts). The two pages just
 * pass different copy + a fixed `kind`; backend filter `?type=` does
 * the actual separation.
 */
type Kind = "registered" | "guest";

interface CopyBundle {
  eyebrow: string;
  title: string;
  /** Inserted into the subtitle: "X clients ${subtitleSuffix}". */
  subtitleSuffix: string;
  emptyMessage: string;
  searchPlaceholder?: string;
}

const COPY: Record<Kind, CopyBundle> = {
  registered: {
    eyebrow: "CRM",
    title: "Clients avec compte",
    subtitleSuffix: "inscrit(s) sur la boutique",
    emptyMessage:
      "Aucun client inscrit pour l'instant. Les comptes créés depuis la page d'inscription apparaîtront ici, même sans commande.",
    searchPlaceholder: "Nom, téléphone, email…",
  },
  guest: {
    eyebrow: "CRM",
    title: "Commandes invité",
    subtitleSuffix: "ayant commandé sans compte",
    emptyMessage:
      "Aucune commande invité pour l'instant. Les commandes passées sans création de compte apparaîtront ici.",
    searchPlaceholder: "Nom, téléphone, email…",
  },
};

export function CustomersTable({ kind }: { kind: Kind }) {
  const copy = COPY[kind];
  // Backend filter: each page is fixed to one type — no dropdown.
  const typeFilter: CustomerTypeFilter =
    kind === "registered" ? "registered" : "guest";

  const [rows, setRows] = React.useState<ApiCustomerRow[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Row-action modal state — only one open at a time; the customer
  // object is captured at open-time so closing won't lose context.
  const [blockFor, setBlockFor] = React.useState<ApiCustomerRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.list({
        q: search.trim() || undefined,
        type: typeFilter,
      });
      setRows(res.data);
      setError(null);
    } catch {
      setError("Impossible de charger les clients.");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const totals = React.useMemo(() => {
    if (!rows) return null;
    return {
      count: rows.length,
      orders: rows.reduce((s, r) => s + r.orderCount, 0),
      revenue: rows.reduce((s, r) => s + r.totalSpent, 0),
    };
  }, [rows]);

  return (
    <>
      <AdminPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={
          rows === null
            ? "Chargement…"
            : `${rows.length} client${rows.length > 1 ? "s" : ""} ${copy.subtitleSuffix}`
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Actualiser
          </Button>
        }
      />

      {totals ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <KpiCard
            icon={Users}
            label={kind === "registered" ? "Comptes" : "Invités"}
            value={String(totals.count)}
          />
          <KpiCard
            icon={ShoppingBag}
            label="Commandes (total)"
            value={String(totals.orders)}
          />
          <KpiCard
            icon={Wallet}
            label="Revenu cumulé"
            value={formatDZD(totals.revenue, "fr")}
          />
        </div>
      ) : null}

      <div className="mb-3 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-9 rounded-md border-zinc-200 bg-white pl-9 text-xs md:text-xs"
          />
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Mobile (< md): card list — same pattern as /admin/orders. */}
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200 bg-white md:hidden">
        {rows === null ? (
          <li className="px-4 py-10 text-center text-xs text-zinc-500">
            Chargement…
          </li>
        ) : rows.length === 0 ? (
          <li className="px-4 py-10 text-center text-xs text-zinc-500">
            {copy.emptyMessage}
          </li>
        ) : (
          rows.map((c) => (
            <li
              key={c.phone || `cust-${c.customerId ?? "?"}`}
              className="flex flex-col gap-1.5 px-3 py-2.5"
            >
              {/* Name + account/guest pill + actions */}
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-xs font-semibold text-zinc-900">
                      {c.firstName} {c.lastName}
                    </p>
                    {c.isRegistered ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0 font-mono text-[9px] font-medium text-blue-700">
                        <span className="size-1 rounded-full bg-blue-500" />
                        Compte
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0 font-mono text-[9px] font-medium text-zinc-600">
                        <span className="size-1 rounded-full bg-zinc-400" />
                        Invité
                      </span>
                    )}
                  </div>
                  {c.email ? (
                    <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                      {c.email}
                    </p>
                  ) : null}
                </div>
                <CustomerRowActions
                  customer={c}
                  onBlockIp={() => setBlockFor(c)}
                />
              </div>

              {/* Phone + wilaya */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    dir="ltr"
                    className="font-mono text-zinc-700 hover:text-blue-700"
                  >
                    {c.phone}
                  </a>
                ) : (
                  <span className="italic text-zinc-400">Sans téléphone</span>
                )}
                {c.wilayaName ? (
                  <span className="text-zinc-500">{c.wilayaName}</span>
                ) : null}
              </div>

              {/* IP + blocked badge */}
              {c.latestIp ? (
                <div className="flex items-center gap-1.5" dir="ltr">
                  <span className="font-mono text-[10px] text-zinc-600">
                    {c.latestIp}
                  </span>
                  {c.ipBlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0 font-mono text-[9px] font-medium text-red-700">
                      <span className="size-1 rounded-full bg-red-500" />
                      Bloquée
                    </span>
                  ) : null}
                </div>
              ) : null}

              {/* Order count + total + last order */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <span className="text-zinc-500">
                  {c.orderCount} commande{c.orderCount > 1 ? "s" : ""}
                  {c.lastOrderAt
                    ? ` · ${new Date(c.lastOrderAt).toLocaleDateString("fr-DZ")}`
                    : ""}
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
                  {c.orderCount > 0
                    ? formatDZD(c.totalSpent, "fr")
                    : "—"}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="hidden overflow-hidden rounded-md border border-zinc-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Wilaya</th>
                <th className="px-4 py-3 font-medium">Dernière IP</th>
                <th className="px-4 py-3 font-medium text-right">Commandes</th>
                <th className="px-4 py-3 font-medium text-right">Total dépensé</th>
                <th className="px-4 py-3 font-medium">Dernière</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                    Chargement…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    {copy.emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr
                    // Phone may be empty for accounts that signed up
                    // via email only; fall back to the customer id so
                    // multiple phone-less rows don't collide on key="".
                    key={c.phone || `cust-${c.customerId ?? "?"}`}
                    className="border-t border-zinc-100 hover:bg-zinc-50/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-zinc-900">
                          {c.firstName} {c.lastName}
                        </p>
                        {c.isRegistered ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-700"
                            title="Client avec un compte"
                          >
                            <span className="size-1.5 rounded-full bg-blue-500" />
                            Compte
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600"
                            title="A commandé sans créer de compte"
                          >
                            <span className="size-1.5 rounded-full bg-zinc-400" />
                            Invité
                          </span>
                        )}
                      </div>
                      {c.email ? (
                        <p className="mt-0.5 text-2xs text-zinc-500">{c.email}</p>
                      ) : null}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 font-mono text-2xs text-zinc-700"
                      dir="ltr"
                    >
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="hover:text-blue-700">
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-2xs italic text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {c.wilayaName ?? (
                        <span className="text-2xs italic text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" dir="ltr">
                      {c.latestIp ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-2xs text-zinc-700">
                            {c.latestIp}
                          </span>
                          {c.ipBlocked ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-red-700"
                              title="Cette IP est dans la liste noire"
                            >
                              <span className="size-1.5 rounded-full bg-red-500" />
                              Bloquée
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-2xs italic text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-900">
                      {c.orderCount > 0 ? (
                        c.orderCount
                      ) : (
                        <span className="text-2xs italic text-zinc-400">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-medium tabular-nums text-zinc-900">
                      {c.orderCount > 0 ? (
                        formatDZD(c.totalSpent, "fr")
                      ) : (
                        <span className="text-2xs italic text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {c.lastOrderAt ? (
                        new Date(c.lastOrderAt).toLocaleDateString("fr-DZ")
                      ) : (
                        <span className="text-2xs italic text-zinc-400">
                          Jamais
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <CustomerRowActions
                        customer={c}
                        onBlockIp={() => setBlockFor(c)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BlockIpDialog
        customer={blockFor}
        onClose={() => setBlockFor(null)}
      />
    </>
  );
}

/* ───────────────────────── Row actions menu ───────────────────────── */

function CustomerRowActions({
  customer,
  onBlockIp,
}: {
  customer: ApiCustomerRow;
  onBlockIp: () => void;
}) {
  const isBlocked = customer.ipBlocked;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        aria-label="Actions"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {isBlocked ? (
          <DropdownMenuItem
            nativeButton={false}
            render={<Link href={routes.admin.blockedIps} />}
            className="text-emerald-700 focus:text-emerald-800"
          >
            <ShieldCheck className="size-3.5" />
            Déjà bloqué — gérer
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={onBlockIp}
            disabled={!customer.phone}
            className="text-red-600 focus:text-red-700"
          >
            <ShieldOff className="size-3.5" />
            {customer.phone
              ? "Bloquer ce client"
              : "Aucun numéro enregistré"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ───────────────────────── Block-IP dialog ───────────────────────── */

function BlockIpDialog({
  customer,
  onClose,
}: {
  customer: ApiCustomerRow | null;
  onClose: () => void;
}) {
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (customer) setReason("");
  }, [customer]);

  const onConfirm = async () => {
    if (!customer || busy) return;
    setBusy(true);
    try {
      const result = await customersApi.blockIp(
        customer.phone,
        reason || undefined,
      );
      // Phone is always blocked (it's the durable signal); IP only
      // gets a row when this customer has a recorded IP. Toast
      // mentions both so the admin knows what landed where.
      const bits: string[] = [`numéro ${result.phone.phoneNumber}`];
      if (result.ip) bits.push(`IP ${result.ip.ipAddress}`);
      toast.success(`Client bloqué — ${bits.join(" + ")}`);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec du blocage.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!customer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bloquer ce client</DialogTitle>
          <DialogDescription>
            {customer
              ? `Le numéro de téléphone ${customer.phone || "(non enregistré)"} de ${customer.firstName} ${customer.lastName} et l'adresse IP de sa dernière commande seront ajoutés à la liste noire. Toute nouvelle commande depuis ce numéro OU cette IP sera refusée — même avec un VPN.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field
            label="Raison (facultatif)"
            htmlFor="block-reason"
            hint="Visible dans /admin/blocked-phones et /admin/blocked-ips."
          >
            <Input
              id="block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={255}
              placeholder="Ex. fausses commandes répétées"
              className="h-9 text-sm"
            />
          </Field>
        </div>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? "Blocage…" : "Bloquer ce client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-2xs font-medium text-zinc-700">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-2xs text-zinc-500">{hint}</span>
      ) : null}
    </label>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-4">
      <span className="inline-flex size-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <Icon className="size-4" />
      </span>
      <div>
        <Mono className="text-2xs text-zinc-500">{label}</Mono>
        <p className="font-mono text-base font-semibold tabular-nums text-zinc-900">
          {value}
        </p>
      </div>
    </div>
  );
}
