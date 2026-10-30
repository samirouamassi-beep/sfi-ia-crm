import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { refreshAllPrices } from "@/lib/pricing";

// Relevé quotidien des cotes (Vercel Cron : voir vercel.json, ou `npm run prices:refresh`).
export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const report = await refreshAllPrices({ delayMs: 500 });
  return NextResponse.json(report);
}
