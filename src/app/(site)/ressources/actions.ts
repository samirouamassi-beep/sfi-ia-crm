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
  const disponibleAPartirDe = champ(formData, "disponibleAPartirDe");
  return {
    nom: champ(formData, "nom") ?? "",
    prenom: champ(formData, "prenom") ?? "",
    typeContrat: champ(formData, "typeContrat") ?? "",
    entite: champ(formData, "entite") ?? "",
    niveau: champ(formData, "niveau") ?? "",
    statut: champ(formData, "statut") ?? "",
    competencesSalesforce: champ(formData, "competencesSalesforce"),
    certificationsDetenues: champ(formData, "certificationsDetenues"),
    anneesExperience: nombre(formData, "anneesExperience"),
    salaireBrutMensuel: nombre(formData, "salaireBrutMensuel"),
    tjmAchat: nombre(formData, "tjmAchat"),
    tjmVenteCible: nombre(formData, "tjmVenteCible"),
    disponibleAPartirDe: disponibleAPartirDe ? new Date(disponibleAPartirDe) : null,
    sourceApporteur: champ(formData, "sourceApporteur"),
    notes: champ(formData, "notes"),
  };
}

export async function creerRessource(formData: FormData) {
  await prisma.ressource.create({ data: donnees(formData) });
  revalidatePath("/ressources");
  redirect("/ressources");
}

export async function modifierRessource(id: string, formData: FormData) {
  await prisma.ressource.update({ where: { id }, data: donnees(formData) });
  revalidatePath("/ressources");
  redirect("/ressources");
}

export async function supprimerRessource(id: string) {
  await prisma.ressource.delete({ where: { id } });
  revalidatePath("/ressources");
  redirect("/ressources");
}
