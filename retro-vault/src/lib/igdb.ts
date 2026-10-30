// Client IGDB (https://api-docs.igdb.com) : authentification Twitch "client credentials",
// jeton mis en cache en mémoire jusqu'à expiration.

import "server-only";

export type IgdbGame = {
  igdbId: number;
  title: string;
  coverUrl: string | null;
  releaseYear: number | null;
  developer: string | null;
  publisher: string | null;
  genres: string[];
  summary: string | null;
  platformIgdbIds: number[];
};

type RawGame = {
  id: number;
  name: string;
  first_release_date?: number;
  summary?: string;
  cover?: { image_id: string };
  platforms?: number[];
  genres?: { name: string }[];
  involved_companies?: { developer: boolean; publisher: boolean; company: { name: string } }[];
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export function igdbConfigured(): boolean {
  return Boolean(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET);
}

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const params = new URLSearchParams({
    client_id: process.env.IGDB_CLIENT_ID!,
    client_secret: process.env.IGDB_CLIENT_SECRET!,
    grant_type: "client_credentials",
  });
  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: "POST" });
  if (!res.ok) throw new Error(`Twitch OAuth : HTTP ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

export function coverUrl(imageId: string, size: "cover_big" | "thumb" | "720p" = "cover_big") {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

/** Échappe une saisie utilisateur pour la syntaxe Apicalypse ("..."). */
function quote(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function mapGame(g: RawGame): IgdbGame {
  const companies = g.involved_companies ?? [];
  return {
    igdbId: g.id,
    title: g.name,
    coverUrl: g.cover ? coverUrl(g.cover.image_id) : null,
    releaseYear: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
    developer: companies.find((c) => c.developer)?.company.name ?? null,
    publisher: companies.find((c) => c.publisher)?.company.name ?? null,
    genres: (g.genres ?? []).map((x) => x.name),
    summary: g.summary ?? null,
    platformIgdbIds: g.platforms ?? [],
  };
}

export async function searchGames(
  query: string,
  opts: { platformIgdbId?: number | null; limit?: number } = {}
): Promise<IgdbGame[]> {
  const where = opts.platformIgdbId ? `where platforms = (${Math.trunc(opts.platformIgdbId)});` : "";
  const body = [
    `search ${quote(query)};`,
    "fields name,first_release_date,summary,cover.image_id,platforms,genres.name,",
    "involved_companies.developer,involved_companies.publisher,involved_companies.company.name;",
    where,
    `limit ${Math.min(opts.limit ?? 10, 20)};`,
  ].join(" ");

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${await accessToken()}`,
      Accept: "application/json",
    },
    body,
    // Les métadonnées d'un jeu rétro ne bougent pas : cache serveur d'une journée.
    next: { revalidate: 86_400 },
  });
  if (res.status === 401) cachedToken = null;
  if (!res.ok) throw new Error(`IGDB : HTTP ${res.status}`);
  return ((await res.json()) as RawGame[]).map(mapGame);
}
