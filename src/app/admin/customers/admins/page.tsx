"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, RefreshCw, ShieldCheck, Trash2, UserCog } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirm } from "@/components/admin/ConfirmDialog";
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
import { useAdminAuth } from "@/lib/admin-auth";
import { adminsApi, type ApiAdminRow } from "@/lib/api/admins";
import { HttpError } from "@/lib/api/http";
import { cn } from "@/lib/utils";

const ROLE_META: Record<string, { label: string; cls: string }> = {
  owner: { label: "Propriétaire", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  admin: { label: "Admin",        cls: "bg-blue-50 text-blue-700 border-blue-200" },
  staff: { label: "Staff",        cls: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export default function AdminsPage() {
  const { admin: currentAdmin } = useAdminAuth();
  const confirm = useConfirm();
  const [rows, setRows] = React.useState<ApiAdminRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<number | null>(null);

  // Only owners can delete other admins. Gate the entire trash column
  // on this so non-owners don't even see the button.
  const isOwner = currentAdmin?.role === "owner";

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminsApi.list();
      setRows(data);
      setError(null);
    } catch {
      setError("Impossible de charger la liste des admins.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onRemove = async (a: ApiAdminRow) => {
    const ok = await confirm({
      title: `Supprimer ${a.name} ?`,
      message:
        `Le compte de ${a.name} (${a.email}) sera supprimé et toutes ses ` +
        `sessions seront révoquées. Cette action est définitive.`,
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    setRemovingId(a.id);
    try {
      await adminsApi.remove(a.id);
      toast.success(`${a.name} supprimé.`);
      // Optimistically drop the row instead of re-fetching the whole
      // list — small page, no other state to reconcile.
      setRows((prev) => prev?.filter((r) => r.id !== a.id) ?? prev);
    } catch (err) {
      // 403 = not owner, 422 = self-delete or last-owner, otherwise
      // network/server. Surface whichever message the backend chose.
      const body =
        err instanceof HttpError
          ? (err.body as { message?: string } | undefined)
          : undefined;
      toast.error(
        body?.message ??
          (err instanceof Error ? err.message : "Échec de la suppression."),
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Équipe"
        title="Admins"
        subtitle={
          rows === null
            ? "Chargement…"
            : `${rows.length} compte${rows.length > 1 ? "s" : ""} avec accès au dashboard`
        }
        actions={
          <>
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
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-3.5" />
              Ajouter un admin
            </Button>
          </>
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
            Aucun admin. Cliquez sur « Ajouter un admin » pour créer le premier compte.
          </li>
        ) : (
          rows.map((a) => {
            const role = ROLE_META[a.role] ?? {
              label: a.role,
              cls: "bg-zinc-100 text-zinc-700 border-zinc-200",
            };
            return (
              <li key={a.id} className="flex flex-col gap-1.5 px-3 py-2.5">
                {/* Avatar + name/email + delete */}
                <div className="flex items-start gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-600 font-semibold text-[12px] text-white">
                    {(a.name?.[0] ?? a.email?.[0] ?? "?").toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-900">
                      {a.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-zinc-500">
                      {a.email}
                    </p>
                  </div>
                  {isOwner ? (
                    a.id === currentAdmin?.id ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-1.5 py-0 font-mono text-[9px] uppercase tracking-wide text-zinc-500">
                        Vous
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onRemove(a)}
                        disabled={removingId === a.id}
                        aria-label={`Supprimer ${a.name}`}
                        title={`Supprimer ${a.name}`}
                        className="inline-flex size-6 items-center justify-center rounded text-zinc-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )
                  ) : null}
                </div>

                {/* Role + status pills */}
                <div className="ps-11 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0 font-mono text-[9px] font-medium uppercase tracking-wide",
                      role.cls,
                    )}
                  >
                    {role.label}
                  </span>
                  {a.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0 font-mono text-[9px] font-medium text-emerald-700">
                      <span className="size-1 rounded-full bg-emerald-500" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0 font-mono text-[9px] font-medium text-zinc-600">
                      <span className="size-1 rounded-full bg-zinc-400" />
                      Désactivé
                    </span>
                  )}
                </div>

                {/* Last seen + created */}
                <p className="ps-11 text-[10px] text-zinc-500">
                  Vu{" "}
                  {a.lastSeenAt
                    ? new Date(a.lastSeenAt).toLocaleString("fr-DZ", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "jamais"}
                  {a.createdAt
                    ? ` · Créé le ${new Date(a.createdAt).toLocaleDateString("fr-DZ")}`
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
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Dernière activité</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
                {isOwner ? <th className="w-12 px-4 py-3" /> : null}
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td
                    colSpan={isOwner ? 6 : 5}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    Chargement…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={isOwner ? 6 : 5}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    Aucun admin pour l&apos;instant. Cliquez sur « Ajouter un admin » pour créer le premier compte.
                  </td>
                </tr>
              ) : (
                rows.map((a) => {
                  const role = ROLE_META[a.role] ?? {
                    label: a.role,
                    cls: "bg-zinc-100 text-zinc-700 border-zinc-200",
                  };
                  return (
                    <tr
                      key={a.id}
                      className="border-t border-zinc-100 hover:bg-zinc-50/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-600 text-cream font-semibold text-[11px] text-white">
                            {(a.name?.[0] ?? a.email?.[0] ?? "?").toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900">{a.name}</p>
                            <p className="truncate font-mono text-2xs text-zinc-500">
                              {a.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
                            role.cls,
                          )}
                        >
                          {role.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {a.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600">
                            <span className="size-1.5 rounded-full bg-zinc-400" />
                            Désactivé
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {a.lastSeenAt ? (
                          new Date(a.lastSeenAt).toLocaleString("fr-DZ", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        ) : (
                          <span className="text-2xs italic text-zinc-400">Jamais</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString("fr-DZ")
                          : "—"}
                      </td>
                      {isOwner ? (
                        <td className="px-2 py-3">
                          {a.id === currentAdmin?.id ? (
                            // Owners can't delete themselves — render a
                            // tiny "Vous" tag instead of a disabled
                            // trash icon so it doesn't look like a bug.
                            <span
                              className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-500"
                              title="C'est votre propre compte"
                            >
                              Vous
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void onRemove(a)}
                              disabled={removingId === a.id}
                              aria-label={`Supprimer ${a.name}`}
                              title={`Supprimer ${a.name}`}
                              className="inline-flex size-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateAdminDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          void load();
        }}
      />
    </>
  );
}

/* ───────────────────────── Create dialog ───────────────────────── */

function CreateAdminDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "staff">("admin");
  const [busy, setBusy] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Reset every time the dialog opens so a previous error / value
  // doesn't leak into the next admin we want to create.
  React.useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setPassword("");
    setRole("admin");
    setFieldErrors({});
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFieldErrors({});
    try {
      const admin = await adminsApi.create({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      toast.success(
        `${admin.name} a été ajouté en ${ROLE_META[admin.role]?.label ?? admin.role}.`,
      );
      onCreated();
    } catch (err) {
      // Laravel 422 → field-level errors come back on err.body.errors.
      if (err instanceof HttpError && err.status === 422) {
        const body = err.body as
          | { errors?: Record<string, string[]>; message?: string }
          | undefined;
        if (body?.errors) {
          const next: Record<string, string> = {};
          for (const [k, msgs] of Object.entries(body.errors)) {
            if (Array.isArray(msgs) && msgs[0]) next[k] = msgs[0];
          }
          setFieldErrors(next);
        }
        toast.error(body?.message ?? "Validation échouée.");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Création du compte impossible.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="size-4 text-blue-700" />
            Ajouter un admin
          </DialogTitle>
          <DialogDescription>
            Crée un nouveau compte qui pourra se connecter sur /admin/login.
            Communiquez le mot de passe en personne ou via WhatsApp — il
            ne sera plus affiché après cette fenêtre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nom complet" htmlFor="new-admin-name" error={fieldErrors.name}>
            <Input
              id="new-admin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              autoComplete="off"
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Email" htmlFor="new-admin-email" error={fieldErrors.email}>
            <Input
              id="new-admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={160}
              autoComplete="off"
              className="h-9 text-sm"
            />
          </Field>
          <Field
            label="Mot de passe"
            htmlFor="new-admin-password"
            hint="Minimum 8 caractères."
            error={fieldErrors.password}
          >
            <Input
              id="new-admin-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={120}
              autoComplete="new-password"
              className="h-9 font-mono text-sm"
            />
          </Field>
          <Field label="Rôle" htmlFor="new-admin-role" error={fieldErrors.role}>
            <select
              id="new-admin-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "staff")}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-400/20"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </Field>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              <ShieldCheck className="size-3.5" />
              {busy ? "Création…" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-2xs font-medium text-zinc-700">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-2xs font-medium text-red-700">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-2xs text-zinc-500">{hint}</span>
      ) : null}
    </label>
  );
}
