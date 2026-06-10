"use client";

import * as React from "react";
import { Database, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Small } from "@/components/ui/typography";
import { backupApi } from "@/lib/api/backup";
import { HttpError } from "@/lib/api/http";

/**
 * Admin widget: one button that downloads a full `.sql` dump of the whole
 * database (every table — produits, commandes, clients, paramètres…). The
 * file is importable via phpMyAdmin or any MySQL client.
 */
export function BackupManager() {
  const [downloading, setDownloading] = React.useState(false);

  const onBackup = async () => {
    setDownloading(true);
    const pending = toast.loading("Préparation de la sauvegarde…");
    try {
      await backupApi.downloadDatabase();
      toast.success("Sauvegarde téléchargée", { id: pending });
    } catch (err) {
      const message =
        err instanceof HttpError && err.status === 401
          ? "Session expirée. Reconnectez-vous."
          : "Échec de la sauvegarde. Réessayez.";
      toast.error(message, { id: pending });
    } finally {
      setDownloading(false);
    }
  };

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
            Sauvegarde de la base de données
          </h2>
          <Small className="text-zinc-500">
            Télécharge un fichier <code className="font-mono text-2xs">.sql</code>{" "}
            complet de toute la base — produits, commandes, clients, catégories,
            paramètres, etc. Réimportable via phpMyAdmin. Conservez-le en lieu sûr.
          </Small>
        </div>
      </header>

      <Button
        type="button"
        variant="primary"
        size="default"
        onClick={() => void onBackup()}
        disabled={downloading}
      >
        <Download className="size-4" />
        {downloading
          ? "Préparation…"
          : "Télécharger une sauvegarde complète"}
      </Button>
    </section>
  );
}
