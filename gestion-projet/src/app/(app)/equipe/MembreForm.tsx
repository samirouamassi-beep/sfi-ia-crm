import Link from "next/link";
import { ROLES } from "@/lib/listes";
import { boutonPrincipal, boutonSecondaire, inputClass, labelClass } from "@/components/ui";

export function MembreForm({
  action,
  valeurs = {},
}: {
  action: (formData: FormData) => void;
  valeurs?: {
    nom?: string;
    email?: string | null;
    role?: string;
    tauxJournalier?: number;
    capaciteJours?: number;
    actif?: boolean;
  };
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Nom *</label>
          <input name="nom" required defaultValue={valeurs.nom} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" defaultValue={valeurs.email ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Rôle</label>
          <select name="role" defaultValue={valeurs.role ?? "Consultant"} className={inputClass}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Coût journalier (MAD)</label>
          <input type="number" min="0" step="any" name="tauxJournalier" defaultValue={valeurs.tauxJournalier ?? 0} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Capacité (jours / semaine)</label>
          <input type="number" min="0" max="7" step="0.5" name="capaciteJours" defaultValue={valeurs.capaciteJours ?? 5} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Statut</label>
          <select name="actif" defaultValue={valeurs.actif === false ? "off" : "on"} className={inputClass}>
            <option value="on">Actif</option>
            <option value="off">Inactif</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={boutonPrincipal}>
          Enregistrer
        </button>
        <Link href="/equipe" className={boutonSecondaire}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
