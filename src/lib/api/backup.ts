"use client";

import { adminToken, http, HttpError } from "@/lib/api/http";

/**
 * Database backup & restore API client.
 *
 * Most calls go through the shared `http` JSON wrapper. The two file
 * *downloads* can't — `http` always reads the body as text/JSON, which is
 * wrong for a (potentially large) binary `.sql` file — so those go straight to
 * `fetch`, attach the admin bearer token the same way `http` does, and turn the
 * streamed body into a browser download.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/** A server-side snapshot stored under storage/app/backups. */
export interface BackupFile {
  name: string;
  size: number;
  sizeHuman: string;
  createdAt: string;
  /** True for the automatic snapshot taken just before a restore. */
  auto: boolean;
}

export interface RestoreResult {
  restoredFrom: string;
  statements: number;
  safetyBackup: string;
}

/** Pull `filename` out of a Content-Disposition header, with a fallback. */
function filenameFromDisposition(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;
  // RFC 5987 `filename*=UTF-8''…` takes precedence over plain `filename="…"`.
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/["']/g, "").trim());
    } catch {
      /* fall through to the plain form */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim() || fallback;
}

/** Fetch a binary endpoint and hand the body to the browser as a download. */
async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const token = adminToken.get();
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/sql",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let body: unknown = null;
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    throw new HttpError(res.status, body, `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const filename = filenameFromDisposition(
    res.headers.get("Content-Disposition"),
    fallbackName,
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const backupApi = {
  /** Download a full SQL dump directly, without storing it on the server. */
  downloadDatabase(): Promise<void> {
    return downloadFile("/api/admin/backup/database", "bingo-backup.sql");
  },

  /** List the snapshots stored on the server, newest first. */
  async list(): Promise<BackupFile[]> {
    const res = await http.get<{ data: BackupFile[] }>("/api/admin/backups");
    return res.data ?? [];
  },

  /** Take a fresh snapshot and store it on the server. */
  async create(): Promise<BackupFile> {
    const res = await http.post<{ data: BackupFile }>("/api/admin/backups");
    return res.data;
  },

  /** Download a specific stored snapshot. */
  download(name: string): Promise<void> {
    return downloadFile(
      `/api/admin/backups/${encodeURIComponent(name)}`,
      name,
    );
  },

  /** Restore the database from a stored snapshot (destructive — re-imports). */
  async restore(name: string): Promise<RestoreResult> {
    const res = await http.post<{ data: RestoreResult }>(
      `/api/admin/backups/${encodeURIComponent(name)}/restore`,
    );
    return res.data;
  },

  /** Delete a stored snapshot. */
  async remove(name: string): Promise<void> {
    await http.delete(`/api/admin/backups/${encodeURIComponent(name)}`);
  },
};
