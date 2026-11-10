import Link from "next/link";
import { PlatformForm } from "@/components/settings/platform-form";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { savePlatform } from "../actions";

export const metadata = { title: "Nouvelle console" };

export default async function NewPlatformPage() {
  const manufacturers = await prisma.platform.findMany({ distinct: ["manufacturer"], select: { manufacturer: true }, orderBy: { manufacturer: "asc" } });
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Nouvelle console" />
      <Link href="/settings/platforms" className="text-sm text-accent">
        ← Consoles
      </Link>
      <PlatformForm manufacturers={manufacturers.map((m) => m.manufacturer)} action={savePlatform.bind(null, null)} submitLabel="Ajouter la console" />
    </div>
  );
}
