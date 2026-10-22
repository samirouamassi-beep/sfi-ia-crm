import Link from "next/link";
import { ACTIVITES, PROCEDURES_AO, STATUTS_AO } from "@/lib/listes";
import { boutonPrincipal, boutonSecondaire, dateInput, inputClass, labelClass } from "@/components/ui";

type Valeurs = {
  reference?: string;
  maitreOuvrage?: string;
  objet?: string;
  procedure?: string;
  activite?: string;
  dateLimite?: Date;
  montantEstime?: number | null;
  montantSoumis?: number | null;
  cautionProvisoire?: number | null;
  statut?: string;
  responsableId?: string | null;
  notes?: string | null;
};

function Choix({ nom, valeurs, defaut }: { nom: string; valeurs: readonly string[]; defaut?: string }) {
  return (
    <select name={nom} defaultValue={defaut ?? valeurs[0]} className={inputClass}>
      {valeurs.map((v) => (
        <option key={v}>{v}</option>
      ))}
    </select>
  );
}

export function AppelOffreForm({
  action,
  valeurs = {},
  membres,
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
  membres: { id: string; nom: string }[];
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className={labelClass}>Référence de l&apos;AO *</label>
          <input name="reference" required defaultValue={valeurs.reference} placeholder="AO n° 12/2026" className={inputClass} />
        </div>
        <div className="sm:col-span-3">
          <label className={labelClass}>Objet *</label>
          <input name="objet" required defaultValue={valeurs.objet} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Maître d&apos;ouvrage *</label>
          <input
            name="maitreOuvrage"
            required
            defaultValue={valeurs.maitreOuvrage}
            placeholder="ONEE, SRM, régie…"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Procédure</label>
          <Choix nom="procedure" valeurs={PROCEDURES_AO} defaut={valeurs.procedure} />
        </div>
        <div>
          <label className={labelClass}>Activité</label>
          <Choix nom="activite" valeurs={ACTIVITES} defaut={valeurs.activite} />
        </div>
        <div>
          <label className={labelClass}>Date limite de dépôt *</label>
          <input type="date" name="dateLimite" required defaultValue={dateInput(valeurs.dateLimite)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Estimation MO (MAD)</label>
          <input type="number" min="0" step="1000" name="montantEstime" defaultValue={valeurs.montantEstime ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Montant soumis (MAD)</label>
          <input type="number" min="0" step="1000" name="montantSoumis" defaultValue={valeurs.montantSoumis ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Caution provisoire (MAD)</label>
          <input type="number" min="0" step="1000" name="cautionProvisoire" defaultValue={valeurs.cautionProvisoire ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Statut</label>
          <Choix nom="statut" valeurs={STATUTS_AO} defaut={valeurs.statut} />
        </div>
        <div className="sm:col-span-3">
          <label className={labelClass}>Responsable de l&apos;offre</label>
          <select name="responsableId" defaultValue={valeurs.responsableId ?? ""} className={inputClass}>
            <option value="">—</option>
            {membres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Notes (pièces à fournir, visite des lieux, concurrents…)</label>
        <textarea name="notes" rows={3} defaultValue={valeurs.notes ?? ""} className={inputClass} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className={boutonPrincipal}>
          Enregistrer
        </button>
        <Link href="/appels-offres" className={boutonSecondaire}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
