// Seed : plateformes rétro + (option --demo) une collection de démonstration avec 12 mois
// d'historique de cotes SIMULÉ (source "seed", montants fictifs), pour voir le tableau de bord
// sans clés API. Pas de jaquette ni d'igdbId : ils arrivent avec un ajout réel via IGDB.
//   npm run seed            -> plateformes uniquement
//   npm run seed -- --demo  -> + collection de démo pour OWNER_EMAIL

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Completeness, Grade, Region } from "../src/generated/prisma/enums";
import { PLATFORMS } from "../src/lib/catalog";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type Demo = {
  title: string;
  platform: string;
  year: number;
  developer: string;
  publisher: string;
  genres: string[];
  /** Cote NTSC-U actuelle en euros : loose / CIB / neuf */
  prices: [number, number, number];
  /** Tendance sur 12 mois (0.2 = +20 %) */
  trend: number;
  item?: { region: Region; completeness: Completeness; grades?: [Grade?, Grade?, Grade?]; paid: number; monthsAgo: number };
  wish?: { region: Region; completeness: Completeness; target: number };
};

const DEMO: Demo[] = [
  { title: "Chrono Trigger", platform: "snes", year: 1995, developer: "Square", publisher: "Square", genres: ["Role-playing (RPG)"], prices: [140, 420, 2600], trend: 0.18, item: { region: "NTSC_U", completeness: "CIB", grades: ["GOOD", "VERY_GOOD", "VERY_GOOD"], paid: 310, monthsAgo: 11 } },
  { title: "Super Metroid", platform: "snes", year: 1994, developer: "Nintendo R&D1", publisher: "Nintendo", genres: ["Platform", "Adventure"], prices: [45, 160, 900], trend: 0.07, item: { region: "PAL", completeness: "CIB", grades: ["VERY_GOOD", "MINT", "VERY_GOOD"], paid: 120, monthsAgo: 9 } },
  { title: "The Legend of Zelda: A Link to the Past", platform: "snes", year: 1991, developer: "Nintendo EAD", publisher: "Nintendo", genres: ["Adventure", "Role-playing (RPG)"], prices: [30, 110, 700], trend: -0.04, item: { region: "PAL", completeness: "LOOSE", grades: [undefined, undefined, "GOOD"], paid: 35, monthsAgo: 7 } },
  { title: "Sonic the Hedgehog 2", platform: "megadrive", year: 1992, developer: "Sonic Team", publisher: "Sega", genres: ["Platform"], prices: [8, 22, 180], trend: 0.02, item: { region: "PAL", completeness: "CIB", grades: ["GOOD", "GOOD", "VERY_GOOD"], paid: 15, monthsAgo: 10 } },
  { title: "Streets of Rage 2", platform: "megadrive", year: 1992, developer: "Sega", publisher: "Sega", genres: ["Fighting", "Hack and slash/Beat 'em up"], prices: [25, 60, 400], trend: 0.12, item: { region: "PAL", completeness: "CIB", grades: ["VERY_GOOD", "VERY_GOOD", "VERY_GOOD"], paid: 40, monthsAgo: 5 } },
  { title: "Pokémon Red Version", platform: "gb", year: 1996, developer: "Game Freak", publisher: "Nintendo", genres: ["Role-playing (RPG)", "Turn-based strategy (TBS)"], prices: [35, 190, 4500], trend: 0.25, item: { region: "PAL", completeness: "LOOSE", grades: [undefined, undefined, "VERY_GOOD"], paid: 25, monthsAgo: 12 } },
  { title: "Super Mario 64", platform: "n64", year: 1996, developer: "Nintendo EAD", publisher: "Nintendo", genres: ["Platform", "Adventure"], prices: [28, 60, 1200], trend: -0.08, item: { region: "PAL", completeness: "CIB", grades: ["POOR", "GOOD", "VERY_GOOD"], paid: 55, monthsAgo: 8 } },
  { title: "Metal Gear Solid", platform: "ps1", year: 1998, developer: "Konami", publisher: "Konami", genres: ["Shooter", "Adventure"], prices: [12, 30, 300], trend: 0.05, item: { region: "PAL", completeness: "SEALED", grades: ["VERY_GOOD"], paid: 180, monthsAgo: 3 } },
  { title: "EarthBound", platform: "snes", year: 1994, developer: "Ape", publisher: "Nintendo", genres: ["Role-playing (RPG)"], prices: [260, 900, 6500], trend: 0.1, wish: { region: "NTSC_U", completeness: "CIB", target: 750 } },
  { title: "Panzer Dragoon Saga", platform: "saturn", year: 1998, developer: "Team Andromeda", publisher: "Sega", genres: ["Role-playing (RPG)"], prices: [480, 820, 3000], trend: 0.06, wish: { region: "PAL", completeness: "CIB", target: 900 } },
];

async function seedPlatforms() {
  for (const [i, p] of PLATFORMS.entries()) {
    await prisma.platform.upsert({ where: { slug: p.slug }, create: { ...p, sortOrder: i }, update: { ...p, sortOrder: i } });
  }
  console.log(`✓ ${PLATFORMS.length} plateformes`);
}

async function seedDemo() {
  const email = process.env.OWNER_EMAIL ?? "owner@retrovault.local";
  const user = await prisma.user.upsert({ where: { email }, create: { email, name: "Démo" }, update: {} });
  await prisma.collectionItem.deleteMany({ where: { userId: user.id } });
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id } });

  const platforms = new Map((await prisma.platform.findMany()).map((p) => [p.slug, p.id]));
  const today = new Date();

  for (const d of DEMO) {
    const platformId = platforms.get(d.platform)!;
    const product =
      (await prisma.product.findFirst({ where: { title: d.title, platformId } })) ??
      (await prisma.product.create({
        data: { title: d.title, platformId, releaseYear: d.year, developer: d.developer, publisher: d.publisher, genres: d.genres },
      }));

    // Historique hebdomadaire sur 12 mois : tendance linéaire + bruit déterministe.
    await prisma.priceSnapshot.deleteMany({ where: { productId: product.id, source: "seed" } });
    const snapshots = [];
    for (let w = 52; w >= 0; w--) {
      const capturedAt = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - w * 7));
      const progress = (52 - w) / 52;
      const noise = 1 + Math.sin(w * 1.7 + d.year) * 0.03;
      const k = (1 - d.trend * (1 - progress)) * noise;
      const [loose, cib, sealed] = d.prices.map((eur) => Math.round(eur * 100 * k));
      for (const [region, factor] of [["NTSC_U", 1], ["PAL", 0.85]] as const) {
        snapshots.push({
          productId: product.id, region, capturedAt, source: "seed",
          looseCents: Math.round(loose * factor), cibCents: Math.round(cib * factor), sealedCents: Math.round(sealed * factor),
        });
      }
    }
    await prisma.priceSnapshot.createMany({ data: snapshots, skipDuplicates: true });

    if (d.item) {
      const [box, manual, media] = d.item.grades ?? [];
      await prisma.collectionItem.create({
        data: {
          userId: user.id, productId: product.id, region: d.item.region, completeness: d.item.completeness,
          boxGrade: box ?? null, manualGrade: manual ?? null, mediaGrade: media ?? null,
          purchaseCents: d.item.paid * 100,
          acquiredAt: new Date(Date.UTC(today.getFullYear(), today.getMonth() - d.item.monthsAgo, 12)),
        },
      });
    }
    if (d.wish) {
      await prisma.wishlistItem.create({
        data: { userId: user.id, productId: product.id, region: d.wish.region, completeness: d.wish.completeness, targetPriceCents: d.wish.target * 100, priority: 1 },
      });
    }
  }
  console.log(`✓ collection de démo pour ${email}`);
}

seedPlatforms()
  .then(() => (process.argv.includes("--demo") ? seedDemo() : undefined))
  .finally(() => prisma.$disconnect());
