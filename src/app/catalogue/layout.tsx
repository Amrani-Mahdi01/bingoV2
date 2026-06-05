import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/metadata";

// Locale-aware metadata for the (client-rendered) catalogue page. The page
// stays a client component for instant filtering; this server layout
// supplies title/description/canonical/hreflang per language.
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    cleanPath: "/catalogue",
    fr: {
      title: "Catalogue — Tout le matériel de camping",
      description:
        "Parcourez tentes, sacs de couchage, sacs à dos et matériel d'aventure. Filtrez par catégorie, marque et prix. Livraison partout en Algérie.",
    },
    ar: {
      title: "الكتالوج — كل معدات التخييم والمغامرة",
      description:
        "تصفّح الخيام وأكياس النوم وحقائب الظهر ومعدات المغامرة. التصفية حسب الفئة والعلامة والسعر. توصيل إلى كامل الجزائر.",
    },
  });
}

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
