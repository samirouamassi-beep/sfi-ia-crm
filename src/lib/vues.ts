// Vues de liste (equivalent des "List Views" Salesforce) : filtres, recherche et tri passes
// dans l'URL (?q=...&categorie=...&tri=nom&sens=asc). Tout est filtre en memoire, comme le
// reste de l'application : le volume de donnees d'une equipe de 4 associes le permet.

export type SearchParams = { [cle: string]: string | string[] | undefined };

export function lireParam(params: SearchParams, nom: string): string {
  const v = params[nom];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

/** Query string a partir des parametres actuels, avec des valeurs modifiees ("" = retirer). */
export function construireRequete(params: SearchParams, changements: Record<string, string> = {}) {
  const sp = new URLSearchParams();
  for (const cle of Object.keys(params)) {
    const v = lireParam(params, cle);
    if (v) sp.set(cle, v);
  }
  for (const [cle, v] of Object.entries(changements)) {
    if (v) sp.set(cle, v);
    else sp.delete(cle);
  }
  return sp.toString();
}

/** Recherche texte insensible a la casse et aux accents. */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function correspond(q: string, ...champs: (string | null | undefined)[]): boolean {
  if (!q) return true;
  const n = normaliser(q);
  return champs.some((c) => c && normaliser(c).includes(n));
}

type Valeur = string | number | Date | null | undefined;

export function trier<T>(
  items: T[],
  params: SearchParams,
  colonnes: Record<string, (item: T) => Valeur>,
  defaut: { tri: string; sens: "asc" | "desc" }
): T[] {
  const tri = lireParam(params, "tri") in colonnes ? lireParam(params, "tri") : defaut.tri;
  const sensParam = lireParam(params, "sens");
  const sens = sensParam === "asc" || sensParam === "desc" ? sensParam : defaut.sens;
  const acces = colonnes[tri];
  if (!acces) return items;
  const facteur = sens === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const va = acces(a);
    const vb = acces(b);
    // Les valeurs vides restent toujours en fin de liste, quel que soit le sens.
    if (va == null || va === "") return vb == null || vb === "" ? 0 : 1;
    if (vb == null || vb === "") return -1;
    if (va instanceof Date && vb instanceof Date) return (va.getTime() - vb.getTime()) * facteur;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * facteur;
    return String(va).localeCompare(String(vb), "fr", { sensitivity: "base" }) * facteur;
  });
}

export function joursDepuis(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

/** Instant situe dans n jours (filtres "closing sous n jours"). */
export function dansJours(n: number): number {
  return Date.now() + n * 86_400_000;
}
