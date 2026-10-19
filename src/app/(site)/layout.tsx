import { Suspense } from "react";
import { seDeconnecter } from "@/app/login/actions";
import { LiensNavigation, RechercheGlobale } from "@/components/navigation";

const LIENS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/taches", label: "Tâches" },
  { href: "/prospects", label: "Prospects" },
  { href: "/comptes", label: "Comptes" },
  { href: "/contacts", label: "Contacts" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/ressources", label: "Ressources" },
  { href: "/missions", label: "Missions" },
  { href: "/interactions", label: "Interactions" },
  { href: "/rapports", label: "Rapports" },
  { href: "/rh", label: "RH" },
  { href: "/parametres", label: "Paramètres" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
              SFI IA — CRM
            </span>
            <Suspense>
              <RechercheGlobale />
            </Suspense>
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="rounded-md px-2.5 py-1.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                Déconnexion
              </button>
            </form>
          </div>
          <LiensNavigation liens={LIENS} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
