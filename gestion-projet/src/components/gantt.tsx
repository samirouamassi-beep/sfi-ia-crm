"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ajouterJours, debutJour, lundi, numeroSemaine } from "@/lib/calculs";

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
  /** Planning de référence : affiché en barre grise fine sous la barre réelle. */
  baselineDebut?: Date | null;
  baselineFin?: Date | null;
};

export type LienGantt = { de: string; vers: string };

const LARGEUR_SEMAINE = 42;
const PX_JOUR = LARGEUR_SEMAINE / 7;
const HAUTEUR_LIGNE = 36;
const HAUTEUR_ENTETE = 48;
const LARGEUR_LIBELLES = 256; // colonne des libellés (w-64)
const JOUR_MS = 24 * 60 * 60 * 1000;

const formatDate = (d: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Glisse = {
  id: string;
  mode: "deplacer" | "debut" | "fin";
  x0: number;
  debut: Date;
  fin: Date;
  jalon: boolean;
};

/**
 * Diagramme de Gantt : une colonne par semaine, barres remplies selon l'avancement, jalons
 * en losange, flèches de dépendance, planning de référence en gris, ligne du jour.
 * Avec `deplacer`, les barres se déplacent (glisser) et s'allongent (poignées) à la souris ;
 * les successeurs sont alors repoussés côté serveur.
 */
export function Gantt({
  lignes,
  liens = [],
  deplacer,
}: {
  lignes: LigneGantt[];
  liens?: LienGantt[];
  deplacer?: (id: string, debut: string, fin: string) => Promise<number>;
}) {
  const [apercu, setApercu] = useState<{ id: string; debut: Date; fin: Date } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const glisse = useRef<Glisse | null>(null);
  const defilement = useRef<HTMLDivElement>(null);

  // À l'ouverture, se placer sur la période en cours : aujourd'hui au premier tiers de la
  // zone visible (la colonne des libellés, collante, en occupe le début).
  useEffect(() => {
    const el = defilement.current;
    if (!el) return;
    const ligne = el.querySelector<HTMLElement>("[data-aujourdhui]");
    if (!ligne) return;
    const x = ligne.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
    const visible = el.clientWidth - LARGEUR_LIBELLES;
    el.scrollLeft = Math.max(0, x - LARGEUR_LIBELLES - visible * 0.3);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  if (lignes.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Rien à afficher.</p>;
  }

  const dates = (l: LigneGantt) =>
    apercu && apercu.id === l.id ? { debut: apercu.debut, fin: apercu.fin } : { debut: l.debut, fin: l.fin };

  const aujourdhui = debutJour(new Date());
  const toutes = lignes.flatMap((l) => [l.debut, l.fin, l.baselineDebut, l.baselineFin].filter((d): d is Date => !!d));
  const min = new Date(Math.min(...toutes.map((d) => d.getTime()), aujourdhui.getTime()));
  const max = new Date(Math.max(...toutes.map((d) => d.getTime()), aujourdhui.getTime()));
  const origine = lundi(ajouterJours(min, -7));
  const nbSemaines = Math.ceil((max.getTime() - origine.getTime()) / (7 * JOUR_MS)) + 3;
  const semaines = Array.from({ length: nbSemaines }, (_, i) => ajouterJours(origine, i * 7));
  const largeur = nbSemaines * LARGEUR_SEMAINE;
  const px = (d: Date) => ((debutJour(d).getTime() - origine.getTime()) / JOUR_MS) * PX_JOUR;

  const mois: { label: string; debut: number; largeur: number }[] = [];
  for (const s of semaines) {
    const label = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(s);
    const dernier = mois[mois.length - 1];
    if (dernier && dernier.label === label) dernier.largeur += LARGEUR_SEMAINE;
    else mois.push({ label, debut: px(s), largeur: LARGEUR_SEMAINE });
  }

  function commencer(e: React.PointerEvent, l: LigneGantt, mode: Glisse["mode"]) {
    if (!deplacer || enCours) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    glisse.current = { id: l.id, mode, x0: e.clientX, debut: l.debut, fin: l.fin, jalon: !!l.jalon };
  }

  function bouger(e: React.PointerEvent) {
    const g = glisse.current;
    if (!g) return;
    const jours = Math.round((e.clientX - g.x0) / PX_JOUR);
    let debut = g.debut;
    let fin = g.fin;
    if (g.mode === "deplacer" || g.jalon) {
      debut = ajouterJours(g.debut, jours);
      fin = ajouterJours(g.fin, jours);
    } else if (g.mode === "fin") {
      fin = ajouterJours(g.fin, jours);
      if (fin < debut) fin = debut;
    } else {
      debut = ajouterJours(g.debut, jours);
      if (debut > fin) debut = fin;
    }
    setApercu({ id: g.id, debut, fin });
  }

  function lacher() {
    const g = glisse.current;
    glisse.current = null;
    if (!g || !apercu || apercu.id !== g.id || !deplacer) {
      setApercu(null);
      return;
    }
    if (apercu.debut.getTime() === g.debut.getTime() && apercu.fin.getTime() === g.fin.getTime()) {
      setApercu(null);
      return;
    }
    const cible = apercu;
    demarrer(async () => {
      const repoussees = await deplacer(cible.id, iso(cible.debut), iso(cible.fin));
      setApercu(null);
      setMessage(
        repoussees > 0
          ? `${repoussees} tâche(s) suivante(s) repoussée(s) par les dépendances.`
          : `Dates enregistrées : ${formatDate(cible.debut)} → ${formatDate(cible.fin)}.`
      );
    });
  }

  // Flèches de dépendance : de la fin du prédécesseur au début du successeur.
  const index = new Map(lignes.map((l, i) => [l.id, i]));
  const centre = (i: number) => i * HAUTEUR_LIGNE + HAUTEUR_LIGNE / 2;
  const fleches = liens.flatMap(({ de, vers }) => {
    const i = index.get(de);
    const j = index.get(vers);
    if (i == null || j == null) return [];
    const a = lignes[i];
    const b = lignes[j];
    const x1 = a.jalon ? px(dates(a).fin) + PX_JOUR / 2 + 6 : px(ajouterJours(dates(a).fin, 1));
    const x2 = b.jalon ? px(dates(b).debut) + PX_JOUR / 2 - 7 : px(dates(b).debut);
    const y1 = centre(i);
    const y2 = centre(j);
    const d =
      x2 - 8 >= x1 + 6
        ? `M${x1},${y1} H${x1 + 6} V${y2} H${x2}`
        : `M${x1},${y1} H${x1 + 6} V${y2 > y1 ? y2 - HAUTEUR_LIGNE / 2 : y2 + HAUTEUR_LIGNE / 2} H${x2 - 10} V${y2} H${x2}`;
    return [{ cle: `${de}-${vers}`, d }];
  });

  return (
    <div className="relative">
      {message && (
        <div className="absolute right-2 top-2 z-40 rounded-md bg-slate-900 px-3 py-2 text-sm text-white shadow-lg">
          {message}
        </div>
      )}
      <div
        ref={defilement}
        className={`overflow-x-auto rounded-lg border border-slate-200 ${enCours ? "opacity-70" : ""}`}
      >
        <div className="flex min-w-max">
          {/* Colonne des libellés */}
          <div className="sticky left-0 z-30 w-64 shrink-0 border-r border-slate-200 bg-white">
            <div
              className="flex items-end border-b border-slate-200 px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
              style={{ height: HAUTEUR_ENTETE }}
            >
              Tâche
            </div>
            {lignes.map((l) => (
              <div
                key={l.id}
                className={`flex flex-col justify-center border-b border-slate-100 px-3 ${l.groupe ? "bg-slate-50" : ""}`}
                style={{ height: HAUTEUR_LIGNE }}
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
          <div
            className="relative select-none"
            style={{ width: largeur }}
            onPointerMove={bouger}
            onPointerUp={lacher}
            onPointerCancel={lacher}
          >
            <div className="relative border-b border-slate-200 bg-white" style={{ height: HAUTEUR_ENTETE }}>
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: HAUTEUR_ENTETE }}>
              {semaines.map((s) => (
                <div key={s.getTime()} className="absolute top-0 bottom-0 border-l border-slate-100" style={{ left: px(s) }} />
              ))}
              <div
                data-aujourdhui
                className="absolute top-0 bottom-0 z-10 w-0.5 bg-rose-500/70"
                style={{ left: px(aujourdhui) + PX_JOUR / 2 }}
                title="Aujourd'hui"
              />
              {fleches.length > 0 && (
                <svg className="absolute left-0 top-0 z-10" width={largeur} height={lignes.length * HAUTEUR_LIGNE}>
                  <defs>
                    <marker id="fleche-gantt" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                      <path d="M0,0 L8,4 L0,8 z" fill="#64748b" />
                    </marker>
                  </defs>
                  {fleches.map((f) => (
                    <path key={f.cle} d={f.d} fill="none" stroke="#64748b" strokeWidth={1.25} markerEnd="url(#fleche-gantt)" />
                  ))}
                </svg>
              )}
            </div>

            {lignes.map((l) => {
              const { debut, fin } = dates(l);
              const gauche = px(debut);
              const largeurBarre = Math.max(px(ajouterJours(fin, 1)) - gauche, 6);
              const titre = `${l.label} : ${formatDate(debut)} → ${formatDate(fin)} (${l.avancement} %)${
                l.retard ? " — en retard" : ""
              }`;
              const mobile = !!deplacer && !l.groupe;
              const reference =
                l.baselineDebut && l.baselineFin && !l.groupe ? (
                  <div
                    className="absolute bottom-1 h-1.5 rounded-sm bg-slate-400/70"
                    style={{
                      left: px(l.baselineDebut),
                      width: Math.max(px(ajouterJours(l.baselineFin, 1)) - px(l.baselineDebut), 4),
                    }}
                    title={`Référence : ${formatDate(l.baselineDebut)} → ${formatDate(l.baselineFin)}`}
                  />
                ) : null;
              return (
                <div
                  key={l.id}
                  className={`relative border-b border-slate-100 ${l.groupe ? "bg-slate-50/60" : ""}`}
                  style={{ height: HAUTEUR_LIGNE }}
                >
                  {reference}
                  {l.jalon ? (
                    <div
                      onPointerDown={(e) => commencer(e, l, "deplacer")}
                      className={`absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 ${
                        l.avancement >= 100 ? "bg-emerald-600" : l.retard ? "bg-red-600" : "bg-slate-800"
                      } ${mobile ? "cursor-grab active:cursor-grabbing" : ""}`}
                      style={{ left: gauche + PX_JOUR / 2 }}
                      title={`${l.label} — ${formatDate(fin)}`}
                    />
                  ) : l.groupe ? (
                    <div
                      className="absolute top-1/2 h-2 -translate-y-1/2 rounded-sm bg-slate-700"
                      style={{ left: gauche, width: largeurBarre }}
                      title={titre}
                    >
                      <div className="h-full rounded-sm bg-indigo-400" style={{ width: `${l.avancement}%` }} />
                    </div>
                  ) : (
                    <div
                      onPointerDown={(e) => commencer(e, l, "deplacer")}
                      className={`group absolute top-1.5 z-20 h-5 overflow-hidden rounded ${
                        l.retard ? "bg-red-200 ring-1 ring-red-400" : "bg-indigo-200"
                      } ${mobile ? "cursor-grab active:cursor-grabbing" : ""} ${
                        apercu?.id === l.id ? "ring-2 ring-indigo-500" : ""
                      }`}
                      style={{ left: gauche, width: largeurBarre }}
                      title={titre}
                    >
                      <div
                        className={`h-full ${l.retard ? "bg-red-500" : "bg-indigo-600"}`}
                        style={{ width: `${l.avancement}%` }}
                      />
                      {mobile && (
                        <>
                          <div
                            onPointerDown={(e) => commencer(e, l, "debut")}
                            className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-indigo-900/0 group-hover:bg-indigo-900/40"
                          />
                          <div
                            onPointerDown={(e) => commencer(e, l, "fin")}
                            className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-indigo-900/0 group-hover:bg-indigo-900/40"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LegendeGantt({ modifiable, reference }: { modifiable?: boolean; reference?: boolean }) {
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
        <svg width="22" height="10" aria-hidden="true">
          <path d="M1,5 H18" stroke="#64748b" strokeWidth="1.25" />
          <path d="M16,1 L21,5 L16,9 z" fill="#64748b" />
        </svg>
        Dépendance
      </span>
      {reference && (
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-6 rounded-sm bg-slate-400/70" /> Planning de référence
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-0.5 bg-rose-500" /> Aujourd&apos;hui
      </span>
      {modifiable && <span className="font-medium text-slate-600">Glisser une barre pour la déplacer, tirer ses bords pour changer ses dates.</span>}
    </div>
  );
}
