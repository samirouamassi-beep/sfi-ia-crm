// Référentiel produits : création ou réutilisation d'une fiche (jeu/console/accessoire).

import "server-only";
import { prisma } from "./db";
import type { ProductKind } from "./catalog";

export type ProductInput = {
  kind: ProductKind;
  title: string;
  platformId: string;
  igdbId?: number | null;
  coverUrl?: string | null;
  releaseYear?: number | null;
  developer?: string | null;
  publisher?: string | null;
  genres?: string[];
  summary?: string | null;
};

/**
 * Fiche IGDB => clé (igdbId, plateforme) ; saisie libre => titre exact (insensible à la casse)
 * sur la plateforme. Les métadonnées manquantes d'une fiche existante sont complétées.
 */
export async function findOrCreateProduct(input: ProductInput) {
  const title = input.title.trim();
  const existing = input.igdbId
    ? await prisma.product.findUnique({ where: { igdbId_platformId: { igdbId: input.igdbId, platformId: input.platformId } } })
    : await prisma.product.findFirst({
        where: { platformId: input.platformId, kind: input.kind, title: { equals: title, mode: "insensitive" } },
      });

  if (existing) {
    return prisma.product.update({
      where: { id: existing.id },
      data: {
        coverUrl: existing.coverUrl ?? input.coverUrl,
        releaseYear: existing.releaseYear ?? input.releaseYear,
        developer: existing.developer ?? input.developer,
        publisher: existing.publisher ?? input.publisher,
        summary: existing.summary ?? input.summary,
        genres: existing.genres.length ? existing.genres : (input.genres ?? []),
      },
    });
  }

  return prisma.product.create({
    data: {
      kind: input.kind,
      title,
      platformId: input.platformId,
      igdbId: input.igdbId ?? null,
      coverUrl: input.coverUrl ?? null,
      releaseYear: input.releaseYear ?? null,
      developer: input.developer ?? null,
      publisher: input.publisher ?? null,
      genres: input.genres ?? [],
      summary: input.summary ?? null,
    },
  });
}
