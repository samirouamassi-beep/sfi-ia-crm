import { TYPES_INTERACTION } from "@/lib/listes";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui";
import Link from "next/link";

type Valeurs = {
  date?: Date;
  compteId?: string | null;
  contactId?: string | null;
  type?: string;
  fondateur?: string | null;
  sujet?: string | null;
  compteRendu?: string | null;
  prochaineAction?: string | null;
  echeance?: Date | null;
};

function dateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function InteractionForm({
  action,
  valeurs = {},
  comptes,
  contacts,
  fondateurs,
  retour,
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
  comptes: { id: string; nom: string }[];
  contacts: { id: string; nom: string; prenom: string }[];
  fondateurs: { nom: string }[];
  retour?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {retour && <input type="hidden" name="retour" value={retour} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Date *</label>
          <input
            type="date"
            name="date"
            defaultValue={dateInput(valeurs.date) || new Date().toISOString().slice(0, 10)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Type *</label>
          <select name="type" defaultValue={valeurs.type} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {TYPES_INTERACTION.map((t) => (
              <option key={t} value={t}>
                {t}
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
          <label className={labelClass}>Fondateur</label>
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
          <label className={labelClass}>Échéance</label>
          <input
            type="date"
            name="echeance"
            defaultValue={dateInput(valeurs.echeance)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Sujet</label>
          <input name="sujet" defaultValue={valeurs.sujet ?? ""} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Compte-rendu</label>
        <textarea
          name="compteRendu"
          defaultValue={valeurs.compteRendu ?? ""}
          rows={3}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Prochaine action</label>
        <input
          name="prochaineAction"
          defaultValue={valeurs.prochaineAction ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className={buttonPrimaryClass}>
          Enregistrer
        </button>
        <Link href={retour ?? "/interactions"} className={buttonSecondaryClass}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
