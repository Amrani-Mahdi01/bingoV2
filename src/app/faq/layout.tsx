import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — BINGO",
  description:
    "Réponses aux questions les plus fréquentes sur la commande, la livraison, le paiement et les retours.",
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
