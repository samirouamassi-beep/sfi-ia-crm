import { creerRessource } from "../actions";
import { RessourceForm } from "../RessourceForm";

export default function NouvelleRessourcePage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Nouvelle ressource</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <RessourceForm action={creerRessource} />
      </div>
    </div>
  );
}
