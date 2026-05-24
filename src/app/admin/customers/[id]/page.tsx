import * as React from "react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata = {
  title: "Détail client",
};

export default function CustomerDetailPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Détail client"
        subtitle="Cette fiche n'est pas encore disponible côté backend."
      />
      <AdminPlaceholder
        title="Module clients à venir"
        description="Le profil client (commandes, adresses, fidélité) sera branché dès que le module clients sera prêt."
      >
        <Link
          href="/admin/customers"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Retour aux clients
        </Link>
      </AdminPlaceholder>
    </>
  );
}
