import { prisma } from "@/lib/db";
import { Section } from "@/components/ui";
import {
  ajouterFondateur,
  supprimerFondateur,
  modifierEtapePipeline,
  ajouterEtapePipeline,
  supprimerEtapePipeline,
  modifierParametre,
} from "./actions";

export const dynamic = "force-dynamic";

const inputSmall =
  "rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none";
const btnSmall =
  "rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700";
const btnDanger = "text-sm text-red-600 hover:underline";

export default async function ParametresPage() {
  const [fondateurs, etapes, parametres] = await Promise.all([
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    prisma.etapePipeline.findMany({ orderBy: { ordre: "asc" } }),
    prisma.parametre.findMany(),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500">
          Référentiels des listes déroulantes, probabilités par étape et paramètres de charges.
        </p>
      </div>

      <Section title="Fondateurs référents">
        <ul className="divide-y divide-slate-100">
          {fondateurs.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">{f.nom}</span>
              <form action={supprimerFondateur.bind(null, f.id)}>
                <button type="submit" className={btnDanger}>
                  Retirer
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={ajouterFondateur} className="mt-3 flex gap-2">
          <input name="nom" placeholder="Nom de l'associé" required className={inputSmall} />
          <button type="submit" className={btnSmall}>
            Ajouter
          </button>
        </form>
      </Section>

      <Section title="Étapes du pipeline et probabilités">
        <ul className="divide-y divide-slate-100">
          {etapes.map((e) => (
            <li key={e.etape} className="flex items-center justify-between gap-3 py-2">
              <span className="flex-1 text-sm text-slate-700">{e.etape}</span>
              <form
                action={modifierEtapePipeline.bind(null, e.etape)}
                className="flex items-center gap-2"
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  name="probabilite"
                  defaultValue={e.probabilite}
                  className={`${inputSmall} w-20`}
                />
                <button type="submit" className={btnSmall}>
                  Mettre à jour
                </button>
              </form>
              <form action={supprimerEtapePipeline.bind(null, e.etape)}>
                <button type="submit" className={btnDanger}>
                  Retirer
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={ajouterEtapePipeline} className="mt-3 flex gap-2">
          <input name="etape" placeholder="Nouvelle étape" required className={inputSmall} />
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            name="probabilite"
            placeholder="Probabilité"
            required
            className={`${inputSmall} w-28`}
          />
          <button type="submit" className={btnSmall}>
            Ajouter
          </button>
        </form>
      </Section>

      <Section title="Paramètres de charges">
        <ul className="divide-y divide-slate-100">
          {parametres.map((p) => (
            <li key={p.cle} className="flex items-center justify-between gap-3 py-2">
              <span className="flex-1 text-sm text-slate-700">{p.cle}</span>
              <form
                action={modifierParametre.bind(null, p.cle)}
                className="flex items-center gap-2"
              >
                <input
                  type="number"
                  step="0.01"
                  name="valeur"
                  defaultValue={p.valeur}
                  className={`${inputSmall} w-24`}
                />
                <button type="submit" className={btnSmall}>
                  Mettre à jour
                </button>
              </form>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Charges patronales en fraction (0.21 = 21 %). Jours facturables/mois utilisé pour
          convertir un salaire mensuel en coût par jour.
        </p>
      </Section>
    </div>
  );
}
