import { NextResponse, type NextRequest } from "next/server";
import { currentUserId } from "@/lib/auth";
import { exportRows, rowsToCsv } from "@/lib/transfer";

export async function GET(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const rows = await exportRows(userId);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `retrovault-collection-${stamp}.${format}`;
  const headers = { "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" };

  if (format === "json") {
    const body = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items: rows }, null, 2);
    return new NextResponse(body, { headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
  }
  // BOM : ouverture correcte des accents dans Excel.
  return new NextResponse(`﻿${rowsToCsv(rows)}`, { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
}
