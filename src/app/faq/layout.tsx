import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    cleanPath: "/faq",
    fr: {
      title: "FAQ — Questions fréquentes",
      description:
        "Commande, livraison, paiement, retours et compte : retrouvez les réponses aux questions les plus fréquentes sur BINGO Camping.",
    },
    ar: {
      title: "الأسئلة الشائعة",
      description:
        "الطلب، التوصيل، الدفع، الإرجاع والحساب: تجد إجابات أكثر الأسئلة شيوعًا حول BINGO Camping.",
    },
  });
}

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
