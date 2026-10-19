import Link from "next/link";
import { prisma } from "@/lib/db";
import { correspond, lireParam, type SearchParams } from "@/lib/vues";
import { Section, formatDate, formatEuros } from "@/components/ui";

export const dynamic = "force-dynamic";

type Resultat = { id: string; href: string; titre: string; detail: string | null };

const LIMITE = 10;

// Recherche globale (equivalent de la barre de recherche Salesforce) : un seul champ, tous
// les objets. Filtrage en memoire pour ignorer accents et casse ("societe" trouve "Société").
export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const q = lireParam(await searchParams, "q");

  if (q.length < 2) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-slate-900">Recherche</h1>
        <p className="text-sm text-slate-500">
          Tapez au moins 2 caractères dans la barre de recherche en haut de page (raccourci :
          touche « / »).
        </p>
      </div>
    );
  }

  const [comptes, contacts, opportunites, prospects, ressources, missions, interactions, taches] =
    await Promise.all([
      prisma.compte.findMany({ orderBy: { nom: "asc" } }),
      prisma.contact.findMany({ include: { compte: true }, orderBy: { nom: "asc" } }),
      prisma.opportunite.findMany({ include: { compte: true }, orderBy: { createdAt: "desc" } }),
      prisma.prospect.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.ressource.findMany({ orderBy: { nom: "asc" } }),
      prisma.mission.findMany({ include: { compte: true }, orderBy: { createdAt: "desc" } }),
      prisma.interaction.findMany({
        include: { compte: true, contact: true },
        orderBy: { date: "desc" },
      }),
      prisma.tache.findMany({ include: { compte: true }, orderBy: { createdAt: "desc" } }),
    ]);

  const groupes: { titre: string; resultats: Resultat[] }[] = [
    {
      titre: "Comptes",
      resultats: comptes
        .filter((c) => correspond(q, c.nom, c.secteur, c.contactPrincipal, c.notes))
        .map((c) => ({
          id: c.id,
          href: `/comptes/${c.id}`,
          titre: c.nom,
          detail: [c.categorie, c.statutRelation, c.fondateurReferent].filter(Boolean).join(" · "),
        })),
    },
    {
      titre: "Contacts",
      resultats: contacts
        .filter((c) =>
          correspond(
            q,
            `${c.nom} ${c.prenom}`,
            `${c.prenom} ${c.nom}`,
            c.email,
            c.telephone,
            c.fonction,
            c.notes
          )
        )
        .map((c) => ({
          id: c.id,
          href: `/contacts/${c.id}`,
          titre: `${c.prenom} ${c.nom}`,
          detail: [c.fonction, c.compte?.nom, c.email].filter(Boolean).join(" · "),
        })),
    },
    {
      titre: "Opportunités",
      resultats: opportunites
        .filter((o) =>
          correspond(q, o.intitule, o.compte.nom, o.prochaineAction, o.concurrenceIdentifiee, o.notes)
        )
        .map((o) => ({
          id: o.id,
          href: `/pipeline/${o.id}`,
          titre: o.intitule,
          detail: `${o.compte.nom} · ${o.etape} · ${formatEuros(o.montant)}`,
        })),
    },
    {
      titre: "Prospects",
      resultats: prospects
        .filter((p) =>
          correspond(q, `${p.nom} ${p.prenom}`, `${p.prenom} ${p.nom}`, p.societe, p.email, p.notes)
        )
        .map((p) => ({
          id: p.id,
          href: `/prospects/${p.id}`,
          titre: `${p.prenom} ${p.nom}`,
          detail: [p.societe, p.statut].join(" · "),
        })),
    },
    {
      titre: "Ressources",
      resultats: ressources
        .filter((r) =>
          correspond(
            q,
            `${r.nom} ${r.prenom}`,
            `${r.prenom} ${r.nom}`,
            r.competencesSalesforce,
            r.certificationsDetenues,
            r.notes
          )
        )
        .map((r) => ({
          id: r.id,
          href: `/ressources/${r.id}`,
          titre: `${r.prenom} ${r.nom}`,
          detail: [r.niveau, r.statut, r.typeContrat].join(" · "),
        })),
    },
    {
      titre: "Missions",
      resultats: missions
        .filter((m) => correspond(q, m.mission, m.compte.nom, m.notes))
        .map((m) => ({
          id: m.id,
          href: `/missions/${m.id}`,
          titre: m.mission,
          detail: `${m.compte.nom} · ${m.statut}`,
        })),
    },
    {
      titre: "Interactions",
      resultats: interactions
        .filter((i) => correspond(q, i.sujet, i.compteRendu, i.prochaineAction))
        .map((i) => ({
          id: i.id,
          href: `/interactions/${i.id}`,
          titre: i.sujet ?? i.type,
          detail: [
            formatDate(i.date),
            i.type,
            i.compte?.nom,
            i.contact && `${i.contact.prenom} ${i.contact.nom}`,
          ]
            .filter(Boolean)
            .join(" · "),
        })),
    },
    {
      titre: "Tâches",
      resultats: taches
        .filter((t) => correspond(q, t.sujet, t.notes))
        .map((t) => ({
          id: t.id,
          href: `/taches/${t.id}`,
          titre: t.sujet,
          detail: [t.statut, t.compte?.nom, t.echeance && formatDate(t.echeance)]
            .filter(Boolean)
            .join(" · "),
        })),
    },
  ];
  const nonVides = groupes.filter((g) => g.resultats.length > 0);
  const total = nonVides.reduce((s, g) => s + g.resultats.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Résultats pour « {q} »</h1>
        <p className="text-sm text-slate-500">
          {total === 0
            ? "Aucun résultat."
            : `${total} résultat${total > 1 ? "s" : ""} dans ${nonVides.map((g) => g.titre.toLowerCase()).join(", ")}.`}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {nonVides.map((g) => (
          <Section key={g.titre} title={`${g.titre} (${g.resultats.length})`}>
            <ul className="divide-y divide-slate-100">
              {g.resultats.slice(0, LIMITE).map((r) => (
                <li key={r.id} className="py-2">
                  <Link href={r.href} className="text-sm font-medium text-blue-700 hover:underline">
                    {r.titre}
                  </Link>
                  {r.detail && <p className="text-xs text-slate-500">{r.detail}</p>}
                </li>
              ))}
            </ul>
            {g.resultats.length > LIMITE && (
              <p className="pt-2 text-xs text-slate-400">
                {g.resultats.length - LIMITE} autres résultats : affinez la recherche.
              </p>
            )}
          </Section>
        ))}
      </div>
    </div>
  );
}
