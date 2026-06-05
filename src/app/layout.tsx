import type { Metadata } from "next";
import { Cairo, DM_Sans, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { TentOverlay } from "@/components/layout/tent-overlay";
import { Toaster } from "@/components/ui/sonner";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { FavoritesProvider } from "@/lib/favorites";
import { LanguageProvider } from "@/lib/i18n";
import {
  getServerCategories,
  getServerSiteBranding,
  getServerSiteContact,
  getServerSiteHome,
} from "@/lib/server/site-contact";
import { SiteBrandingProvider } from "@/lib/site-branding-context";
import { SiteCategoriesProvider } from "@/lib/site-categories-context";
import { SiteContactProvider } from "@/lib/site-contact-context";
import { SiteHomeProvider } from "@/lib/site-home-context";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE_AR,
  DEFAULT_DESCRIPTION_AR,
  DEFAULT_KEYWORDS,
  OG_IMAGE,
  absUrl,
} from "@/lib/seo/config";
import { JsonLd, organization, localBusiness, website } from "@/lib/seo/jsonld";
import { withLocale } from "@/lib/locale";
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

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const locale = h.get("x-locale") === "ar" ? "ar" : "fr";
  const cleanPath = (h.get("x-pathname") || "/").replace(/^\/ar(?=\/|$)/, "") || "/";

  const frUrl = absUrl(withLocale(cleanPath, "fr"));
  const arUrl = absUrl(withLocale(cleanPath, "ar"));
  const canonical = locale === "ar" ? arUrl : frUrl;
  const title = locale === "ar" ? DEFAULT_TITLE_AR : DEFAULT_TITLE;
  const description =
    locale === "ar" ? DEFAULT_DESCRIPTION_AR : DEFAULT_DESCRIPTION;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      // Inner-page titles render as "Page · BINGO Camping".
      template: `%s · ${SITE_NAME}`,
    },
    description,
    keywords: DEFAULT_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "shopping",
    alternates: {
      canonical,
      languages: { "fr-DZ": frUrl, "ar-DZ": arUrl, "x-default": frUrl },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: locale === "ar" ? "ar_DZ" : "fr_DZ",
      alternateLocale: locale === "ar" ? "fr_DZ" : "ar_DZ",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
    formatDetection: { telephone: true, address: true, email: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side seed of the storefront contact info + branding so the
  // very first paint already has the admin-edited values (no client
  // flash). Both helpers reuse a single deduped /api/settings fetch.
  const [h, [siteContact, siteBranding, siteHome, siteCategories]] =
    await Promise.all([
      headers(),
      Promise.all([
        getServerSiteContact(),
        getServerSiteBranding(),
        getServerSiteHome(),
        getServerCategories(),
      ]),
    ]);
  // Locale comes from the URL (tagged by middleware). Drives html lang/dir
  // server-side so Arabic pages render RTL Arabic on first paint.
  const locale = h.get("x-locale") === "ar" ? "ar" : "fr";
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${dmSans.variable} ${cairo.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-wood-800">
        {/* Site-wide structured data — Organization, the physical Sétif
            store (LocalBusiness) built from live admin contact info, and
            the WebSite + on-site search action. */}
        <JsonLd
          data={[
            organization(siteContact),
            localBusiness(siteContact),
            website(),
          ]}
        />
        <LanguageProvider initialLang={locale}>
          <AdminAuthProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <SiteBrandingProvider initialValue={siteBranding}>
                  <SiteContactProvider initialValue={siteContact}>
                    <SiteCategoriesProvider initialValue={siteCategories}>
                      <SiteHomeProvider initialValue={siteHome}>
                        <Header />
                        {children}
                        <Footer />
                        {/* Sonner — top-right toasts for cart / favorites /
                            other transient feedback. */}
                        <Toaster />
                        {/* Tent transition overlay — hidden for now. Re-enable by
                            uncommenting. Import + component file are kept intact. */}
                        {/* <TentOverlay /> */}
                      </SiteHomeProvider>
                    </SiteCategoriesProvider>
                  </SiteContactProvider>
                </SiteBrandingProvider>
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
          </AdminAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
