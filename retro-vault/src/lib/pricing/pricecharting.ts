// PriceCharting : https://www.pricecharting.com/api-documentation
// Les prix sont renvoyés en centimes de dollar ; convertis en centimes d'euro (USD_TO_EUR).

import type { Region } from "@/generated/prisma/enums";
import type { PriceQuote } from "../valuation";
import type { PriceMatch, PriceProvider } from "./types";

const BASE = "https://www.pricecharting.com/api";

type RawProduct = {
  id: string;
  "product-name": string;
  "console-name": string;
  "loose-price"?: number;
  "cib-price"?: number;
  "new-price"?: number;
  "box-only-price"?: number;
  "manual-only-price"?: number;
};

const REGION_PREFIX: Partial<Record<Region, string>> = { PAL: "PAL ", NTSC_J: "JP " };

export function regionFromConsoleName(consoleName: string): Region {
  if (consoleName.startsWith("PAL ")) return "PAL";
  if (consoleName.startsWith("JP ")) return "NTSC_J";
  return "NTSC_U";
}

export function consoleNameFor(baseName: string, region: Region): string {
  return `${REGION_PREFIX[region] ?? ""}${baseName}`;
}

function rate(): number {
  const r = Number(process.env.USD_TO_EUR ?? "0.92");
  return Number.isFinite(r) && r > 0 ? r : 0.92;
}

const toEur = (usdCents: number | undefined) =>
  usdCents == null || usdCents <= 0 ? null : Math.round(usdCents * rate());

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ t: process.env.PRICECHARTING_TOKEN!, ...params });
  const res = await fetch(`${BASE}/${path}?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`PriceCharting : HTTP ${res.status}`);
  const json = (await res.json()) as T & { status: string; "error-message"?: string };
  if (json.status !== "success") throw new Error(`PriceCharting : ${json["error-message"] ?? "erreur"}`);
  return json;
}

export const priceCharting: PriceProvider = {
  name: "pricecharting",

  configured: () => Boolean(process.env.PRICECHARTING_TOKEN),

  async search(title, platformName, region): Promise<PriceMatch[]> {
    const wanted = consoleNameFor(platformName, region).toLowerCase();
    const { products } = await call<{ products: RawProduct[] }>("products", {
      q: `${title} ${consoleNameFor(platformName, region)}`,
    });
    return products
      .map((p) => ({
        sourceId: p.id,
        title: p["product-name"],
        platformLabel: p["console-name"],
        region: regionFromConsoleName(p["console-name"]),
      }))
      .sort((a, b) => Number(b.platformLabel.toLowerCase() === wanted) - Number(a.platformLabel.toLowerCase() === wanted));
  },

  async quote(sourceId): Promise<PriceQuote | null> {
    const p = await call<RawProduct>("product", { id: sourceId });
    return {
      looseCents: toEur(p["loose-price"]),
      cibCents: toEur(p["cib-price"]),
      sealedCents: toEur(p["new-price"]),
      boxOnlyCents: toEur(p["box-only-price"]),
      manualOnlyCents: toEur(p["manual-only-price"]),
    };
  },
};
