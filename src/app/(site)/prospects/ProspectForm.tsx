import { SOURCES_PROSPECT, STATUTS_PROSPECT } from "@/lib/listes";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui";
import Link from "next/link";

type Valeurs = {
  nom?: string;
  prenom?: string;
  societe?: string;
  fonction?: string | null;
  email?: string | null;
  telephone?: string | null;
  linkedin?: string | null;
  source?: string | null;
  statut?: string;
  fondateurReferent?: string | null;
  notes?: string | null;
};

export function ProspectForm({
  action,
  valeurs = {},
  fondateurs,
  converti = false,
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
  fondateurs: { nom: string }[];
  converti?: boolean;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nom *</label>
          <input name="nom" defaultValue={valeurs.nom} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Prénom *</label>
          <input name="prenom" defaultValue={valeurs.prenom} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Société *</label>
          <input name="societe" defaultValue={valeurs.societe} required className={inputClass} />
          <p className="mt-1 text-xs text-slate-500">
            Deviendra le nom du compte à la conversion.
          </p>
        </div>
        <div>
          <label className={labelClass}>Fonction</label>
          <input name="fonction" defaultValue={valeurs.fonction ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" name="email" defaultValue={valeurs.email ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Téléphone</label>
          <input name="telephone" defaultValue={valeurs.telephone ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>LinkedIn</label>
          <input name="linkedin" defaultValue={valeurs.linkedin ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Source</label>
          <select name="source" defaultValue={valeurs.source ?? ""} className={inputClass}>
            <option value="">—</option>
            {SOURCES_PROSPECT.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Statut *</label>
          <select
            name="statut"
            defaultValue={valeurs.statut ?? "Nouveau"}
            required
            disabled={converti}
            className={inputClass}
          >
            {STATUTS_PROSPECT.filter((s) => converti || s !== "Converti").map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" defaultValue={valeurs.notes ?? ""} rows={3} className={inputClass} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className={buttonPrimaryClass}>
          Enregistrer
        </button>
        <Link href="/prospects" className={buttonSecondaryClass}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
