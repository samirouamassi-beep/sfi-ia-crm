// Données des exports « lisibles » (Excel, PDF) : collection valorisée, éventuellement filtrée
// comme la liste à l'écran, totaux, répartition par console et wishlist.

import "server-only";
import { prisma } from "./db";
import { COMPLETENESS_LABELS, GRADE_LABELS, KIND_LABELS, REGION_LABELS, type Grade } from "./catalog";
import { listAttributes } from "./attributes-store";
import { SORTS, loadCollection, parseFilters, type CollectionFilters, type CollectionRow } from "./collection";
import { loadWishlist, type WishRow } from "./wishlist";
import type { AttributeDef } from "./attributes";

export type PlatformTotal = { name: string; count: number; investedCents: number; valueCents: number };

export type Report = {
  generatedAt: Date;
  /** Filtres actifs en clair, vide si toute la collection */
  filterLabel: string;
  rows: CollectionRow[];
  attributes: AttributeDef[];
  totals: { count: number; investedCents: number; valueCents: number; unpriced: number };
  byPlatform: PlatformTotal[];
  /** Incluse seulement pour un export de toute la collection */
  wishlist: WishRow[] | null;
};

function isFiltered(f: CollectionFilters) {
  return Boolean(f.q || f.platform || f.completeness || f.region || f.kind || f.genre || f.attr);
}

async function describeFilters(f: CollectionFilters, attributes: AttributeDef[]): Promise<string> {
  const parts: string[] = [];
  if (f.q) parts.push(`recherche « ${f.q} »`);
  if (f.platform) {
    const p = await prisma.platform.findUnique({ where: { slug: f.platform }, select: { name: true } });
    parts.push(`console : ${p?.name ?? f.platform}`);
  }
  if (f.kind) parts.push(`type : ${KIND_LABELS[f.kind]}`);
  if (f.region) parts.push(`région : ${REGION_LABELS[f.region]}`);
  if (f.completeness) parts.push(`format : ${COMPLETENESS_LABELS[f.completeness].label}`);
  if (f.genre) parts.push(`genre : ${f.genre}`);
  if (f.attr) parts.push(`avec : ${attributes.find((a) => a.id === f.attr)?.label ?? "?"}`);
  return parts.join(" · ");
}

export async function loadReport(userId: string, params: Record<string, string | string[] | undefined>): Promise<Report> {
  // Sans tri demandé, ordre « catalogue » : console puis titre.
  const filters = parseFilters({ ...params, sort: params.sort && String(params.sort) in SORTS ? params.sort : "title" });
  const [rows, attributes] = await Promise.all([loadCollection(userId, filters), listAttributes(userId)]);
  if (!params.sort) rows.sort((a, b) => a.product.platform.sortOrder - b.product.platform.sortOrder);

  const byPlatform = new Map<string, PlatformTotal>();
  let investedCents = 0;
  let valueCents = 0;
  let unpriced = 0;
  for (const r of rows) {
    const value = r.valueCents ?? r.purchaseCents ?? 0;
    investedCents += r.purchaseCents ?? 0;
    valueCents += value;
    if (r.valueCents == null) unpriced += 1;
    const p = byPlatform.get(r.product.platformId) ?? { name: r.product.platform.name, count: 0, investedCents: 0, valueCents: 0 };
    p.count += 1;
    p.investedCents += r.purchaseCents ?? 0;
    p.valueCents += value;
    byPlatform.set(r.product.platformId, p);
  }

  const filtered = isFiltered(filters);
  return {
    generatedAt: new Date(),
    filterLabel: filtered ? await describeFilters(filters, attributes) : "",
    rows,
    attributes,
    totals: { count: rows.length, investedCents, valueCents, unpriced },
    byPlatform: [...byPlatform.values()].sort((a, b) => b.valueCents - a.valueCents),
    wishlist: filtered ? null : await loadWishlist(userId),
  };
}

/** État des composants en clair : « Bon (7/10) », « Très bon », « — ». */
export function gradeText(grade: Grade | null, score: number | null): string {
  const parts = [grade ? GRADE_LABELS[grade] : null, score != null ? `${score}/10` : null].filter(Boolean);
  if (parts.length === 2) return `${parts[0]} (${parts[1]})`;
  return parts[0] ?? "";
}
