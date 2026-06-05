import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    cleanPath: "/a-propos",
    fr: {
      title: "À propos",
      description:
        "L'histoire de BINGO Camping : une boutique outdoor indépendante à Sétif. Du matériel d'aventure sérieux, à prix justes, livré partout en Algérie.",
    },
    ar: {
      title: "من نحن",
      description:
        "قصة BINGO Camping: متجر مستقل للمعدات الخارجية في سطيف. معدات مغامرة جادة بأسعار عادلة، تُوصَّل إلى كامل الجزائر.",
    },
  });
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
