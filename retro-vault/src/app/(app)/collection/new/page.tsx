import { ItemForm } from "@/components/item-form";
import { PageHeader } from "@/components/ui";
import { requireUserId } from "@/lib/auth";
import { listAttributes } from "@/lib/attributes-store";
import { listPlatforms } from "@/lib/platforms";
import { listAccessoryTypes } from "@/lib/accessories";
import { createItem } from "../actions";

export const metadata = { title: "Ajouter un exemplaire" };

export default async function NewItemPage() {
  const userId = await requireUserId();
  const [platforms, attributes, accessoryTypes] = await Promise.all([
    listPlatforms(),
    listAttributes(userId, { activeOnly: true }),
    listAccessoryTypes(),
  ]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Ajouter à la collection" subtitle="Tapez le titre : jaquette et métadonnées sont récupérées via IGDB." />
      <ItemForm platforms={platforms} attributes={attributes} accessoryTypes={accessoryTypes} action={createItem} submitLabel="Ajouter à la collection" />
    </div>
  );
}
