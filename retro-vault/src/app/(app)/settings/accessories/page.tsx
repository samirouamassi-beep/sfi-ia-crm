import Link from "next/link";
import { AccessoryTypeForm } from "@/components/settings/accessory-form";
import { Badge, Button, Card, CardTitle, PageHeader, cn } from "@/components/ui";
import { DEFAULT_ACCESSORY_TYPES } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { addDefaultAccessoryType, moveAccessoryType, saveAccessoryType, toggleAccessoryType } from "./actions";

export const metadata = { title: "Accessoires" };

export default async function AccessoriesPage() {
  const types = await prisma.accessoryType.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  const existing = new Set(types.map((t) => t.name.toLowerCase()));
  const suggestions = DEFAULT_ACCESSORY_TYPES.filter((n) => !existing.has(n.toLowerCase()));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Accessoires" subtitle="Types proposés quand vous ajoutez un accessoire (câble, caméra, manette…)." />
      <Link href="/settings" className="text-sm text-accent">
        ← Plus
      </Link>

      <Card>
        <CardTitle>Nouveau type</CardTitle>
        <AccessoryTypeForm action={saveAccessoryType.bind(null, null)} submitLabel="Ajouter" />
        {suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <form key={name} action={addDefaultAccessoryType.bind(null, name)}>
                <Button variant="secondary" className="min-h-9 rounded-full px-3 text-xs">
                  ＋ {name}
                </Button>
              </form>
            ))}
          </div>
        )}
      </Card>

      {types.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {types.map((t, i) => (
            <li key={t.id} className={cn("flex items-center gap-2 p-3", !t.active && "opacity-60")}>
              <div className="flex flex-col">
                <form action={moveAccessoryType.bind(null, t.id, -1)}>
                  <Button variant="ghost" disabled={i === 0} className="min-h-7 px-2 text-xs" aria-label={`Monter ${t.name}`}>
                    ▲
                  </Button>
                </form>
                <form action={moveAccessoryType.bind(null, t.id, 1)}>
                  <Button variant="ghost" disabled={i === types.length - 1} className="min-h-7 px-2 text-xs" aria-label={`Descendre ${t.name}`}>
                    ▼
                  </Button>
                </form>
              </div>
              <Link href={`/settings/accessories/${t.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-ink-3">
                  {t._count.products} fiche{t._count.products > 1 ? "s" : ""}
                  {!t.active && <Badge>Masqué</Badge>}
                </p>
              </Link>
              <form action={toggleAccessoryType.bind(null, t.id)}>
                <Button variant="secondary" className="min-h-9 px-3 text-xs">
                  {t.active ? "Masquer" : "Afficher"}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
