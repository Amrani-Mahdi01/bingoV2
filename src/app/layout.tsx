import type { Metadata } from "next";
import { Cairo, DM_Sans, JetBrains_Mono } from "next/font/google";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { TentOverlay } from "@/components/layout/tent-overlay";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { FavoritesProvider } from "@/lib/favorites";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-display",
  subsets: ["latin", "arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BINGO — Le matériel d'aventure, comparé",
  description:
    "Comparez sacs de couchage, tentes, sacs à dos et matériel de terrain — des marques d'aventure qui méritent d'être portées.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${cairo.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-wood-800">
        <LanguageProvider>
          <AdminAuthProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <Header />
                {children}
                <Footer />
                {/* Tent transition overlay — hidden for now. Re-enable by
                    uncommenting. Import + component file are kept intact. */}
                {/* <TentOverlay /> */}
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
          </AdminAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
