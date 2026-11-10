"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { ATTRIBUTE_SUGGESTIONS, parseOptions } from "@/lib/attributes";
import { AttributeType, ProductKind } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import type { FormState } from "@/lib/item-form";

const AttributeSchema = z
  .object({
    label: z.string().trim().min(2, "Nom obligatoire").max(60, "60 caractères maximum"),
    type: z.enum(AttributeType, { message: "Choisissez un type" }),
    options: z.string().optional().transform((s) => parseOptions(s ?? "")),
    kinds: z.array(z.enum(ProductKind)),
    active: z.boolean(),
  })
  .refine((v) => v.type !== "SELECT" || v.options.length >= 2, { message: "Au moins 2 choix", path: ["options"] });

function refresh() {
  revalidatePath("/", "layout");
}

async function nextPosition(userId: string) {
  const last = await prisma.itemAttribute.findFirst({ where: { userId }, orderBy: { position: "desc" } });
  return (last?.position ?? -1) + 1;
}

export async function saveAttribute(id: string | null, _state: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = AttributeSchema.safeParse({
    label: formData.get("label"),
    type: formData.get("type"),
    options: formData.get("options") ?? "",
    kinds: formData.getAll("kinds"),
    // Création : toujours active ; édition : case « Afficher dans le formulaire ».
    active: id ? formData.get("active") === "on" : true,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Vérifiez les champs signalés.", fieldErrors };
  }
  const v = parsed.data;
  const data = { label: v.label, type: v.type, options: v.type === "SELECT" ? v.options : [], kinds: v.kinds, active: v.active };

  const clash = await prisma.itemAttribute.findFirst({
    where: { userId, label: { equals: v.label, mode: "insensitive" }, ...(id && { id: { not: id } }) },
  });
  if (clash) return { error: `« ${clash.label} » existe déjà.`, fieldErrors: { label: "Nom déjà utilisé" } };

  if (id) {
    const existing = await prisma.itemAttribute.findFirst({ where: { id, userId } });
    if (!existing) return { error: "Caractéristique introuvable." };
    // Changer de type rendrait les valeurs saisies incohérentes : on les efface.
    await prisma.$transaction([
      ...(existing.type !== v.type ? [prisma.itemAttributeValue.deleteMany({ where: { attributeId: id } })] : []),
      ...(v.type === "SELECT" && existing.type === "SELECT"
        ? [prisma.itemAttributeValue.deleteMany({ where: { attributeId: id, value: { notIn: v.options } } })]
        : []),
      prisma.itemAttribute.update({ where: { id }, data }),
    ]);
  } else {
    await prisma.itemAttribute.create({ data: { ...data, userId, position: await nextPosition(userId) } });
  }
  refresh();
  redirect("/settings/attributes");
}

/** Ajout en un clic d'une caractéristique suggérée. */
export async function addSuggestedAttribute(label: string) {
  const userId = await requireUserId();
  const suggestion = ATTRIBUTE_SUGGESTIONS.find((s) => s.label === label);
  if (!suggestion) return;
  const exists = await prisma.itemAttribute.findFirst({ where: { userId, label: { equals: label, mode: "insensitive" } } });
  if (!exists) await prisma.itemAttribute.create({ data: { ...suggestion, userId, position: await nextPosition(userId) } });
  refresh();
}

export async function toggleAttribute(id: string) {
  const userId = await requireUserId();
  const a = await prisma.itemAttribute.findFirst({ where: { id, userId } });
  if (!a) return;
  await prisma.itemAttribute.update({ where: { id }, data: { active: !a.active } });
  refresh();
}

export async function moveAttribute(id: string, dir: -1 | 1) {
  const userId = await requireUserId();
  const all = await prisma.itemAttribute.findMany({ where: { userId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const i = all.findIndex((a) => a.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await prisma.$transaction(all.map((a, position) => prisma.itemAttribute.update({ where: { id: a.id }, data: { position } })));
  refresh();
}

export async function deleteAttribute(id: string) {
  const userId = await requireUserId();
  await prisma.itemAttribute.deleteMany({ where: { id, userId } });
  refresh();
  redirect("/settings/attributes");
}
