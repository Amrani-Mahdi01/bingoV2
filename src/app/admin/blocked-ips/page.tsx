"use client";

import * as React from "react";
import { toast } from "sonner";
import { Globe, Phone, RefreshCw, ShieldOff, Trash2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Mono, Small } from "@/components/ui/typography";
import {
  blockedIpsApi,
  type BlockedIpEntry,
} from "@/lib/api/blocked-ips";
import {
  blockedPhonesApi,
  type BlockedPhoneEntry,
} from "@/lib/api/blocked-phones";
import { cn } from "@/lib/utils";

/**
 * Unified blacklist page — IPs and phone numbers in a single table.
 * Two lists live in separate DB tables (blocked_ips, blocked_phones)
 * because they have different semantics + the schema predates this
 * page, but the admin only ever thinks in terms of "this client is
 * blocked" — both signals usually land at the same moment (manual
 * "Bloquer ce client" or the 3-strike auto-block in OrderController).
 */

/**
 * Rows the unified table renders. Three shapes:
 *   - "pair"  — an IP block + a phone block linked by block_group_id.
 *               Single row in the UI, single Débloquer button lifts
 *               both. Created by the "block this client" path
 *               (manual or auto-block on 3+ cancelled/returned).
 *   - "ip"    — a standalone IP block (no matching phone).
 *   - "phone" — a standalone phone block (no matching IP).
 */
type Row =
  | { kind: "pair"; ip: BlockedIpEntry; phone: BlockedPhoneEntry }
  | { kind: "ip"; data: BlockedIpEntry }
  | { kind: "phone"; data: BlockedPhoneEntry };

export default function BlockedListPage() {
  const [ips, setIps] = React.useState<BlockedIpEntry[] | null>(null);
  const [phones, setPhones] = React.useState<BlockedPhoneEntry[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // The Add dialog is single-purpose per open; the variant decides
  // which list it posts to. Two header buttons trigger each variant.
  const [addKind, setAddKind] = React.useState<"ip" | "phone" | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ipsData, phonesData] = await Promise.all([
        blockedIpsApi.list(),
        blockedPhonesApi.list(),
      ]);
      setIps(ipsData);
      setPhones(phonesData);
      setError(null);
    } catch {
      setError("Impossible de charger la liste.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Merge both lists into a single chronologically-sorted feed.
  // Newest blocks at the top. IPs and phones that share a
  // `blockGroupId` collapse into a single "pair" row so the admin
  // can lift both with one Débloquer click. Standalone entries
  // (manually-added IP-only or phone-only blocks) render unchanged.
  const rows: Row[] | null = React.useMemo(() => {
    if (ips === null || phones === null) return null;

    // Index phones by group id so we can pair on a single pass over
    // the IPs.
    const phonesByGroup = new Map<string, BlockedPhoneEntry>();
    for (const p of phones) {
      if (p.blockGroupId) phonesByGroup.set(p.blockGroupId, p);
    }
    const claimedPhoneIds = new Set<number>();

    const merged: Row[] = [];
    for (const ip of ips) {
      const match = ip.blockGroupId
        ? phonesByGroup.get(ip.blockGroupId)
        : undefined;
      if (match) {
        merged.push({ kind: "pair", ip, phone: match });
        claimedPhoneIds.add(match.id);
      } else {
        merged.push({ kind: "ip", data: ip });
      }
    }
    for (const p of phones) {
      if (!claimedPhoneIds.has(p.id)) merged.push({ kind: "phone", data: p });
    }

    // Sort by the most recent timestamp inside the row. For pairs we
    // take the freshest of the two, which matches admin intuition
    // ("this client was last touched at…").
    merged.sort((a, b) => {
      const ta = rowTimestamp(a);
      const tb = rowTimestamp(b);
      if (ta === tb) return 0;
      return ta < tb ? 1 : -1;
    });
    return merged;
  }, [ips, phones]);

  // Format the "and N orders cancelled" suffix shown in unblock
  // toasts. Hidden when no orders were flipped so the message stays
  // tight for manual IP-only blocks etc.
  const cancelledSuffix = (n: number): string =>
    n > 0
      ? ` · ${n} commande${n > 1 ? "s" : ""} basculée${n > 1 ? "s" : ""} en « Annulée »`
      : "";

  const unblock = async (row: Row) => {
    if (row.kind === "pair") {
      // Pair → lift both rows in parallel, optimistic UI removes
      // them together. On any failure we restore both lists from
      // the snapshot so the page never ends up half-correct.
      const prevIps = ips;
      const prevPhones = phones;
      setIps((curr) => curr?.filter((r) => r.id !== row.ip.id) ?? curr);
      setPhones((curr) => curr?.filter((r) => r.id !== row.phone.id) ?? curr);
      try {
        const [, phoneResult] = await Promise.all([
          blockedIpsApi.remove(row.ip.id),
          blockedPhonesApi.remove(row.phone.id),
        ]);
        toast.success(
          `Client débloqué — ${row.phone.phoneNumber} + ${row.ip.ipAddress}${cancelledSuffix(phoneResult.cancelledOrders)}`,
        );
      } catch (err) {
        setIps(prevIps ?? null);
        setPhones(prevPhones ?? null);
        toast.error(err instanceof Error ? err.message : "Échec du déblocage.");
      }
      return;
    }
    if (row.kind === "ip") {
      const prev = ips;
      setIps((curr) => curr?.filter((r) => r.id !== row.data.id) ?? curr);
      try {
        await blockedIpsApi.remove(row.data.id);
        toast.success(`IP ${row.data.ipAddress} débloquée`);
      } catch (err) {
        setIps(prev ?? null);
        toast.error(err instanceof Error ? err.message : "Échec du déblocage.");
      }
      return;
    }
    const prev = phones;
    setPhones((curr) => curr?.filter((r) => r.id !== row.data.id) ?? curr);
    try {
      const result = await blockedPhonesApi.remove(row.data.id);
      toast.success(
        `Numéro ${row.data.phoneNumber} débloqué${cancelledSuffix(result.cancelledOrders)}`,
      );
    } catch (err) {
      setPhones(prev ?? null);
      toast.error(err instanceof Error ? err.message : "Échec du déblocage.");
    }
  };

  // Count after pairing — a single "client" pair counts as one entry
  // in the UI even though the DB holds two rows. The breakdown after
  // the dot still shows the raw split so the admin can sanity-check.
  const pairs = rows?.filter((r) => r.kind === "pair").length ?? 0;
  const loneIps = rows?.filter((r) => r.kind === "ip").length ?? 0;
  const lonePhones = rows?.filter((r) => r.kind === "phone").length ?? 0;
  const totalRows = (rows?.length ?? 0);
  const subtitle =
    rows === null
      ? "Chargement…"
      : `${totalRows} entrée${totalRows > 1 ? "s" : ""} · ${pairs} client${pairs > 1 ? "s" : ""}, ${loneIps} IP, ${lonePhones} téléphone${lonePhones > 1 ? "s" : ""}`;

  return (
    <>
      <AdminPageHeader
        eyebrow="Sécurité"
        title="Liste noire"
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddKind("ip")}
            >
              <Globe className="size-3.5" />
              Bloquer une IP
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setAddKind("phone")}
            >
              <Phone className="size-3.5" />
              Bloquer un numéro
            </Button>
          </div>
        }
      />

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
            Aucune entrée. Le système ajoute automatiquement les clients ayant 3+ commandes retournées.
          </li>
        ) : (
          rows.map((r) => {
            const key = rowKey(r);
            const meta = rowDisplay(r);
            return (
              <li key={key} className="flex flex-col gap-1.5 px-3 py-2.5">
                {/* Type pill + unblock button */}
                <div className="flex items-start justify-between gap-2">
                  {r.kind === "pair" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-1.5 py-0 font-mono text-[9px] font-medium uppercase tracking-wide text-red-700">
                      <Globe className="size-3" strokeWidth={2.2} />
                      <Phone className="size-3" strokeWidth={2.2} />
                      Client
                    </span>
                  ) : r.kind === "ip" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-1.5 py-0 font-mono text-[9px] font-medium uppercase tracking-wide text-blue-700">
                      <Globe className="size-3" strokeWidth={2.2} />
                      IP
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-1.5 py-0 font-mono text-[9px] font-medium uppercase tracking-wide text-violet-700">
                      <Phone className="size-3" strokeWidth={2.2} />
                      Tél
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void unblock(r)}
                    aria-label="Débloquer"
                    title="Débloquer"
                    className="inline-flex h-6 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 font-mono text-[10px] font-medium uppercase tracking-wide text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <Trash2 className="size-3" />
                    Débloquer
                  </button>
                </div>

                {/* Value (IP / phone / both) */}
                <div className="font-mono text-xs text-zinc-900" dir="ltr">
                  {r.kind === "pair" ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-3 text-violet-700" strokeWidth={2.2} />
                        {r.phone.phoneNumber}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-600">
                        <Globe className="size-3 text-blue-700" strokeWidth={2.2} />
                        {r.ip.ipAddress}
                      </span>
                    </div>
                  ) : r.kind === "ip" ? (
                    r.data.ipAddress
                  ) : (
                    r.data.phoneNumber
                  )}
                </div>

                {/* Reason */}
                {meta.reason ? (
                  <p className="text-[11px] text-zinc-700">{meta.reason}</p>
                ) : null}

                {/* Blocked by + when */}
                <p className="text-[10px] text-zinc-500">
                  {meta.blockedBy ? `Par ${meta.blockedBy.name}` : "Par Système"}
                  {meta.blockedAt
                    ? ` · ${new Date(meta.blockedAt).toLocaleString("fr-DZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </p>
              </li>
            );
          })
        )}
      </ul>

      <div className="hidden overflow-hidden rounded-md border border-zinc-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Valeur</th>
                <th className="px-4 py-3 font-medium">Raison</th>
                <th className="px-4 py-3 font-medium">Bloqué par</th>
                <th className="px-4 py-3 font-medium">Le</th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Chargement…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Aucune entrée pour l&apos;instant. Le système ajoute
                    automatiquement les clients ayant 3+ commandes annulées
                    ou retournées.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const key = rowKey(r);
                  const meta = rowDisplay(r);
                  return (
                    <tr
                      key={key}
                      className="border-t border-zinc-100 hover:bg-zinc-50/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        {r.kind === "pair" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-red-700">
                            <Globe className="size-3" strokeWidth={2.2} />
                            <Phone className="size-3" strokeWidth={2.2} />
                            Client
                          </span>
                        ) : r.kind === "ip" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-blue-700">
                            <Globe className="size-3" strokeWidth={2.2} />
                            IP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-violet-700">
                            <Phone className="size-3" strokeWidth={2.2} />
                            Tél
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-900" dir="ltr">
                        {r.kind === "pair" ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="size-3 text-violet-700" strokeWidth={2.2} />
                              {r.phone.phoneNumber}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-zinc-600">
                              <Globe className="size-3 text-blue-700" strokeWidth={2.2} />
                              {r.ip.ipAddress}
                            </span>
                          </div>
                        ) : r.kind === "ip" ? (
                          r.data.ipAddress
                        ) : (
                          r.data.phoneNumber
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {meta.reason ?? (
                          <Small className="text-zinc-400 italic">—</Small>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {meta.blockedBy ? meta.blockedBy.name : (
                          <Small className="text-zinc-400 italic">Système</Small>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                        {meta.blockedAt
                          ? new Date(meta.blockedAt).toLocaleString("fr-DZ", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void unblock(r)}
                        >
                          <Trash2 className="size-3.5" />
                          Débloquer
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note — dropped the uppercase Mono treatment because
          turning a 5-line paragraph into all-caps makes it shout and
          read larger than its actual text-size. Plain small sentence
          case scales down properly on mobile. */}
      <p className="mt-3 text-[10px] leading-relaxed text-zinc-500 md:text-xs">
        Les commandes provenant d&apos;une IP OU d&apos;un numéro bloqué
        reçoivent un 403 avant toute autre validation. Auto-blocage déclenché
        après 3 commandes <strong className="font-semibold">retournées</strong> d&apos;un même numéro — IP et
        téléphone sont ajoutés ensemble. Au déblocage, les commandes
        retournées de ce client basculent automatiquement en
        « Annulée » pour repartir d&apos;un compteur propre.
      </p>

      <AddBlockDialog
        kind={addKind}
        onClose={() => setAddKind(null)}
        onAddedIp={(entry) => {
          setIps((curr) => (curr ? [entry, ...curr] : [entry]));
          setAddKind(null);
          toast.success(`IP ${entry.ipAddress} bloquée`);
        }}
        onAddedPhone={(entry) => {
          setPhones((curr) => (curr ? [entry, ...curr] : [entry]));
          setAddKind(null);
          toast.success(`Numéro ${entry.phoneNumber} bloqué`);
        }}
      />
    </>
  );
}

/* ─── Row helpers — keep the JSX above readable ─── */

/** Stable key for React. Pairs sort by their IP id since it's unique
 *  across the merged set; standalone rows use kind + id. */
function rowKey(r: Row): string {
  if (r.kind === "pair") return `pair-${r.ip.id}-${r.phone.id}`;
  return `${r.kind}-${r.data.id}`;
}

/** Which timestamp to sort on. For pairs we take the freshest of the
 *  two so the row jumps to the top right after admin blocks a client. */
function rowTimestamp(r: Row): string {
  if (r.kind === "pair") {
    const a = r.ip.blockedAt ?? "";
    const b = r.phone.blockedAt ?? "";
    return a > b ? a : b;
  }
  return r.data.blockedAt ?? "";
}

/** Reason / actor / timestamp shown in the shared columns. Pairs use
 *  the phone row as the canonical source (manual + auto paths both
 *  write identical metadata, so either side works). */
function rowDisplay(r: Row): {
  reason: string | null;
  blockedAt: string | null;
  blockedBy: { id: number; name: string; email: string } | null | undefined;
} {
  if (r.kind === "pair") {
    return {
      reason: r.phone.reason,
      blockedAt: r.phone.blockedAt,
      blockedBy: r.phone.blockedBy,
    };
  }
  return {
    reason: r.data.reason,
    blockedAt: r.data.blockedAt,
    blockedBy: r.data.blockedBy,
  };
}

function AddBlockDialog({
  kind,
  onClose,
  onAddedIp,
  onAddedPhone,
}: {
  kind: "ip" | "phone" | null;
  onClose: () => void;
  onAddedIp: (entry: BlockedIpEntry) => void;
  onAddedPhone: (entry: BlockedPhoneEntry) => void;
}) {
  const [value, setValue] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (kind) {
      setValue("");
      setReason("");
    }
  }, [kind]);

  const open = kind !== null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !kind) return;
    setBusy(true);
    try {
      if (kind === "ip") {
        const entry = await blockedIpsApi.create(
          value.trim(),
          reason || undefined,
        );
        onAddedIp(entry);
      } else {
        const entry = await blockedPhonesApi.create(
          value.trim(),
          reason || undefined,
        );
        onAddedPhone(entry);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : kind === "ip"
            ? "IP invalide ou déjà bloquée."
            : "Numéro invalide ou déjà bloqué.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kind === "ip"
              ? "Bloquer une adresse IP"
              : "Bloquer un numéro de téléphone"}
          </DialogTitle>
          <DialogDescription>
            {kind === "ip"
              ? "Ajoute une IP à la liste noire manuellement. Pour bloquer un client complet (IP + téléphone), utilisez l'action « Bloquer ce client » sur sa fiche."
              : "Ajoute un numéro à la liste noire. Le numéro de téléphone est la barrière la plus durable — les VPN changent l'IP mais rarement le numéro."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-2xs font-medium text-zinc-700">
              {kind === "ip" ? "Adresse IP" : "Numéro de téléphone"}
            </span>
            {kind === "ip" ? (
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                placeholder="192.168.1.42"
                dir="ltr"
                className="h-9 font-mono text-sm"
              />
            ) : (
              <Input
                value={value}
                onChange={(e) =>
                  // Match storefront checkout: digits only, max 10.
                  setValue(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                required
                minLength={10}
                maxLength={10}
                inputMode="numeric"
                pattern="\d*"
                placeholder="0555 12 34 56"
                dir="ltr"
                className="h-9 font-mono text-sm"
              />
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs font-medium text-zinc-700">
              Raison (facultatif)
            </span>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={255}
              className="h-9 text-sm"
            />
          </label>
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
              type="submit"
              size="sm"
              variant="destructive"
              disabled={busy}
            >
              {busy ? "Blocage…" : "Bloquer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
