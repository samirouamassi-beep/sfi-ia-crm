// CSV minimal conforme RFC 4180 (guillemets, retours ligne dans les champs).
// Séparateur détecté à l'import (virgule ou point-virgule, ce dernier étant celui d'Excel FR).

export function toCsv(header: string[], rows: (string | number | null | undefined)[][], sep = ","): string {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    // Neutralise l'injection de formules à l'ouverture dans un tableur.
    const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
    return /[",;\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [header, ...rows].map((r) => r.map(cell).join(sep)).join("\r\n") + "\r\n";
}

export function parseCsv(text: string): Record<string, string>[] {
  const input = text.replace(/^﻿/, "");
  const firstLine = input.slice(0, input.search(/\r?\n|$/));
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === sep) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      records.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  const [header, ...data] = records.filter((r) => r.some((v) => v.trim() !== ""));
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase());
  return data.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}
