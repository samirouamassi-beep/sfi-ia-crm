import Link from "next/link";
import { Badge, Button, ButtonLink, PageHeader, cn } from "@/components/ui";
import { prisma } from "@/lib/db";
import { movePlatform, togglePlatform } from "./actions";

export const metadata = { title: "Consoles" };

export default async function PlatformsPage() {
  const platforms = await prisma.platform.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader
        title="Consoles"
        subtitle="Plateformes proposées dans les formulaires, dans cet ordre."
        action={<ButtonLink href="/settings/platforms/new">＋ Ajouter</ButtonLink>}
      />
      <Link href="/settings" className="text-sm text-accent">
        ← Plus
      </Link>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {platforms.map((p, i) => (
          <li key={p.id} className={cn("flex items-center gap-2 p-3", !p.active && "opacity-60")}>
            <div className="flex flex-col">
              <form action={movePlatform.bind(null, p.id, -1)}>
                <Button variant="ghost" disabled={i === 0} className="min-h-7 px-2 text-xs" aria-label={`Monter ${p.name}`}>
                  ▲
                </Button>
              </form>
              <form action={movePlatform.bind(null, p.id, 1)}>
                <Button variant="ghost" disabled={i === platforms.length - 1} className="min-h-7 px-2 text-xs" aria-label={`Descendre ${p.name}`}>
                  ▼
                </Button>
              </form>
            </div>
            <Link href={`/settings/platforms/${p.id}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-ink-3">
                <Badge>{p.shortName}</Badge> {p.manufacturer}
                {p.releaseYear ? ` · ${p.releaseYear}` : ""} · {p._count.products} fiche{p._count.products > 1 ? "s" : ""}
                {!p.active && <Badge>Masquée</Badge>}
              </p>
            </Link>
            <form action={togglePlatform.bind(null, p.id)}>
              <Button variant="secondary" className="min-h-9 px-3 text-xs">
                {p.active ? "Masquer" : "Afficher"}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
