"use client";

import { adminToken, HttpError } from "@/lib/api/http";

/**
 * Database backup download.
 *
 * The shared `http` wrapper always reads the response as text/JSON, which is
 * wrong for a (potentially large) binary file download. So this goes straight
 * to `fetch`, attaches the admin bearer token the same way `http` does, and
 * turns the streamed `.sql` body into a browser download.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

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

export const backupApi = {
  /**
   * Download a full SQL dump of the database. Resolves once the browser has
   * been handed the file; rejects with `HttpError` on a non-2xx response.
   */
  async downloadDatabase(): Promise<void> {
    const token = adminToken.get();
    const res = await fetch(`${API_URL}/api/admin/backup/database`, {
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
      "bingo-backup.sql",
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
