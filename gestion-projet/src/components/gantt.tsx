import Link from "next/link";
import { ajouterJours, debutJour, lundi, numeroSemaine } from "@/lib/calculs";
import { formatDate } from "@/components/ui";

export type LigneGantt = {
  id: string;
  label: string;
  sousLabel?: string;
  debut: Date;
  fin: Date;
  avancement: number;
  jalon?: boolean;
  retard?: boolean;
  href?: string;
  /** Ligne de regroupement (phase ou projet) : barre résumé, libellé en gras. */
  groupe?: boolean;
  couleur?: string;
};

const LARGEUR_SEMAINE = 34;
const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * Diagramme de Gantt rendu côté serveur (HTML/CSS, sans dépendance) : une colonne par
 * semaine, une barre par tâche remplie selon l'avancement, jalons en losange, ligne
 * verticale sur aujourd'hui.
 */
export function Gantt({ lignes }: { lignes: LigneGantt[] }) {
  if (lignes.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Rien à afficher.</p>;
  }
  const aujourdhui = debutJour(new Date());
  const min = new Date(Math.min(...lignes.map((l) => l.debut.getTime()), aujourdhui.getTime()));
  const max = new Date(Math.max(...lignes.map((l) => l.fin.getTime()), aujourdhui.getTime()));
  const origine = lundi(ajouterJours(min, -7));
  const nbSemaines = Math.ceil((max.getTime() - origine.getTime()) / (7 * JOUR_MS)) + 2;
  const semaines = Array.from({ length: nbSemaines }, (_, i) => ajouterJours(origine, i * 7));
  const largeur = nbSemaines * LARGEUR_SEMAINE;
  const px = (d: Date) => ((debutJour(d).getTime() - origine.getTime()) / (7 * JOUR_MS)) * LARGEUR_SEMAINE;

  // Bandeau des mois au-dessus des semaines.
  const mois: { label: string; debut: number; largeur: number }[] = [];
  for (const s of semaines) {
    const label = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(s);
    const dernier = mois[mois.length - 1];
    if (dernier && dernier.label === label) dernier.largeur += LARGEUR_SEMAINE;
    else mois.push({ label, debut: px(s), largeur: LARGEUR_SEMAINE });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <div className="flex min-w-max">
        {/* Colonne des libellés */}
        <div className="sticky left-0 z-20 w-64 shrink-0 border-r border-slate-200 bg-white">
          <div className="flex h-12 items-end border-b border-slate-200 px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tâche
          </div>
          {lignes.map((l) => (
            <div
              key={l.id}
              className={`flex h-9 flex-col justify-center border-b border-slate-100 px-3 ${
                l.groupe ? "bg-slate-50" : ""
              }`}
            >
              <div className={`truncate text-sm ${l.groupe ? "font-semibold" : "pl-3"}`}>
                {l.href ? (
                  <Link href={l.href} className="hover:text-indigo-700 hover:underline">
                    {l.jalon && "◆ "}
                    {l.label}
                  </Link>
                ) : (
                  <>
                    {l.jalon && "◆ "}
                    {l.label}
                  </>
                )}
              </div>
              {l.sousLabel && (
                <div className={`truncate text-[11px] leading-tight text-slate-500 ${l.groupe ? "" : "pl-3"}`}>
                  {l.sousLabel}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zone temporelle */}
        <div className="relative" style={{ width: largeur }}>
          <div className="relative h-12 border-b border-slate-200 bg-white">
            {mois.map((m) => (
              <div
                key={m.label + m.debut}
                className="absolute top-0 h-6 truncate border-l border-slate-200 px-1.5 pt-1 text-xs font-medium capitalize text-slate-600"
                style={{ left: m.debut, width: m.largeur }}
              >
                {m.label}
              </div>
            ))}
            {semaines.map((s) => (
              <div
                key={s.getTime()}
                className="absolute bottom-0 h-6 border-l border-slate-100 pt-1 text-center text-[10px] text-slate-400"
                style={{ left: px(s), width: LARGEUR_SEMAINE }}
                title={`Semaine du ${formatDate(s)}`}
              >
                S{numeroSemaine(s)}
              </div>
            ))}
          </div>

          {/* Quadrillage + ligne du jour */}
          <div className="pointer-events-none absolute inset-x-0 top-12 bottom-0">
            {semaines.map((s) => (
              <div
                key={s.getTime()}
                className="absolute top-0 bottom-0 border-l border-slate-100"
                style={{ left: px(s) }}
              />
            ))}
            <div
              className="absolute top-0 bottom-0 z-10 w-0.5 bg-rose-500/70"
              style={{ left: px(aujourdhui) + LARGEUR_SEMAINE / 14 }}
              title="Aujourd'hui"
            />
          </div>

          {lignes.map((l) => {
            const gauche = px(l.debut);
            const largeurBarre = Math.max(px(ajouterJours(l.fin, 1)) - gauche, 6);
            return (
              <div
                key={l.id}
                className={`relative h-9 border-b border-slate-100 ${l.groupe ? "bg-slate-50/60" : ""}`}
              >
                {l.jalon ? (
                  <div
                    className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 ${
                      l.avancement >= 100 ? "bg-emerald-600" : l.retard ? "bg-red-600" : "bg-slate-800"
                    }`}
                    style={{ left: gauche + LARGEUR_SEMAINE / 14 }}
                    title={`${l.label} — ${formatDate(l.fin)}`}
                  />
                ) : l.groupe ? (
                  <div
                    className="absolute top-1/2 h-2 -translate-y-1/2 rounded-sm bg-slate-700"
                    style={{ left: gauche, width: largeurBarre }}
                    title={`${l.label} : ${formatDate(l.debut)} → ${formatDate(l.fin)} (${l.avancement} %)`}
                  >
                    <div className="h-full rounded-sm bg-indigo-400" style={{ width: `${l.avancement}%` }} />
                  </div>
                ) : (
                  <div
                    className={`absolute top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded ${
                      l.retard ? "bg-red-200 ring-1 ring-red-400" : l.couleur ?? "bg-indigo-200"
                    }`}
                    style={{ left: gauche, width: largeurBarre }}
                    title={`${l.label} : ${formatDate(l.debut)} → ${formatDate(l.fin)} (${l.avancement} %)${
                      l.retard ? " — en retard" : ""
                    }`}
                  >
                    <div
                      className={`h-full ${l.retard ? "bg-red-500" : "bg-indigo-600"}`}
                      style={{ width: `${l.avancement}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LegendeGantt() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-6 rounded bg-indigo-200">
          <span className="block h-full w-1/2 rounded-l bg-indigo-600" />
        </span>
        Tâche (partie foncée = avancement)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-6 rounded bg-red-200 ring-1 ring-red-400" /> En retard
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rotate-45 bg-slate-800" /> Jalon
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-0.5 bg-rose-500" /> Aujourd&apos;hui
      </span>
    </div>
  );
}
