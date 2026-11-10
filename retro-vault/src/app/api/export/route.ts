import { NextResponse, type NextRequest } from "next/server";
import { currentUserId } from "@/lib/auth";
import { buildWorkbook } from "@/lib/export-excel";
import { buildPdf } from "@/lib/export-pdf";
import { loadReport } from "@/lib/report";
import { exportTable, tableToCsv } from "@/lib/transfer";

// Formats :
//  - csv / json : sauvegarde brute, réimportable (Plus → Importer)
//  - xlsx / pdf : documents lisibles, valorisés, qui respectent les filtres de la collection
//    (mêmes paramètres d'URL que /collection : q, platform, completeness…)
const FORMATS = ["csv", "json", "xlsx", "pdf"] as const;
type Format = (typeof FORMATS)[number];

const MIME: Record<Format, string> = {
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

export async function GET(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const requested = params.get("format");
  const format: Format = FORMATS.find((f) => f === requested) ?? "csv";
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = {
    "Content-Type": MIME[format],
    "Content-Disposition": `attachment; filename="retrovault-collection-${stamp}.${format}"`,
    "Cache-Control": "no-store",
  };

  if (format === "xlsx" || format === "pdf") {
    const report = await loadReport(userId, Object.fromEntries(params));
    const body = format === "xlsx" ? await buildWorkbook(report) : await buildPdf(report);
    return new NextResponse(new Uint8Array(body), { headers });
  }

  const table = await exportTable(userId);
  if (format === "json") {
    const body = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items: table.rows }, null, 2);
    return new NextResponse(body, { headers });
  }
  // BOM : ouverture correcte des accents dans Excel.
  return new NextResponse(`﻿${tableToCsv(table)}`, { headers });
}
