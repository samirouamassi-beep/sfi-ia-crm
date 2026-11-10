"use server";

// Paramétrage des plateformes. Référentiel commun (V0 mono-collectionneur) : une plateforme
// déjà utilisée par une fiche produit ne se supprime pas, elle se masque.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { FormState } from "@/lib/item-form";
import { uniqueSlug } from "@/lib/platforms";

const optText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined), z.string().max(max).optional());
const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(min).max(max).optional());

const PlatformSchema = z.object({
  name: z.string().trim().min(2, "Nom obligatoire").max(80),
  shortName: z.string().trim().min(1, "Abréviation obligatoire").max(12, "12 caractères maximum"),
  manufacturer: z.string().trim().min(1, "Constructeur obligatoire").max(60),
  releaseYear: optInt(1970, 2100),
  igdbId: optInt(1, 100_000),
  priceChartingName: optText(80),
  active: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

function refresh() {
  revalidatePath("/", "layout");
}

export async function savePlatform(id: string | null, _state: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const parsed = PlatformSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Vérifiez les champs signalés.", fieldErrors };
  }
  const v = parsed.data;
  const data = {
    name: v.name,
    shortName: v.shortName,
    manufacturer: v.manufacturer,
    releaseYear: v.releaseYear ?? null,
    igdbId: v.igdbId ?? null,
    priceChartingName: v.priceChartingName ?? null,
    active: v.active,
  };

  if (data.igdbId != null) {
    const clash = await prisma.platform.findFirst({ where: { igdbId: data.igdbId, ...(id && { id: { not: id } }) } });
    if (clash) return { error: `L'identifiant IGDB ${data.igdbId} est déjà utilisé par ${clash.name}.`, fieldErrors: { igdbId: "Déjà utilisé" } };
  }

  if (id) {
    await prisma.platform.update({ where: { id }, data });
  } else {
    const last = await prisma.platform.findFirst({ orderBy: { sortOrder: "desc" } });
    await prisma.platform.create({ data: { ...data, slug: await uniqueSlug(v.name), sortOrder: (last?.sortOrder ?? -1) + 1 } });
  }
  refresh();
  redirect("/settings/platforms");
}

export async function togglePlatform(id: string) {
  await requireUserId();
  const p = await prisma.platform.findUniqueOrThrow({ where: { id } });
  await prisma.platform.update({ where: { id }, data: { active: !p.active } });
  refresh();
}

/** Échange la position avec la voisine (dir -1 = monter, +1 = descendre). */
export async function movePlatform(id: string, dir: -1 | 1) {
  await requireUserId();
  const all = await prisma.platform.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true } });
  const i = all.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await prisma.$transaction(all.map((p, position) => prisma.platform.update({ where: { id: p.id }, data: { sortOrder: position } })));
  refresh();
}

export async function deletePlatform(id: string) {
  await requireUserId();
  const used = await prisma.product.count({ where: { platformId: id } });
  if (used > 0) {
    // Garde-fou : le bouton n'est proposé que pour une plateforme inutilisée.
    await prisma.platform.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.platform.delete({ where: { id } });
  }
  refresh();
  redirect("/settings/platforms");
}
