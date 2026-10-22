// Dépendances fin → début entre tâches et recalcul automatique du planning.
//
// Règle : un successeur commence au plus tôt le jour ouvré qui suit la fin de chacun de ses
// prédécesseurs. Quand une tâche est décalée ou allongée, ses successeurs sont repoussés (en
// gardant leur durée), puis les successeurs de ceux-ci, etc. Le planning n'est jamais
// avancé automatiquement : rapprocher une tâche reste une décision du chef de projet.

import { prisma } from "@/lib/db";
import { ajouterJours, debutJour, estOuvre, joursOuvres } from "@/lib/calculs";

const JOUR_MS = 24 * 60 * 60 * 1000;

type Noeud = { id: string; debut: Date; fin: Date; jalon: boolean };
type Lien = { predecesseurId: string; successeurId: string };

/** Premier jour ouvré qui suit la fin d'un prédécesseur (un jalon libère le jour même). */
export function debutAuPlusTot(pred: Noeud): Date {
  let d = debutJour(pred.jalon ? pred.fin : ajouterJours(pred.fin, 1));
  while (!estOuvre(d)) d = ajouterJours(d, 1);
  return d;
}

/** Date du n-ième jour ouvré à partir de `debut` (inclus). */
function finApresJoursOuvres(debut: Date, n: number): Date {
  let d = debutJour(debut);
  let compte = estOuvre(d) ? 1 : 0;
  while (compte < n) {
    d = ajouterJours(d, 1);
    if (estOuvre(d)) compte++;
  }
  return d;
}

/** Vrai si ajouter predecesseur → successeur créerait une boucle. */
export function creeUnCycle(liens: Lien[], predecesseurId: string, successeurId: string): boolean {
  if (predecesseurId === successeurId) return true;
  const suivants = new Map<string, string[]>();
  for (const l of liens) suivants.set(l.predecesseurId, [...(suivants.get(l.predecesseurId) ?? []), l.successeurId]);
  // Le lien boucle si le prédécesseur est déjà atteignable depuis le successeur.
  const aVisiter = [successeurId];
  const vus = new Set<string>();
  while (aVisiter.length) {
    const id = aVisiter.pop()!;
    if (id === predecesseurId) return true;
    if (vus.has(id)) continue;
    vus.add(id);
    aVisiter.push(...(suivants.get(id) ?? []));
  }
  return false;
}

/**
 * Calcule les décalages à appliquer (fonction pure) : renvoie les tâches dont les dates
 * changent, avec leurs nouvelles dates.
 */
export function calculerDecalages(
  taches: Noeud[],
  liens: Lien[],
  depart: string[]
): Map<string, { debut: Date; fin: Date }> {
  const parId = new Map(taches.map((t) => [t.id, { ...t }]));
  const successeurs = new Map<string, string[]>();
  const predecesseurs = new Map<string, string[]>();
  for (const l of liens) {
    successeurs.set(l.predecesseurId, [...(successeurs.get(l.predecesseurId) ?? []), l.successeurId]);
    predecesseurs.set(l.successeurId, [...(predecesseurs.get(l.successeurId) ?? []), l.predecesseurId]);
  }
  const changees = new Map<string, { debut: Date; fin: Date }>();
  const file = [...depart];
  let garde = 0;
  while (file.length && garde++ < 10000) {
    const id = file.shift()!;
    for (const sId of successeurs.get(id) ?? []) {
      const s = parId.get(sId);
      if (!s) continue;
      const auPlusTot = new Date(
        Math.max(...(predecesseurs.get(sId) ?? []).map((p) => debutAuPlusTot(parId.get(p)!).getTime()))
      );
      if (debutJour(s.debut) >= auPlusTot) continue;
      const ouvres = joursOuvres(s.debut, s.fin);
      if (ouvres > 0) {
        // Même nombre de jours ouvrés qu'avant, à partir du nouveau début.
        s.fin = finApresJoursOuvres(auPlusTot, ouvres);
      } else {
        const decalage = Math.round((auPlusTot.getTime() - debutJour(s.debut).getTime()) / JOUR_MS);
        s.fin = ajouterJours(s.fin, decalage);
      }
      s.debut = auPlusTot;
      changees.set(sId, { debut: s.debut, fin: s.fin });
      file.push(sId);
    }
  }
  return changees;
}

/** Applique en base les décalages provoqués par la modification des tâches `depart`. */
export async function propagerDependances(projetId: string, depart: string[]): Promise<number> {
  const [taches, liens] = await Promise.all([
    prisma.tache.findMany({ where: { projetId }, select: { id: true, debut: true, fin: true, jalon: true } }),
    prisma.dependance.findMany({ where: { successeur: { projetId } }, select: { predecesseurId: true, successeurId: true } }),
  ]);
  const changees = calculerDecalages(taches, liens, depart);
  if (changees.size === 0) return 0;
  await prisma.$transaction(
    [...changees].map(([id, dates]) => prisma.tache.update({ where: { id }, data: dates }))
  );
  return changees.size;
}

/**
 * Remplace les prédécesseurs d'une tâche. Les liens qui créeraient une boucle ou qui
 * pointent vers une tâche d'un autre projet sont ignorés ; renvoie leur nombre.
 */
export async function definirPredecesseurs(
  projetId: string,
  tacheId: string,
  predecesseurIds: string[]
): Promise<number> {
  const [valides, liens] = await Promise.all([
    prisma.tache.findMany({ where: { projetId, id: { in: predecesseurIds } }, select: { id: true } }),
    prisma.dependance.findMany({
      where: { successeur: { projetId }, NOT: { successeurId: tacheId } },
      select: { predecesseurId: true, successeurId: true },
    }),
  ]);
  const retenus: string[] = [];
  for (const { id } of valides) {
    if (creeUnCycle([...liens, ...retenus.map((p) => ({ predecesseurId: p, successeurId: tacheId }))], id, tacheId)) continue;
    retenus.push(id);
  }
  await prisma.$transaction([
    prisma.dependance.deleteMany({ where: { successeurId: tacheId } }),
    prisma.dependance.createMany({
      data: retenus.map((predecesseurId) => ({ predecesseurId, successeurId: tacheId })),
    }),
  ]);
  return predecesseurIds.length - retenus.length;
}
