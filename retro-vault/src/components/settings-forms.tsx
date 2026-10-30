"use client";

import { useActionState } from "react";
import type { ImportState, RefreshState } from "@/app/(app)/settings/actions";
import { clearPageCaches } from "./service-worker";
import { Button } from "./ui";

export function ImportForm({ action }: { action: (s: ImportState, f: FormData) => Promise<ImportState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <input
        name="file"
        type="file"
        accept=".csv,.json,text/csv,application/json"
        required
        aria-label="Fichier à importer"
        className="block w-full text-sm text-ink-3 file:mr-3 file:min-h-10 file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:text-ink"
      />
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "Import en cours…" : "Importer"}
      </Button>
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      {state?.report && (
        <div role="status" className="space-y-1 text-sm">
          <p className="text-good">✓ {state.report.imported} exemplaire(s) importé(s).</p>
          {state.report.errors.length > 0 && (
            <details className="text-ink-2">
              <summary className="cursor-pointer text-bad">{state.report.errors.length} ligne(s) ignorée(s)</summary>
              <ul className="mt-1 max-h-48 overflow-auto text-xs">
                {state.report.errors.map((e) => (
                  <li key={e.line}>
                    Ligne {e.line} : {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </form>
  );
}

export function RefreshPricesForm({ action }: { action: () => Promise<RefreshState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        ↻ Actualiser toutes les cotes
      </Button>
      {state && <p role="status" className="text-xs text-ink-3">{state.message}</p>}
    </form>
  );
}

export function LogoutForm({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} onSubmit={() => void clearPageCaches()}>
      <Button type="submit" variant="danger" className="w-full">
        Se déconnecter
      </Button>
    </form>
  );
}
