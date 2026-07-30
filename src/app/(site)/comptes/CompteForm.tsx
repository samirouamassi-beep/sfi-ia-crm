import {
  CATEGORIES_COMPTE,
  STATUTS_RELATION,
  PRIORITES,
  STATUTS_REFERENCEMENT,
} from "@/lib/listes";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui";
import Link from "next/link";

type Valeurs = {
  nom?: string;
  categorie?: string;
  secteur?: string | null;
  statutRelation?: string;
  priorite?: string;
  fondateurReferent?: string | null;
  contactPrincipal?: string | null;
  origineRelation?: string | null;
  statutReferencement?: string | null;
  delaiPaiementJours?: number | null;
  notes?: string | null;
};

export function CompteForm({
  action,
  valeurs = {},
  fondateurs,
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
  fondateurs: { nom: string }[];
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nom du compte *</label>
          <input
            name="nom"
            defaultValue={valeurs.nom}
            required
            className={inputClass}
            placeholder="Ex : Orpheopolis"
          />
          <p className="mt-1 text-xs text-slate-500">
            Écrivez-le toujours de la même façon partout (copier-coller conseillé).
          </p>
        </div>
        <div>
          <label className={labelClass}>Catégorie *</label>
          <select name="categorie" defaultValue={valeurs.categorie} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {CATEGORIES_COMPTE.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Secteur</label>
          <input name="secteur" defaultValue={valeurs.secteur ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Statut relation *</label>
          <select
            name="statutRelation"
            defaultValue={valeurs.statutRelation}
            required
            className={inputClass}
          >
            <option value="" disabled>
              —
            </option>
            {STATUTS_RELATION.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Priorité *</label>
          <select name="priorite" defaultValue={valeurs.priorite} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {PRIORITES.map((p) => (
              <option key={p} value={p}>
                {p}
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
        <div>
          <label className={labelClass}>Contact principal</label>
          <input
            name="contactPrincipal"
            defaultValue={valeurs.contactPrincipal ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Origine de la relation</label>
          <input
            name="origineRelation"
            defaultValue={valeurs.origineRelation ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Statut référencement</label>
          <select
            name="statutReferencement"
            defaultValue={valeurs.statutReferencement ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            {STATUTS_REFERENCEMENT.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Délai de paiement (jours)</label>
          <input
            type="number"
            name="delaiPaiementJours"
            defaultValue={valeurs.delaiPaiementJours ?? ""}
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
        <Link href="/comptes" className={buttonSecondaryClass}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
