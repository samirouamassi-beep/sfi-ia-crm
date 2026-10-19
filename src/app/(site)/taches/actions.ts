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
  const echeance = champ(formData, "echeance");
  return {
    sujet: champ(formData, "sujet") ?? "",
    echeance: echeance ? new Date(echeance) : null,
    priorite: champ(formData, "priorite"),
    fondateur: champ(formData, "fondateur"),
    compteId: champ(formData, "compteId"),
    contactId: champ(formData, "contactId"),
    opportuniteId: champ(formData, "opportuniteId"),
    notes: champ(formData, "notes"),
  };
}

function revalider() {
  revalidatePath("/taches");
  revalidatePath("/");
  revalidatePath("/comptes", "layout");
}

export async function creerTache(formData: FormData) {
  await prisma.tache.create({ data: donnees(formData) });
  revalider();
  redirect(cheminRetour(formData, "/taches"));
}

export async function modifierTache(id: string, formData: FormData) {
  await prisma.tache.update({ where: { id }, data: donnees(formData) });
  revalider();
  redirect(cheminRetour(formData, "/taches"));
}

export async function supprimerTache(id: string) {
  await prisma.tache.delete({ where: { id } });
  revalider();
  redirect("/taches");
}

/** Case a cocher : terminer une tache, ou la rouvrir. */
export async function basculerTache(id: string) {
  const tache = await prisma.tache.findUnique({ where: { id } });
  if (!tache) return;
  const terminee = tache.statut === "Terminée";
  await prisma.tache.update({
    where: { id },
    data: terminee
      ? { statut: "À faire", termineeLe: null }
      : { statut: "Terminée", termineeLe: new Date() },
  });
  revalider();
}
