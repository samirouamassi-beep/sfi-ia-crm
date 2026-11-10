// Polices standard PDF (Helvetica) : encodage WinAnsi, proche de Latin-1.

/** Ramène un texte au jeu de caractères WinAnsi des polices standard PDF. */
export function pdfText(input: string): string {
  return input
    .replace(/[\u202F\u2009\u00A0]/g, " ") // espaces fines insérées par Intl fr-FR
    .replace(/\u2212/g, "-")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7E\u00A0-\u00FF€‘’“”–—…•]/g, "?");
}
