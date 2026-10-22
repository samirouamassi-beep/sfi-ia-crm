import Link from "next/link";
import {
  CATEGORIES_DEPENSE,
  METEOS,
  NIVEAUX,
  PRIORITES,
  STATUTS_PROJET,
  STATUTS_RISQUE,
  STATUTS_TACHE,
  TYPES_RISQUE,
} from "@/lib/listes";
import {
  boutonPrincipal,
  boutonSecondaire,
  dateInput,
  inputClass,
  labelClass,
} from "@/components/ui";

type Option = { id: string; nom: string };

function Choix({
  nom,
  valeurs,
  defaut,
  vide,
}: {
  nom: string;
  valeurs: readonly string[];
  defaut?: string | null;
  vide?: boolean;
}) {
  return (
    <select name={nom} defaultValue={defaut ?? (vide ? "" : valeurs[0])} className={inputClass}>
      {vide && <option value="">—</option>}
      {valeurs.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}

function ChoixId({ nom, options, defaut }: { nom: string; options: Option[]; defaut?: string | null }) {
  return (
    <select name={nom} defaultValue={defaut ?? ""} className={inputClass}>
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nom}
        </option>
      ))}
    </select>
  );
}

function Boutons({ annuler }: { annuler: string }) {
  return (
    <div className="flex gap-2 pt-2">
      <button type="submit" className={boutonPrincipal}>
        Enregistrer
      </button>
      <Link href={annuler} className={boutonSecondaire}>
        Annuler
      </Link>
    </div>
  );
}

export type ValeursProjet = {
  code?: string;
  nom?: string;
  client?: string | null;
  numeroMarche?: string | null;
  description?: string | null;
  chefId?: string | null;
  statut?: string;
  priorite?: string;
  meteo?: string;
  debut?: Date;
  fin?: Date;
  budget?: number;
  commentaire?: string | null;
};

export function ProjetForm({
  action,
  valeurs = {},
  membres,
  annuler,
}: {
  action: (formData: FormData) => void;
  valeurs?: ValeursProjet;
  membres: Option[];
  annuler: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className={labelClass}>Code *</label>
          <input name="code" required defaultValue={valeurs.code} className={inputClass} placeholder="PRJ-006" />
        </div>
        <div className="sm:col-span-3">
          <label className={labelClass}>Nom du projet *</label>
          <input name="nom" required defaultValue={valeurs.nom} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Maître d&apos;ouvrage</label>
          <input
            name="client"
            defaultValue={valeurs.client ?? ""}
            placeholder="ONEE, SRM, régie…"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>N° de marché</label>
          <input name="numeroMarche" defaultValue={valeurs.numeroMarche ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Chef de projet</label>
          <ChoixId nom="chefId" options={membres} defaut={valeurs.chefId} />
        </div>
        <div>
          <label className={labelClass}>Statut</label>
          <Choix nom="statut" valeurs={STATUTS_PROJET} defaut={valeurs.statut} />
        </div>
        <div>
          <label className={labelClass}>Priorité</label>
          <Choix nom="priorite" valeurs={PRIORITES} defaut={valeurs.priorite ?? "Normale"} />
        </div>
        <div>
          <label className={labelClass}>Météo</label>
          <Choix nom="meteo" valeurs={METEOS} defaut={valeurs.meteo} />
        </div>
        <div>
          <label className={labelClass}>Budget (MAD HT)</label>
          <input type="number" min="0" step="100" name="budget" defaultValue={valeurs.budget ?? 0} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Début *</label>
          <input type="date" name="debut" required defaultValue={dateInput(valeurs.debut)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Fin *</label>
          <input type="date" name="fin" required defaultValue={dateInput(valeurs.fin)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea name="description" rows={3} defaultValue={valeurs.description ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Commentaire de situation</label>
        <textarea name="commentaire" rows={2} defaultValue={valeurs.commentaire ?? ""} className={inputClass} />
      </div>
      <Boutons annuler={annuler} />
    </form>
  );
}

export type ValeursTache = {
  nom?: string;
  description?: string | null;
  phaseId?: string | null;
  responsableId?: string | null;
  statut?: string;
  priorite?: string;
  jalon?: boolean;
  debut?: Date;
  fin?: Date;
  chargeJours?: number;
  avancement?: number;
};

export function TacheForm({
  action,
  valeurs = {},
  membres,
  phases,
  annuler,
  retour,
}: {
  action: (formData: FormData) => void;
  valeurs?: ValeursTache;
  membres: Option[];
  phases: Option[];
  annuler: string;
  retour?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {retour && <input type="hidden" name="retour" value={retour} />}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <label className={labelClass}>Nom de la tâche *</label>
          <input name="nom" required defaultValue={valeurs.nom} className={inputClass} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
          <input type="checkbox" name="jalon" defaultChecked={valeurs.jalon} className="h-4 w-4" />
          C&apos;est un jalon ◆
        </label>
        <div className="sm:col-span-2">
          <label className={labelClass}>Phase</label>
          <ChoixId nom="phaseId" options={phases} defaut={valeurs.phaseId} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Responsable</label>
          <ChoixId nom="responsableId" options={membres} defaut={valeurs.responsableId} />
        </div>
        <div>
          <label className={labelClass}>Début *</label>
          <input type="date" name="debut" required defaultValue={dateInput(valeurs.debut)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fin</label>
          <input type="date" name="fin" defaultValue={dateInput(valeurs.fin)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Charge prévue (jours)</label>
          <input type="number" min="0" step="0.5" name="chargeJours" defaultValue={valeurs.chargeJours ?? 0} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Avancement (%)</label>
          <input type="number" min="0" max="100" step="5" name="avancement" defaultValue={valeurs.avancement ?? 0} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Statut</label>
          <Choix nom="statut" valeurs={STATUTS_TACHE} defaut={valeurs.statut} />
        </div>
        <div>
          <label className={labelClass}>Priorité</label>
          <Choix nom="priorite" valeurs={PRIORITES} defaut={valeurs.priorite ?? "Normale"} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea name="description" rows={3} defaultValue={valeurs.description ?? ""} className={inputClass} />
      </div>
      <Boutons annuler={annuler} />
    </form>
  );
}

export type ValeursRisque = {
  type?: string;
  titre?: string;
  description?: string | null;
  probabilite?: number;
  impact?: number;
  statut?: string;
  responsableId?: string | null;
  mitigation?: string | null;
  echeance?: Date | null;
};

export function RisqueForm({
  action,
  valeurs = {},
  membres,
  annuler,
}: {
  action: (formData: FormData) => void;
  valeurs?: ValeursRisque;
  membres: Option[];
  annuler: string;
}) {
  const niveau = (nom: string, defaut: number) => (
    <select name={nom} defaultValue={defaut} className={inputClass}>
      {NIVEAUX.map((n) => (
        <option key={n.valeur} value={n.valeur}>
          {n.valeur} — {n.label}
        </option>
      ))}
    </select>
  );
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className={labelClass}>Type</label>
          <Choix nom="type" valeurs={TYPES_RISQUE} defaut={valeurs.type} />
        </div>
        <div className="sm:col-span-3">
          <label className={labelClass}>Intitulé *</label>
          <input name="titre" required defaultValue={valeurs.titre} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Probabilité</label>
          {niveau("probabilite", valeurs.probabilite ?? 2)}
        </div>
        <div>
          <label className={labelClass}>Impact</label>
          {niveau("impact", valeurs.impact ?? 2)}
        </div>
        <div>
          <label className={labelClass}>Statut</label>
          <Choix nom="statut" valeurs={STATUTS_RISQUE} defaut={valeurs.statut} />
        </div>
        <div>
          <label className={labelClass}>Échéance</label>
          <input type="date" name="echeance" defaultValue={dateInput(valeurs.echeance)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Responsable</label>
          <ChoixId nom="responsableId" options={membres} defaut={valeurs.responsableId} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea name="description" rows={2} defaultValue={valeurs.description ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Plan d&apos;action / mitigation</label>
        <textarea name="mitigation" rows={3} defaultValue={valeurs.mitigation ?? ""} className={inputClass} />
      </div>
      <Boutons annuler={annuler} />
    </form>
  );
}

export function DepenseForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="grid items-end gap-2 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <label className={labelClass}>Libellé</label>
        <input name="libelle" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Catégorie</label>
        <Choix nom="categorie" valeurs={CATEGORIES_DEPENSE} />
      </div>
      <div>
        <label className={labelClass}>Montant (MAD)</label>
        <input type="number" min="0" step="1" name="montant" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Date</label>
        <input type="date" name="date" defaultValue={dateInput(new Date())} className={inputClass} />
      </div>
      <button type="submit" className={boutonPrincipal}>
        Ajouter
      </button>
    </form>
  );
}
