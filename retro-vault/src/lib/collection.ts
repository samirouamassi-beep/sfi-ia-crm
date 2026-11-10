// Lecture de la collection : filtres portés par l'URL, valorisation à la volée.

import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import {
  COMPLETENESS_VALUES,
  KIND_VALUES,
  REGION_VALUES,
  isEnumValue,
  type Completeness,
  type ProductKind,
  type Region,
} from "./catalog";
import { PriceIndex, type Snapshot } from "./history";
import { estimateValueCents, gain, realizedGain, saleNetCents } from "./valuation";

export const SORTS = {
  title: "Titre (A → Z)",
  value: "Valeur estimée",
  gain: "Plus-value",
  purchase: "Prix d'achat",
  acquired: "Date d'acquisition",
  added: "Ajout récent",
} as const;
export type SortKey = keyof typeof SORTS;

export type CollectionFilters = {
  q: string;
  platform: string | null; // slug
  completeness: Completeness | null;
  region: Region | null;
  /** Types de produit cochés (jeux, consoles, accessoires) ; vide = tous */
  kinds: ProductKind[];
  genre: string | null;
  /** Caractéristique oui/non cochée (id), ex. « Avec notice » */
  attr: string | null;
  /** Type d'accessoire (id) */
  accessory: string | null;
  /** Statut : par défaut la collection actuelle (en collection + à vendre) */
  status: StatusFilter;
  sort: SortKey;
};

export const STATUS_FILTERS = {
  owned: "En collection",
  for_sale: "À vendre",
  sold: "Vendus",
  all: "Tous (vendus inclus)",
} as const;
export type StatusFilter = keyof typeof STATUS_FILTERS;

const STATUS_WHERE: Record<StatusFilter, Prisma.CollectionItemWhereInput> = {
  owned: { status: { not: "SOLD" } },
  for_sale: { status: "FOR_SALE" },
  sold: { status: "SOLD" },
  all: {},
};

type RawParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** `kind=CONSOLE,ACCESSORY` (cases cochées) ; tous cochés = pas de filtre. */
function parseKinds(raw: string | string[] | undefined): ProductKind[] {
  const values = (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .flatMap((v) => v.split(","))
    .filter((v): v is ProductKind => isEnumValue(KIND_VALUES, v));
  const unique = [...new Set(values)];
  return unique.length === KIND_VALUES.length ? [] : unique;
}

export function parseFilters(params: RawParams): CollectionFilters {
  const sort = one(params.sort);
  return {
    q: one(params.q).trim().slice(0, 100),
    platform: one(params.platform) || null,
    completeness: isEnumValue(COMPLETENESS_VALUES, one(params.completeness)) ? (one(params.completeness) as Completeness) : null,
    region: isEnumValue(REGION_VALUES, one(params.region)) ? (one(params.region) as Region) : null,
    kinds: parseKinds(params.kind),
    genre: one(params.genre) || null,
    attr: one(params.attr) || null,
    accessory: one(params.accessory) || null,
    status: one(params.status) in STATUS_FILTERS ? (one(params.status) as StatusFilter) : "owned",
    sort: sort in SORTS ? (sort as SortKey) : "added",
  };
}

export async function loadPriceIndex(productIds: string[]): Promise<PriceIndex> {
  if (productIds.length === 0) return new PriceIndex([]);
  const snapshots = await prisma.priceSnapshot.findMany({
    where: { productId: { in: [...new Set(productIds)] } },
    select: {
      productId: true, region: true, capturedAt: true,
      looseCents: true, cibCents: true, sealedCents: true, boxOnlyCents: true, manualOnlyCents: true,
    },
  });
  return new PriceIndex(snapshots satisfies Snapshot[]);
}

const itemInclude = {
  product: { include: { platform: true, accessoryType: true } },
  photos: { orderBy: { position: "asc" }, take: 1 },
  attributeValues: true,
} satisfies Prisma.CollectionItemInclude;

/**
 * valueCents : valeur estimée ; pour un exemplaire vendu, le net encaissé.
 * deltaCents / ratio : plus-value latente, ou réalisée si vendu.
 */
export type CollectionRow = Prisma.CollectionItemGetPayload<{ include: typeof itemInclude }> & {
  valueCents: number | null;
  quoteDate: Date | null;
  deltaCents: number | null;
  ratio: number | null;
};

export async function loadCollection(userId: string, f: CollectionFilters): Promise<CollectionRow[]> {
  const where: Prisma.CollectionItemWhereInput = {
    userId,
    ...STATUS_WHERE[f.status],
    ...(f.completeness && { completeness: f.completeness }),
    ...(f.region && { region: f.region }),
    ...(f.attr && { attributeValues: { some: { attributeId: f.attr, value: "true" } } }),
    product: {
      ...(f.q && { title: { contains: f.q, mode: "insensitive" } }),
      ...(f.platform && { platform: { slug: f.platform } }),
      ...(f.kinds.length > 0 && { kind: { in: f.kinds } }),
      ...(f.genre && { genres: { has: f.genre } }),
      ...(f.accessory && { accessoryTypeId: f.accessory }),
    },
  };
  const items = await prisma.collectionItem.findMany({ where, include: itemInclude });
  const index = await loadPriceIndex(items.map((i) => i.productId));
  const now = new Date();

  const rows: CollectionRow[] = items.map((item) => {
    if (item.status === "SOLD") {
      return { ...item, valueCents: saleNetCents(item), quoteDate: null, ...realizedGain(item) };
    }
    const quote = index.quoteAt(item.productId, item.region, now);
    const valueCents = estimateValueCents(item, quote);
    return { ...item, valueCents, quoteDate: quote?.capturedAt ?? null, ...gain(valueCents, item.purchaseCents) };
  });

  const desc = (a: number | null, b: number | null) => (b ?? -Infinity) - (a ?? -Infinity);
  const time = (d: Date | null) => d?.getTime() ?? null;
  const sorters: Record<SortKey, (a: CollectionRow, b: CollectionRow) => number> = {
    title: (a, b) => a.product.title.localeCompare(b.product.title, "fr"),
    value: (a, b) => desc(a.valueCents, b.valueCents),
    gain: (a, b) => desc(a.deltaCents, b.deltaCents),
    purchase: (a, b) => desc(a.purchaseCents, b.purchaseCents),
    acquired: (a, b) => desc(time(a.acquiredAt), time(b.acquiredAt)),
    added: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  };
  return rows.sort(sorters[f.sort]);
}

/** Valeurs proposées dans les filtres (plateformes et genres présents dans la collection). */
export async function loadFilterOptions(userId: string) {
  const [products, flags, accessories] = await Promise.all([
    prisma.product.findMany({
      where: { items: { some: { userId } } },
      select: { genres: true, platform: { select: { slug: true, shortName: true, sortOrder: true } } },
    }),
    prisma.itemAttribute.findMany({
      where: { userId, type: "BOOLEAN" },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true, label: true },
    }),
    prisma.accessoryType.findMany({
      where: { products: { some: { items: { some: { userId } } } } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  const platforms = new Map<string, { slug: string; shortName: string; sortOrder: number }>();
  const genres = new Set<string>();
  for (const p of products) {
    platforms.set(p.platform.slug, p.platform);
    p.genres.forEach((g) => genres.add(g));
  }
  return {
    platforms: [...platforms.values()].sort((a, b) => a.sortOrder - b.sortOrder),
    genres: [...genres].sort((a, b) => a.localeCompare(b, "fr")),
    flags,
    accessories,
  };
}
