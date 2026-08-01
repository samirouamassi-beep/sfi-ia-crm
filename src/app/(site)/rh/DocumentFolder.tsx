import { supprimerDocument } from "./actions";
import { formatDate, rowLinkClass, buttonPrimaryClass } from "@/components/ui";

type DocumentItem = { id: string; nom: string; url: string; createdAt: Date };

export function DocumentFolder({
  documents,
  uploadAction,
  retourPath,
}: {
  documents: DocumentItem[];
  uploadAction: (formData: FormData) => void;
  retourPath: string;
}) {
  return (
    <div className="space-y-4">
      <form action={uploadAction} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="fichier"
          required
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
        />
        <button type="submit" className={buttonPrimaryClass}>
          Ajouter un document
        </button>
      </form>

      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <a
              href={`/api/cv?url=${encodeURIComponent(d.url)}&nom=${encodeURIComponent(d.nom)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={rowLinkClass}
            >
              {d.nom}
            </a>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{formatDate(d.createdAt)}</span>
              <form action={supprimerDocument.bind(null, d.id, retourPath)}>
                <button type="submit" className="text-sm text-red-600 hover:underline">
                  Supprimer
                </button>
              </form>
            </div>
          </li>
        ))}
        {documents.length === 0 && (
          <li className="px-4 py-6 text-center text-slate-400">Aucun document pour l&apos;instant.</li>
        )}
      </ul>
    </div>
  );
}
