// Lecture des champs de formulaire (server actions).

export function texte(formData: FormData, nom: string): string | null {
  const v = formData.get(nom);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export function nombre(formData: FormData, nom: string, defaut = 0): number {
  const v = texte(formData, nom);
  if (v == null) return defaut;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : defaut;
}

/** Date saisie dans un <input type="date"> (AAAA-MM-JJ), interprétée à minuit heure locale. */
export function date(formData: FormData, nom: string): Date | null {
  const v = texte(formData, nom);
  if (!v) return null;
  const [a, m, j] = v.split("-").map(Number);
  return new Date(a, m - 1, j);
}
