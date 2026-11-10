// Agrégats du tableau de bord.

import "server-only";
import { prisma } from "./db";
import { loadPriceIndex } from "./collection";
import { buildTimeline, computeMovers, itemValueAt, monthEnds, ownedSince, type ValuedItem } from "./history";
import type { Completeness } from "./catalog";
import { realizedGain, saleNetCents } from "./valuation";

const MOVERS_WINDOW_DAYS = 30;
const MAX_TIMELINE_MONTHS = 24;

export async function loadDashboard(userId: string) {
  const items = await prisma.collectionItem.findMany({
    where: { userId },
    include: { product: { include: { platform: true } } },
  });
  const index = await loadPriceIndex(items.map((i) => i.productId));
  const now = new Date();
  // La courbe intègre les exemplaires vendus jusqu'à leur date de vente ; le reste du tableau
  // de bord ne porte que sur la collection actuelle.
  const valued: ValuedItem[] = items.map((i) => (i.status === "SOLD" ? { ...i, soldAt: i.soldAt ?? i.updatedAt } : i));
  const owned = items.filter((i) => i.status !== "SOLD");
  const sold = items.filter((i) => i.status === "SOLD");
  const forSale = items.filter((i) => i.status === "FOR_SALE");

  // Courbe : depuis la première acquisition, bornée à 24 mois, au moins 6 mois.
  const earliest = items.reduce<Date>((min, i) => (ownedSince(i) < min ? ownedSince(i) : min), now);
  const floor = new Date(now.getFullYear(), now.getMonth() - MAX_TIMELINE_MONTHS + 1, 1);
  const sixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const from = earliest < floor ? floor : earliest > sixMonths ? sixMonths : earliest;
  const timeline = buildTimeline(valued, index, monthEnds(from, now));

  const current = timeline[timeline.length - 1] ?? { valueCents: 0, investedCents: 0 };
  const withValue = owned.map((item) => ({ item, valueCents: itemValueAt(item, index, now) }));
  const unpriced = withValue.filter((x) => x.valueCents == null).length;

  const since = new Date(now.getTime() - MOVERS_WINDOW_DAYS * 86_400_000);
  const movers = computeMovers(valued, index, since, now);
  const byId = new Map(items.map((i) => [i.id, i]));
  const withItem = (m: (typeof movers)[number]) => ({ ...m, item: byId.get(m.itemId)! });

  const platforms = new Map<string, { name: string; count: number; valueCents: number }>();
  const completeness: Record<Completeness, number> = { LOOSE: 0, CIB: 0, SEALED: 0 };
  for (const { item, valueCents } of withValue) {
    const p = platforms.get(item.product.platformId) ?? { name: item.product.platform.shortName, count: 0, valueCents: 0 };
    p.count += 1;
    p.valueCents += valueCents ?? item.purchaseCents ?? 0;
    platforms.set(item.product.platformId, p);
    completeness[item.completeness] += 1;
  }

  const sales = {
    count: sold.length,
    revenueCents: sold.reduce((s, i) => s + (saleNetCents(i) ?? 0), 0),
    realizedCents: sold.reduce((s, i) => s + (realizedGain(i).deltaCents ?? 0), 0),
  };

  return {
    count: owned.length,
    sales,
    forSale: { count: forSale.length, askingCents: forSale.reduce((s, i) => s + (i.askingPriceCents ?? 0), 0) },
    valueCents: current.valueCents,
    investedCents: current.investedCents,
    unpriced,
    timeline,
    gainers: movers.filter((m) => m.deltaCents > 0).slice(0, 5).map(withItem),
    losers: movers.filter((m) => m.deltaCents < 0).slice(0, 5).map(withItem),
    moversWindowDays: MOVERS_WINDOW_DAYS,
    topPieces: withValue
      .filter((x) => x.valueCents != null)
      .sort((a, b) => b.valueCents! - a.valueCents!)
      .slice(0, 5),
    platforms: [...platforms.values()].sort((a, b) => b.valueCents - a.valueCents),
    completeness,
  };
}

export type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;
