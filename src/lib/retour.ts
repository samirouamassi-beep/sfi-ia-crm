// Formulaires ouverts depuis une fiche (ex. "+ Tache" sur la fiche 360 d'un compte) :
// le champ cache "retour" ramene sur cette fiche apres l'enregistrement.

/** Chemin interne uniquement (commence par "/" mais pas "//") : pas de redirection externe. */
export function cheminValide(chemin: string | null | undefined): chemin is string {
  return !!chemin && chemin.startsWith("/") && !chemin.startsWith("//");
}

export function cheminRetour(formData: FormData, defaut: string): string {
  const v = formData.get("retour");
  return typeof v === "string" && cheminValide(v) ? v : defaut;
}
