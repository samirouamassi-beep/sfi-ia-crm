// Export Excel (.xlsx) : onglets Collection, Par console, Wishlist.
// Montants en euros (nombres, pas texte) pour que les formules et tris Excel fonctionnent.

import "server-only";
import ExcelJS from "exceljs";
import { COMPLETENESS_LABELS, KIND_LABELS, REGION_LABELS } from "./catalog";
import { formatValue } from "./attributes";
import { PRIORITY_LABELS } from "./wishlist";
import { gradeText, type Report } from "./report";

const EUR = '#,##0.00 "€"';
const PCT = "0.0%";
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6250D6" } };
const TOTAL_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDEBFB" } };

const euros = (cents: number | null | undefined) => (cents == null ? null : cents / 100);

type Col = { header: string; key: string; width: number; numFmt?: string };

function addTable(sheet: ExcelJS.Worksheet, columns: Col[], rows: Record<string, unknown>[], totals?: Record<string, string>) {
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width, style: c.numFmt ? { numFmt: c.numFmt } : {} }));
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 30;
  rows.forEach((r) => sheet.addRow(r));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  if (rows.length > 0) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: columns.length } };
  }
  if (totals && rows.length > 0) {
    const last = rows.length + 1;
    const row = sheet.addRow({});
    columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const t = totals[c.key];
      if (!t) return;
      const letter = sheet.getColumn(i + 1).letter;
      // Résultat précalculé : affiché par les aperçus (iOS, Gmail) qui ne recalculent pas.
      const result = rows.reduce<number>((sum, r) => sum + (typeof r[c.key] === "number" ? (r[c.key] as number) : 0), 0);
      cell.value = t === "label" ? "Total" : { formula: t.replace(/COL/g, letter).replace(/LAST/g, String(last)), result };
    });
    row.font = { bold: true };
    row.fill = TOTAL_FILL;
  }
}

export async function buildWorkbook(report: Report): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "RetroGame Vault";
  wb.created = report.generatedAt;

  // --- Collection ---
  const collection = wb.addWorksheet("Collection");
  const attrCols: Col[] = report.attributes.map((a, i) => ({ header: a.label, key: `attr${i}`, width: Math.max(12, a.label.length + 2) }));
  const columns: Col[] = [
    { header: "Titre", key: "title", width: 40 },
    { header: "Console", key: "platform", width: 22 },
    { header: "Type", key: "kind", width: 11 },
    { header: "Région", key: "region", width: 9 },
    { header: "Format", key: "completeness", width: 13 },
    { header: "État boîte", key: "box", width: 14 },
    { header: "État notice", key: "manual", width: 14 },
    { header: "État support", key: "media", width: 14 },
    ...attrCols,
    { header: "Acquis le", key: "acquiredAt", width: 12, numFmt: "dd/mm/yyyy" },
    { header: "Prix d'achat", key: "purchase", width: 13, numFmt: EUR },
    { header: "Valeur estimée", key: "value", width: 14, numFmt: EUR },
    { header: "Plus-value", key: "gain", width: 13, numFmt: EUR },
    { header: "Plus-value %", key: "ratio", width: 12, numFmt: PCT },
    { header: "Notes", key: "notes", width: 40 },
  ];
  addTable(
    collection,
    columns,
    report.rows.map((r) => ({
      title: r.product.title,
      platform: r.product.platform.name,
      kind: KIND_LABELS[r.product.kind],
      region: REGION_LABELS[r.region],
      completeness: COMPLETENESS_LABELS[r.completeness].label,
      box: gradeText(r.boxGrade, r.boxScore),
      manual: gradeText(r.manualGrade, r.manualScore),
      media: gradeText(r.mediaGrade, r.mediaScore),
      ...Object.fromEntries(
        report.attributes.map((a, i) => {
          const v = r.attributeValues.find((x) => x.attributeId === a.id)?.value;
          return [`attr${i}`, v == null ? null : a.type === "NUMBER" ? Number(v) : formatValue(a, v)];
        })
      ),
      acquiredAt: r.acquiredAt,
      purchase: euros(r.purchaseCents),
      value: euros(r.valueCents),
      gain: euros(r.deltaCents),
      ratio: r.ratio,
      notes: r.notes,
    })),
    { title: "label", purchase: "SUM(COL2:COLLAST)", value: "SUM(COL2:COLLAST)", gain: "SUM(COL2:COLLAST)" }
  );

  // --- Par console ---
  const platforms = wb.addWorksheet("Par console");
  addTable(
    platforms,
    [
      { header: "Console", key: "name", width: 30 },
      { header: "Pièces", key: "count", width: 10 },
      { header: "Investi", key: "invested", width: 14, numFmt: EUR },
      { header: "Valeur estimée", key: "value", width: 15, numFmt: EUR },
      { header: "Plus-value", key: "gain", width: 14, numFmt: EUR },
    ],
    report.byPlatform.map((p) => ({
      name: p.name,
      count: p.count,
      invested: euros(p.investedCents),
      value: euros(p.valueCents),
      gain: euros(p.valueCents - p.investedCents),
    })),
    { name: "label", count: "SUM(COL2:COLLAST)", invested: "SUM(COL2:COLLAST)", value: "SUM(COL2:COLLAST)", gain: "SUM(COL2:COLLAST)" }
  );
  platforms.addRow([]);
  platforms.addRow([
    report.filterLabel ? `Filtre : ${report.filterLabel}` : "Toute la collection",
  ]);
  platforms.addRow([`Généré le ${report.generatedAt.toLocaleDateString("fr-FR")} · pièces sans cote comptées à leur prix d'achat`]);

  // --- Wishlist ---
  if (report.wishlist) {
    const wish = wb.addWorksheet("Wishlist");
    addTable(
      wish,
      [
        { header: "Titre", key: "title", width: 40 },
        { header: "Console", key: "platform", width: 22 },
        { header: "Région", key: "region", width: 9 },
        { header: "Format visé", key: "completeness", width: 13 },
        { header: "Priorité", key: "priority", width: 10 },
        { header: "Prix cible", key: "target", width: 12, numFmt: EUR },
        { header: "Cote actuelle", key: "market", width: 13, numFmt: EUR },
        { header: "Sous la cible", key: "deal", width: 12 },
      ],
      report.wishlist.map((w) => ({
        title: w.product.title,
        platform: w.product.platform.name,
        region: REGION_LABELS[w.region],
        completeness: COMPLETENESS_LABELS[w.completeness].label,
        priority: PRIORITY_LABELS[w.priority],
        target: euros(w.targetPriceCents),
        market: euros(w.market),
        deal: w.deal ? "Oui" : "",
      }))
    );
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
