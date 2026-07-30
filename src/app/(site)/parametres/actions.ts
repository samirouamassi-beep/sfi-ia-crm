"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function ajouterFondateur(formData: FormData) {
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;
  await prisma.fondateur.create({ data: { nom } });
  revalidatePath("/parametres");
}

export async function supprimerFondateur(id: string) {
  await prisma.fondateur.delete({ where: { id } });
  revalidatePath("/parametres");
}

export async function modifierEtapePipeline(etape: string, formData: FormData) {
  const probabilite = Number(formData.get("probabilite"));
  await prisma.etapePipeline.update({ where: { etape }, data: { probabilite } });
  revalidatePath("/parametres");
}

export async function ajouterEtapePipeline(formData: FormData) {
  const etape = String(formData.get("etape") ?? "").trim();
  const probabilite = Number(formData.get("probabilite") ?? 0);
  if (!etape) return;
  const max = await prisma.etapePipeline.aggregate({ _max: { ordre: true } });
  await prisma.etapePipeline.create({
    data: { etape, probabilite, ordre: (max._max.ordre ?? 0) + 1 },
  });
  revalidatePath("/parametres");
}

export async function supprimerEtapePipeline(etape: string) {
  await prisma.etapePipeline.delete({ where: { etape } });
  revalidatePath("/parametres");
}

export async function modifierParametre(cle: string, formData: FormData) {
  const valeur = Number(formData.get("valeur"));
  await prisma.parametre.update({ where: { cle }, data: { valeur } });
  revalidatePath("/parametres");
}
