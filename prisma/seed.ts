// Importe les donnees reelles de Suivi_Operationnel_SFI_IA.xlsx (hors lignes d'exemple,
// grisees dans le fichier d'origine). A executer une seule fois sur une base vide :
//   npx tsx prisma/seed.ts

import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  for (const nom of ["Samir", "Sokayna", "Hamza", "Rafie"]) {
    await prisma.fondateur.upsert({ where: { nom }, update: {}, create: { nom } });
  }

  const etapes = [
    { etape: "Identifié", probabilite: 0.1, ordre: 1 },
    { etape: "Qualifié", probabilite: 0.25, ordre: 2 },
    { etape: "Proposition envoyée", probabilite: 0.5, ordre: 3 },
    { etape: "Négociation", probabilite: 0.75, ordre: 4 },
    { etape: "Reporté", probabilite: 0.05, ordre: 5 },
    { etape: "Signé", probabilite: 1.0, ordre: 6 },
    { etape: "Perdu", probabilite: 0.0, ordre: 7 },
  ];
  for (const e of etapes) {
    await prisma.etapePipeline.upsert({ where: { etape: e.etape }, update: {}, create: e });
  }

  const parametres = [
    { cle: "Charges patronales Maroc", valeur: 0.21 },
    { cle: "Charges patronales France", valeur: 0.42 },
    { cle: "Jours facturables / mois", valeur: 18 },
  ];
  for (const p of parametres) {
    await prisma.parametre.upsert({ where: { cle: p.cle }, update: {}, create: p });
  }

  // Seuls comptes reellement saisis dans le fichier Excel a ce jour (nom uniquement,
  // le reste des champs reste a completer par l'equipe).
  for (const nom of ["Metlife FR", "Metlife UK", "Metlife Middle East"]) {
    await prisma.compte.upsert({
      where: { nom },
      update: {},
      create: {
        nom,
        categorie: "Prospect",
        statutRelation: "À qualifier",
        priorite: "Moyenne",
      },
    });
  }

  console.log("Seed termine.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
