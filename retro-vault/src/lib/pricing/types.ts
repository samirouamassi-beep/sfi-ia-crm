import type { Region } from "@/generated/prisma/enums";
import type { PriceQuote } from "../valuation";

export type PriceMatch = { sourceId: string; title: string; platformLabel: string; region: Region };

/**
 * Source de cotation. Implémentations : PriceCharting (API payante). Une source "eBay ventes
 * conclues" ou un scraper éthique (robots.txt, cache, débit limité) se brancherait ici.
 */
export interface PriceProvider {
  readonly name: string;
  configured(): boolean;
  search(title: string, platformName: string, region: Region): Promise<PriceMatch[]>;
  quote(sourceId: string): Promise<PriceQuote | null>;
}
