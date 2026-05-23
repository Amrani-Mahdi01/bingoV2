"use client";

import * as React from "react";

export type Language = "fr" | "ar";

const STORAGE_KEY = "bingo.language";

/* ─── Translations ──────────────────────────────────────────────────
   Keys are arbitrary; values are tuples [fr, ar]. Add a new key here
   and call `t("my.key")` anywhere a `useLanguage()` hook is in scope. */
const TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Brand
  "brand.home": { fr: "BINGO — accueil", ar: "بينغو — الرئيسية" },

  // Top weather strip
  "strip.coords": { fr: "36.2°N · 5.4°E · SÉTIF", ar: "36.2°N · 5.4°E · سطيف" },
  "strip.shipping": {
    fr: "LIVRAISON GRATUITE DÈS 12 000 DA",
    ar: "توصيل مجاني ابتداءً من 12,000 دج",
  },
  "strip.guides": {
    fr: "GUIDES D'AUTOMNE — EN LIGNE",
    ar: "أدلة الخريف — متوفرة الآن",
  },
  "strip.returns": { fr: "RETOURS 30 JOURS", ar: "إرجاع خلال 30 يوماً" },
  "strip.reviews": {
    fr: "AVIS INDÉPENDANTS DEPUIS 2025",
    ar: "آراء مستقلة منذ 2025",
  },

  // Nav
  "nav.catalogue": { fr: "Catalogue", ar: "الكتالوج" },
  "nav.promotions": { fr: "Promotions", ar: "العروض" },
  "nav.about": { fr: "À propos", ar: "من نحن" },
  "nav.contact": { fr: "Contact", ar: "اتصل بنا" },
  "nav.primary": { fr: "Navigation principale", ar: "التنقل الرئيسي" },

  // Search
  "search.placeholder": { fr: "Rechercher du matériel…", ar: "ابحث عن المعدات…" },
  "search.placeholderShort": { fr: "Rechercher…", ar: "ابحث…" },
  "search.aria": { fr: "Rechercher du matériel", ar: "ابحث عن المعدات" },
  "search.categories": { fr: "Catégories", ar: "الفئات" },
  "search.subCategories": { fr: "Sous-catégories", ar: "الفئات الفرعية" },
  "search.products": { fr: "Produits", ar: "المنتجات" },
  "search.noResults": { fr: "Aucun résultat pour", ar: "لا توجد نتائج لـ" },

  // Icon cluster
  "icon.wishlist": {
    fr: "Liste de souhaits, 0 articles",
    ar: "قائمة الأمنيات، 0 عناصر",
  },
  "icon.account": { fr: "Mon compte", ar: "حسابي" },
  "icon.cart": { fr: "Panier, 2 articles", ar: "السلة، عنصران" },

  // Locale switcher (legacy desktop button)
  "locale.aria": {
    fr: "Changer de région : Algérie, Français",
    ar: "تغيير المنطقة: الجزائر، العربية",
  },

  // Mobile menu
  "menu.open": { fr: "Ouvrir le menu", ar: "افتح القائمة" },
  "menu.close": { fr: "Fermer le menu", ar: "اغلق القائمة" },
  "menu.dialog": { fr: "Menu de navigation", ar: "قائمة التنقل" },
  "menu.mySpace": { fr: "Mon espace", ar: "حسابي" },
  "menu.account": { fr: "Mon compte", ar: "حسابي" },
  "menu.wishlist": { fr: "Liste de souhaits", ar: "قائمة الأمنيات" },

  // Language toggle
  "lang.toggleAria": { fr: "Changer la langue", ar: "تغيير اللغة" },
  "lang.fr": { fr: "FR", ar: "FR" },
  "lang.ar": { fr: "AR", ar: "AR" },

  // Hero / banner slider
  "hero.carousel": {
    fr: "Carrousel promotionnel",
    ar: "كاروسيل ترويجي",
  },
  "hero.limitedEdition": { fr: "Édition limitée", ar: "إصدار محدود" },
  "hero.prev": { fr: "Précédent", ar: "السابق" },
  "hero.next": { fr: "Suivant", ar: "التالي" },
  "hero.slide": { fr: "Aller à la promotion", ar: "اذهب إلى العرض" },
  "hero.cta.aria": {
    fr: "Raccourcis vers le catalogue",
    ar: "روابط سريعة إلى الكتالوج",
  },
  "hero.cta.promotions": { fr: "Promotions", ar: "العروض" },
  "hero.cta.new": { fr: "Nouveautés", ar: "الجديد" },
  "hero.cta.bestsellers": { fr: "Best-sellers", ar: "الأكثر مبيعاً" },
  // Short tone tags used in the hero product cards
  "hero.tag.promo": { fr: "Promo", ar: "عرض" },
  "hero.tag.new": { fr: "Nouveauté", ar: "جديد" },
  "hero.tag.best": { fr: "Bestseller", ar: "الأكثر مبيعاً" },

  // Promo block under the BINGO wordmark
  "hero.promo.eyebrow": { fr: "Offre limitée", ar: "عرض محدود" },
  "hero.promo.slogan": {
    fr: "Jusqu'à −30 % sur la collection automne",
    ar: "خصم يصل إلى 30٪ على تشكيلة الخريف",
  },
  "hero.promo.cta": { fr: "Voir les promotions", ar: "اطلع على العروض" },

  // Cart
  "cart.title": { fr: "Panier", ar: "السلة" },
  "cart.items": { fr: "articles", ar: "عنصر" },
  "cart.empty": { fr: "Votre panier est vide", ar: "السلة فارغة" },
  "cart.subtotal": { fr: "Sous-total", ar: "المجموع الفرعي" },
  "cart.view": { fr: "Voir le panier", ar: "عرض السلة" },
  "cart.checkout": { fr: "Commander", ar: "اتمام الطلب" },
  "cart.decrease": { fr: "Diminuer la quantité", ar: "تقليل الكمية" },
  "cart.increase": { fr: "Augmenter la quantité", ar: "زيادة الكمية" },
  "cart.remove": { fr: "Supprimer l'article", ar: "حذف العنصر" },
  "cart.qty": { fr: "Quantité", ar: "الكمية" },
};

type Ctx = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof TRANSLATIONS | string) => string;
};

const LanguageContext = React.createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>("fr");

  // Hydrate from localStorage on mount (client-only)
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === "fr" || stored === "ar") setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  // Sync <html lang> and dir attributes whenever lang changes
  React.useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  }, [lang]);

  const setLang = React.useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = React.useCallback(
    (key: string) => {
      const entry = TRANSLATIONS[key];
      if (!entry) return key;
      return entry[lang] ?? entry.fr;
    },
    [lang]
  );

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): Ctx {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    // Fallback so non-wrapped trees still render in French
    return {
      lang: "fr",
      setLang: () => {},
      t: (key) => TRANSLATIONS[key]?.fr ?? key,
    };
  }
  return ctx;
}
