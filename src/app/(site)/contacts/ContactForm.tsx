import { PRIORITES } from "@/lib/listes";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui";
import Link from "next/link";

type Valeurs = {
  nom?: string;
  prenom?: string;
  compteId?: string | null;
  fonction?: string | null;
  roleDecision?: string | null;
  email?: string | null;
  telephone?: string | null;
  linkedin?: string | null;
  fondateurReferent?: string | null;
  priorite?: string | null;
  relancePrevueLe?: Date | null;
  notes?: string | null;
};

function dateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function ContactForm({
  action,
  valeurs = {},
  comptes,
  fondateurs,
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
  comptes: { id: string; nom: string }[];
  fondateurs: { nom: string }[];
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
          <p className="mt-1 text-xs text-slate-500">
            « Nom Prénom » dans cet ordre : utilisé pour les rapprochements automatiques.
          </p>
        </div>
        <div>
          <label className={labelClass}>Compte rattaché</label>
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
          <label className={labelClass}>Fonction</label>
          <input name="fonction" defaultValue={valeurs.fonction ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Rôle dans la décision</label>
          <input
            name="roleDecision"
            defaultValue={valeurs.roleDecision ?? ""}
            className={inputClass}
          />
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
          <label className={labelClass}>Relance prévue le</label>
          <input
            type="date"
            name="relancePrevueLe"
            defaultValue={dateInput(valeurs.relancePrevueLe)}
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
        <Link href="/contacts" className={buttonSecondaryClass}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
