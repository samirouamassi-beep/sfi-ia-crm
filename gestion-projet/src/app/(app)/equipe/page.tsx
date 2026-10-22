import Link from "next/link";
import { prisma } from "@/lib/db";
import { ajouterJours, chargeSemaine, lundi, tacheTerminee } from "@/lib/calculs";
import {
  Badge,
  Carte,
  EnTete,
  Progression,
  formatEuros,
  formatJours,
  lienClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/ui";
import { MembreForm } from "./MembreForm";
import { creerMembre } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Équipe" };

export default async function EquipePage() {
  const debut = lundi(new Date());
  const semaines = [0, 1, 2, 3].map((i) => ajouterJours(debut, i * 7));
  const membres = await prisma.membre.findMany({
    orderBy: [{ actif: "desc" }, { nom: "asc" }],
    include: {
      taches: { where: { jalon: false, projet: { statut: { in: ["Cadrage", "En cours", "En pause"] } } } },
      projetsDiriges: { where: { statut: { in: ["Cadrage", "En cours", "En pause"] } } },
    },
  });

  return (
    <div className="space-y-5">
      <EnTete titre="Équipe" sousTitre={`${membres.filter((m) => m.actif).length} membres actifs`} />
      <Carte>
        <div className="-mx-4 -my-4 overflow-x-auto">
          <table className={tableClass}>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className={thClass}>Membre</th>
                <th className={thClass}>Rôle</th>
                <th className={`${thClass} text-right`}>Taux jour</th>
                <th className={`${thClass} text-right`}>Capacité</th>
                <th className={`${thClass} text-right`}>Tâches ouvertes</th>
                <th className={`${thClass} text-right`}>Projets dirigés</th>
                <th className={`${thClass} w-48`}>Occupation 4 prochaines semaines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {membres.map((m) => {
                const ouvertes = m.taches.filter((t) => !tacheTerminee(t));
                const charge = semaines.reduce((s, sem) => s + ouvertes.reduce((x, t) => x + chargeSemaine(t, sem), 0), 0);
                const taux = m.capaciteJours > 0 ? charge / (m.capaciteJours * 4) : 0;
                return (
                  <tr key={m.id} className={m.actif ? "" : "opacity-50"}>
                    <td className={tdClass}>
                      <Link href={`/equipe/${m.id}`} className={lienClass}>
                        {m.nom}
                      </Link>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </td>
                    <td className={tdClass}>
                      <Badge>{m.role}</Badge>
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{formatEuros(m.tauxJournalier)}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{formatJours(m.capaciteJours)}/sem.</td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      <Link href={`/mes-taches?membre=${m.id}`} className="hover:underline">
                        {ouvertes.length}
                      </Link>
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{m.projetsDiriges.length}</td>
                    <td className={tdClass}>
                      <Progression
                        valeur={Math.round(taux * 100)}
                        couleur={taux > 1.05 ? "bg-red-500" : taux > 0.85 ? "bg-amber-400" : "bg-emerald-500"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Carte>
      <Carte titre="Ajouter un membre">
        <MembreForm action={creerMembre} />
      </Carte>
    </div>
  );
}
