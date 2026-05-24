import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos — BINGO",
  description:
    "Une boutique outdoor indépendante à Sétif. Notre histoire, nos valeurs, notre sélection.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
