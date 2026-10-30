// Libellés et référentiels fixes (enums Prisma -> affichage FR).
// Importable côté client : ne dépend que des enums générés, pas du client Prisma.

import {
  Completeness,
  Grade,
  ProductKind,
  Region,
} from "@/generated/prisma/enums";

export { Completeness, Grade, ProductKind, Region };

export const COMPLETENESS_LABELS: Record<Completeness, { label: string; hint: string }> = {
  LOOSE: { label: "Loose", hint: "Cartouche / disque seul" },
  CIB: { label: "CIB", hint: "Complet en boîte avec notice" },
  SEALED: { label: "Neuf scellé", hint: "Sous blister d'origine" },
};

export const GRADE_LABELS: Record<Grade, string> = {
  POOR: "Mauvais",
  GOOD: "Bon",
  VERY_GOOD: "Très bon",
  MINT: "Neuf",
};

export const REGION_LABELS: Record<Region, string> = {
  PAL: "PAL",
  NTSC_U: "NTSC-U",
  NTSC_J: "NTSC-J",
  OTHER: "Autre",
};

export const KIND_LABELS: Record<ProductKind, string> = {
  GAME: "Jeu",
  CONSOLE: "Console",
  ACCESSORY: "Accessoire",
};

export const COMPLETENESS_VALUES = Object.keys(COMPLETENESS_LABELS) as Completeness[];
export const GRADE_VALUES = Object.keys(GRADE_LABELS) as Grade[];
export const REGION_VALUES = Object.keys(REGION_LABELS) as Region[];
export const KIND_VALUES = Object.keys(KIND_LABELS) as ProductKind[];

export function isEnumValue<T extends string>(values: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (values as readonly string[]).includes(v);
}

/**
 * Plateformes rétro pré-chargées (seed). igdbId = identifiant "platforms" IGDB,
 * priceChartingName = libellé "console-name" PriceCharting (version NTSC-U ; la version PAL
 * est préfixée "PAL ", la japonaise "JP ").
 */
export const PLATFORMS = [
  { slug: "nes", name: "Nintendo Entertainment System", shortName: "NES", manufacturer: "Nintendo", releaseYear: 1983, igdbId: 18, priceChartingName: "NES" },
  { slug: "snes", name: "Super Nintendo", shortName: "SNES", manufacturer: "Nintendo", releaseYear: 1990, igdbId: 19, priceChartingName: "Super Nintendo" },
  { slug: "n64", name: "Nintendo 64", shortName: "N64", manufacturer: "Nintendo", releaseYear: 1996, igdbId: 4, priceChartingName: "Nintendo 64" },
  { slug: "gamecube", name: "Nintendo GameCube", shortName: "GC", manufacturer: "Nintendo", releaseYear: 2001, igdbId: 21, priceChartingName: "Gamecube" },
  { slug: "gb", name: "Game Boy", shortName: "GB", manufacturer: "Nintendo", releaseYear: 1989, igdbId: 33, priceChartingName: "GameBoy" },
  { slug: "gbc", name: "Game Boy Color", shortName: "GBC", manufacturer: "Nintendo", releaseYear: 1998, igdbId: 22, priceChartingName: "GameBoy Color" },
  { slug: "gba", name: "Game Boy Advance", shortName: "GBA", manufacturer: "Nintendo", releaseYear: 2001, igdbId: 24, priceChartingName: "GameBoy Advance" },
  { slug: "master-system", name: "Sega Master System", shortName: "SMS", manufacturer: "Sega", releaseYear: 1985, igdbId: 64, priceChartingName: "Sega Master System" },
  { slug: "megadrive", name: "Mega Drive / Genesis", shortName: "MD", manufacturer: "Sega", releaseYear: 1988, igdbId: 29, priceChartingName: "Sega Genesis" },
  { slug: "saturn", name: "Sega Saturn", shortName: "SAT", manufacturer: "Sega", releaseYear: 1994, igdbId: 32, priceChartingName: "Sega Saturn" },
  { slug: "dreamcast", name: "Sega Dreamcast", shortName: "DC", manufacturer: "Sega", releaseYear: 1998, igdbId: 23, priceChartingName: "Sega Dreamcast" },
  { slug: "game-gear", name: "Sega Game Gear", shortName: "GG", manufacturer: "Sega", releaseYear: 1990, igdbId: 35, priceChartingName: "Sega Game Gear" },
  { slug: "ps1", name: "PlayStation", shortName: "PS1", manufacturer: "Sony", releaseYear: 1994, igdbId: 7, priceChartingName: "Playstation" },
  { slug: "ps2", name: "PlayStation 2", shortName: "PS2", manufacturer: "Sony", releaseYear: 2000, igdbId: 8, priceChartingName: "Playstation 2" },
  { slug: "neo-geo-aes", name: "Neo Geo AES", shortName: "AES", manufacturer: "SNK", releaseYear: 1990, igdbId: 80, priceChartingName: "Neo Geo AES" },
  { slug: "pc-engine", name: "PC Engine / TurboGrafx-16", shortName: "PCE", manufacturer: "NEC", releaseYear: 1987, igdbId: 86, priceChartingName: "TurboGrafx-16" },
  { slug: "atari-2600", name: "Atari 2600", shortName: "2600", manufacturer: "Atari", releaseYear: 1977, igdbId: 59, priceChartingName: "Atari 2600" },
] as const;
