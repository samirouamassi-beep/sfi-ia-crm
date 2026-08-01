import {
  TYPES_CONTRAT,
  ENTITES,
  NIVEAUX,
  STATUTS_RESSOURCE,
  CERTIFICATIONS_SALESFORCE,
} from "@/lib/listes";
import { inputClass, labelClass, buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui";
import Link from "next/link";

type Valeurs = {
  nom?: string;
  prenom?: string;
  typeContrat?: string;
  entite?: string;
  niveau?: string;
  statut?: string;
  competencesSalesforce?: string | null;
  certificationsDetenues?: string | null;
  anneesExperience?: number | null;
  salaireBrutMensuel?: number | null;
  tjmAchat?: number | null;
  tjmVenteCible?: number | null;
  disponibleAPartirDe?: Date | null;
  sourceApporteur?: string | null;
  cvNom?: string | null;
  cvUrl?: string | null;
  notes?: string | null;
};

function dateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function RessourceForm({
  action,
  valeurs = {},
}: {
  action: (formData: FormData) => void;
  valeurs?: Valeurs;
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
          <label className={labelClass}>Type de contrat *</label>
          <select name="typeContrat" defaultValue={valeurs.typeContrat} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {TYPES_CONTRAT.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Entité de rattachement *</label>
          <select name="entite" defaultValue={valeurs.entite} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {ENTITES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Niveau *</label>
          <select name="niveau" defaultValue={valeurs.niveau} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Statut *</label>
          <select name="statut" defaultValue={valeurs.statut} required className={inputClass}>
            <option value="" disabled>
              —
            </option>
            {STATUTS_RESSOURCE.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Compétences Salesforce</label>
          <input
            name="competencesSalesforce"
            defaultValue={valeurs.competencesSalesforce ?? ""}
            placeholder="Ex : Apex, LWC, Data Cloud"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Certifications détenues</label>
          <input
            name="certificationsDetenues"
            defaultValue={valeurs.certificationsDetenues ?? ""}
            placeholder={`Séparées par ";" — ex : ${CERTIFICATIONS_SALESFORCE[0]}; ${CERTIFICATIONS_SALESFORCE[7]}`}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Années d&apos;expérience</label>
          <input
            type="number"
            step="0.5"
            name="anneesExperience"
            defaultValue={valeurs.anneesExperience ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Disponible à partir du</label>
          <input
            type="date"
            name="disponibleAPartirDe"
            defaultValue={dateInput(valeurs.disponibleAPartirDe)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Salaire brut mensuel (€)</label>
          <input
            type="number"
            name="salaireBrutMensuel"
            defaultValue={valeurs.salaireBrutMensuel ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>TJM d&apos;achat (€)</label>
          <input
            type="number"
            name="tjmAchat"
            defaultValue={valeurs.tjmAchat ?? ""}
            className={inputClass}
          />
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2 -mt-2">
          Renseignez soit le salaire brut mensuel (salarié), soit le TJM d&apos;achat (freelance),
          jamais les deux. Le TJM est prioritaire s&apos;il est rempli.
        </p>
        <div>
          <label className={labelClass}>TJM de vente cible (€)</label>
          <input
            type="number"
            name="tjmVenteCible"
            defaultValue={valeurs.tjmVenteCible ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Source / apporteur</label>
          <input
            name="sourceApporteur"
            defaultValue={valeurs.sourceApporteur ?? ""}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>CV (PDF, Word ou PowerPoint)</label>
          {valeurs.cvUrl && (
            <p className="mt-1 text-sm">
              Fichier actuel :{" "}
              <a
                href={valeurs.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
              >
                {valeurs.cvNom ?? "voir le CV"}
              </a>
            </p>
          )}
          <input
            type="file"
            name="cv"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
          />
          <p className="mt-1 text-xs text-slate-500">
            {valeurs.cvUrl
              ? "Choisir un nouveau fichier remplace le CV actuel."
              : "Facultatif — 4,5 Mo maximum."}
          </p>
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
        <Link href="/ressources" className={buttonSecondaryClass}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
