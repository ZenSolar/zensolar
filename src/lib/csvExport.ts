/**
 * Pass D · #3 — CSV export helpers.
 *
 * Tiny dependency-free CSV serializer + browser download trigger. Cells
 * are RFC-4180-escaped (double quotes doubled, anything containing a
 * comma / quote / newline gets wrapped in quotes). Dates, numbers, and
 * nullish values are coerced to safe string forms.
 */

type CsvCell = string | number | boolean | Date | null | undefined;
export type CsvRow = Record<string, CsvCell>;

const escapeCell = (value: CsvCell): string => {
  if (value === null || value === undefined) return "";
  let str: string;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === "number") {
    str = Number.isFinite(value) ? String(value) : "";
  } else {
    str = String(value);
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Serialize an array of row objects to a CSV string.
 * Column order is taken from the first row's keys unless `columns` is
 * provided (recommended — keeps the header stable across empty data).
 */
export function rowsToCsv(rows: CsvRow[], columns?: string[]): string {
  const cols = columns ?? (rows[0] ? Object.keys(rows[0]) : []);
  const header = cols.map((c) => escapeCell(c)).join(",");
  const body = rows.map((row) => cols.map((c) => escapeCell(row[c])).join(",")).join("\r\n");
  return body ? `${header}\r\n${body}` : header;
}

/**
 * Trigger a browser download of `content` as `filename`. Defaults to
 * text/csv. Adds a UTF-8 BOM so Excel opens accented characters cleanly.
 */
export function downloadFile(
  filename: string,
  content: string,
  mimeType = "text/csv;charset=utf-8",
) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Safari doesn't cancel the download mid-flight.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Convenience: serialize rows + trigger download in one call. */
export function downloadCsv(filename: string, rows: CsvRow[], columns?: string[]) {
  downloadFile(filename, rowsToCsv(rows, columns));
}

/** "2026-05-23" — safe for filenames. */
export function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
