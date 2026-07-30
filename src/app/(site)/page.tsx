import { getTableauDeBord } from "@/lib/calculs";
import { Section, Stat, formatEuros, formatPourcentage } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TableauDeBordPage() {
  const tb = await getTableauDeBord();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-slate-500">
          Tout se calcule automatiquement à partir des autres pages. Aucune saisie ici.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Portefeuille">
          <Stat label="Comptes enregistrés" value={tb.portefeuille.comptesEnregistres} />
          <Stat label="Clients actifs" value={tb.portefeuille.clientsActifs} />
          <Stat label="Prospects" value={tb.portefeuille.prospects} />
          <Stat label="Partenaires intégrateurs" value={tb.portefeuille.partenairesIntegrateurs} />
          <Stat label="Contacts au carnet d'adresses" value={tb.portefeuille.contactsCarnet} />
        </Section>

        <Section title="Ressources">
          <Stat label="Ressources enregistrées" value={tb.ressources.enregistrees} />
          <Stat label="En mission" value={tb.ressources.enMission} />
          <Stat label="Disponibles" value={tb.ressources.disponibles} />
          <Stat label="Vivier qualifié" value={tb.ressources.vivierQualifie} />
          <Stat label="Salariés Maroc" value={tb.ressources.salariesMaroc} />
          <Stat label="Freelances France" value={tb.ressources.freelancesFrance} />
          <Stat label="Total certifications Salesforce" value={tb.ressources.totalCertifications} />
        </Section>

        <Section title="Pipeline">
          <Stat label="Nombre d'opportunités ouvertes" value={tb.pipeline.nbOuvertes} />
          <Stat label="Montant total du pipeline" value={formatEuros(tb.pipeline.montantTotal)} />
          <Stat label="Pipeline pondéré" value={formatEuros(tb.pipeline.montantPondere)} />
          <Stat label="Montant signé" value={formatEuros(tb.pipeline.montantSigne)} />
          <Stat label="Montant perdu" value={formatEuros(tb.pipeline.montantPerdu)} />
          <Stat label="Taux de réussite" value={formatPourcentage(tb.pipeline.tauxReussite)} />
        </Section>

        <Section title="Missions en cours">
          <Stat label="Missions actives" value={tb.missions.actives} />
          <Stat label="CA mensuel récurrent" value={formatEuros(tb.missions.caMensuelRecurrent)} />
          <Stat label="Coût mensuel" value={formatEuros(tb.missions.coutMensuel)} />
          <Stat label="Marge mensuelle" value={formatEuros(tb.missions.margeMensuelle)} />
          <Stat label="Taux de marge global" value={formatPourcentage(tb.missions.tauxMargeGlobal)} />
          <Stat label="Jours facturés par mois" value={tb.missions.joursFacturesParMois} />
        </Section>

        <Section title="Actions en retard">
          <Stat
            label="Opportunités en retard d'action"
            value={tb.actionsEnRetard.opportunites}
            alerte={tb.actionsEnRetard.opportunites > 0}
          />
          <Stat
            label="Interactions à relancer"
            value={tb.actionsEnRetard.interactions}
            alerte={tb.actionsEnRetard.interactions > 0}
          />
          <Stat
            label="Contacts à relancer"
            value={tb.actionsEnRetard.contacts}
            alerte={tb.actionsEnRetard.contacts > 0}
          />
        </Section>

        <Section title="Référencements partenaires">
          <Stat label="Dossiers référencés" value={tb.referencements.dossiersReferences} />
          <Stat label="Dossiers en instruction" value={tb.referencements.dossiersEnInstruction} />
          <Stat label="Dossiers à constituer" value={tb.referencements.dossiersAConstituer} />
        </Section>
      </div>
    </div>
  );
}
