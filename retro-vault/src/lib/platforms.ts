import "server-only";
import { prisma } from "./db";

export function listPlatforms() {
  return prisma.platform.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, shortName: true, manufacturer: true },
  });
}
