import Link from "next/link";
import { ShareActions } from "@/components/share-actions";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Résumé partageable" };

export default async function SharePage({ searchParams }: { searchParams: Promise<{ money?: string }> }) {
  const hideMoney = (await searchParams).money === "0";
  const src = `/share/card${hideMoney ? "?money=0" : ""}`;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <PageHeader title="Résumé partageable" subtitle="Image générée à partir de votre collection." />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Résumé visuel de la collection" width={1080} height={1350} className="h-auto w-full rounded-2xl border border-line" />
      <Link href={hideMoney ? "/share" : "/share?money=0"} className="block text-sm text-accent">
        {hideMoney ? "Afficher les montants" : "Masquer les montants (discrétion)"}
      </Link>
      <ShareActions src={src} />
    </div>
  );
}
