"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function champ(formData: FormData, nom: string): string | null {
  const v = formData.get(nom);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function nombre(formData: FormData, nom: string): number | null {
  const v = champ(formData, nom);
  return v ? Number(v) : null;
}

function donnees(formData: FormData) {
  const dateDebut = champ(formData, "dateDebut");
  const dateFinPrevue = champ(formData, "dateFinPrevue");
  return {
    compteId: champ(formData, "compteId") ?? "",
    mission: champ(formData, "mission") ?? "",
    typeOffre: champ(formData, "typeOffre") ?? "",
    ressourceId: champ(formData, "ressourceId"),
    dateDebut: dateDebut ? new Date(dateDebut) : null,
    dateFinPrevue: dateFinPrevue ? new Date(dateFinPrevue) : null,
    joursFacturesParMois: nombre(formData, "joursFacturesParMois"),
    tjmVente: nombre(formData, "tjmVente"),
    tjmCoutAchat: nombre(formData, "tjmCoutAchat"),
    statut: champ(formData, "statut") ?? "",
    fondateurReferent: champ(formData, "fondateurReferent"),
    notes: champ(formData, "notes"),
  };
}

export async function creerMission(formData: FormData) {
  await prisma.mission.create({ data: donnees(formData) });
  revalidatePath("/missions");
  redirect("/missions");
}

export async function modifierMission(id: string, formData: FormData) {
  await prisma.mission.update({ where: { id }, data: donnees(formData) });
  revalidatePath("/missions");
  redirect("/missions");
}

export async function supprimerMission(id: string) {
  await prisma.mission.delete({ where: { id } });
  revalidatePath("/missions");
  redirect("/missions");
}
