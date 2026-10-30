"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseItemForm, type FormState } from "@/lib/item-form";
import { parseEurosToCents } from "@/lib/money";
import { refreshPrice } from "@/lib/pricing";
import { findOrCreateProduct } from "@/lib/products";

const WishSchema = z.object({
  priority: z.coerce.number().int().min(1).max(3),
  target: z.string().optional(),
});

export async function addWish(_state: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  // Réutilise la validation du formulaire exemplaire (plateforme, titre, IGDB, région, format).
  const product = parseItemForm(formData);
  if (!product.data) return product.state;
  const wish = WishSchema.safeParse(Object.fromEntries(formData));
  if (!wish.success) return { error: "Priorité invalide." };

  const target = wish.data.target ? parseEurosToCents(wish.data.target) : null;
  if (wish.data.target && target == null) return { error: "Prix cible invalide.", fieldErrors: { target: "Montant invalide" } };

  const p = await findOrCreateProduct(product.data);
  const { region, completeness } = product.data;
  const key = { userId, productId: p.id, region, completeness };
  await prisma.wishlistItem.upsert({
    where: { userId_productId_region_completeness: key },
    create: { ...key, targetPriceCents: target, priority: wish.data.priority },
    update: { targetPriceCents: target, priority: wish.data.priority },
  });
  after(() => refreshPrice(p.id, region).catch((e) => console.error("[cotation]", e)));
  revalidatePath("/wishlist");
  return { ok: true };
}

export async function removeWish(id: string) {
  const userId = await requireUserId();
  await prisma.wishlistItem.deleteMany({ where: { id, userId } });
  revalidatePath("/wishlist");
}
