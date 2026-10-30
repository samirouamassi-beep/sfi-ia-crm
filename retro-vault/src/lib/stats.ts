// Agrégats du tableau de bord.

import "server-only";
import { prisma } from "./db";
import { loadPriceIndex } from "./collection";
import { buildTimeline, computeMovers, itemValueAt, monthEnds, ownedSince, type ValuedItem } from "./history";
import type { Completeness } from "./catalog";

const MOVERS_WINDOW_DAYS = 30;
const MAX_TIMELINE_MONTHS = 24;

export async function loadDashboard(userId: string) {
  const items = await prisma.collectionItem.findMany({
    where: { userId },
    include: { product: { include: { platform: true } } },
  });
  const index = await loadPriceIndex(items.map((i) => i.productId));
  const now = new Date();
  const valued: ValuedItem[] = items;

  // Courbe : depuis la première acquisition, bornée à 24 mois, au moins 6 mois.
  const earliest = items.reduce<Date>((min, i) => (ownedSince(i) < min ? ownedSince(i) : min), now);
  const floor = new Date(now.getFullYear(), now.getMonth() - MAX_TIMELINE_MONTHS + 1, 1);
  const sixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const from = earliest < floor ? floor : earliest > sixMonths ? sixMonths : earliest;
  const timeline = buildTimeline(valued, index, monthEnds(from, now));

  const current = timeline[timeline.length - 1] ?? { valueCents: 0, investedCents: 0 };
  const withValue = items.map((item) => ({ item, valueCents: itemValueAt(item, index, now) }));
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

  return {
    count: items.length,
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
