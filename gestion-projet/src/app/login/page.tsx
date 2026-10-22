"use client";

import { useActionState } from "react";
import { seConnecter } from "./actions";
import { MARQUE } from "@/lib/marque";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [etat, action, enCours] = useActionState(seConnecter, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-semibold text-slate-900">{MARQUE.nom}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">{MARQUE.accroche}</p>
        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="motDePasse" className="block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              required
              autoFocus
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {etat?.erreur && <p className="text-sm text-red-600">{etat.erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {enCours ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
