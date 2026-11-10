"use server";

// Paramétrage des types d'accessoires (référentiel commun, comme les plateformes).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { DEFAULT_ACCESSORY_TYPES } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import type { FormState } from "@/lib/item-form";

const NameSchema = z.string().trim().min(2, "Nom obligatoire").max(60, "60 caractères maximum");

function refresh() {
  revalidatePath("/", "layout");
}

async function nextPosition() {
  const last = await prisma.accessoryType.findFirst({ orderBy: { position: "desc" } });
  return (last?.position ?? -1) + 1;
}

export async function saveAccessoryType(id: string | null, _state: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const name = NameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message, fieldErrors: { name: name.error.issues[0].message } };

  const clash = await prisma.accessoryType.findFirst({
    where: { name: { equals: name.data, mode: "insensitive" }, ...(id && { id: { not: id } }) },
  });
  if (clash) return { error: `« ${clash.name} » existe déjà.`, fieldErrors: { name: "Nom déjà utilisé" } };

  if (id) {
    await prisma.accessoryType.update({ where: { id }, data: { name: name.data, active: formData.get("active") === "on" } });
    refresh();
    redirect("/settings/accessories");
  }
  await prisma.accessoryType.create({ data: { name: name.data, position: await nextPosition() } });
  refresh();
  return { ok: true };
}

export async function addDefaultAccessoryType(name: string) {
  await requireUserId();
  if (!DEFAULT_ACCESSORY_TYPES.includes(name)) return;
  const exists = await prisma.accessoryType.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (!exists) await prisma.accessoryType.create({ data: { name, position: await nextPosition() } });
  refresh();
}

export async function toggleAccessoryType(id: string) {
  await requireUserId();
  const t = await prisma.accessoryType.findUnique({ where: { id } });
  if (!t) return;
  await prisma.accessoryType.update({ where: { id }, data: { active: !t.active } });
  refresh();
}

export async function moveAccessoryType(id: string, dir: -1 | 1) {
  await requireUserId();
  const all = await prisma.accessoryType.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true } });
  const i = all.findIndex((t) => t.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await prisma.$transaction(all.map((t, position) => prisma.accessoryType.update({ where: { id: t.id }, data: { position } })));
  refresh();
}

/** Suppression : les fiches qui l'utilisaient repassent en « type non précisé ». */
export async function deleteAccessoryType(id: string) {
  await requireUserId();
  await prisma.accessoryType.deleteMany({ where: { id } });
  refresh();
  redirect("/settings/accessories");
}
