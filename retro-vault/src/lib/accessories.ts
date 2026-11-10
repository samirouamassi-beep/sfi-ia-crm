import "server-only";
import { prisma } from "./db";

/** Types d'accessoires proposés dans le formulaire : les actifs, plus `keepId` (type actuel). */
export function listAccessoryTypes(opts: { keepId?: string | null } = {}) {
  return prisma.accessoryType.findMany({
    where: { OR: [{ active: true }, ...(opts.keepId ? [{ id: opts.keepId }] : [])] },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}
