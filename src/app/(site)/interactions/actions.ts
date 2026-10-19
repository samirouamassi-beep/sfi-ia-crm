"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cheminRetour } from "@/lib/retour";

function champ(formData: FormData, nom: string): string | null {
  const v = formData.get(nom);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function donnees(formData: FormData) {
  const date = champ(formData, "date");
  const echeance = champ(formData, "echeance");
  return {
    date: date ? new Date(date) : new Date(),
    compteId: champ(formData, "compteId"),
    contactId: champ(formData, "contactId"),
    type: champ(formData, "type") ?? "",
    fondateur: champ(formData, "fondateur"),
    sujet: champ(formData, "sujet"),
    compteRendu: champ(formData, "compteRendu"),
    prochaineAction: champ(formData, "prochaineAction"),
    echeance: echeance ? new Date(echeance) : null,
  };
}

export async function creerInteraction(formData: FormData) {
  await prisma.interaction.create({ data: donnees(formData) });
  revalidatePath("/interactions");
  redirect(cheminRetour(formData, "/interactions"));
}

export async function modifierInteraction(id: string, formData: FormData) {
  await prisma.interaction.update({ where: { id }, data: donnees(formData) });
  revalidatePath("/interactions");
  redirect("/interactions");
}

export async function supprimerInteraction(id: string) {
  await prisma.interaction.delete({ where: { id } });
  revalidatePath("/interactions");
  redirect("/interactions");
}
