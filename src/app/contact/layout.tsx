import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    cleanPath: "/contact",
    fr: {
      title: "Contact",
      description:
        "Contactez BINGO Camping — boutique à Sétif (Cité Dallas). Téléphone, WhatsApp, e-mail et adresse pour toutes vos questions sur le matériel d'aventure.",
    },
    ar: {
      title: "اتصل بنا",
      description:
        "تواصل مع BINGO Camping — متجر في سطيف (حي دالاس). الهاتف وواتساب والبريد الإلكتروني والعنوان لكل استفساراتك حول معدات المغامرة.",
    },
  });
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
