"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function enregistrerVue(page: string, requete: string, formData: FormData) {
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;
  await prisma.vueListe.create({ data: { nom, page, requete } });
  revalidatePath(page);
}

export async function supprimerVue(id: string, page: string) {
  await prisma.vueListe.delete({ where: { id } });
  revalidatePath(page);
}
