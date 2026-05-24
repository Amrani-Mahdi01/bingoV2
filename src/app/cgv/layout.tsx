import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — BINGO",
  description:
    "Les conditions générales de vente applicables aux commandes passées sur le site BINGO.",
};

export default function CGVLayout({ children }: { children: React.ReactNode }) {
  return children;
}
