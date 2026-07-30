import { TYPES_OFFRE, STATUTS_MISSION } from "@/lib/listes";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui";
import Link from "next/link";

type Valeurs = {
  compteId?: string;
  mission?: string;
  typeOffre?: string;
  ressourceId?: string | null;
  dateDebut?: Date | null;
  dateFinPrevue?: Date | null;
  joursFacturesParMois?: number | null;
  tjmVente?: number | null;
  tjmCoutAchat?: number | null;
  statut?: string;
  fondateurReferent?: string | null;
  notes?: string | null;
};

function dateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function MissionForm({
  action,
  valeurs = {},
  comptes,
  ressources,
  fondateurs,
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
  comptes: { id: string; nom: string }[];
  ressources: { id: string; nom: string; prenom: string }[];
  fondateurs: { nom: string }[];
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <label className={labelClass}>Mission *</label>
          <input name="mission" defaultValue={valeurs.mission} required className={inputClass} />
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
          <label className={labelClass}>Ressource affectée</label>
          <select name="ressourceId" defaultValue={valeurs.ressourceId ?? ""} className={inputClass}>
            <option value="">—</option>
            {ressources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nom} {r.prenom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date de début</label>
          <input
            type="date"
            name="dateDebut"
            defaultValue={dateInput(valeurs.dateDebut)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Date de fin prévue</label>
          <input
            type="date"
            name="dateFinPrevue"
            defaultValue={dateInput(valeurs.dateFinPrevue)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Jours facturés / mois</label>
          <input
            type="number"
            step="0.5"
            name="joursFacturesParMois"
            defaultValue={valeurs.joursFacturesParMois ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Statut *</label>
          <select name="statut" defaultValue={valeurs.statut} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {STATUTS_MISSION.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>TJM de vente (€)</label>
          <input
            type="number"
            name="tjmVente"
            defaultValue={valeurs.tjmVente ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>TJM ou coût d&apos;achat (€)</label>
          <input
            type="number"
            name="tjmCoutAchat"
            defaultValue={valeurs.tjmCoutAchat ?? ""}
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
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" defaultValue={valeurs.notes ?? ""} rows={3} className={inputClass} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className={buttonPrimaryClass}>
          Enregistrer
        </button>
        <Link href="/missions" className={buttonSecondaryClass}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
