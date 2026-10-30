"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { parseItemForm, type FormState, type ItemFormValues } from "@/lib/item-form";
import { findOrCreateProduct } from "@/lib/products";
import { refreshPrice } from "@/lib/pricing";
import { PhotoError, deletePhoto, uploadPhoto } from "@/lib/storage";

const MAX_PHOTOS_PER_SUBMIT = 4;

function itemData(v: ItemFormValues) {
  return {
    region: v.region,
    completeness: v.completeness,
    boxGrade: v.boxGrade ?? null,
    manualGrade: v.manualGrade ?? null,
    mediaGrade: v.mediaGrade ?? null,
    boxScore: v.boxScore ?? null,
    manualScore: v.manualScore ?? null,
    mediaScore: v.mediaScore ?? null,
    acquiredAt: v.acquiredAt ?? null,
    purchaseCents: v.purchase,
    manualValueCents: v.manualValue,
    notes: v.notes ?? null,
  };
}

async function productFor(v: ItemFormValues) {
  return findOrCreateProduct({
    kind: v.kind,
    title: v.title,
    platformId: v.platformId,
    igdbId: v.igdbId,
    coverUrl: v.coverUrl,
    releaseYear: v.releaseYear,
    developer: v.developer,
    publisher: v.publisher,
    genres: v.genres,
    summary: v.summary,
  });
}

async function savePhotos(userId: string, itemId: string, formData: FormData): Promise<string | null> {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const last = await prisma.itemPhoto.findFirst({ where: { itemId }, orderBy: { position: "desc" } });
  let position = (last?.position ?? -1) + 1;
  for (const file of files.slice(0, MAX_PHOTOS_PER_SUBMIT)) {
    try {
      const stored = await uploadPhoto(userId, itemId, file);
      await prisma.itemPhoto.create({ data: { itemId, ...stored, position: position++ } });
    } catch (e) {
      if (e instanceof PhotoError) return e.message;
      throw e;
    }
  }
  return files.length > MAX_PHOTOS_PER_SUBMIT ? `Seules les ${MAX_PHOTOS_PER_SUBMIT} premières photos ont été ajoutées.` : null;
}

/** Cote récupérée après la réponse : l'ajout reste instantané même si l'API est lente. */
function refreshPriceLater(productId: string, region: ItemFormValues["region"]) {
  after(async () => {
    try {
      await refreshPrice(productId, region);
    } catch (e) {
      console.error("[cotation]", e);
    }
  });
}

export async function createItem(_state: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parseItemForm(formData);
  if (!parsed.data) return parsed.state;

  const product = await productFor(parsed.data);
  const item = await prisma.collectionItem.create({
    data: { userId, productId: product.id, ...itemData(parsed.data) },
  });
  const photoWarning = await savePhotos(userId, item.id, formData);
  refreshPriceLater(product.id, item.region);

  revalidatePath("/", "layout");
  redirect(`/collection/${item.id}${photoWarning ? `?warning=${encodeURIComponent(photoWarning)}` : ""}`);
}

export async function updateItem(itemId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parseItemForm(formData);
  if (!parsed.data) return parsed.state;

  const existing = await prisma.collectionItem.findFirst({ where: { id: itemId, userId } });
  if (!existing) return { error: "Exemplaire introuvable." };

  const product = await productFor(parsed.data);
  await prisma.collectionItem.update({
    where: { id: itemId },
    data: { productId: product.id, ...itemData(parsed.data) },
  });
  const photoWarning = await savePhotos(userId, itemId, formData);
  if (product.id !== existing.productId || parsed.data.region !== existing.region) {
    refreshPriceLater(product.id, parsed.data.region);
  }

  revalidatePath("/", "layout");
  redirect(`/collection/${itemId}${photoWarning ? `?warning=${encodeURIComponent(photoWarning)}` : ""}`);
}

export async function deleteItem(itemId: string) {
  const userId = await requireUserId();
  const item = await prisma.collectionItem.findFirst({ where: { id: itemId, userId }, include: { photos: true } });
  if (!item) return;
  await prisma.collectionItem.delete({ where: { id: itemId } });
  await Promise.all(item.photos.map((p) => deletePhoto(p.storagePath)));
  revalidatePath("/", "layout");
  redirect("/collection");
}

export async function removePhoto(photoId: string) {
  const userId = await requireUserId();
  const photo = await prisma.itemPhoto.findFirst({ where: { id: photoId, item: { userId } } });
  if (!photo) return;
  await prisma.itemPhoto.delete({ where: { id: photoId } });
  await deletePhoto(photo.storagePath);
  revalidatePath(`/collection/${photo.itemId}`);
}

/** Bouton "Actualiser la cote" de la fiche. */
export async function refreshItemPrice(itemId: string) {
  const userId = await requireUserId();
  const item = await prisma.collectionItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return;
  await refreshPrice(item.productId, item.region);
  revalidatePath(`/collection/${itemId}`);
}
