import Link from "next/link";
import { seDeconnecter } from "@/app/login/actions";

const LIENS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/comptes", label: "Comptes" },
  { href: "/contacts", label: "Contacts" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/ressources", label: "Ressources" },
  { href: "/missions", label: "Missions" },
  { href: "/interactions", label: "Interactions" },
  { href: "/parametres", label: "Paramètres" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">SFI IA — CRM</span>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {LIENS.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {lien.label}
              </Link>
            ))}
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="rounded-md px-2.5 py-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
