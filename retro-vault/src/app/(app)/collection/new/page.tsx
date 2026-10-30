import { ItemForm } from "@/components/item-form";
import { PageHeader } from "@/components/ui";
import { listPlatforms } from "@/lib/platforms";
import { createItem } from "../actions";

export const metadata = { title: "Ajouter un exemplaire" };

export default async function NewItemPage() {
  const platforms = await listPlatforms();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Ajouter à la collection" subtitle="Tapez le titre : jaquette et métadonnées sont récupérées via IGDB." />
      <ItemForm platforms={platforms} action={createItem} submitLabel="Ajouter à la collection" />
    </div>
  );
}
