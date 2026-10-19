"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { changerEtapeOpportunite } from "./actions";
import { formatDate, formatEuros } from "@/components/ui";

export type Carte = {
  id: string;
  intitule: string;
  compteId: string;
  compteNom: string;
  montant: number;
  etape: string;
  dateClosingVisee: Date | null;
  echeanceProchaineAction: Date | null;
  prochaineAction: string | null;
  fondateurReferent: string | null;
};

const COULEURS_ETAPE: Record<string, string> = {
  Signé: "border-t-emerald-500",
  Perdu: "border-t-red-400",
  Reporté: "border-t-amber-400",
};

export function Kanban({
  etapes,
  cartes: cartesInitiales,
}: {
  etapes: { etape: string; probabilite: number }[];
  cartes: Carte[];
}) {
  const [cartes, setCartes] = useState(cartesInitiales);
  const [survol, setSurvol] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Les cartes rechargees par le serveur (filtres, autre onglet) remplacent l'etat local.
  const [precedentes, setPrecedentes] = useState(cartesInitiales);
  if (precedentes !== cartesInitiales) {
    setPrecedentes(cartesInitiales);
    setCartes(cartesInitiales);
  }

  function deplacer(id: string, etape: string) {
    const carte = cartes.find((c) => c.id === id);
    if (!carte || carte.etape === etape) return;
    const etapeAvant = carte.etape;
    setErreur(null);
    setCartes((cs) => cs.map((c) => (c.id === id ? { ...c, etape } : c)));
    startTransition(async () => {
      try {
        await changerEtapeOpportunite(id, etape);
      } catch {
        setCartes((cs) => cs.map((c) => (c.id === id ? { ...c, etape: etapeAvant } : c)));
        setErreur(`Impossible de déplacer « ${carte.intitule} ». Réessayez.`);
      }
    });
  }

  return (
    <div className="space-y-2">
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {etapes.map((e) => {
          const colonne = cartes.filter((c) => c.etape === e.etape);
          const total = colonne.reduce((s, c) => s + c.montant, 0);
          return (
            <div
              key={e.etape}
              onDragOver={(ev) => {
                ev.preventDefault();
                setSurvol(e.etape);
              }}
              onDragLeave={() => setSurvol((s) => (s === e.etape ? null : s))}
              onDrop={(ev) => {
                ev.preventDefault();
                setSurvol(null);
                deplacer(ev.dataTransfer.getData("text/plain"), e.etape);
              }}
              className={`flex w-64 shrink-0 flex-col rounded-lg border border-t-4 bg-slate-100/70 ${
                COULEURS_ETAPE[e.etape] ?? "border-t-slate-400"
              } ${survol === e.etape ? "border-slate-400 bg-slate-200/70" : "border-slate-200"}`}
            >
              <div className="border-b border-slate-200 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">{e.etape}</h3>
                  <span className="text-xs text-slate-500">
                    {colonne.length} · {Math.round(e.probabilite * 100)} %
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  {formatEuros(total)}
                  <span className="text-slate-400"> · pondéré {formatEuros(total * e.probabilite)}</span>
                </p>
              </div>
              <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                {colonne.map((c) => {
                  const enRetard =
                    c.echeanceProchaineAction != null &&
                    new Date(c.echeanceProchaineAction).getTime() < Date.now();
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(ev) => {
                        ev.dataTransfer.setData("text/plain", c.id);
                        ev.dataTransfer.effectAllowed = "move";
                      }}
                      className="cursor-grab rounded-md border border-slate-200 bg-white p-2.5 text-sm shadow-sm active:cursor-grabbing"
                    >
                      <Link
                        href={`/pipeline/${c.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {c.intitule}
                      </Link>
                      <Link
                        href={`/comptes/${c.compteId}`}
                        className="block text-xs text-slate-500 hover:underline"
                      >
                        {c.compteNom}
                      </Link>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {formatEuros(c.montant)}
                        </span>
                        <span className="text-slate-500">
                          {c.dateClosingVisee ? `Closing ${formatDate(c.dateClosingVisee)}` : ""}
                        </span>
                      </div>
                      {(c.prochaineAction || c.echeanceProchaineAction) && (
                        <p
                          className={`mt-1.5 rounded px-1.5 py-0.5 text-xs ${
                            enRetard ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {c.prochaineAction ?? "Prochaine action"}
                          {c.echeanceProchaineAction &&
                            ` · ${formatDate(c.echeanceProchaineAction)}`}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">{c.fondateurReferent ?? ""}</span>
                        {/* Ecrans tactiles : le glisser-deposer HTML n'y fonctionne pas. */}
                        <select
                          aria-label="Déplacer vers l'étape"
                          value={c.etape}
                          onChange={(ev) => deplacer(c.id, ev.target.value)}
                          className="hidden rounded border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-600 pointer-coarse:block"
                        >
                          {etapes.map((x) => (
                            <option key={x.etape} value={x.etape}>
                              {x.etape}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
                {colonne.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">Déposez une carte ici</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
