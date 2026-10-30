// Séries temporelles de cotes : valeur d'un exemplaire à une date, courbe valeur vs
// investissement, plus fortes variations. Logique pure (testée dans history.test.ts).

import type { Region } from "@/generated/prisma/enums";
import { estimateValueCents, type ItemCondition, type PriceQuote } from "./valuation";

export type Snapshot = PriceQuote & { productId: string; region: Region; capturedAt: Date };

export type ValuedItem = ItemCondition & {
  id: string;
  productId: string;
  region: Region;
  acquiredAt: Date | null;
  createdAt: Date;
  purchaseCents: number | null;
};

const seriesKey = (productId: string, region: Region) => `${productId}|${region}`;

/** Index des cotes par produit/région, triées par date croissante. */
export class PriceIndex {
  private series = new Map<string, Snapshot[]>();

  constructor(snapshots: Snapshot[]) {
    for (const s of snapshots) {
      const k = seriesKey(s.productId, s.region);
      const list = this.series.get(k);
      if (list) list.push(s);
      else this.series.set(k, [s]);
    }
    for (const list of this.series.values()) {
      list.sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
    }
  }

  /**
   * Dernière cote connue à la date donnée. Repli sur la cote NTSC-U quand la région n'est
   * pas cotée (cas fréquent pour le PAL/NTSC-J sur PriceCharting).
   */
  quoteAt(productId: string, region: Region, at: Date): Snapshot | null {
    return (
      this.lastBefore(seriesKey(productId, region), at) ??
      (region !== "NTSC_U" ? this.lastBefore(seriesKey(productId, "NTSC_U"), at) : null)
    );
  }

  private lastBefore(key: string, at: Date): Snapshot | null {
    const list = this.series.get(key);
    if (!list) return null;
    const t = at.getTime();
    let lo = 0;
    let hi = list.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid].capturedAt.getTime() <= t) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found >= 0 ? list[found] : null;
  }
}

export function ownedSince(item: ValuedItem): Date {
  return item.acquiredAt ?? item.createdAt;
}

export function itemValueAt(item: ValuedItem, index: PriceIndex, at: Date): number | null {
  return estimateValueCents(item, index.quoteAt(item.productId, item.region, at));
}

export type TimelinePoint = { date: Date; valueCents: number; investedCents: number };

/** Fins de mois entre `from` et `to` (inclus), `to` étant toujours le dernier point. */
export function monthEnds(from: Date, to: Date): Date[] {
  const points: Date[] = [];
  let y = from.getFullYear();
  let m = from.getMonth();
  for (;;) {
    const end = new Date(y, m + 1, 0, 23, 59, 59);
    if (end >= to) break;
    points.push(end);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  points.push(to);
  return points;
}

/**
 * Valeur estimée vs investissement cumulé à chaque date. Un exemplaire sans cote à une date
 * donnée est compté à son prix d'achat (hypothèse neutre plutôt que zéro).
 */
export function buildTimeline(items: ValuedItem[], index: PriceIndex, dates: Date[]): TimelinePoint[] {
  return dates.map((date) => {
    let valueCents = 0;
    let investedCents = 0;
    for (const item of items) {
      if (ownedSince(item) > date) continue;
      const purchase = item.purchaseCents ?? 0;
      investedCents += purchase;
      valueCents += itemValueAt(item, index, date) ?? purchase;
    }
    return { date, valueCents, investedCents };
  });
}

export type Mover = {
  itemId: string;
  beforeCents: number;
  nowCents: number;
  deltaCents: number;
  ratio: number;
};

/** Variation de cote de chaque exemplaire entre `since` et `now` (valeurs manuelles exclues). */
export function computeMovers(items: ValuedItem[], index: PriceIndex, since: Date, now: Date): Mover[] {
  const movers: Mover[] = [];
  for (const item of items) {
    if (item.manualValueCents != null) continue;
    const before = itemValueAt(item, index, since);
    const current = itemValueAt(item, index, now);
    if (before == null || current == null || before === 0 || before === current) continue;
    movers.push({
      itemId: item.id,
      beforeCents: before,
      nowCents: current,
      deltaCents: current - before,
      ratio: (current - before) / before,
    });
  }
  return movers.sort((a, b) => Math.abs(b.ratio) - Math.abs(a.ratio));
}
