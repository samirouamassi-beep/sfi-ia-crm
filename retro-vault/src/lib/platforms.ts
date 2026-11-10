import "server-only";
import { prisma } from "./db";

/**
 * Plateformes proposées dans les formulaires : les actives, plus `keepId` (plateforme actuelle
 * d'un exemplaire en cours d'édition, même masquée depuis).
 */
export function listPlatforms(opts: { keepId?: string } = {}) {
  return prisma.platform.findMany({
    where: { OR: [{ active: true }, ...(opts.keepId ? [{ id: opts.keepId }] : [])] },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, shortName: true, manufacturer: true },
  });
}

/** Identifiant d'URL dérivé du nom : "Super Nintendo" -> "super-nintendo". */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "plateforme";
}

export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = slugify(base);
  for (let i = 1; ; i++) {
    const slug = i === 1 ? root : `${root}-${i}`;
    const taken = await prisma.platform.findFirst({ where: { slug, ...(exceptId && { id: { not: exceptId } }) } });
    if (!taken) return slug;
  }
}
