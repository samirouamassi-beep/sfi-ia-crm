import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Carte, EnTete } from "@/components/ui";
import { MembreForm } from "../MembreForm";
import { modifierMembre } from "../actions";

export const dynamic = "force-dynamic";

export default async function ModifierMembre({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membre = await prisma.membre.findUnique({ where: { id } });
  if (!membre) notFound();
  return (
    <div className="space-y-5">
      <EnTete titre={membre.nom} sousTitre="Un membre inactif n'apparaît plus dans les listes ni le plan de charge." />
      <Carte>
        <MembreForm action={modifierMembre.bind(null, id)} valeurs={membre} />
      </Carte>
    </div>
  );
}
