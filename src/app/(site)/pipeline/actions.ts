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
  const dateClosingVisee = champ(formData, "dateClosingVisee");
  const echeanceProchaineAction = champ(formData, "echeanceProchaineAction");
  const nbJoursOuPostes = champ(formData, "nbJoursOuPostes");
  return {
    intitule: champ(formData, "intitule") ?? "",
    compteId: champ(formData, "compteId") ?? "",
    typeOffre: champ(formData, "typeOffre") ?? "",
    nbJoursOuPostes: nbJoursOuPostes ? Number(nbJoursOuPostes) : null,
    montant: Number(champ(formData, "montant") ?? 0),
    etape: champ(formData, "etape") ?? "",
    dateClosingVisee: dateClosingVisee ? new Date(dateClosingVisee) : null,
    fondateurReferent: champ(formData, "fondateurReferent"),
    prochaineAction: champ(formData, "prochaineAction"),
    echeanceProchaineAction: echeanceProchaineAction ? new Date(echeanceProchaineAction) : null,
    concurrenceIdentifiee: champ(formData, "concurrenceIdentifiee"),
    notes: champ(formData, "notes"),
  };
}

export async function creerOpportunite(formData: FormData) {
  await prisma.opportunite.create({ data: donnees(formData) });
  revalidatePath("/pipeline");
  redirect(cheminRetour(formData, "/pipeline"));
}

export async function modifierOpportunite(id: string, formData: FormData) {
  await prisma.opportunite.update({ where: { id }, data: donnees(formData) });
  revalidatePath("/pipeline");
  redirect("/pipeline");
}

export async function supprimerOpportunite(id: string) {
  await prisma.opportunite.delete({ where: { id } });
  revalidatePath("/pipeline");
  redirect("/pipeline");
}

/** Kanban : deplacement d'une carte vers une autre etape (glisser-deposer). */
export async function changerEtapeOpportunite(id: string, etape: string) {
  const existe = await prisma.etapePipeline.findUnique({ where: { etape } });
  if (!existe) throw new Error(`Étape inconnue : ${etape}`);
  await prisma.opportunite.update({ where: { id }, data: { etape } });
  revalidatePath("/pipeline");
}
