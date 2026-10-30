// Mise à jour des cotes : une ligne PriceSnapshot par produit/région/jour.

import "server-only";
import type { Region } from "@/generated/prisma/enums";
import { prisma } from "../db";
import { priceCharting } from "./pricecharting";
import type { PriceProvider } from "./types";

export const provider: PriceProvider = priceCharting;

function today(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Trouve (ou mémorise) la fiche de la source correspondant au produit dans la région. */
async function resolveSourceId(productId: string, region: Region): Promise<string | null> {
  const link = await prisma.priceSourceLink.findUnique({
    where: { productId_region_provider: { productId, region, provider: provider.name } },
  });
  if (link) return link.sourceId;

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { platform: true },
  });
  const platformName = product.platform.priceChartingName ?? product.platform.name;
  const matches = await provider.search(product.title, platformName, region);
  const match = matches.find((m) => m.region === region);
  if (!match) return null;

  await prisma.priceSourceLink.create({
    data: { productId, region, provider: provider.name, sourceId: match.sourceId, label: `${match.title} (${match.platformLabel})` },
  });
  return match.sourceId;
}

export async function refreshPrice(productId: string, region: Region): Promise<boolean> {
  if (!provider.configured()) return false;
  const sourceId = await resolveSourceId(productId, region);
  if (!sourceId) return false;
  const quote = await provider.quote(sourceId);
  if (!quote) return false;

  const capturedAt = today();
  const data = {
    looseCents: quote.looseCents,
    cibCents: quote.cibCents,
    sealedCents: quote.sealedCents,
    boxOnlyCents: quote.boxOnlyCents ?? null,
    manualOnlyCents: quote.manualOnlyCents ?? null,
    source: provider.name,
  };
  await prisma.priceSnapshot.upsert({
    where: { productId_region_capturedAt: { productId, region, capturedAt } },
    create: { productId, region, capturedAt, ...data },
    update: data,
  });
  return true;
}

export type RefreshReport = { total: number; updated: number; failed: { key: string; error: string }[] };

/**
 * Rafraîchit toutes les paires produit/région présentes en collection ou en wishlist,
 * séquentiellement avec une pause (respect du débit de l'API).
 */
export async function refreshAllPrices(opts: { userId?: string; delayMs?: number } = {}): Promise<RefreshReport> {
  const where = opts.userId ? { userId: opts.userId } : {};
  const [items, wishes] = await Promise.all([
    prisma.collectionItem.findMany({ where, select: { productId: true, region: true }, distinct: ["productId", "region"] }),
    prisma.wishlistItem.findMany({ where, select: { productId: true, region: true }, distinct: ["productId", "region"] }),
  ]);
  const pairs = new Map<string, { productId: string; region: Region }>();
  for (const p of [...items, ...wishes]) pairs.set(`${p.productId}|${p.region}`, p);

  const report: RefreshReport = { total: pairs.size, updated: 0, failed: [] };
  if (!provider.configured()) return report;
  for (const [key, { productId, region }] of pairs) {
    try {
      if (await refreshPrice(productId, region)) report.updated += 1;
    } catch (e) {
      report.failed.push({ key, error: e instanceof Error ? e.message : String(e) });
    }
    await new Promise((r) => setTimeout(r, opts.delayMs ?? 1000));
  }
  return report;
}
