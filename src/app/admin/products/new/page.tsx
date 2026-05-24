import * as React from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";

export const metadata = {
  title: "Nouveau produit",
};

export default function NewProductPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Nouveau produit"
        subtitle="Champs bilingues FR / AR. Choisissez catégorie + marque (ou créez-en une), ajoutez des photos, enregistrez."
      />
      <ProductCreateForm />
    </>
  );
}
