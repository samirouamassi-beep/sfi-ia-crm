// Accès base des caractéristiques personnalisées.

import "server-only";
import { prisma } from "./db";
import type { AttributeDef } from "./attributes";

const select = { id: true, label: true, type: true, options: true, kinds: true } as const;

export function listAttributes(userId: string, opts: { activeOnly?: boolean } = {}): Promise<AttributeDef[]> {
  return prisma.itemAttribute.findMany({
    where: { userId, ...(opts.activeOnly && { active: true }) },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select,
  });
}

/** Enregistre les valeurs lues du formulaire : null supprime la valeur. */
export async function saveAttributeValues(itemId: string, values: Map<string, string | null>) {
  const toDelete = [...values].filter(([, v]) => v === null).map(([id]) => id);
  const toUpsert = [...values].filter((e): e is [string, string] => e[1] !== null);
  await prisma.$transaction([
    prisma.itemAttributeValue.deleteMany({ where: { itemId, attributeId: { in: toDelete } } }),
    ...toUpsert.map(([attributeId, value]) =>
      prisma.itemAttributeValue.upsert({
        where: { itemId_attributeId: { itemId, attributeId } },
        create: { itemId, attributeId, value },
        update: { value },
      })
    ),
  ]);
}
