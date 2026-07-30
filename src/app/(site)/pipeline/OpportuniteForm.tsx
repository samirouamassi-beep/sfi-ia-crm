import { TYPES_OFFRE } from "@/lib/listes";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui";
import Link from "next/link";

type Valeurs = {
  intitule?: string;
  compteId?: string;
  typeOffre?: string;
  nbJoursOuPostes?: number | null;
  montant?: number;
  etape?: string;
  dateClosingVisee?: Date | null;
  fondateurReferent?: string | null;
  prochaineAction?: string | null;
  echeanceProchaineAction?: Date | null;
  concurrenceIdentifiee?: string | null;
  notes?: string | null;
};

function dateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function OpportuniteForm({
  action,
  valeurs = {},
  comptes,
  fondateurs,
  etapes,
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
  comptes: { id: string; nom: string }[];
  fondateurs: { nom: string }[];
  etapes: { etape: string }[];
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Intitulé de l&apos;opportunité *</label>
          <input name="intitule" defaultValue={valeurs.intitule} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Compte *</label>
          <select name="compteId" defaultValue={valeurs.compteId} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {comptes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Type d&apos;offre *</label>
          <select name="typeOffre" defaultValue={valeurs.typeOffre} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {TYPES_OFFRE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Nb de jours ou de postes</label>
          <input
            type="number"
            step="0.5"
            name="nbJoursOuPostes"
            defaultValue={valeurs.nbJoursOuPostes ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Montant (€ HT) *</label>
          <input
            type="number"
            step="1"
            name="montant"
            defaultValue={valeurs.montant ?? ""}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Étape *</label>
          <select name="etape" defaultValue={valeurs.etape} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {etapes.map((e) => (
              <option key={e.etape} value={e.etape}>
                {e.etape}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date de closing visée</label>
          <input
            type="date"
            name="dateClosingVisee"
            defaultValue={dateInput(valeurs.dateClosingVisee)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Fondateur référent</label>
          <select
            name="fondateurReferent"
            defaultValue={valeurs.fondateurReferent ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            {fondateurs.map((f) => (
              <option key={f.nom} value={f.nom}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Prochaine action</label>
          <input
            name="prochaineAction"
            defaultValue={valeurs.prochaineAction ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Échéance prochaine action</label>
          <input
            type="date"
            name="echeanceProchaineAction"
            defaultValue={dateInput(valeurs.echeanceProchaineAction)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Concurrence identifiée</label>
          <input
            name="concurrenceIdentifiee"
            defaultValue={valeurs.concurrenceIdentifiee ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" defaultValue={valeurs.notes ?? ""} rows={3} className={inputClass} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className={buttonPrimaryClass}>
          Enregistrer
        </button>
        <Link href="/pipeline" className={buttonSecondaryClass}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
