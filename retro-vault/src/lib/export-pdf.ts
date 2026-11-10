// Export PDF (A4) : synthèse, répartition par console, détail de la collection, wishlist.
// Polices standard PDF (Helvetica, encodage WinAnsi) : pas de fichier de police à embarquer,
// les caractères hors Latin-1 sont remplacés (voir pdfText).

import "server-only";
import PDFDocument from "pdfkit";
import { COMPLETENESS_LABELS, REGION_LABELS } from "./catalog";
import { formatValue } from "./attributes";
import { formatCents, formatDelta, formatPercent } from "./money";
import { gradeText, type Report } from "./report";
import { PRIORITY_LABELS } from "./wishlist";
import { pdfText } from "./pdf-text";

const C = {
  accent: "#6250D6",
  ink: "#16181D",
  muted: "#6B6A64",
  line: "#DEDCE8",
  zebra: "#F6F5FB",
  group: "#EDEBFB",
  good: "#0A7D0A",
  bad: "#C0392B",
};
const MARGIN = 40;
const PAGE = { width: 595.28, height: 841.89 };
const CONTENT_W = PAGE.width - MARGIN * 2;
const BOTTOM = PAGE.height - MARGIN - 24; // réserve pour le pied de page

const money = (cents: number | null | undefined) => pdfText(formatCents(cents));
const toneOf = (v: number | null) => (v == null || v === 0 ? C.muted : v > 0 ? C.good : C.bad);

type Cell = { text: string; sub?: string; color?: string; bold?: boolean };
type Column = { label: string; width: number; align?: "left" | "right" };
type Row = Cell[] | { group: string };

function table(doc: PDFKit.PDFDocument, columns: Column[], rows: Row[]) {
  const pad = 4;
  const drawHeader = () => {
    const y = doc.y;
    doc.rect(MARGIN, y, CONTENT_W, 18).fill(C.accent);
    let x = MARGIN;
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");
    for (const col of columns) {
      doc.text(pdfText(col.label), x + pad, y + 5, { width: col.width - pad * 2, align: col.align ?? "left", lineBreak: false });
      x += col.width;
    }
    doc.y = y + 18;
  };

  drawHeader();
  let zebra = false;
  for (const row of rows) {
    if (!Array.isArray(row)) {
      if (doc.y + 18 + 20 > BOTTOM) {
        doc.addPage();
        drawHeader();
      }
      const y = doc.y;
      doc.rect(MARGIN, y, CONTENT_W, 16).fill(C.group);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.accent).text(pdfText(row.group), MARGIN + pad, y + 4, { width: CONTENT_W - pad * 2, lineBreak: false });
      doc.y = y + 16;
      zebra = false;
      continue;
    }

    // Hauteur de ligne : la cellule la plus haute (texte + sous-ligne éventuelle).
    const heights = row.map((cell, i) => {
      const w = columns[i].width - pad * 2;
      doc.font(cell.bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5);
      let h = doc.heightOfString(pdfText(cell.text || " "), { width: w });
      if (cell.sub) {
        doc.font("Helvetica").fontSize(7);
        h += 1 + doc.heightOfString(pdfText(cell.sub), { width: w });
      }
      return h;
    });
    const h = Math.max(...heights) + pad * 2;
    if (doc.y + h > BOTTOM) {
      doc.addPage();
      drawHeader();
    }
    const y = doc.y;
    if (zebra) doc.rect(MARGIN, y, CONTENT_W, h).fill(C.zebra);
    zebra = !zebra;

    let x = MARGIN;
    row.forEach((cell, i) => {
      const col = columns[i];
      const w = col.width - pad * 2;
      doc.font(cell.bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(cell.color ?? C.ink);
      doc.text(pdfText(cell.text), x + pad, y + pad, { width: w, align: col.align ?? "left" });
      if (cell.sub) {
        doc.font("Helvetica").fontSize(7).fillColor(C.muted).text(pdfText(cell.sub), x + pad, doc.y + 1, { width: w, align: col.align ?? "left" });
      }
      x += col.width;
    });
    doc.moveTo(MARGIN, y + h).lineTo(MARGIN + CONTENT_W, y + h).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.y = y + h;
  }
  doc.x = MARGIN;
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  if (doc.y + 60 > BOTTOM) doc.addPage();
  else doc.moveDown(1.2);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.ink).text(pdfText(title), MARGIN, doc.y);
  doc.moveDown(0.4);
}

function statBoxes(doc: PDFKit.PDFDocument, stats: { label: string; value: string; color?: string }[]) {
  const gap = 8;
  const w = (CONTENT_W - gap * (stats.length - 1)) / stats.length;
  const y = doc.y;
  stats.forEach((s, i) => {
    const x = MARGIN + i * (w + gap);
    doc.roundedRect(x, y, w, 52, 6).lineWidth(0.8).strokeColor(C.line).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(pdfText(s.label), x + 10, y + 10, { width: w - 20 });
    doc.font("Helvetica-Bold").fontSize(15).fillColor(s.color ?? C.ink).text(pdfText(s.value), x + 10, y + 24, { width: w - 20, lineBreak: false });
  });
  doc.y = y + 52;
  doc.x = MARGIN;
}

export async function buildPdf(report: Report): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    bufferPages: true,
    info: { Title: "RetroGame Vault - Ma collection", Author: "RetroGame Vault" },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const dateLabel = report.generatedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // En-tête
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.accent).text("RETROGAME VAULT", MARGIN, MARGIN, { characterSpacing: 1.5 });
  doc.font("Helvetica-Bold").fontSize(22).fillColor(C.ink).text("Ma collection");
  doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(pdfText(`Au ${dateLabel}${report.filterLabel ? ` · filtre : ${report.filterLabel}` : ""}`));
  doc.moveDown(1);

  const { totals } = report;
  const gainCents = totals.valueCents - totals.investedCents;
  const ratio = totals.investedCents > 0 ? gainCents / totals.investedCents : null;
  statBoxes(doc, [
    { label: "Pièces", value: String(totals.count) },
    { label: "Valeur estimée", value: formatCents(totals.valueCents, { round: true }) },
    { label: "Investi", value: formatCents(totals.investedCents, { round: true }) },
    { label: "Plus-value", value: `${formatDelta(gainCents)}`, color: toneOf(gainCents) },
  ]);
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(
    pdfText(
      `ROI ${formatPercent(ratio)}` +
        (totals.unpriced > 0 ? ` · ${totals.unpriced} pièce(s) sans cote, comptée(s) à leur prix d'achat` : "")
    )
  );

  if (report.rows.length === 0) {
    doc.moveDown(2).font("Helvetica").fontSize(11).fillColor(C.muted).text("Aucun exemplaire ne correspond.");
  } else {
    // Répartition par console
    sectionTitle(doc, "Répartition par console");
    table(
      doc,
      [
        { label: "Console", width: 195 },
        { label: "Pièces", width: 50, align: "right" },
        { label: "Investi", width: 90, align: "right" },
        { label: "Valeur estimée", width: 90, align: "right" },
        { label: "Plus-value", width: CONTENT_W - 425, align: "right" },
      ],
      report.byPlatform.map((p) => [
        { text: p.name, bold: true },
        { text: String(p.count) },
        { text: money(p.investedCents) },
        { text: money(p.valueCents) },
        { text: pdfText(formatDelta(p.valueCents - p.investedCents)), color: toneOf(p.valueCents - p.investedCents) },
      ])
    );

    // Détail, regroupé par console
    sectionTitle(doc, "Détail de la collection");
    const rows: Row[] = [];
    let current = "";
    for (const r of report.rows) {
      if (r.product.platform.name !== current) {
        current = r.product.platform.name;
        const count = report.byPlatform.find((p) => p.name === current)?.count ?? 0;
        rows.push({ group: `${current} (${count})` });
      }
      const details = [
        ...(r.status === "FOR_SALE" ? [`À VENDRE${r.askingPriceCents != null ? ` ${formatCents(r.askingPriceCents, { round: true })}` : ""}`] : []),
        ...(r.status === "SOLD" ? [`VENDU${r.soldAt ? ` le ${r.soldAt.toLocaleDateString("fr-FR", { timeZone: "UTC" })}` : ""}`] : []),
        ...(r.product.accessoryType ? [r.product.accessoryType.name] : []),
        REGION_LABELS[r.region],
        COMPLETENESS_LABELS[r.completeness].label,
        ...([
          ["boîte", gradeText(r.boxGrade, r.boxScore)],
          ["notice", gradeText(r.manualGrade, r.manualScore)],
          ["support", gradeText(r.mediaGrade, r.mediaScore)],
        ] as const)
          .filter(([, g]) => g)
          .map(([k, g]) => `${k} ${g.toLowerCase()}`),
        ...r.attributeValues.flatMap((v) => {
          const a = report.attributes.find((x) => x.id === v.attributeId);
          if (!a) return [];
          return a.type === "BOOLEAN" ? [a.label.toLowerCase()] : [`${a.label.toLowerCase()} : ${formatValue(a, v.value)}`];
        }),
      ];
      rows.push([
        { text: r.product.title, sub: details.join(" · "), bold: true },
        { text: r.acquiredAt ? r.acquiredAt.toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "-" },
        { text: money(r.purchaseCents) },
        { text: money(r.valueCents), sub: r.manualValueCents != null ? "manuelle" : undefined },
        {
          text: r.deltaCents == null ? "-" : pdfText(formatDelta(r.deltaCents)),
          sub: r.ratio == null ? undefined : pdfText(formatPercent(r.ratio)),
          color: toneOf(r.deltaCents),
        },
      ]);
    }
    table(
      doc,
      [
        { label: "Titre", width: 235 },
        { label: "Acquis le", width: 60 },
        { label: "Achat", width: 70, align: "right" },
        { label: "Valeur", width: 75, align: "right" },
        { label: "Plus-value", width: CONTENT_W - 440, align: "right" },
      ],
      rows
    );
  }

  if (report.sales && report.sales.length > 0) {
    const net = report.sales.reduce((s, r) => s + (r.valueCents ?? 0), 0);
    const realized = report.sales.reduce((s, r) => s + (r.deltaCents ?? 0), 0);
    sectionTitle(doc, "Ventes");
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.muted)
      .text(pdfText(`${report.sales.length} vente(s) · ${formatCents(net)} encaissés · plus-value réalisée ${formatDelta(realized)}`));
    doc.moveDown(0.4);
    table(
      doc,
      [
        { label: "Titre", width: 215 },
        { label: "Vendu le", width: 60 },
        { label: "Achat", width: 70, align: "right" },
        { label: "Net encaissé", width: 80, align: "right" },
        { label: "Plus-value", width: CONTENT_W - 425, align: "right" },
      ],
      report.sales.map((r) => [
        {
          text: r.product.title,
          sub: [r.product.platform.shortName, r.product.accessoryType?.name, COMPLETENESS_LABELS[r.completeness].label, r.saleChannel].filter(Boolean).join(" · "),
          bold: true,
        },
        { text: r.soldAt ? r.soldAt.toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "-" },
        { text: money(r.purchaseCents) },
        { text: money(r.valueCents), sub: r.saleFeesCents ? pdfText(`frais ${formatCents(r.saleFeesCents)} déduits`) : undefined },
        { text: r.deltaCents == null ? "-" : pdfText(formatDelta(r.deltaCents)), color: toneOf(r.deltaCents) },
      ])
    );
  }

  if (report.wishlist && report.wishlist.length > 0) {
    sectionTitle(doc, "Wishlist");
    table(
      doc,
      [
        { label: "Titre", width: 225 },
        { label: "Priorité", width: 60 },
        { label: "Prix cible", width: 75, align: "right" },
        { label: "Cote", width: 75, align: "right" },
        { label: "", width: CONTENT_W - 435, align: "right" },
      ],
      report.wishlist.map((w) => [
        { text: w.product.title, sub: `${w.product.platform.shortName} · ${REGION_LABELS[w.region]} · ${COMPLETENESS_LABELS[w.completeness].label}`, bold: true },
        { text: PRIORITY_LABELS[w.priority] ?? "" },
        { text: money(w.targetPriceCents) },
        { text: money(w.market) },
        w.deal ? { text: "Sous la cible", color: C.good, bold: true } : { text: "" },
      ])
    );
  }

  // Pied de page sur chaque page (marge basse neutralisée pour ne pas créer de page).
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(C.muted)
      .text(pdfText(`RetroGame Vault · ${dateLabel} · page ${i + 1} / ${range.count}`), MARGIN, PAGE.height - MARGIN + 8, {
        width: CONTENT_W,
        align: "right",
        lineBreak: false,
      });
  }

  doc.end();
  return done;
}
