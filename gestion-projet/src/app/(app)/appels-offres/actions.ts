"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { date, nombre, texte } from "@/lib/formulaire";
import { ajouterJours } from "@/lib/calculs";
import { PHASES_DEFAUT, TAUX_CAUTION_DEFINITIVE } from "@/lib/listes";

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
    tauxTva: nombre(formData, "tauxTva", 20),
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
      tauxTva: ao.tauxTva,
      description: `Projet issu de l'appel d'offres ${ao.reference} (${ao.procedure}).`,
      phases: { create: PHASES_DEFAUT.map((nom, ordre) => ({ nom, ordre })) },
    },
  });
  await prisma.appelOffre.update({ where: { id }, data: { statut: "Gagné", projetId: projet.id } });
  // Marché gagné : la caution définitive est à émettre (montant usuel, à ajuster selon le CPS).
  const montantMarche = ao.montantSoumis ?? ao.montantEstime;
  if (montantMarche) {
    await prisma.caution.create({
      data: {
        appelOffreId: id,
        type: "Définitive",
        montant: Math.round(montantMarche * TAUX_CAUTION_DEFINITIVE),
        statut: "À émettre",
        notes: "Créée automatiquement à 3 % du marché : vérifier le taux prévu au CPS.",
      },
    });
  }
  revalider();
  revalidatePath("/projets");
  redirect(`/projets/${projet.id}/modifier`);
}

// ---------- Cautions ----------

export async function ajouterCaution(appelOffreId: string, formData: FormData) {
  const montantSaisi = nombre(formData, "montant");
  if (montantSaisi <= 0) return;
  await prisma.caution.create({
    data: {
      appelOffreId,
      type: texte(formData, "type") ?? "Provisoire",
      montant: montantSaisi,
      banque: texte(formData, "banque"),
      reference: texte(formData, "reference"),
      dateEmission: date(formData, "dateEmission"),
      dateEcheance: date(formData, "dateEcheance"),
      statut: texte(formData, "statut") ?? "À émettre",
      notes: texte(formData, "notes"),
    },
  });
  revalider();
}

export async function changerStatutCaution(id: string, formData: FormData) {
  const statut = texte(formData, "statut");
  if (!statut) return;
  await prisma.caution.update({ where: { id }, data: { statut } });
  revalider();
}

export async function supprimerCaution(id: string) {
  await prisma.caution.delete({ where: { id } });
  revalider();
}

