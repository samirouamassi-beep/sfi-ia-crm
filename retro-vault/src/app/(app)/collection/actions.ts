"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ItemStatus } from "@/lib/catalog";
import { parseEurosToCents } from "@/lib/money";
import { requireUserId } from "@/lib/auth";
import { parseItemForm, type FormState, type ItemFormValues } from "@/lib/item-form";
import { findOrCreateProduct } from "@/lib/products";
import { refreshPrice } from "@/lib/pricing";
import { PhotoError, deletePhoto, uploadPhoto } from "@/lib/storage";
import { parseAttributeFields } from "@/lib/attributes";
import { listAttributes, saveAttributeValues } from "@/lib/attributes-store";

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

/** Formulaire complet : champs fixes + caractéristiques personnalisées actives. */
async function parseForm(userId: string, formData: FormData) {
  const parsed = parseItemForm(formData);
  const attributes = await listAttributes(userId, { activeOnly: true });
  const kind = parsed.data?.kind ?? "GAME";
  const attrs = parseAttributeFields(formData, attributes, kind);
  if (parsed.data?.accessoryTypeId && !(await prisma.accessoryType.findUnique({ where: { id: parsed.data.accessoryTypeId } }))) {
    attrs.errors.accessoryTypeId = "Type d'accessoire inconnu";
  }
  const attrErrors = Object.keys(attrs.errors).length > 0;
  if (!parsed.data || attrErrors) {
    return {
      state: {
        error: "Vérifiez les champs signalés.",
        fieldErrors: { ...(parsed.state?.fieldErrors ?? {}), ...attrs.errors },
      } satisfies FormState,
    } as const;
  }
  return { data: parsed.data, attributeValues: attrs.values } as const;
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
    // Accessoire : type choisi (ou retiré) dans le formulaire ; sinon type du produit inchangé.
    accessoryTypeId: v.kind === "ACCESSORY" ? (v.accessoryTypeId ?? null) : undefined,
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
  const parsed = await parseForm(userId, formData);
  if (!parsed.data) return parsed.state;

  const product = await productFor(parsed.data);
  const item = await prisma.collectionItem.create({
    data: { userId, productId: product.id, ...itemData(parsed.data) },
  });
  await saveAttributeValues(item.id, parsed.attributeValues);
  const photoWarning = await savePhotos(userId, item.id, formData);
  refreshPriceLater(product.id, item.region);

  revalidatePath("/", "layout");
  redirect(`/collection/${item.id}${photoWarning ? `?warning=${encodeURIComponent(photoWarning)}` : ""}`);
}

export async function updateItem(itemId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = await parseForm(userId, formData);
  if (!parsed.data) return parsed.state;

  const existing = await prisma.collectionItem.findFirst({ where: { id: itemId, userId } });
  if (!existing) return { error: "Exemplaire introuvable." };

  const product = await productFor(parsed.data);
  await prisma.collectionItem.update({
    where: { id: itemId },
    data: { productId: product.id, ...itemData(parsed.data) },
  });
  await saveAttributeValues(itemId, parsed.attributeValues);
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

const SaleSchema = z
  .object({
    status: z.enum(ItemStatus),
    asking: z.string().optional(),
    soldAt: z.string().optional(),
    salePrice: z.string().optional(),
    saleFees: z.string().optional(),
    saleChannel: z.string().trim().max(60).optional(),
  })
  .transform((v, ctx) => {
    const cents = (field: "asking" | "salePrice" | "saleFees", label: string) => {
      if (!v[field]) return null;
      const c = parseEurosToCents(v[field]);
      if (c == null) ctx.addIssue({ code: "custom", path: [field], message: `${label} : montant invalide` });
      return c;
    };
    if (v.status === "SOLD") {
      const salePriceCents = cents("salePrice", "Prix de vente");
      if (salePriceCents == null && !v.salePrice) ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Prix de vente obligatoire" });
      if (!v.soldAt || !/^\d{4}-\d{2}-\d{2}$/.test(v.soldAt)) ctx.addIssue({ code: "custom", path: ["soldAt"], message: "Date de vente obligatoire" });
      return {
        status: v.status,
        askingPriceCents: null,
        soldAt: v.soldAt ? new Date(`${v.soldAt}T00:00:00Z`) : null,
        salePriceCents,
        saleFeesCents: cents("saleFees", "Frais"),
        saleChannel: v.saleChannel || null,
      };
    }
    // Retour « en collection » ou « à vendre » : les informations de vente sont effacées.
    return {
      status: v.status,
      askingPriceCents: v.status === "FOR_SALE" ? cents("asking", "Prix demandé") : null,
      soldAt: null,
      salePriceCents: null,
      saleFeesCents: null,
      saleChannel: null,
    };
  });

/** Carte « Vente » de la fiche : en collection / à vendre / vendu. */
export async function updateSale(itemId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const item = await prisma.collectionItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return { error: "Exemplaire introuvable." };
  const parsed = SaleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Vérifiez les champs signalés.", fieldErrors };
  }
  await prisma.collectionItem.update({ where: { id: itemId }, data: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true };
}
