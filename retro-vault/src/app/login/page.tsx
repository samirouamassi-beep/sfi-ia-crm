"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-7">
        <p className="text-lg font-semibold tracking-wide">
          RETRO<span className="text-accent">VAULT</span>
        </p>
        <p className="mt-1 text-sm text-ink-3">Votre collection rétro, cotée et suivie.</p>
        <form action={action} className="mt-6 space-y-4">
          <label htmlFor="password" className="block text-sm font-medium text-ink-2">
            Mot de passe
          </label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
          {state?.error && (
            <p role="alert" className="text-sm text-bad">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Connexion…" : "Ouvrir le coffre"}
          </Button>
        </form>
      </div>
    </main>
  );
}
