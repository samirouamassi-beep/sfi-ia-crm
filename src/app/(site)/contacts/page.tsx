import Link from "next/link";
import { getContactsAvecIndicateurs } from "@/lib/calculs";
import { formatDate, linkButtonClass, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await getContactsAvecIndicateurs();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500">
            Une ligne par personne. Rattachée à un compte via « Compte rattaché ».
          </p>
        </div>
        <Link href="/contacts/nouveau" className={linkButtonClass}>
          + Nouveau contact
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Compte rattaché</th>
              <th className="px-3 py-2">Fonction</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Fondateur référent</th>
              <th className="px-3 py-2">Dernier contact</th>
              <th className="px-3 py-2">Relance prévue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-slate-900 hover:underline">
                    {c.nom} {c.prenom}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{c.compte?.nom ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{c.fonction ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{c.email ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{c.fondateurReferent ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{formatDate(c.dernierContact)}</td>
                <td className="px-3 py-2">
                  {c.relancePrevueLe ? (
                    <Badge retard={c.relanceEnRetard}>{formatDate(c.relancePrevueLe)}</Badge>
                  ) : (
                    "–"
                  )}
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  Aucun contact pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
