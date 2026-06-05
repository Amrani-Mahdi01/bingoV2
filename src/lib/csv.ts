/* Minimal CSV helpers — no dependencies, RFC 4180-ish.
 *
 *  Round-trip safe: parseCSV(toCSV(rows)) === rows for any string rows.
 *  Handles commas, double-quotes (escaped as ""), and newlines inside
 *  quoted fields. Recognises both LF and CRLF line endings on read.
 */

/** Serialise a 2-D array of strings to a CSV string with CRLF endings. */
export function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

function escapeCell(value: string): string {
  // Quote only when necessary: commas, quotes, CR, LF, or leading/trailing whitespace.
  if (/[",\r\n]/.test(value) || /^\s|\s$/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Parse a CSV string into a 2-D array of strings. Empty trailing lines
 *  are stripped. Throws on unterminated quoted fields. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (c === "\r") {
      // Eat \r\n as a single line terminator.
      if (text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
      continue;
    }
    cell += c;
    i++;
  }

  if (inQuotes) throw new Error("CSV: champ entre guillemets non terminé");

  // Flush the last cell/row (no trailing newline case).
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // Drop fully-empty trailing rows that come from a trailing newline.
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c === "")) {
    rows.pop();
  }

  return rows;
}

/** Trigger a browser download of `content` as `filename`. */
export function downloadCSV(filename: string, content: string): void {
  // BOM so Excel opens UTF-8 files correctly (Arabic, accents).
  const blob = new Blob(["﻿" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
