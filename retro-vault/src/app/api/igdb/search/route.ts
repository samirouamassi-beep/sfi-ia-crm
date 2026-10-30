import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { igdbConfigured, searchGames, type IgdbGame } from "@/lib/igdb";

export type GameSuggestion = Omit<IgdbGame, "platformIgdbIds"> & { source: "igdb" | "local" };
export type GameSearchResponse = { igdb: boolean; results: GameSuggestion[]; error?: string };

/**
 * Auto-complétion du formulaire d'ajout : IGDB filtré sur la plateforme choisie, complété par
 * les fiches déjà présentes en base (utile hors connexion IGDB ou pour les saisies libres).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const platformSlug = request.nextUrl.searchParams.get("platform");
  if (q.length < 2) return NextResponse.json<GameSearchResponse>({ igdb: igdbConfigured(), results: [] });

  const platform = platformSlug ? await prisma.platform.findUnique({ where: { slug: platformSlug } }) : null;

  const local = await prisma.product.findMany({
    where: { title: { contains: q, mode: "insensitive" }, ...(platform && { platformId: platform.id }) },
    take: 5,
    orderBy: { title: "asc" },
  });
  const results: GameSuggestion[] = local.map((p) => ({
    source: "local",
    igdbId: p.igdbId ?? 0,
    title: p.title,
    coverUrl: p.coverUrl,
    releaseYear: p.releaseYear,
    developer: p.developer,
    publisher: p.publisher,
    genres: p.genres,
    summary: p.summary,
  }));

  if (!igdbConfigured()) return NextResponse.json<GameSearchResponse>({ igdb: false, results });

  try {
    const games = await searchGames(q, { platformIgdbId: platform?.igdbId, limit: 8 });
    const known = new Set(local.map((p) => p.igdbId).filter(Boolean));
    for (const g of games) {
      if (known.has(g.igdbId)) continue;
      const { igdbId, title, coverUrl, releaseYear, developer, publisher, genres, summary } = g;
      results.push({ source: "igdb", igdbId, title, coverUrl, releaseYear, developer, publisher, genres, summary });
    }
    return NextResponse.json<GameSearchResponse>({ igdb: true, results });
  } catch (e) {
    console.error("[igdb]", e);
    return NextResponse.json<GameSearchResponse>({ igdb: true, results, error: "IGDB indisponible, réessayez." });
  }
}
