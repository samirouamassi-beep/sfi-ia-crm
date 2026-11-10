import { ImportForm, LogoutForm, RefreshPricesForm } from "@/components/settings-forms";
import { ButtonLink, Card, CardTitle, PageHeader } from "@/components/ui";
import { logout } from "@/app/login/actions";
import { igdbConfigured } from "@/lib/igdb";
import { provider } from "@/lib/pricing";
import { EXPORT_COLUMNS } from "@/lib/transfer";
import { importCollection, refreshMyPrices } from "./actions";

export const metadata = { title: "Plus" };

// Téléchargement de fichier : lien natif (un <Link> passerait par le routeur client).
const exportLink = "inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-sm font-medium hover:border-ink-3";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Plus" />

      <Card>
        <CardTitle>Paramétrage</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <ButtonLink href="/settings/platforms" variant="secondary">
            🎮 Consoles
          </ButtonLink>
          <ButtonLink href="/settings/attributes" variant="secondary">
            🏷️ Caractéristiques
          </ButtonLink>
        </div>
        <p className="mt-2 text-xs text-ink-3">
          Ajoutez ou masquez des consoles, et créez vos propres champs d&apos;exemplaire (avec notice, avec cale, édition…).
        </p>
      </Card>

      <Card>
        <CardTitle>Résumé partageable</CardTitle>
        <p className="mb-3 text-sm text-ink-3">Une carte image de votre collection (stats et pièces maîtresses) à partager.</p>
        <ButtonLink href="/share" className="w-full">
          Créer mon résumé
        </ButtonLink>
      </Card>

      <Card>
        <CardTitle>Télécharger mes données</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <a href="/api/export?format=xlsx" download className={exportLink}>
            📊 Excel
          </a>
          <a href="/api/export?format=pdf" download className={exportLink}>
            📄 PDF
          </a>
        </div>
        <p className="mt-2 text-xs text-ink-3">
          Collection valorisée (état, caractéristiques, achat, valeur, plus-value), totaux par console et wishlist.
          Pour n&apos;exporter qu&apos;une partie, filtrez la liste de la collection puis utilisez ses boutons d&apos;export.
        </p>
        <p className="mb-2 mt-4 text-xs font-medium text-ink-2">Sauvegarde réimportable</p>
        <div className="grid grid-cols-2 gap-2">
          <a href="/api/export?format=csv" download className={exportLink}>
            CSV
          </a>
          <a href="/api/export?format=json" download className={exportLink}>
            JSON
          </a>
        </div>
      </Card>

      <Card>
        <CardTitle>Importer</CardTitle>
        <p className="mb-3 text-xs text-ink-3">
          CSV (virgule ou point-virgule) ou JSON, mêmes colonnes que l&apos;export. Obligatoires : <code>title</code>,{" "}
          <code>platform</code> (ex. <code>snes</code>), <code>completeness</code> (<code>LOOSE</code> / <code>CIB</code> /{" "}
          <code>SEALED</code>). Caractéristiques : une colonne <code>attr:Nom</code> chacune (ex.{" "}
          <code>attr:Avec notice</code> = <code>oui</code>). Les exemplaires sont ajoutés, jamais remplacés.
        </p>
        <details className="mb-3 text-xs text-ink-3">
          <summary className="cursor-pointer">Toutes les colonnes</summary>
          <p className="mt-1 break-words font-mono">{EXPORT_COLUMNS.join(", ")}</p>
        </details>
        <ImportForm action={importCollection} />
      </Card>

      <Card>
        <CardTitle>Sources de données</CardTitle>
        <ul className="mb-3 space-y-1 text-sm">
          <li>{igdbConfigured() ? "✓" : "✕"} IGDB (jaquettes et métadonnées)</li>
          <li>
            {provider.configured() ? "✓" : "✕"} Cotation ({provider.name})
          </li>
        </ul>
        <RefreshPricesForm action={refreshMyPrices} />
      </Card>

      <LogoutForm action={logout} />
    </div>
  );
}
