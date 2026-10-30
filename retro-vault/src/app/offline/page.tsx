export const metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="text-lg font-semibold">Pas de connexion</h1>
      <p className="max-w-xs text-sm text-ink-2">
        Les pages déjà consultées restent disponibles. Les cotes et les modifications seront
        synchronisées au retour du réseau.
      </p>
    </main>
  );
}
