import { PRIORITES } from "@/lib/listes";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui";
import Link from "next/link";

type Valeurs = {
  sujet?: string;
  echeance?: Date | null;
  priorite?: string | null;
  fondateur?: string | null;
  compteId?: string | null;
  contactId?: string | null;
  opportuniteId?: string | null;
  notes?: string | null;
};

function dateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function TacheForm({
  action,
  valeurs = {},
  comptes,
  contacts,
  opportunites,
  fondateurs,
  retour,
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
  comptes: { id: string; nom: string }[];
  contacts: { id: string; nom: string; prenom: string }[];
  opportunites: { id: string; intitule: string }[];
  fondateurs: { nom: string }[];
  retour?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {retour && <input type="hidden" name="retour" value={retour} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Sujet *</label>
          <input
            name="sujet"
            defaultValue={valeurs.sujet}
            required
            className={inputClass}
            placeholder="Ex : Relancer pour la proposition commerciale"
          />
        </div>
        <div>
          <label className={labelClass}>Échéance</label>
          <input
            type="date"
            name="echeance"
            defaultValue={dateInput(valeurs.echeance)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Priorité</label>
          <select name="priorite" defaultValue={valeurs.priorite ?? ""} className={inputClass}>
            <option value="">—</option>
            {PRIORITES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Assignée à</label>
          <select name="fondateur" defaultValue={valeurs.fondateur ?? ""} className={inputClass}>
            <option value="">—</option>
            {fondateurs.map((f) => (
              <option key={f.nom} value={f.nom}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Compte</label>
          <select name="compteId" defaultValue={valeurs.compteId ?? ""} className={inputClass}>
            <option value="">—</option>
            {comptes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Contact</label>
          <select name="contactId" defaultValue={valeurs.contactId ?? ""} className={inputClass}>
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} {c.prenom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Opportunité</label>
          <select
            name="opportuniteId"
            defaultValue={valeurs.opportuniteId ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            {opportunites.map((o) => (
              <option key={o.id} value={o.id}>
                {o.intitule}
              </option>
            ))}
          </select>
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
        <Link href={retour ?? "/taches"} className={buttonSecondaryClass}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
