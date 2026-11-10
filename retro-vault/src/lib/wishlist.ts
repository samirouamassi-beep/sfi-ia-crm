// Wishlist : cote du marché en face du prix cible.

import "server-only";
import { prisma } from "./db";
import { loadPriceIndex } from "./collection";
import { basePriceCents } from "./valuation";

export const PRIORITY_LABELS: Record<number, string> = { 1: "Haute", 2: "Normale", 3: "Basse" };

export async function loadWishlist(userId: string) {
  const wishes = await prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: { include: { platform: true } } },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
  const index = await loadPriceIndex(wishes.map((w) => w.productId));
  const now = new Date();
  return wishes.map((w) => {
    const quote = index.quoteAt(w.productId, w.region, now);
    const market = quote ? basePriceCents(quote, w.completeness) : null;
    return { ...w, market, deal: market != null && w.targetPriceCents != null && market <= w.targetPriceCents };
  });
}

export type WishRow = Awaited<ReturnType<typeof loadWishlist>>[number];
