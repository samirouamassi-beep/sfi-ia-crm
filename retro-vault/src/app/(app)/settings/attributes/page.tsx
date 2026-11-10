import Link from "next/link";
import { AttributeForm } from "@/components/settings/attribute-form";
import { Badge, Button, Card, CardTitle, PageHeader, cn } from "@/components/ui";
import { requireUserId } from "@/lib/auth";
import { ATTRIBUTE_SUGGESTIONS } from "@/lib/attributes";
import { ATTRIBUTE_TYPE_LABELS, KIND_LABELS } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { addSuggestedAttribute, moveAttribute, saveAttribute, toggleAttribute } from "./actions";

export const metadata = { title: "Caractéristiques" };

export default async function AttributesPage() {
  const userId = await requireUserId();
  const attributes = await prisma.itemAttribute.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { values: true } } },
  });
  const existing = new Set(attributes.map((a) => a.label.toLowerCase()));
  const suggestions = ATTRIBUTE_SUGGESTIONS.filter((s) => !existing.has(s.label.toLowerCase()));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Caractéristiques" subtitle="Champs supplémentaires du formulaire d'ajout (notice, cale, édition…)." />
      <Link href="/settings" className="text-sm text-accent">
        ← Plus
      </Link>

      {attributes.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {attributes.map((a, i) => (
            <li key={a.id} className={cn("flex items-center gap-2 p-3", !a.active && "opacity-60")}>
              <div className="flex flex-col">
                <form action={moveAttribute.bind(null, a.id, -1)}>
                  <Button variant="ghost" disabled={i === 0} className="min-h-7 px-2 text-xs" aria-label={`Monter ${a.label}`}>
                    ▲
                  </Button>
                </form>
                <form action={moveAttribute.bind(null, a.id, 1)}>
                  <Button variant="ghost" disabled={i === attributes.length - 1} className="min-h-7 px-2 text-xs" aria-label={`Descendre ${a.label}`}>
                    ▼
                  </Button>
                </form>
              </div>
              <Link href={`/settings/attributes/${a.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.label}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-ink-3">
                  <Badge>{ATTRIBUTE_TYPE_LABELS[a.type].label}</Badge>
                  {a.kinds.length === 0 || a.kinds.length === 3 ? "Tous types" : a.kinds.map((k) => KIND_LABELS[k]).join(", ")}
                  {a.type === "SELECT" && ` · ${a.options.length} choix`}
                  {` · ${a._count.values} exemplaire${a._count.values > 1 ? "s" : ""}`}
                  {!a.active && <Badge>Masquée</Badge>}
                </p>
              </Link>
              <form action={toggleAttribute.bind(null, a.id)}>
                <Button variant="secondary" className="min-h-9 px-3 text-xs">
                  {a.active ? "Masquer" : "Afficher"}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <Card>
          <CardTitle>Suggestions</CardTitle>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <form key={s.label} action={addSuggestedAttribute.bind(null, s.label)}>
                <Button variant="secondary" className="min-h-9 rounded-full px-3 text-xs">
                  ＋ {s.label}
                </Button>
              </form>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Nouvelle caractéristique</CardTitle>
        <AttributeForm action={saveAttribute.bind(null, null)} submitLabel="Ajouter" />
      </Card>
    </div>
  );
}
