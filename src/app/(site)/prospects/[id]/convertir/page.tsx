import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getEtapesPipeline } from "@/lib/calculs";
import { CATEGORIES_COMPTE, PRIORITES, TYPES_OFFRE } from "@/lib/listes";
import { normaliser } from "@/lib/vues";
import { convertirProspect } from "../../actions";
import {
  Section,
  buttonPrimaryClass,
  buttonSecondaryClass,
  inputClass,
  labelClass,
} from "@/components/ui";

export default async function ConvertirProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [prospect, comptes, etapes] = await Promise.all([
    prisma.prospect.findUnique({ where: { id } }),
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    getEtapesPipeline(),
  ]);

  if (!prospect) notFound();
  if (prospect.convertiLe) redirect(`/prospects/${id}`);

  // Rapprochement automatique : un compte du meme nom (casse et accents ignores) est propose.
  const compteCorrespondant = comptes.find(
    (c) => normaliser(c.nom) === normaliser(prospect.societe)
  );
  const etapesOuvertes = etapes.filter((e) => e.etape !== "Signé" && e.etape !== "Perdu");

  return (
    <div className="max-w-2xl space-y-4">
      <Link href={`/prospects/${id}`} className="text-sm text-slate-500 hover:text-slate-900">
        ← Retour au prospect
      </Link>
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Convertir {prospect.prenom} {prospect.nom}
        </h1>
        <p className="text-sm text-slate-500">
          Le prospect devient un contact rattaché à un compte. Vous pouvez aussi créer une
          opportunité dans la foulée.
        </p>
      </div>

      <form action={convertirProspect.bind(null, id)} className="space-y-4">
        <Section title="1. Compte">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Rattacher à</label>
              <select
                name="compteExistantId"
                defaultValue={compteCorrespondant?.id ?? ""}
                className={inputClass}
              >
                <option value="">Créer un nouveau compte</option>
                {comptes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Compte existant : {c.nom}
                  </option>
                ))}
              </select>
              {compteCorrespondant && (
                <p className="mt-1 text-xs text-emerald-700">
                  Un compte « {compteCorrespondant.nom} » existe déjà : il est présélectionné.
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Si nouveau compte
              </p>
            </div>
            <div>
              <label className={labelClass}>Nom du compte</label>
              <input name="nomCompte" defaultValue={prospect.societe} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Catégorie</label>
              <select name="categorie" defaultValue="Prospect" className={inputClass}>
                {CATEGORIES_COMPTE.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priorité</label>
              <select name="priorite" defaultValue="Moyenne" className={inputClass}>
                {PRIORITES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <Section title="2. Contact">
          <p className="text-sm text-slate-600">
            Un contact <span className="font-medium">{prospect.nom} {prospect.prenom}</span>
            {prospect.fonction && ` (${prospect.fonction})`} sera créé avec l&apos;email, le
            téléphone, le LinkedIn et les notes du prospect.
          </p>
        </Section>

        <Section title="3. Opportunité (optionnel)">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="creerOpportunite" className="h-4 w-4" />
            Créer une opportunité
          </label>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Intitulé</label>
              <input
                name="intitule"
                defaultValue={`${prospect.societe} — `}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Type d&apos;offre</label>
              <select name="typeOffre" defaultValue="Régie" className={inputClass}>
                {TYPES_OFFRE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Montant (€ HT)</label>
              <input type="number" step="1" name="montant" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Étape</label>
              <select
                name="etape"
                defaultValue={etapesOuvertes[0]?.etape}
                className={inputClass}
              >
                {etapesOuvertes.map((e) => (
                  <option key={e.etape} value={e.etape}>
                    {e.etape}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <div className="flex gap-2">
          <button type="submit" className={buttonPrimaryClass}>
            Convertir
          </button>
          <Link href={`/prospects/${id}`} className={buttonSecondaryClass}>
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
