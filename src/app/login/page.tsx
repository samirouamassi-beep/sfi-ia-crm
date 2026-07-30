"use client";

import { useActionState } from "react";
import { seConnecter } from "./actions";

export default function LoginPage() {
  const [etat, action, enCours] = useActionState(seConnecter, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">SFI IA — CRM</h1>
        <p className="mt-1 text-sm text-slate-500">
          Accès réservé aux 4 associés. Utilisez le mot de passe d&apos;équipe.
        </p>
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          {etat?.erreur && <p className="text-sm text-red-600">{etat.erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {enCours ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
