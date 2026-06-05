import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    cleanPath: "/cgv",
    fr: {
      title: "Conditions générales de vente",
      description:
        "Conditions générales de vente de BINGO Camping : commandes, prix, livraison, paiement et garanties.",
    },
    ar: {
      title: "الشروط العامة للبيع",
      description:
        "الشروط العامة للبيع في BINGO Camping: الطلبات والأسعار والتوصيل والدفع والضمانات.",
    },
  });
}

export default function CGVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
