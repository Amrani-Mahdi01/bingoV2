"use client";

import * as React from "react";
import {
  AlertTriangle,
  Database,
  Download,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Small } from "@/components/ui/typography";
import { backupApi, type BackupFile } from "@/lib/api/backup";
import { HttpError } from "@/lib/api/http";

/**
 * Admin widget: full backup & restore of the whole database.
 *
 * - "Créer une sauvegarde" takes a snapshot and stores it server-side
 *   (storage/app/backups) — the list below refreshes.
 * - Each stored snapshot can be re-downloaded, RESTORED (re-imported so every
 *   table goes back to its saved state) or deleted.
 * - Restore is destructive, so it's gated behind a confirmation dialog; the
 *   backend also auto-snapshots the current state right before restoring.
 */

type PendingAction = { type: "restore" | "delete"; file: BackupFile };

function authMessage(err: unknown, fallback: string): string {
  return err instanceof HttpError && err.status === 401
    ? "Session expirée. Reconnectez-vous."
    : fallback;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function BackupManager() {
  const [backups, setBackups] = React.useState<BackupFile[] | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [downloadingDirect, setDownloadingDirect] = React.useState(false);
  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [working, setWorking] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setBackups(await backupApi.list());
    } catch (err) {
      setBackups([]);
      toast.error(authMessage(err, "Impossible de charger les sauvegardes."));
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = async () => {
    setCreating(true);
    const id = toast.loading("Création de la sauvegarde…");
    try {
      const file = await backupApi.create();
      toast.success(`Sauvegarde créée (${file.sizeHuman}).`, { id });
      await refresh();
    } catch (err) {
      toast.error(authMessage(err, "Échec de la création. Réessayez."), { id });
    } finally {
      setCreating(false);
    }
  };

  const onDirectDownload = async () => {
    setDownloadingDirect(true);
    const id = toast.loading("Préparation du téléchargement…");
    try {
      await backupApi.downloadDatabase();
      toast.success("Sauvegarde téléchargée.", { id });
    } catch (err) {
      toast.error(authMessage(err, "Échec du téléchargement. Réessayez."), { id });
    } finally {
      setDownloadingDirect(false);
    }
  };

  const onDownloadStored = async (file: BackupFile) => {
    const id = toast.loading("Téléchargement…");
    try {
      await backupApi.download(file.name);
      toast.success("Fichier téléchargé.", { id });
    } catch (err) {
      toast.error(authMessage(err, "Échec du téléchargement."), { id });
    }
  };

  const confirmPending = async () => {
    if (!pending) return;
    const { type, file } = pending;
    setWorking(true);
    const id = toast.loading(
      type === "restore" ? "Restauration en cours…" : "Suppression…",
    );
    try {
      if (type === "restore") {
        const res = await backupApi.restore(file.name);
        toast.success(
          `Base restaurée (${res.statements} instructions). ` +
            `Sécurité : ${res.safetyBackup}. Reconnectez-vous si besoin.`,
          { id, duration: 8000 },
        );
      } else {
        await backupApi.remove(file.name);
        toast.success("Sauvegarde supprimée.", { id });
      }
      setPending(null);
      await refresh();
    } catch (err) {
      // The restore endpoint returns the safety-backup name on failure.
      const body =
        err instanceof HttpError
          ? (err.body as { message?: string; safetyBackup?: string } | null)
          : null;
      const fallback =
        type === "restore"
          ? "Échec de la restauration."
          : "Échec de la suppression.";
      toast.error(body?.message ?? authMessage(err, fallback), {
        id,
        duration: 8000,
      });
    } finally {
      setWorking(false);
    }
  };

  const isRestore = pending?.type === "restore";

  return (
    <section
      id="backup"
      className="space-y-4 rounded-md border border-zinc-200 bg-white p-5 sm:p-6"
    >
      <header className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <Database className="size-5" />
        </span>
        <div className="space-y-0.5">
          <h2 className="font-sans text-lg font-semibold text-zinc-900">
            Sauvegarde &amp; restauration
          </h2>
          <Small className="text-zinc-500">
            Crée des copies complètes de toute la base — produits, commandes,
            clients, catégories, paramètres… Les sauvegardes sont conservées sur
            le serveur ; vous pouvez les télécharger ou{" "}
            <strong className="font-semibold text-zinc-700">restaurer</strong>{" "}
            l&apos;une d&apos;elles pour tout remettre en place.
          </Small>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="default"
          onClick={() => void onCreate()}
          disabled={creating}
        >
          {creating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {creating ? "Création…" : "Créer une sauvegarde"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => void onDirectDownload()}
          disabled={downloadingDirect}
        >
          {downloadingDirect ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Télécharger une copie
        </Button>
      </div>

      {/* Stored snapshots */}
      <div className="rounded-md border border-zinc-200">
        <div className="border-b border-zinc-100 px-4 py-2.5">
          <Small className="font-medium text-zinc-600">
            Sauvegardes enregistrées
          </Small>
        </div>

        {backups === null ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" />
            Chargement…
          </div>
        ) : backups.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-500">
            Aucune sauvegarde enregistrée pour le moment.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {backups.map((file) => (
              <li
                key={file.name}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-xs text-zinc-800">
                      {file.name}
                    </span>
                    {file.auto && (
                      <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-2xs font-medium text-amber-700">
                        auto
                      </span>
                    )}
                  </div>
                  <Small className="text-zinc-400">
                    {formatDate(file.createdAt)} · {file.sizeHuman}
                  </Small>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPending({ type: "restore", file })}
                  >
                    <RotateCcw className="size-3.5" />
                    Restaurer
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Télécharger"
                    onClick={() => void onDownloadStored(file)}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Supprimer"
                    className="text-ember hover:bg-ember/10"
                    onClick={() => setPending({ type: "delete", file })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirmation dialog (restore = destructive, delete = irreversible) */}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !working) setPending(null);
        }}
      >
        <DialogContent showCloseButton={!working}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className={isRestore ? "size-5 text-amber-600" : "size-5 text-ember"}
              />
              {isRestore ? "Restaurer cette sauvegarde ?" : "Supprimer cette sauvegarde ?"}
            </DialogTitle>
            <DialogDescription>
              {isRestore ? (
                <>
                  Cela remplacera <strong>toutes les données actuelles</strong>{" "}
                  (produits, commandes, clients, paramètres…) par celles du
                  fichier. Une sauvegarde de sécurité de l&apos;état actuel est
                  créée automatiquement juste avant. Vous devrez peut-être vous
                  reconnecter ensuite.
                </>
              ) : (
                <>
                  Le fichier{" "}
                  <span className="font-mono text-xs">{pending?.file.name}</span>{" "}
                  sera supprimé définitivement. Cette action est irréversible.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPending(null)}
              disabled={working}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant={isRestore ? "primary" : "destructive"}
              onClick={() => void confirmPending()}
              disabled={working}
            >
              {working && <Loader2 className="size-4 animate-spin" />}
              {isRestore ? "Restaurer" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
