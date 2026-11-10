// Export / import de la collection (CSV ou JSON, même jeu de colonnes).
// Les caractéristiques personnalisées occupent une colonne chacune : "attr:<nom>".

import "server-only";
import { z } from "zod";
import { prisma } from "./db";
import { parseCsv, toCsv } from "./csv";
import { Completeness, Grade, ProductKind, Region } from "./catalog";
import { findOrCreateProduct } from "./products";
import { parseEurosToCents } from "./money";
import { normalizeValue, type AttributeDef } from "./attributes";
import { listAttributes, saveAttributeValues } from "./attributes-store";

export const EXPORT_COLUMNS = [
  "title", "platform", "kind", "region", "completeness",
  "box_grade", "manual_grade", "media_grade", "box_score", "manual_score", "media_score",
  "acquired_at", "purchase_eur", "manual_value_eur", "notes",
  "igdb_id", "release_year", "developer", "publisher", "genres", "cover_url",
] as const;

export const ATTRIBUTE_COLUMN_PREFIX = "attr:";

type ExportRow = Record<string, string | number | null>;
export type ExportTable = { columns: string[]; rows: ExportRow[] };

const euros = (c: number | null) => (c == null ? null : (c / 100).toFixed(2));
const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export async function exportTable(userId: string): Promise<ExportTable> {
  const [items, attributes] = await Promise.all([
    prisma.collectionItem.findMany({
      where: { userId },
      include: { product: { include: { platform: true } }, attributeValues: true },
      orderBy: [{ product: { platform: { sortOrder: "asc" } } }, { product: { title: "asc" } }],
    }),
    listAttributes(userId),
  ]);
  const attrColumns = attributes.map((a) => `${ATTRIBUTE_COLUMN_PREFIX}${a.label}`);
  const rows = items.map((i) => ({
    title: i.product.title,
    platform: i.product.platform.slug,
    kind: i.product.kind,
    region: i.region,
    completeness: i.completeness,
    box_grade: i.boxGrade,
    manual_grade: i.manualGrade,
    media_grade: i.mediaGrade,
    box_score: i.boxScore,
    manual_score: i.manualScore,
    media_score: i.mediaScore,
    acquired_at: isoDate(i.acquiredAt),
    purchase_eur: euros(i.purchaseCents),
    manual_value_eur: euros(i.manualValueCents),
    notes: i.notes,
    igdb_id: i.product.igdbId,
    release_year: i.product.releaseYear,
    developer: i.product.developer,
    publisher: i.product.publisher,
    genres: i.product.genres.join("|"),
    cover_url: i.product.coverUrl,
    ...Object.fromEntries(
      attributes.map((a, k) => {
        const v = i.attributeValues.find((x) => x.attributeId === a.id)?.value ?? null;
        return [attrColumns[k], a.type === "BOOLEAN" && v === "true" ? "oui" : v];
      })
    ),
  }));
  return { columns: [...EXPORT_COLUMNS, ...attrColumns], rows };
}

export function tableToCsv({ columns, rows }: ExportTable): string {
  return toCsv(columns, rows.map((r) => columns.map((c) => r[c] ?? null)));
}

/** Colonnes "attr:<nom>" d'une ligne importée -> valeurs normalisées, ou message d'erreur. */
function importAttributeValues(entry: unknown, byLabel: Map<string, AttributeDef>) {
  const values = new Map<string, string | null>();
  if (!entry || typeof entry !== "object") return { values };
  for (const [key, raw] of Object.entries(entry)) {
    if (!key.toLowerCase().startsWith(ATTRIBUTE_COLUMN_PREFIX)) continue;
    const label = key.slice(ATTRIBUTE_COLUMN_PREFIX.length).trim().toLowerCase();
    const attr = byLabel.get(label);
    if (!attr) {
      if (raw == null || String(raw).trim() === "") continue;
      return { values, error: `caractéristique inconnue « ${label} » (à créer dans Plus → Caractéristiques)` };
    }
    const v = normalizeValue(attr, raw);
    if (v !== null && typeof v === "object") return { values, error: v.error };
    values.set(attr.id, v);
  }
  return { values };
}

// ---------- Import ----------

const blank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
const optional = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((v) => (blank(v) ? undefined : v), schema.optional());
const upper = (v: unknown) => (typeof v === "string" ? v.trim().toUpperCase().replace("-", "_") : v);
const optEnum = <T extends Record<string, string>>(values: T) => optional(z.preprocess(upper, z.enum(values)));
const optScore = optional(z.coerce.number().int().min(1).max(10));
const optEuros = optional(
  z.preprocess((v) => (typeof v === "number" ? String(v) : v), z.string()).transform((s, ctx) => {
    const c = parseEurosToCents(s);
    if (c == null) ctx.addIssue({ code: "custom", message: "montant invalide" });
    return c ?? 0;
  })
);

const ImportRow = z.object({
  title: z.string().trim().min(1, "titre manquant").max(200),
  platform: z.string().trim().min(1, "plateforme manquante"),
  kind: optEnum(ProductKind),
  region: optEnum(Region),
  completeness: z.preprocess(upper, z.enum(Completeness, { message: "état LOOSE / CIB / SEALED attendu" })),
  box_grade: optEnum(Grade),
  manual_grade: optEnum(Grade),
  media_grade: optEnum(Grade),
  box_score: optScore,
  manual_score: optScore,
  media_score: optScore,
  acquired_at: optional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date AAAA-MM-JJ attendue")),
  purchase_eur: optEuros,
  manual_value_eur: optEuros,
  notes: optional(z.string().max(2000)),
  igdb_id: optional(z.coerce.number().int().positive()),
  release_year: optional(z.coerce.number().int().min(1970).max(2100)),
  developer: optional(z.string().max(200)),
  publisher: optional(z.string().max(200)),
  genres: optional(z.union([z.string(), z.array(z.string())])),
  cover_url: optional(z.url()),
});

export type ImportReport = { imported: number; errors: { line: number; message: string }[] };

export function parseImportFile(name: string, text: string): unknown[] {
  if (name.toLowerCase().endsWith(".json") || text.trimStart().startsWith("{") || text.trimStart().startsWith("[")) {
    const json = JSON.parse(text) as unknown;
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object" && Array.isArray((json as { items?: unknown }).items)) {
      return (json as { items: unknown[] }).items;
    }
    throw new Error("JSON attendu : tableau d'exemplaires ou objet { items: [...] }.");
  }
  return parseCsv(text);
}

export async function importRows(userId: string, raw: unknown[]): Promise<ImportReport> {
  const platforms = await prisma.platform.findMany();
  const attributes = await listAttributes(userId);
  const byLabel = new Map(attributes.map((a) => [a.label.toLowerCase(), a]));
  const bySlug = new Map(platforms.flatMap((p) => [[p.slug, p], [p.shortName.toLowerCase(), p]]));
  const report: ImportReport = { imported: 0, errors: [] };

  for (const [i, entry] of raw.entries()) {
    const line = i + 2; // ligne 1 = en-tête CSV
    const parsed = ImportRow.safeParse(entry);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      report.errors.push({ line, message: `${issue.path.join(".") || "ligne"} : ${issue.message}` });
      continue;
    }
    const r = parsed.data;
    const attrs = importAttributeValues(entry, byLabel);
    if (attrs.error) {
      report.errors.push({ line, message: attrs.error });
      continue;
    }
    const platform = bySlug.get(r.platform.toLowerCase());
    if (!platform) {
      report.errors.push({ line, message: `plateforme inconnue « ${r.platform} »` });
      continue;
    }
    const product = await findOrCreateProduct({
      kind: r.kind ?? "GAME",
      title: r.title,
      platformId: platform.id,
      igdbId: r.igdb_id,
      coverUrl: r.cover_url,
      releaseYear: r.release_year,
      developer: r.developer,
      publisher: r.publisher,
      genres: Array.isArray(r.genres) ? r.genres : r.genres?.split("|").map((g) => g.trim()).filter(Boolean),
    });
    const item = await prisma.collectionItem.create({
      data: {
        userId,
        productId: product.id,
        region: r.region ?? "PAL",
        completeness: r.completeness,
        boxGrade: r.box_grade,
        manualGrade: r.manual_grade,
        mediaGrade: r.media_grade,
        boxScore: r.box_score,
        manualScore: r.manual_score,
        mediaScore: r.media_score,
        acquiredAt: r.acquired_at ? new Date(`${r.acquired_at}T00:00:00Z`) : null,
        purchaseCents: r.purchase_eur,
        manualValueCents: r.manual_value_eur,
        notes: r.notes,
      },
    });
    await saveAttributeValues(item.id, attrs.values);
    report.imported += 1;
  }
  return report;
}
