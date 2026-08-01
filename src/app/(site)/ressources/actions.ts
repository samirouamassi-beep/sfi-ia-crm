"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";

const EXTENSIONS_CV_AUTORISEES = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];

function extensionAutorisee(nom: string): boolean {
  const nomMin = nom.toLowerCase();
  return EXTENSIONS_CV_AUTORISEES.some((ext) => nomMin.endsWith(ext));
}

/** Si un fichier CV valide est present dans le formulaire, le televerse sur Vercel Blob. */
async function televerserCv(formData: FormData): Promise<{ cvNom: string; cvUrl: string } | null> {
  const fichier = formData.get("cv");
  if (!(fichier instanceof File) || fichier.size === 0) return null;
  if (!extensionAutorisee(fichier.name)) {
    throw new Error("Format de CV non autorise (PDF, Word ou PowerPoint uniquement).");
  }
  const resultat = await put(`cv/${crypto.randomUUID()}-${fichier.name}`, fichier, {
    access: "public",
  });
  return { cvNom: fichier.name, cvUrl: resultat.url };
}

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
  const cv = await televerserCv(formData);
  await prisma.ressource.create({ data: { ...donnees(formData), ...cv } });
  revalidatePath("/ressources");
  redirect("/ressources");
}

export async function modifierRessource(id: string, formData: FormData) {
  const cv = await televerserCv(formData);
  if (cv) {
    const existante = await prisma.ressource.findUnique({ where: { id } });
    if (existante?.cvUrl) {
      await del(existante.cvUrl).catch(() => {});
    }
  }
  await prisma.ressource.update({ where: { id }, data: { ...donnees(formData), ...cv } });
  revalidatePath("/ressources");
  redirect("/ressources");
}

export async function supprimerRessource(id: string) {
  const existante = await prisma.ressource.findUnique({ where: { id } });
  if (existante?.cvUrl) {
    await del(existante.cvUrl).catch(() => {});
  }
  await prisma.ressource.delete({ where: { id } });
  revalidatePath("/ressources");
  redirect("/ressources");
}
