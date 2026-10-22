"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { date, nombre, texte } from "@/lib/formulaire";
import { ajouterJours } from "@/lib/calculs";
import { PHASES_DEFAUT } from "@/lib/listes";

function montant(formData: FormData, nom: string): number | null {
  return texte(formData, nom) == null ? null : nombre(formData, nom);
}

function donnees(formData: FormData) {
  return {
    reference: texte(formData, "reference") ?? "",
    maitreOuvrage: texte(formData, "maitreOuvrage") ?? "",
    objet: texte(formData, "objet") ?? "",
    procedure: texte(formData, "procedure") ?? "AO ouvert",
    activite: texte(formData, "activite") ?? "Télégestion / SCADA",
    dateLimite: date(formData, "dateLimite") ?? new Date(),
    montantEstime: montant(formData, "montantEstime"),
    montantSoumis: montant(formData, "montantSoumis"),
    cautionProvisoire: montant(formData, "cautionProvisoire"),
    statut: texte(formData, "statut") ?? "Veille",
    responsableId: texte(formData, "responsableId"),
    notes: texte(formData, "notes"),
  };
}

function revalider() {
  revalidatePath("/appels-offres", "layout");
  revalidatePath("/");
}

export async function creerAppelOffre(formData: FormData) {
  await prisma.appelOffre.create({ data: donnees(formData) });
  revalider();
  redirect("/appels-offres");
}

export async function modifierAppelOffre(id: string, formData: FormData) {
  await prisma.appelOffre.update({ where: { id }, data: donnees(formData) });
  revalider();
  redirect("/appels-offres");
}

export async function supprimerAppelOffre(id: string) {
  await prisma.appelOffre.delete({ where: { id } });
  revalider();
  redirect("/appels-offres");
}

/**
 * Marché gagné : crée le projet correspondant (maître d'ouvrage, montant, chef de projet =
 * responsable de l'offre, phases types) et le relie à l'appel d'offres.
 */
export async function convertirEnProjet(id: string) {
  const ao = await prisma.appelOffre.findUnique({ where: { id } });
  if (!ao) return;
  if (ao.projetId) redirect(`/projets/${ao.projetId}`);
  const nb = await prisma.projet.count();
  const debut = new Date();
  const projet = await prisma.projet.create({
    data: {
      code: `PRJ-${String(nb + 1).padStart(3, "0")}`,
      nom: ao.objet,
      client: ao.maitreOuvrage,
      numeroMarche: ao.reference,
      chefId: ao.responsableId,
      statut: "Cadrage",
      priorite: "Normale",
      meteo: "Vert",
      debut,
      fin: ajouterJours(debut, 180),
      budget: ao.montantSoumis ?? ao.montantEstime ?? 0,
      description: `Projet issu de l'appel d'offres ${ao.reference} (${ao.procedure}).`,
      phases: { create: PHASES_DEFAUT.map((nom, ordre) => ({ nom, ordre })) },
    },
  });
  await prisma.appelOffre.update({ where: { id }, data: { statut: "Gagné", projetId: projet.id } });
  revalider();
  revalidatePath("/projets");
  redirect(`/projets/${projet.id}/modifier`);
}
