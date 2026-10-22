"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { date, nombre, texte } from "@/lib/formulaire";
import { cheminRetour } from "@/lib/retour";
import { PHASES_DEFAUT } from "@/lib/listes";

function revalider(projetId?: string) {
  revalidatePath("/", "layout");
  if (projetId) revalidatePath(`/projets/${projetId}`, "layout");
}

// ---------- Projets ----------

function donneesProjet(formData: FormData) {
  const debut = date(formData, "debut") ?? new Date();
  const fin = date(formData, "fin") ?? debut;
  return {
    code: texte(formData, "code") ?? "",
    nom: texte(formData, "nom") ?? "",
    client: texte(formData, "client"),
    numeroMarche: texte(formData, "numeroMarche"),
    description: texte(formData, "description"),
    chefId: texte(formData, "chefId"),
    statut: texte(formData, "statut") ?? "Cadrage",
    priorite: texte(formData, "priorite") ?? "Normale",
    meteo: texte(formData, "meteo") ?? "Vert",
    debut,
    fin: fin < debut ? debut : fin,
    budget: nombre(formData, "budget"),
    commentaire: texte(formData, "commentaire"),
  };
}

export async function creerProjet(formData: FormData) {
  const projet = await prisma.projet.create({ data: donneesProjet(formData) });
  // Phases de départ, modifiables ensuite.
  await prisma.phase.createMany({
    data: PHASES_DEFAUT.map((nom, ordre) => ({ projetId: projet.id, nom, ordre })),
  });
  revalider();
  redirect(`/projets/${projet.id}`);
}

export async function modifierProjet(id: string, formData: FormData) {
  await prisma.projet.update({ where: { id }, data: donneesProjet(formData) });
  revalider(id);
  redirect(`/projets/${id}`);
}

export async function supprimerProjet(id: string) {
  await prisma.projet.delete({ where: { id } });
  revalider();
  redirect("/projets");
}

/** Mise à jour rapide de la météo et du commentaire depuis la synthèse. */
export async function mettreAJourMeteo(id: string, formData: FormData) {
  await prisma.projet.update({
    where: { id },
    data: {
      meteo: texte(formData, "meteo") ?? "Vert",
      commentaire: texte(formData, "commentaire"),
    },
  });
  revalider(id);
}

// ---------- Phases ----------

export async function ajouterPhase(projetId: string, formData: FormData) {
  const nom = texte(formData, "nom");
  if (!nom) return;
  const max = await prisma.phase.aggregate({ where: { projetId }, _max: { ordre: true } });
  await prisma.phase.create({ data: { projetId, nom, ordre: (max._max.ordre ?? -1) + 1 } });
  revalider(projetId);
}

export async function supprimerPhase(projetId: string, phaseId: string) {
  await prisma.phase.delete({ where: { id: phaseId } });
  revalider(projetId);
}

// ---------- Tâches ----------

function donneesTache(formData: FormData) {
  const jalon = formData.get("jalon") === "on";
  const debut = date(formData, "debut") ?? new Date();
  const finSaisie = date(formData, "fin") ?? debut;
  const fin = jalon ? debut : finSaisie < debut ? debut : finSaisie;
  const statut = texte(formData, "statut") ?? "À faire";
  let avancement = Math.max(0, Math.min(100, Math.round(nombre(formData, "avancement"))));
  if (statut === "Terminée") avancement = 100;
  return {
    nom: texte(formData, "nom") ?? "",
    description: texte(formData, "description"),
    phaseId: texte(formData, "phaseId"),
    responsableId: texte(formData, "responsableId"),
    statut: avancement === 100 ? "Terminée" : statut,
    priorite: texte(formData, "priorite") ?? "Normale",
    jalon,
    debut,
    fin,
    chargeJours: jalon ? 0 : nombre(formData, "chargeJours"),
    avancement,
  };
}

export async function creerTache(projetId: string, formData: FormData) {
  const max = await prisma.tache.aggregate({ where: { projetId }, _max: { ordre: true } });
  await prisma.tache.create({
    data: { ...donneesTache(formData), projetId, ordre: (max._max.ordre ?? -1) + 1 },
  });
  revalider(projetId);
  redirect(cheminRetour(formData, `/projets/${projetId}?onglet=taches`));
}

export async function modifierTache(projetId: string, id: string, formData: FormData) {
  await prisma.tache.update({ where: { id }, data: donneesTache(formData) });
  revalider(projetId);
  redirect(cheminRetour(formData, `/projets/${projetId}?onglet=taches`));
}

export async function supprimerTache(projetId: string, id: string) {
  await prisma.tache.delete({ where: { id } });
  revalider(projetId);
  redirect(`/projets/${projetId}?onglet=taches`);
}

/** Glisser-déposer du Kanban. */
export async function changerStatutTache(id: string, statut: string) {
  const tache = await prisma.tache.update({
    where: { id },
    data: {
      statut,
      ...(statut === "Terminée" ? { avancement: 100 } : {}),
      ...(statut === "À faire" ? { avancement: 0 } : {}),
    },
  });
  revalider(tache.projetId);
}

// ---------- Dépenses ----------

export async function ajouterDepense(projetId: string, formData: FormData) {
  const libelle = texte(formData, "libelle");
  if (!libelle) return;
  await prisma.depense.create({
    data: {
      projetId,
      libelle,
      categorie: texte(formData, "categorie") ?? "Autre",
      montant: nombre(formData, "montant"),
      date: date(formData, "date") ?? new Date(),
    },
  });
  revalider(projetId);
}

export async function supprimerDepense(projetId: string, id: string) {
  await prisma.depense.delete({ where: { id } });
  revalider(projetId);
}

// ---------- Risques ----------

function donneesRisque(formData: FormData) {
  return {
    type: texte(formData, "type") ?? "Risque",
    titre: texte(formData, "titre") ?? "",
    description: texte(formData, "description"),
    probabilite: nombre(formData, "probabilite", 2),
    impact: nombre(formData, "impact", 2),
    statut: texte(formData, "statut") ?? "Ouvert",
    responsableId: texte(formData, "responsableId"),
    mitigation: texte(formData, "mitigation"),
    echeance: date(formData, "echeance"),
  };
}

export async function creerRisque(projetId: string, formData: FormData) {
  await prisma.risque.create({ data: { ...donneesRisque(formData), projetId } });
  revalider(projetId);
  revalidatePath("/risques");
  redirect(cheminRetour(formData, `/projets/${projetId}?onglet=risques`));
}

export async function modifierRisque(projetId: string, id: string, formData: FormData) {
  await prisma.risque.update({ where: { id }, data: donneesRisque(formData) });
  revalider(projetId);
  revalidatePath("/risques");
  redirect(cheminRetour(formData, `/projets/${projetId}?onglet=risques`));
}

export async function supprimerRisque(projetId: string, id: string) {
  await prisma.risque.delete({ where: { id } });
  revalider(projetId);
  redirect(`/projets/${projetId}?onglet=risques`);
}
