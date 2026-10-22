import Link from "next/link";
import { CAUTION_LIBEREE, STATUTS_CAUTION, TYPES_CAUTION } from "@/lib/listes";
import { debutJour } from "@/lib/calculs";
import {
  Badge,
  Vide,
  boutonPrincipal,
  dateInput,
  formatDate,
  formatMontant,
  inputClass,
  labelClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/ui";
import { ajouterCaution, changerStatutCaution, supprimerCaution } from "./actions";

export type LigneCaution = {
  id: string;
  type: string;
  montant: number;
  banque: string | null;
  reference: string | null;
  dateEmission: Date | null;
  dateEcheance: Date | null;
  statut: string;
  notes: string | null;
  appelOffre?: { id: string; reference: string; maitreOuvrage: string };
};

const TON_STATUT: Record<string, string> = {
  "À émettre": "À faire",
  Émise: "En cours",
  Déposée: "En revue",
  [CAUTION_LIBEREE]: "Terminé",
};

/** Tableau des cautions ; `avecAppelOffre` ajoute la colonne de l'AO (vue consolidée). */
export function TableauCautions({ cautions, avecAppelOffre }: { cautions: LigneCaution[]; avecAppelOffre?: boolean }) {
  const auj = debutJour(new Date());
  if (cautions.length === 0) return <Vide>Aucune caution.</Vide>;
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className={tableClass}>
        <thead className="border-b border-slate-200">
          <tr>
            {avecAppelOffre && <th className={thClass}>Appel d&apos;offres</th>}
            <th className={thClass}>Type</th>
            <th className={`${thClass} text-right`}>Montant</th>
            <th className={thClass}>Banque · réf.</th>
            <th className={thClass}>Émise le</th>
            <th className={thClass}>Restitution prévue</th>
            <th className={thClass}>Statut</th>
            <th className={thClass} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cautions.map((c) => {
            const active = c.statut !== CAUTION_LIBEREE;
            const echue = active && c.dateEcheance != null && c.dateEcheance < auj;
            return (
              <tr key={c.id} className={active ? "" : "text-slate-400"}>
                {avecAppelOffre && c.appelOffre && (
                  <td className={tdClass}>
                    <Link href={`/appels-offres/${c.appelOffre.id}`} className="font-medium text-indigo-700 hover:underline">
                      {c.appelOffre.reference}
                    </Link>
                    <div className="text-xs text-slate-500">{c.appelOffre.maitreOuvrage}</div>
                  </td>
                )}
                <td className={tdClass}>{c.type}</td>
                <td className={`${tdClass} whitespace-nowrap text-right tabular-nums`}>{formatMontant(c.montant)}</td>
                <td className={tdClass}>
                  {c.banque ?? "—"}
                  {c.reference && <div className="text-xs text-slate-500">{c.reference}</div>}
                  {c.notes && <div className="text-xs text-slate-500">{c.notes}</div>}
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>{formatDate(c.dateEmission)}</td>
                <td className={`${tdClass} whitespace-nowrap ${echue ? "font-medium text-red-600" : ""}`}>
                  {formatDate(c.dateEcheance)}
                  {echue && <div className="text-xs">échue : relancer la mainlevée</div>}
                </td>
                <td className={tdClass}>
                  <form action={changerStatutCaution.bind(null, c.id)} className="flex items-center gap-1">
                    <select
                      name="statut"
                      defaultValue={c.statut}
                      aria-label="Statut de la caution"
                      className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs"
                    >
                      {STATUTS_CAUTION.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button type="submit" className="rounded border border-slate-200 px-1.5 py-1 text-xs hover:bg-slate-50">
                      OK
                    </button>
                  </form>
                  <div className="mt-1">
                    <Badge ton={TON_STATUT[c.statut]}>{c.statut}</Badge>
                  </div>
                </td>
                <td className={tdClass}>
                  <form action={supprimerCaution.bind(null, c.id)}>
                    <button className="text-xs text-slate-400 hover:text-red-600" title="Supprimer">
                      ✕
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AjoutCaution({ appelOffreId }: { appelOffreId: string }) {
  return (
    <form action={ajouterCaution.bind(null, appelOffreId)} className="grid items-end gap-2 sm:grid-cols-4 lg:grid-cols-8">
      <div>
        <label className={labelClass}>Type</label>
        <select name="type" className={inputClass}>
          {TYPES_CAUTION.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Montant (MAD)</label>
        <input type="number" min="0.01" step="any" name="montant" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Banque</label>
        <input name="banque" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Référence</label>
        <input name="reference" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Émise le</label>
        <input type="date" name="dateEmission" defaultValue={dateInput(new Date())} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Restitution prévue</label>
        <input type="date" name="dateEcheance" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Statut</label>
        <select name="statut" defaultValue="Émise" className={inputClass}>
          {STATUTS_CAUTION.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <button type="submit" className={boutonPrincipal}>
        Ajouter
      </button>
    </form>
  );
}
