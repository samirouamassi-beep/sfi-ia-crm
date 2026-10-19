// Graphiques simples en HTML/CSS (pas de librairie) : barres horizontales et colonnes.
// Specs : barres <= 24px d'epaisseur, extremite arrondie 4px, valeur ecrite en bout de barre
// (couleur de texte, jamais la couleur de la serie), info-bulle native au survol de la ligne.

export const COULEURS = {
  principale: "#2a78d6", // bleu, serie 1
  secondaire: "#86b6ef", // meme rampe, pas 250 (total derriere le pondere)
  succes: "#1baf7a",
  perte: "#e34948",
};

export type Barre = {
  label: string;
  valeur: number;
  /** Seconde valeur (>= valeur) dessinee en fond, ex. montant total derriere le pondere. */
  fond?: number;
  texte?: string;
  infobulle?: string;
  href?: string;
};

export function BarresHorizontales({
  barres,
  couleur = COULEURS.principale,
  couleurFond = COULEURS.secondaire,
  vide = "Aucune donnée.",
}: {
  barres: Barre[];
  couleur?: string;
  couleurFond?: string;
  vide?: string;
}) {
  const max = Math.max(...barres.map((b) => Math.max(b.valeur, b.fond ?? 0)), 0);
  if (barres.length === 0 || max === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{vide}</p>;
  }
  return (
    <ul className="space-y-2">
      {barres.map((b) => {
        const largeur = (b.valeur / max) * 100;
        const largeurFond = b.fond != null ? (b.fond / max) * 100 : 0;
        const contenu = (
          <>
            <span className="w-32 shrink-0 truncate text-xs text-slate-600 sm:w-40">{b.label}</span>
            <span className="relative flex h-5 flex-1 items-center">
              {b.fond != null && (
                <span
                  className="absolute left-0 top-0 h-full rounded-r"
                  style={{ width: `${largeurFond}%`, backgroundColor: couleurFond }}
                />
              )}
              <span
                className="relative h-full rounded-r"
                style={{ width: `${Math.max(largeur, b.valeur > 0 ? 0.5 : 0)}%`, backgroundColor: couleur }}
              />
              <span className="relative ml-2 whitespace-nowrap text-xs font-medium text-slate-800">
                {b.texte ?? b.valeur}
              </span>
            </span>
          </>
        );
        return (
          <li key={b.label} title={b.infobulle ?? `${b.label} : ${b.texte ?? b.valeur}`}>
            {b.href ? (
              <a href={b.href} className="flex items-center gap-3 rounded hover:bg-slate-50">
                {contenu}
              </a>
            ) : (
              <div className="flex items-center gap-3 rounded hover:bg-slate-50">{contenu}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Colonnes({
  colonnes,
  couleur = COULEURS.principale,
  hauteur = 160,
  vide = "Aucune donnée.",
}: {
  colonnes: { label: string; valeur: number; texte?: string; infobulle?: string; accent?: boolean }[];
  couleur?: string;
  hauteur?: number;
  vide?: string;
}) {
  const max = Math.max(...colonnes.map((c) => c.valeur), 0);
  if (colonnes.length === 0 || max === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{vide}</p>;
  }
  return (
    <div>
      <div
        className="flex items-end gap-1 border-b border-slate-200"
        style={{ height: hauteur + 20 }}
      >
        {colonnes.map((c) => (
          <div
            key={c.label}
            title={c.infobulle ?? `${c.label} : ${c.texte ?? c.valeur}`}
            className="group flex h-full flex-1 flex-col items-center justify-end hover:bg-slate-50"
          >
            {c.valeur > 0 && (
              <span className="mb-1 whitespace-nowrap text-[10px] font-medium text-slate-700">
                {c.texte ?? c.valeur}
              </span>
            )}
            <span
              className="w-full max-w-6 rounded-t"
              style={{
                height: `${(c.valeur / max) * hauteur}px`,
                backgroundColor: c.accent ? COULEURS.perte : couleur,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {colonnes.map((c) => (
          <span key={c.label} className="flex-1 truncate text-center text-[10px] text-slate-500">
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Legende({ elements }: { elements: { label: string; couleur: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600">
      {elements.map((e) => (
        <span key={e.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: e.couleur }} />
          {e.label}
        </span>
      ))}
    </div>
  );
}

export function Tuile({
  label,
  valeur,
  detail,
}: {
  label: string;
  valeur: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valeur}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}
