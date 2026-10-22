import { seDeconnecter } from "@/app/login/actions";
import { MenuLateral, type LienNav } from "@/components/navigation";
import { Logo } from "@/components/logo";
import { MARQUE } from "@/lib/marque";

const LIENS: LienNav[] = [
  { href: "/", label: "Tableau de bord", icone: "accueil" },
  { href: "/appels-offres", label: "Appels d'offres", icone: "ao" },
  { href: "/projets", label: "Projets", icone: "projets" },
  { href: "/planning", label: "Planning", icone: "planning" },
  { href: "/mes-taches", label: "Tâches", icone: "taches" },
  { href: "/charge", label: "Plan de charge", icone: "charge" },
  { href: "/temps", label: "Feuilles de temps", icone: "temps" },
  { href: "/risques", label: "Risques", icone: "risques" },
  { href: "/equipe", label: "Équipe", icone: "equipe" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="print:hidden border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-4 p-3 lg:p-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Logo />
              <div>
                <div className="text-sm font-semibold leading-tight text-slate-900">
                  {MARQUE.nom}
                </div>
                <div className="hidden text-[11px] leading-tight text-slate-500 lg:block">
                  {MARQUE.accroche}
                </div>
              </div>
            </div>
            <form action={seDeconnecter} className="lg:hidden">
              <button type="submit" className="text-sm text-slate-400 hover:text-slate-900">
                Déconnexion
              </button>
            </form>
          </div>
          <MenuLateral liens={LIENS} />
          <form action={seDeconnecter} className="mt-auto hidden lg:block">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 print:p-0">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
