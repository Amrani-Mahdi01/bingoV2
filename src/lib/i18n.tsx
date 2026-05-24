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
  "icon.wishlist": { fr: "Favoris", ar: "المفضلة" },
  "icon.account": { fr: "Mon compte", ar: "حسابي" },
  "icon.cart": { fr: "Panier", ar: "السلة" },
  "account.menu.aria": { fr: "Menu compte", ar: "قائمة الحساب" },
  "account.greeting":  { fr: "Bonjour, {name}", ar: "مرحباً، {name}" },
  "account.profile":   { fr: "Mon compte",  ar: "حسابي" },
  "account.orders":    { fr: "Mes commandes", ar: "طلباتي" },
  "account.logout":    { fr: "Déconnexion", ar: "تسجيل الخروج" },
  "account.signIn":    { fr: "Se connecter", ar: "تسجيل الدخول" },
  "account.register":  { fr: "Créer un compte", ar: "إنشاء حساب" },

  // Locale switcher (legacy desktop button)
  "locale.aria": {
    fr: "Changer de région : Algérie, Français",
    ar: "تغيير المنطقة: الجزائر، العربية",
  },

  // Top info bar
  "header.address": {
    fr: "Cité Dallas, Bât. 3 · 19000 Sétif",
    ar: "حي دالاس، عمارة 3 · 19000 سطيف",
  },

  // Icon labels with live counts ({n} is substituted at runtime)
  "icon.wishlist.withCount": {
    fr: "Favoris, {n} articles",
    ar: "المفضلة، {n} عناصر",
  },
  "icon.cart.withCount": {
    fr: "Panier, {n} articles",
    ar: "السلة، {n} عناصر",
  },

  // Search results panel
  "search.results.count": {
    fr: "{n} résultats",
    ar: "{n} نتائج",
  },
  "search.results.none": {
    fr: "Aucun résultat",
    ar: "لا توجد نتائج",
  },
  "search.notFound.title": {
    fr: "Rien trouvé",
    ar: "لم يتم العثور على شيء",
  },
  "search.notFound.hint": {
    fr: "Essayez un autre mot-clé.",
    ar: "حاول كلمة مفتاحية أخرى.",
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

  // Brand wordmark + tagline + scroll cue
  "hero.brand": { fr: "BINGO", ar: "بينغو" },
  "hero.tagline": {
    fr: "Le matériel d'aventure, côte à côte.",
    ar: "معدات المغامرة، جنباً إلى جنب.",
  },
  "hero.scroll": { fr: "Défiler", ar: "مرر للأسفل" },

  // Promo block under the BINGO wordmark
  "hero.promo.eyebrow": { fr: "Offre limitée", ar: "عرض محدود" },
  "hero.promo.slogan": {
    fr: "Jusqu'à −30 % sur la collection automne",
    ar: "خصم يصل إلى 30٪ على تشكيلة الخريف",
  },
  "hero.promo.cta": { fr: "Voir les promotions", ar: "اطلع على العروض" },

  // Categories section
  "categories.eyebrow": {
    fr: "Catalogue · 6 collections",
    ar: "الكتالوج · 6 مجموعات",
  },
  "categories.title": {
    fr: "Trouvez le matériel par catégorie",
    ar: "اعثر على المعدات حسب الفئة",
  },
  "categories.subtitle": {
    fr: "Sacs de couchage, tentes, sacs à dos et plus encore — testés sur le terrain, comparés côte à côte.",
    ar: "أكياس نوم، خيام، حقائب وأكثر — مختبرة في الميدان، ومقارنة جنباً إلى جنب.",
  },
  "categories.cta": { fr: "Voir tout", ar: "عرض الكل" },
  "categories.products": { fr: "{n} produits", ar: "{n} منتجات" },

  // Per-sub-category names (catalogue filter dropdowns)
  // key shape: subcat.{parentSlug}.{slug}
  "subcat.sacs-de-couchage.duvet":         { fr: "Duvet",                 ar: "زغبي" },
  "subcat.sacs-de-couchage.synthetique":   { fr: "Synthétique",           ar: "اصطناعي" },
  "subcat.sacs-de-couchage.4-saisons":     { fr: "4 saisons",             ar: "4 فصول" },
  "subcat.tentes.2-places":                { fr: "2 places",              ar: "لشخصين" },
  "subcat.tentes.familiales":              { fr: "Familiales",            ar: "عائلية" },
  "subcat.tentes.ultralegeres":            { fr: "Ultralégères",          ar: "فائقة الخفة" },
  "subcat.sacs-a-dos.trek":                { fr: "Trek longue distance",  ar: "ترحال طويل" },
  "subcat.sacs-a-dos.journee":             { fr: "Sacs à la journée",     ar: "حقائب يومية" },
  "subcat.sacs-a-dos.hydratation":         { fr: "Sacs d'hydratation",    ar: "حقائب ترطيب" },
  "subcat.eclairage.frontales":            { fr: "Frontales",             ar: "كشافات الرأس" },
  "subcat.eclairage.lanternes":            { fr: "Lanternes",             ar: "فوانيس" },
  "subcat.navigation.couteaux":            { fr: "Couteaux & multifonctions", ar: "سكاكين متعددة الوظائف" },
  "subcat.navigation.boussoles":           { fr: "Boussoles & GPS",       ar: "بوصلات و GPS" },
  "subcat.campement.cuisine":              { fr: "Cuisine & réchauds",    ar: "مطبخ ومواقد" },
  "subcat.campement.hydratation":          { fr: "Bouteilles & gourdes",  ar: "زجاجات وقنينات" },
  "subcat.campement.mobilier":             { fr: "Mobilier de camp",      ar: "أثاث المخيم" },

  // Per-category names (homepage tiles)
  "category.tentes":            { fr: "Tentes",            ar: "الخيام" },
  "category.sacs-a-dos":        { fr: "Sacs à dos",        ar: "الحقائب" },
  "category.chaussures":        { fr: "Chaussures",        ar: "الأحذية" },
  "category.eclairage":         { fr: "Éclairage",         ar: "الإضاءة" },
  "category.navigation":        { fr: "Navigation",        ar: "الملاحة" },
  "category.campement":         { fr: "Campement",         ar: "التخييم" },
  "category.sacs-de-couchage":  { fr: "Sacs de couchage",  ar: "أكياس النوم" },
  "category.cuisine":           { fr: "Cuisine de camp",   ar: "مطبخ التخييم" },
  "category.hydratation":       { fr: "Hydratation",       ar: "الترطيب" },
  "category.vetements":         { fr: "Vêtements",         ar: "الملابس" },
  "category.rechauds":          { fr: "Réchauds",          ar: "المواقد" },
  "category.couteaux":          { fr: "Couteaux & outils", ar: "سكاكين وأدوات" },
  "category.accessoires":       { fr: "Accessoires",       ar: "الإكسسوارات" },
  "category.sacs-etanches":     { fr: "Sacs étanches",     ar: "حقائب مقاومة للماء" },
  "category.tapis-matelas":     { fr: "Tapis & matelas",   ar: "سجاد ومراتب" },
  "category.securite":          { fr: "Sécurité",          ar: "السلامة" },

  // Checkout / commander page
  "checkout.back":          { fr: "Retour à l'accueil",        ar: "العودة إلى الرئيسية" },
  "checkout.title":         { fr: "Finaliser la commande",     ar: "إتمام الطلب" },
  "checkout.subtitle":      {
    fr: "{n} articles dans votre panier. Renseignez vos informations de livraison ci-dessous.",
    ar: "{n} عناصر في سلتك. أدخل بيانات التوصيل أدناه.",
  },
  "checkout.subtitleEmpty": {
    fr: "Votre panier est vide. Ajoutez d'abord un produit avant de passer commande.",
    ar: "السلة فارغة. أضف منتجاً أولاً قبل إتمام الطلب.",
  },

  // Shipping form
  "checkout.shipping.title": { fr: "Informations de livraison", ar: "بيانات التوصيل" },
  "checkout.phone":        { fr: "Téléphone", ar: "الهاتف" },
  "checkout.phone.placeholder": {
    fr: "+213 5XX XX XX XX",
    ar: "0X XX XX XX XX",
  },
  "checkout.wilaya":       { fr: "Wilaya",    ar: "الولاية" },
  "checkout.commune":      { fr: "Commune",   ar: "البلدية" },
  "checkout.wilaya.placeholder":  { fr: "Sélectionnez une wilaya", ar: "اختر ولاية" },
  "checkout.commune.placeholder": { fr: "Sélectionnez une commune", ar: "اختر بلدية" },
  "checkout.commune.placeholderEmpty": {
    fr: "Choisissez d'abord la wilaya",
    ar: "اختر الولاية أولاً",
  },

  // Validation errors
  "checkout.error.firstName": { fr: "Le prénom est requis.", ar: "الاسم مطلوب." },
  "checkout.error.lastName":  { fr: "Le nom est requis.",    ar: "اللقب مطلوب." },
  "checkout.error.phone":     { fr: "Le numéro est requis.", ar: "رقم الهاتف مطلوب." },
  "checkout.error.phoneInvalid": {
    fr: "Numéro invalide — ex. +213 5XX XX XX XX.",
    ar: "رقم غير صحيح — مثال: 0X XX XX XX XX.",
  },
  "checkout.error.wilaya":  { fr: "Sélectionnez une wilaya.",  ar: "اختر ولاية." },
  "checkout.error.commune": { fr: "Sélectionnez une commune.", ar: "اختر بلدية." },

  // Delivery method
  "checkout.delivery.title": { fr: "Mode de livraison", ar: "طريقة التوصيل" },
  "checkout.delivery.home.title":       { fr: "À domicile",                ar: "إلى المنزل" },
  "checkout.delivery.home.description": { fr: "Livré directement chez vous", ar: "يُسلَّم مباشرة إلى منزلك" },
  "checkout.delivery.stop.title":       { fr: "Stop Desk", ar: "Stop Desk" },
  "checkout.delivery.stop.description": { fr: "À retirer en agence", ar: "يُستلم من الوكالة" },

  // Submit
  "checkout.submit":        { fr: "Confirmer la commande", ar: "تأكيد الطلب" },
  "checkout.submitShort":   { fr: "Confirmer",             ar: "تأكيد" },

  // Order summary
  "checkout.summary.title":   { fr: "Votre commande",       ar: "طلبك" },
  "checkout.summary.empty":   { fr: "Votre panier est vide", ar: "السلة فارغة" },
  "checkout.summary.browse":  { fr: "Parcourir le catalogue", ar: "تصفّح الكتالوج" },
  "checkout.summary.qty":     { fr: "Quantité : {n}",       ar: "الكمية: {n}" },
  "checkout.summary.subtotal":{ fr: "Sous-total",           ar: "المجموع الفرعي" },
  "checkout.summary.shipping":{ fr: "Livraison",            ar: "التوصيل" },
  "checkout.summary.total":   { fr: "Total",                ar: "المجموع" },

  // Success
  "checkout.success.title": { fr: "Commande reçue, merci !", ar: "تم استلام الطلب، شكراً!" },
  "checkout.success.subtitle": {
    fr: "Nous vous appelons sous 24 h pour confirmer la livraison. Surveillez votre téléphone — l'équipe BINGO va vous joindre.",
    ar: "نتصل بك خلال 24 ساعة لتأكيد التوصيل. ابقَ بجوار هاتفك — سيتواصل معك فريق بينغو.",
  },

  // Combobox
  "combobox.noOptions": { fr: "Aucune option", ar: "لا توجد خيارات" },

  // Product details — extras
  "product.back":       { fr: "Retour à l'accueil",  ar: "العودة إلى الرئيسية" },
  "product.readMore":   { fr: "Lire la suite…", ar: "اقرأ المزيد…" },
  "product.readLess":   { fr: "Lire moins",     ar: "اقرأ أقل" },
  "product.qty.label":  { fr: "Quantité",       ar: "الكمية" },
  "product.qty.dec":    { fr: "Diminuer la quantité", ar: "تقليل الكمية" },
  "product.qty.inc":    { fr: "Augmenter la quantité", ar: "زيادة الكمية" },
  "product.image.prev": { fr: "Image précédente", ar: "الصورة السابقة" },
  "product.image.next": { fr: "Image suivante",   ar: "الصورة التالية" },
  "product.image.view": { fr: "Voir l'image {n}", ar: "عرض الصورة {n}" },
  "product.buyNow":     { fr: "Commander maintenant", ar: "اطلب الآن" },
  "product.similar.eyebrow": { fr: "Découvrir aussi",  ar: "اكتشف أيضاً" },
  "product.similar.title":   { fr: "Produits similaires", ar: "منتجات مشابهة" },

  // Favoris page
  "favoris.eyebrow": { fr: "Votre sélection", ar: "اختياراتك" },
  "favoris.title":   { fr: "Favoris",          ar: "المفضلة" },
  "favoris.heroEmpty": {
    fr: "Aucun produit en favoris pour le moment. Cliquez sur le ♥ d'une fiche produit pour la garder ici.",
    ar: "لا يوجد منتج في المفضلة حالياً. اضغط على ♥ في بطاقة المنتج للاحتفاظ به هنا.",
  },
  "favoris.count.one":  { fr: "{n} produit sauvegardé.",  ar: "{n} منتج محفوظ." },
  "favoris.count.many": { fr: "{n} produits sauvegardés.", ar: "{n} منتجات محفوظة." },
  "favoris.clear":      { fr: "Tout vider",          ar: "تفريغ الكل" },
  "favoris.empty.title":{ fr: "Aucun favori pour l'instant", ar: "لا توجد مفضلة حالياً" },
  "favoris.empty.text": {
    fr: "Parcourez le catalogue et cliquez sur le ♥ d'un produit pour le retrouver ici, n'importe quand.",
    ar: "تصفّح الكتالوج واضغط على ♥ في أي منتج لإيجاده هنا، في أي وقت.",
  },
  "favoris.empty.cta":  { fr: "Explorer le catalogue", ar: "تصفّح الكتالوج" },

  // CGV page
  "cgv.eyebrow":  { fr: "Mentions légales",    ar: "إشعارات قانونية" },
  "cgv.title":    { fr: "Conditions générales de vente", ar: "الشروط والأحكام العامة للبيع" },
  "cgv.updated":  { fr: "Dernière mise à jour", ar: "آخر تحديث" },
  "cgv.updatedAt":{ fr: "Octobre 2026",         ar: "أكتوبر 2026" },
  "cgv.artPrefix":{ fr: "Art.",                 ar: "مادة" },
  "cgv.footer.question": { fr: "Pour toute question :", ar: "لأي سؤال:" },

  // Article 1 — Objet
  "cgv.art.1.title": { fr: "Objet", ar: "الموضوع" },
  "cgv.art.1.body": {
    fr: "Les présentes Conditions Générales de Vente (CGV) régissent toute commande passée sur le site BINGO. Elles s'appliquent dès la validation de la commande, sans réserve d'aucune autre condition.",
    ar: "تحكم هذه الشروط والأحكام العامة للبيع كل طلب يتم على موقع بينغو. وتُطبَّق فور تأكيد الطلب، دون أي تحفّظ على أي شرط آخر.",
  },

  // Article 2 — Vendeur
  "cgv.art.2.title": { fr: "Vendeur", ar: "البائع" },
  "cgv.art.2.body.p1.before": { fr: "Le vendeur est ", ar: "البائع هو " },
  "cgv.art.2.body.p1.brand":  { fr: "BINGO Camping",   ar: "بينغو كامبينغ" },
  "cgv.art.2.body.p1.after": {
    fr: ", boutique outdoor basée à Sétif (Algérie).",
    ar: "، متجر معدات خارجية يقع في سطيف (الجزائر).",
  },
  "cgv.art.2.body.p2.before": {
    fr: "Cité Dallas, Bâtiment 3 (près de LG) — 19000 Sétif, Algérie. Téléphone : ",
    ar: "حي دالاس، عمارة 3 (بجوار LG) — 19000 سطيف، الجزائر. الهاتف: ",
  },

  // Article 3 — Commande
  "cgv.art.3.title": { fr: "Commande", ar: "الطلب" },
  "cgv.art.3.body": {
    fr: "Toute commande implique l'acceptation pleine et entière des présentes CGV. Une commande est considérée comme ferme et définitive après confirmation téléphonique par notre équipe.",
    ar: "كل طلب يستلزم القبول الكامل والتام للشروط الحالية. يُعتبر الطلب نهائياً ومؤكداً بعد التأكيد الهاتفي من قِبل فريقنا.",
  },

  // Article 4 — Prix et paiement
  "cgv.art.4.title": { fr: "Prix et paiement", ar: "الأسعار والدفع" },
  "cgv.art.4.body.p1": {
    fr: "Les prix sont indiqués en dinars algériens (DA), toutes taxes comprises. Les frais de livraison sont précisés avant validation de la commande.",
    ar: "الأسعار محددة بالدينار الجزائري (دج)، شاملة لجميع الضرائب. تُحدَّد رسوم التوصيل قبل تأكيد الطلب.",
  },
  "cgv.art.4.body.p2": {
    fr: "Le paiement s'effectue à la livraison, en espèces ou par carte bancaire, sauf indication contraire.",
    ar: "يتم الدفع عند الاستلام، نقداً أو ببطاقة بنكية، ما لم يُذكر خلاف ذلك.",
  },

  // Article 5 — Garantie
  "cgv.art.5.title": { fr: "Garantie", ar: "الضمان" },
  "cgv.art.5.body": {
    fr: "Les produits vendus bénéficient de la garantie légale de conformité ainsi que de la garantie commerciale du fabricant lorsque celle-ci s'applique. Les conditions précises de chaque garantie sont disponibles sur demande.",
    ar: "تتمتع المنتجات المباعة بضمان المطابقة القانوني وكذلك الضمان التجاري للمُصنّع عند انطباقه. تتوفر الشروط المحددة لكل ضمان عند الطلب.",
  },

  // Article 6 — Données personnelles
  "cgv.art.6.title": { fr: "Données personnelles", ar: "البيانات الشخصية" },
  "cgv.art.6.body": {
    fr: "Vos informations (nom, téléphone, adresse) sont utilisées uniquement pour traiter votre commande. Elles ne sont jamais revendues à des tiers. Vous pouvez demander leur suppression à tout moment.",
    ar: "تُستخدم بياناتك (الاسم، الهاتف، العنوان) فقط لمعالجة طلبك. لا تُباع أبداً لأي طرف ثالث. يمكنك طلب حذفها في أي وقت.",
  },

  // Article 7 — Litiges
  "cgv.art.7.title": { fr: "Litiges et droit applicable", ar: "النزاعات والقانون المُطبَّق" },
  "cgv.art.7.body": {
    fr: "Les présentes CGV sont régies par le droit algérien. En cas de litige, une solution amiable sera recherchée en priorité avant toute action judiciaire.",
    ar: "تخضع هذه الشروط للقانون الجزائري. في حالة النزاع، يُسعى إلى حلّ ودي بالأولوية قبل أي إجراء قضائي.",
  },

  // FAQ page
  "faq.eyebrow": { fr: "Aide", ar: "المساعدة" },
  "faq.title":   { fr: "Questions fréquentes", ar: "الأسئلة الشائعة" },
  "faq.subtitle.before": {
    fr: "Les réponses aux questions qu'on nous pose le plus souvent. Vous ne trouvez pas la vôtre ? Appelez-nous au ",
    ar: "إجابات على الأسئلة التي تُطرح علينا كثيراً. لا تجد إجابتك؟ اتصل بنا على ",
  },

  "faq.cta.eyebrow":  { fr: "Toujours bloqué·e", ar: "ما زلت محتاراً؟" },
  "faq.cta.title":    { fr: "On vous répond en direct.", ar: "نردّ عليك مباشرة." },
  "faq.cta.subtitle": {
    fr: "Notre équipe est disponible du samedi au jeudi, de 9 h à 18 h.",
    ar: "فريقنا متاح من السبت إلى الخميس، من 9 صباحاً إلى 6 مساءً.",
  },

  // FAQ topic titles
  "faq.cat.order":    { fr: "Commande",           ar: "الطلب" },
  "faq.cat.delivery": { fr: "Livraison",          ar: "التوصيل" },
  "faq.cat.payment":  { fr: "Paiement",           ar: "الدفع" },
  "faq.cat.returns":  { fr: "Retours et garantie", ar: "الإرجاع والضمان" },
  "faq.cat.account":  { fr: "Compte et données", ar: "الحساب والبيانات" },
  "faq.cat.contact":  { fr: "Boutique et contact", ar: "المتجر والتواصل" },

  // Order
  "faq.q.order.1": { fr: "Comment passer une commande ?", ar: "كيف أقوم بطلب؟" },
  "faq.a.order.1": {
    fr: "Parcourez le catalogue, ajoutez les produits qui vous intéressent au panier, puis cliquez sur Commander. Vous renseignez vos informations de livraison et nous vous rappelons sous 24 h pour confirmer.",
    ar: "تصفّح الكتالوج، أضف المنتجات التي تهمّك إلى السلة، ثم اضغط على «اطلب». تُدخل بيانات التوصيل ونعاود الاتصال بك خلال 24 ساعة للتأكيد.",
  },
  "faq.q.order.2": { fr: "Puis-je commander par téléphone ?", ar: "هل يمكنني الطلب عبر الهاتف؟" },
  "faq.a.order.2.before": { fr: "Bien sûr — appelez-nous au ", ar: "بالتأكيد — اتصل بنا على " },
  "faq.a.order.2.after": {
    fr: " du samedi au jeudi entre 9 h et 18 h. Vous pouvez aussi nous écrire sur WhatsApp.",
    ar: " من السبت إلى الخميس بين 9 صباحاً و6 مساءً. يمكنك أيضاً مراسلتنا على واتساب.",
  },
  "faq.q.order.3": { fr: "Comment modifier ou annuler ma commande ?", ar: "كيف أعدّل أو ألغي طلبي؟" },
  "faq.a.order.3": {
    fr: "Contactez-nous le plus rapidement possible. Tant que la commande n'est pas expédiée, nous pouvons la modifier ou l'annuler sans frais.",
    ar: "تواصل معنا في أسرع وقت ممكن. ما دام الطلب لم يُشحن بعد، يمكننا تعديله أو إلغاؤه مجاناً.",
  },

  // Delivery
  "faq.q.delivery.1": { fr: "Quels sont les délais de livraison ?", ar: "ما هي مدة التوصيل؟" },
  "faq.a.delivery.1": {
    fr: "Entre 48 h et 72 h ouvrées dans la plupart des wilayas, parfois plus pour les régions éloignées du Sud.",
    ar: "بين 48 و72 ساعة عمل في أغلب الولايات، وقد تطول إلى مناطق الجنوب البعيدة.",
  },
  "faq.q.delivery.2": { fr: "Livrez-vous dans toutes les wilayas ?", ar: "هل توصلون إلى جميع الولايات؟" },
  "faq.a.delivery.2": {
    fr: "Oui — nous livrons dans les 58 wilayas d'Algérie.",
    ar: "نعم — نوصل إلى 58 ولاية في الجزائر.",
  },
  "faq.q.delivery.3": { fr: "Qu'est-ce que le Stop Desk ?", ar: "ما هو Stop Desk؟" },
  "faq.a.delivery.3": {
    fr: "C'est un point relais : le colis arrive dans une agence partenaire de votre commune, et vous passez le récupérer quand cela vous arrange. C'est l'option la plus économique.",
    ar: "هو نقطة استلام: يصل الطرد إلى وكالة شريكة في بلديتك، وتمرّ لاستلامه وقتما يناسبك. هو الخيار الأكثر اقتصاداً.",
  },

  // Payment
  "faq.q.payment.1": { fr: "Quels modes de paiement acceptez-vous ?", ar: "ما هي طرق الدفع المقبولة؟" },
  "faq.a.payment.1": {
    fr: "Paiement à la livraison, en espèces uniquement.",
    ar: "الدفع عند الاستلام، نقداً فقط.",
  },
  "faq.q.payment.2": { fr: "Le paiement à la livraison est-il sécurisé ?", ar: "هل الدفع عند الاستلام آمن؟" },
  "faq.a.payment.2": {
    fr: "Oui. Vous ne payez qu'une fois le colis remis et inspecté.",
    ar: "نعم. لا تدفع إلا بعد استلام الطرد ومعاينته.",
  },

  // Returns
  "faq.q.returns.1": { fr: "Comment retourner un produit ?", ar: "كيف أُرجع منتجاً؟" },
  "faq.a.returns.1": {
    fr: "Vous avez 30 jours à compter de la réception pour nous retourner un produit non utilisé, dans son emballage d'origine. Contactez-nous pour organiser le retour.",
    ar: "لديك 30 يوماً من تاريخ الاستلام لإرجاع منتج غير مستعمل في عبوته الأصلية. تواصل معنا لتنظيم الإرجاع.",
  },
  "faq.q.returns.2": { fr: "Mon produit est défectueux, que faire ?", ar: "منتجي معطوب، ماذا أفعل؟" },
  "faq.a.returns.2": {
    fr: "Contactez-nous avec une photo ou une vidéo du défaut. Nous organisons l'échange ou le remboursement selon la situation, sans frais pour vous.",
    ar: "تواصل معنا مع صورة أو فيديو للعطل. نقوم بالاستبدال أو الاسترجاع حسب الحالة، دون أي تكلفة عليك.",
  },

  // Account
  "faq.q.account.1": { fr: "Dois-je créer un compte pour commander ?", ar: "هل يجب إنشاء حساب للطلب؟" },
  "faq.a.account.1": {
    fr: "Non. Vous pouvez commander sans créer de compte — il suffit de remplir le formulaire de livraison.",
    ar: "لا. يمكنك الطلب دون إنشاء حساب — يكفي ملء استمارة التوصيل.",
  },
  "faq.q.account.2": { fr: "Comment sont utilisées mes données ?", ar: "كيف تُستخدم بياناتي؟" },
  "faq.a.account.2": {
    fr: "Uniquement pour traiter votre commande. Nous ne revendons jamais vos informations à des tiers.",
    ar: "فقط لمعالجة طلبك. لا نبيع بياناتك لأي طرف ثالث أبداً.",
  },

  // Contact
  "faq.q.contact.1": { fr: "Comment vous contacter ?", ar: "كيف أتواصل معكم؟" },
  "faq.a.contact.1.before": { fr: "Par téléphone au ", ar: "عبر الهاتف على " },
  "faq.a.contact.1.middle": {
    fr: ", sur WhatsApp, ou via notre formulaire de ",
    ar: "، أو على واتساب، أو عبر استمارة ",
  },
  "faq.a.contact.1.link":   { fr: "contact", ar: "التواصل" },

  // Auth — login + register
  "auth.divider":            { fr: "ou",                 ar: "أو" },
  "auth.guest":              { fr: "Continuer sans compte", ar: "المتابعة بدون حساب" },
  "auth.email":              { fr: "Email",              ar: "البريد الإلكتروني" },
  "auth.emailPlaceholder":   { fr: "vous@email.dz",      ar: "you@email.dz" },
  "auth.password":           { fr: "Mot de passe",       ar: "كلمة المرور" },
  "auth.password.show":      { fr: "Afficher le mot de passe", ar: "إظهار كلمة المرور" },
  "auth.password.hide":      { fr: "Masquer le mot de passe", ar: "إخفاء كلمة المرور" },
  "auth.brandSignature":     {
    fr: "BINGO Camping · Sétif · 36.2°N 5.4°E",
    ar: "بينغو كامبينغ · سطيف · 36.2°N 5.4°E",
  },

  // Login page
  "login.brand.eyebrow":  { fr: "Espace membre",   ar: "فضاء العضو" },
  "login.brand.title1":   { fr: "Bon retour",       ar: "أهلاً بعودتك" },
  "login.brand.title2":   { fr: "sur la base",      ar: "إلى القاعدة" },
  "login.brand.lead": {
    fr: "Retrouvez vos commandes, vos favoris et vos adresses de livraison — tout est déjà prêt.",
    ar: "اعثر على طلباتك، ومفضلتك، وعناوين التوصيل — كل شيء جاهز.",
  },
  "login.brand.bullet1": { fr: "Suivi de commande en direct",   ar: "تتبّع الطلب مباشرة" },
  "login.brand.bullet2": { fr: "Liste de favoris synchronisée", ar: "قائمة مفضلة متزامنة" },
  "login.brand.bullet3": { fr: "Adresses prêtes au prochain achat", ar: "عناوين جاهزة للطلب القادم" },

  "login.eyebrow":      { fr: "Connexion",          ar: "تسجيل الدخول" },
  "login.title":        { fr: "Connectez-vous",     ar: "سجّل دخولك" },
  "login.noAccount":    { fr: "Pas encore de compte ?", ar: "ليس لديك حساب بعد؟" },
  "login.createAccount":{ fr: "Créer un compte",    ar: "إنشاء حساب" },
  "login.remember":     { fr: "Se souvenir de moi", ar: "تذكّرني" },
  "login.submit":       { fr: "Se connecter",       ar: "تسجيل الدخول" },

  // Login errors
  "login.error.emailMissing": { fr: "Votre email est requis.", ar: "البريد الإلكتروني مطلوب." },
  "login.error.emailInvalid": { fr: "Email invalide.",         ar: "البريد الإلكتروني غير صحيح." },
  "login.error.passwordMissing": { fr: "Votre mot de passe est requis.", ar: "كلمة المرور مطلوبة." },
  "login.error.passwordShort":   { fr: "6 caractères minimum.", ar: "6 أحرف على الأقل." },

  // Register page
  "register.brand.eyebrow": { fr: "Rejoignez la base", ar: "انضم إلى القاعدة" },
  "register.brand.title1":  { fr: "Une équipe",        ar: "فريق" },
  "register.brand.title2":  { fr: "d'aventure.",       ar: "مغامرة." },
  "register.brand.lead": {
    fr: "Un compte BINGO = des commandes plus rapides, vos favoris à portée de main, et nos guides terrain en avant-première.",
    ar: "حساب بينغو = طلبات أسرع، ومفضلتك في متناول يدك، وأدلتنا الميدانية بأولوية.",
  },
  "register.brand.bullet1": { fr: "Nouveautés en avant-première",  ar: "الجديد بأولوية" },
  "register.brand.bullet2": { fr: "Adresses sauvegardées, commande en un clic", ar: "عناوين محفوظة، طلب بنقرة واحدة" },
  "register.brand.bullet3": { fr: "Retours sous 30 jours, garantis", ar: "إرجاع خلال 30 يوماً، مضمون" },

  "register.eyebrow":     { fr: "Nouveau client",      ar: "عميل جديد" },
  "register.title":       { fr: "Créer un compte",     ar: "إنشاء حساب" },
  "register.haveAccount": { fr: "Déjà un compte ?",    ar: "هل لديك حساب بالفعل؟" },
  "register.signIn":      { fr: "Se connecter",        ar: "تسجيل الدخول" },
  "register.firstName":   { fr: "Prénom",              ar: "الاسم" },
  "register.lastName":    { fr: "Nom",                 ar: "اللقب" },
  "register.confirm":     { fr: "Confirmation",        ar: "التأكيد" },
  "register.passwordPlaceholder": { fr: "6 caractères minimum", ar: "6 أحرف على الأقل" },
  "register.confirmPlaceholder":  { fr: "Retapez votre mot de passe", ar: "أعد كتابة كلمة المرور" },
  "register.acceptTermsPrefix":  { fr: "J'accepte les", ar: "أوافق على" },
  "register.acceptTermsLink":    { fr: "conditions générales de vente", ar: "الشروط والأحكام العامة للبيع" },
  "register.submit":      { fr: "Créer mon compte",    ar: "إنشاء حسابي" },

  // Register errors
  "register.error.firstName": { fr: "Votre prénom est requis.", ar: "الاسم مطلوب." },
  "register.error.lastName":  { fr: "Votre nom est requis.",    ar: "اللقب مطلوب." },
  "register.error.emailMissing": { fr: "Votre email est requis.", ar: "البريد الإلكتروني مطلوب." },
  "register.error.emailInvalid": { fr: "Email invalide.",       ar: "البريد الإلكتروني غير صحيح." },
  "register.error.passwordMissing": { fr: "Mot de passe requis.", ar: "كلمة المرور مطلوبة." },
  "register.error.passwordShort":   { fr: "6 caractères minimum.", ar: "6 أحرف على الأقل." },
  "register.error.confirmMissing":  { fr: "Veuillez confirmer le mot de passe.", ar: "يرجى تأكيد كلمة المرور." },
  "register.error.confirmMismatch": { fr: "Les mots de passe ne correspondent pas.", ar: "كلمات المرور غير متطابقة." },
  "register.error.terms": { fr: "Vous devez accepter les CGV.", ar: "يجب أن توافق على الشروط والأحكام." },

  // Contact page
  "contact.eyebrow": { fr: "Une question",     ar: "هل لديك سؤال؟" },
  "contact.title":   { fr: "Contactez-nous",   ar: "تواصل معنا" },
  "contact.subtitle": {
    fr: "Une question sur un produit, une commande ou un conseil terrain ? Écrivez-nous — l'équipe BINGO vous répond sous 24 h.",
    ar: "هل لديك سؤال عن منتج أو طلب أو نصيحة ميدانية؟ راسلنا — يردّ عليك فريق بينغو خلال 24 ساعة.",
  },

  // Contact form
  "contact.form.title":   { fr: "Écrivez-nous", ar: "راسلنا" },
  "contact.form.name":    { fr: "Nom",          ar: "الاسم" },
  "contact.form.email":   { fr: "Email",        ar: "البريد الإلكتروني" },
  "contact.form.subject": { fr: "Objet",        ar: "الموضوع" },
  "contact.form.message": { fr: "Message",      ar: "الرسالة" },
  "contact.form.emailPlaceholder":   { fr: "vous@email.dz", ar: "you@email.dz" },
  "contact.form.subjectPlaceholder": {
    fr: "Question sur une commande, demande de conseil, …",
    ar: "سؤال عن طلب، طلب نصيحة، …",
  },
  "contact.form.messagePlaceholder": {
    fr: "Détaillez votre demande…",
    ar: "اشرح طلبك بالتفصيل…",
  },
  "contact.form.submit": { fr: "Envoyer le message", ar: "إرسال الرسالة" },

  // Contact form validation
  "contact.error.name":         { fr: "Votre nom est requis.",       ar: "الاسم مطلوب." },
  "contact.error.emailMissing": { fr: "Votre email est requis.",     ar: "البريد الإلكتروني مطلوب." },
  "contact.error.emailInvalid": { fr: "Email invalide.",             ar: "البريد الإلكتروني غير صحيح." },
  "contact.error.subject":      { fr: "L'objet est requis.",         ar: "الموضوع مطلوب." },
  "contact.error.messageMissing": { fr: "Le message est requis.",    ar: "الرسالة مطلوبة." },
  "contact.error.messageShort": {
    fr: "Votre message est un peu court (10 caractères minimum).",
    ar: "الرسالة قصيرة (10 أحرف على الأقل).",
  },

  // Direct contact cards
  "contact.card.phone.label":    { fr: "Par téléphone",      ar: "بالهاتف" },
  "contact.card.phone.hours":    {
    fr: "Samedi — Jeudi · 9 h — 18 h",
    ar: "السبت — الخميس · 9ص — 6م",
  },
  "contact.card.phone.cta":      { fr: "Appeler",            ar: "اتصل" },
  "contact.card.whatsapp.label": { fr: "Sur WhatsApp",       ar: "عبر واتساب" },
  "contact.card.whatsapp.primary": { fr: "Discutons directement", ar: "لنتحدث مباشرة" },
  "contact.card.whatsapp.note":  {
    fr: "Réponse moyenne en moins de 2 h",
    ar: "متوسط الردّ أقل من ساعتين",
  },
  "contact.card.whatsapp.cta":   { fr: "Ouvrir WhatsApp",    ar: "افتح واتساب" },
  "contact.card.shop.label":     { fr: "À la boutique",      ar: "في المتجر" },
  "contact.card.shop.cta":       { fr: "Voir l'adresse",     ar: "عرض العنوان" },

  // Success state
  "contact.success.title": {
    fr: "Message envoyé, merci !",
    ar: "تم إرسال الرسالة، شكراً!",
  },
  "contact.success.subtitle": {
    fr: "Nous vous répondons sous 24 h ouvrées sur l'email que vous nous avez laissé.",
    ar: "نردّ عليك خلال 24 ساعة عمل على البريد الإلكتروني الذي تركته.",
  },
  "contact.success.reset": { fr: "Envoyer un autre message", ar: "إرسال رسالة أخرى" },

  // À propos page
  "about.eyebrow": { fr: "Qui sommes-nous", ar: "تعرّف علينا" },
  "about.title":   { fr: "À propos",        ar: "من نحن" },
  "about.intro": {
    fr: "BINGO est une boutique outdoor née à Sétif, au pied du Djurdjura. Nous sélectionnons et testons sur le terrain le matériel d'aventure que nous voudrions emporter en bivouac — rien d'autre.",
    ar: "بينغو متجر للمعدات الخارجية وُلد في سطيف، عند سفح جرجرة. نختار ونختبر في الميدان معدات المغامرة التي نودّ أخذها معنا إلى المخيم — لا شيء آخر.",
  },

  // Our story
  "about.story.eyebrow": { fr: "Notre histoire", ar: "قصتنا" },
  "about.story.title": {
    fr: "Une boutique née sur les sentiers",
    ar: "متجر وُلد على الدروب",
  },
  "about.story.p1": {
    fr: "Tout a commencé dans un bivouac au Tikjda, autour d'un réchaud qui refusait de s'allumer. Nous avons cherché du matériel sérieux, à des prix justes, livrable partout en Algérie. Nous n'avons pas trouvé. Alors nous l'avons monté.",
    ar: "بدأ كل شيء في مخيم بتيكجدة، حول موقد رفض أن يشتعل. بحثنا عن معدات جدية، بأسعار معقولة، تُسلَّم في جميع أنحاء الجزائر. لم نجد. فأسّسنا المتجر بأنفسنا.",
  },
  "about.story.p2": {
    fr: "BINGO est une équipe de trois passionnés — randonnée, alpinisme, photo — qui sélectionne les marques qu'elle utilise, teste chaque produit sur le terrain, et raconte ses choix dans le journal.",
    ar: "بينغو فريق من ثلاثة شغوفين — المشي، تسلق الجبال، التصوير — يختار العلامات التي يستخدمها، ويختبر كل منتج في الميدان، ويشرح خياراته في المدونة.",
  },
  "about.story.quote": {
    fr: "« Le matériel doit servir l'aventure, jamais l'inverse. »",
    ar: "«المعدات يجب أن تخدم المغامرة، وليس العكس.»",
  },
  "about.story.stats.creation": { fr: "Année de création", ar: "سنة التأسيس" },
  "about.story.stats.wilayas":  { fr: "Wilayas livrées",   ar: "ولاية مُغطّاة" },
  "about.story.stats.products": { fr: "Produits testés",   ar: "منتج مُختبَر" },
  "about.story.imageAlt": {
    fr: "Tente plantée face aux montagnes au coucher du soleil",
    ar: "خيمة منصوبة أمام الجبال عند الغروب",
  },

  // Values
  "about.values.eyebrow": { fr: "Ce qu'on défend",     ar: "ما نؤمن به" },
  "about.values.title":   { fr: "Nos quatre engagements", ar: "التزاماتنا الأربعة" },
  "about.values.field.title": { fr: "Testé sur le terrain",  ar: "مُختبَر في الميدان" },
  "about.values.field.text": {
    fr: "Aucun produit n'arrive en vitrine sans avoir traîné dans un sac à dos, dormi sous une tente, encaissé une averse.",
    ar: "لا يصل أي منتج إلى الواجهة قبل أن يُحمل في حقيبة، وينام تحت خيمة، ويتلقى زخة مطر.",
  },
  "about.values.curation.title": { fr: "Sélection rigoureuse", ar: "اختيار صارم" },
  "about.values.curation.text": {
    fr: "Moins de références, mieux choisies. Nous préférons une bonne tente à dix moyennes.",
    ar: "عدد أقل من المنتجات، باختيار أفضل. نُفضّل خيمة جيدة على عشر متوسطة.",
  },
  "about.values.delivery.title": { fr: "Livré partout en Algérie", ar: "توصيل في كل الجزائر" },
  "about.values.delivery.text": {
    fr: "Livraison à domicile ou en agence Stop Desk, sous 48 h dans la plupart des wilayas.",
    ar: "توصيل إلى المنزل أو إلى وكالة Stop Desk، خلال 48 ساعة في أغلب الولايات.",
  },
  "about.values.support.title": { fr: "Service après-vente", ar: "خدمة ما بعد البيع" },
  "about.values.support.text": {
    fr: "30 jours pour changer d'avis, garantie fabricant, et un humain au bout du fil.",
    ar: "30 يوماً لتغيير رأيك، ضمان المُصنّع، وإنسان حقيقي يرد على المكالمة.",
  },

  // Shop visit
  "about.shop.eyebrow": { fr: "Venez nous voir", ar: "تعالوا لزيارتنا" },
  "about.shop.title":   { fr: "La boutique de Sétif", ar: "متجر سطيف" },
  "about.shop.subtitle": {
    fr: "Un espace de 80 m² au centre-ville de Sétif où l'on essaie les sacs, on grimpe sur les chaussures, et on partage les guides terrain autour d'un café.",
    ar: "فضاء بمساحة 80 م² في وسط مدينة سطيف، حيث نُجرّب الحقائب، ونُجرّب الأحذية، ونتشارك أدلة الميدان حول فنجان قهوة.",
  },
  "about.shop.address.label": { fr: "Adresse", ar: "العنوان" },
  "about.shop.address.line1": {
    fr: "Cité Dallas, Bâtiment 3 (près de LG)",
    ar: "حي دالاس، عمارة 3 (بجوار LG)",
  },
  "about.shop.address.line2": {
    fr: "19000 Sétif, Algérie",
    ar: "19000 سطيف، الجزائر",
  },
  "about.shop.phone.label":   { fr: "Téléphone", ar: "الهاتف" },
  "about.shop.imageAlt":      { fr: "Carte de la région de Sétif", ar: "خريطة منطقة سطيف" },

  // Bottom CTA
  "about.cta.eyebrow": { fr: "Prêt à partir",         ar: "هل أنت مستعد للانطلاق؟" },
  "about.cta.title":   { fr: "Découvrez la collection", ar: "اكتشف المجموعة" },
  "about.cta.subtitle": {
    fr: "Sacs de couchage, tentes, sacs à dos, éclairage — la sélection BINGO, livrée partout en Algérie.",
    ar: "أكياس النوم، الخيام، الحقائب، الإضاءة — اختيارات بينغو، تُسلَّم في كل الجزائر.",
  },
  "about.cta.btn": { fr: "Voir le catalogue", ar: "عرض الكتالوج" },

  // Catalogue page
  "catalogue.eyebrow":  { fr: "Boutique", ar: "المتجر" },
  "catalogue.title":    { fr: "Catalogue", ar: "الكتالوج" },
  "catalogue.subtitle": {
    fr: "Toute notre sélection — testée, choisie, livrée dans toute l'Algérie.",
    ar: "كل اختياراتنا — مختبرة، مختارة، ومُسلَّمة في كامل الجزائر.",
  },

  // Breadcrumb
  "breadcrumb.aria":       { fr: "Fil d'Ariane",        ar: "مسار التنقل" },
  "breadcrumb.home":       { fr: "Accueil",             ar: "الرئيسية" },
  "breadcrumb.catalogue":  { fr: "Catalogue",           ar: "الكتالوج" },

  // Search bar (page)
  "catalogue.search.placeholder": {
    fr: "Rechercher tente, sac de couchage, lampe frontale…",
    ar: "ابحث عن خيمة، كيس نوم، كشاف رأس…",
  },
  "catalogue.search.aria":       { fr: "Rechercher dans le catalogue", ar: "ابحث في الكتالوج" },
  "catalogue.search.clearAria":  { fr: "Effacer la recherche",         ar: "مسح البحث" },

  // Filters sidebar
  "filters.title":            { fr: "Filtres",            ar: "الفلاتر" },
  "filters.clear":            { fr: "Aucun",              ar: "إلغاء" },
  "filters.section.categories":  { fr: "Catégories",      ar: "الفئات" },
  "filters.section.price":       { fr: "Prix",            ar: "السعر" },
  "filters.section.brands":      { fr: "Marques",         ar: "العلامات التجارية" },
  "filters.section.availability":{ fr: "Disponibilité",   ar: "التوفر" },
  "filters.allCategories":    { fr: "Toutes les catégories", ar: "جميع الفئات" },
  "filters.price.min":        { fr: "Min",                ar: "أدنى" },
  "filters.price.max":        { fr: "Max",                ar: "أقصى" },
  "filters.price.minAria":    { fr: "Prix minimum",       ar: "السعر الأدنى" },
  "filters.price.maxAria":    { fr: "Prix maximum",       ar: "السعر الأقصى" },
  "filters.brands.placeholder":{fr: "Rechercher une marque…", ar: "ابحث عن علامة تجارية…" },
  "filters.brands.aria":      { fr: "Rechercher une marque",  ar: "ابحث عن علامة تجارية" },
  "filters.brands.none":      { fr: "Aucune marque",      ar: "لا توجد علامة تجارية" },
  "filters.brands.more":      { fr: "Voir plus ({n})",    ar: "عرض المزيد ({n})" },
  "filters.brands.less":      { fr: "Voir moins",         ar: "عرض أقل" },
  "filters.availability.inStock": { fr: "En stock uniquement", ar: "المتوفر فقط" },
  "filters.availability.promo":   { fr: "Produits en promotion", ar: "المنتجات في العروض" },
  "filters.category.expand":   { fr: "Déplier",           ar: "توسيع" },
  "filters.category.collapse": { fr: "Replier",           ar: "طي" },

  // Sort
  "sort.popular":    { fr: "Populaires",       ar: "الأكثر شعبية" },
  "sort.newest":     { fr: "Nouveautés",       ar: "الجديد" },
  "sort.priceAsc":   { fr: "Prix croissant",   ar: "السعر تصاعدياً" },
  "sort.priceDesc":  { fr: "Prix décroissant", ar: "السعر تنازلياً" },
  "sort.prefix":     { fr: "Trier ·",          ar: "ترتيب ·" },

  // Toolbar
  "toolbar.results":  { fr: "{n} résultats",   ar: "{n} نتائج" },

  // Pagination
  "pagination.aria":  { fr: "Pagination",      ar: "ترقيم الصفحات" },
  "pagination.prev":  { fr: "Page précédente", ar: "الصفحة السابقة" },
  "pagination.next":  { fr: "Page suivante",   ar: "الصفحة التالية" },
  "pagination.go":    { fr: "Aller à la page {n}", ar: "اذهب إلى الصفحة {n}" },

  // Empty state
  "catalogue.empty.title": {
    fr: "Aucun produit ne correspond à vos filtres",
    ar: "لا يوجد منتج يطابق فلاترك",
  },
  "catalogue.empty.subtitle": {
    fr: "Essayez d'élargir votre recherche ou réinitialisez les filtres.",
    ar: "حاول توسيع بحثك أو أعد ضبط الفلاتر.",
  },
  "catalogue.empty.reset":  { fr: "Réinitialiser", ar: "إعادة ضبط" },

  // Mobile filters drawer
  "mobileFilters.show":         { fr: "Voir les résultats",   ar: "عرض النتائج" },
  "mobileFilters.close":        { fr: "Fermer",               ar: "إغلاق" },
  "mobileFilters.closeAria":    { fr: "Fermer les filtres",   ar: "إغلاق الفلاتر" },

  // Footer
  "footer.aria": { fr: "Pied de page", ar: "تذييل الصفحة" },
  "footer.tagline": {
    fr: "Matériel d'aventure indépendant, sélectionné et testé sur le terrain depuis Sétif.",
    ar: "معدات مغامرة مستقلة، مختارة ومختبرة في الميدان من سطيف.",
  },
  "footer.copyright": {
    fr: "© {year} BINGO Camping · Sétif, Algérie",
    ar: "© {year} بينغو كامبينغ · سطيف، الجزائر",
  },
  "footer.col.catalogue": { fr: "Catalogue", ar: "الكتالوج" },
  "footer.col.help":      { fr: "Aide",      ar: "المساعدة" },
  "footer.col.about":     { fr: "À propos",  ar: "من نحن" },
  "footer.help.faq":      { fr: "FAQ",       ar: "الأسئلة الشائعة" },
  "footer.help.delivery": { fr: "Livraison", ar: "التوصيل" },
  "footer.help.returns":  { fr: "Retours",   ar: "الإرجاع" },
  "footer.help.contact":  { fr: "Contact",   ar: "اتصل بنا" },
  "footer.about.story":   { fr: "Notre histoire", ar: "قصتنا" },
  "footer.about.favorites":{fr: "Favoris",   ar: "المفضلة" },
  "footer.about.cgv":     { fr: "CGV",       ar: "الشروط والأحكام" },

  // Trust band — 4 reassurance points
  "trust.aria": { fr: "Nos engagements", ar: "التزاماتنا" },
  "trust.delivery.title": { fr: "Livraison gratuite", ar: "توصيل مجاني" },
  "trust.delivery.text": {
    fr: "Dès 12 000 DA partout en Algérie",
    ar: "ابتداءً من 12,000 دج في جميع أنحاء الجزائر",
  },
  "trust.returns.title": {
    fr: "Retours sous 30 jours",
    ar: "إرجاع خلال 30 يوماً",
  },
  "trust.returns.text": {
    fr: "Sans question, en boutique ou par envoi",
    ar: "بدون أسئلة، في المتجر أو عبر الشحن",
  },
  "trust.payment.title": { fr: "Paiement sécurisé", ar: "دفع آمن" },
  "trust.payment.text": {
    fr: "À la livraison ou en ligne",
    ar: "عند الاستلام أو عبر الإنترنت",
  },
  "trust.shop.title": { fr: "Boutique à Sétif", ar: "متجر في سطيف" },
  "trust.shop.text": {
    fr: "36.2°N · 5.4°E — rendez-vous sur place",
    ar: "36.2°N · 5.4°E — موعدك في المكان",
  },

  // Collection CTA — bottom of homepage
  "collection.eyebrow": {
    fr: "Tout notre matériel",
    ar: "كل معداتنا",
  },
  "collection.title": {
    fr: "Découvrez la collection complète",
    ar: "اكتشف المجموعة الكاملة",
  },
  "collection.subtitle": {
    fr: "Sacs de couchage, tentes, sacs à dos, éclairage, navigation — tout ce qu'il faut pour la prochaine sortie, sélectionné et testé sur le terrain.",
    ar: "أكياس النوم، الخيام، الحقائب، الإضاءة، الملاحة — كل ما تحتاجه للخرجة القادمة، مختارة ومختبرة في الميدان.",
  },
  "collection.cta": { fr: "Voir la collection", ar: "عرض المجموعة" },

  // Promotions banner
  "promo.eyebrow": {
    fr: "Offre limitée · Octobre",
    ar: "عرض محدود · أكتوبر",
  },
  "promo.title": {
    fr: "Jusqu'à −30 % sur la collection automne",
    ar: "خصم يصل إلى 30٪ على تشكيلة الخريف",
  },
  "promo.subtitle": {
    fr: "Sacs de couchage, hardshells et sacs à dos — notre meilleure sélection est en promo jusqu'à fin octobre. Livraison gratuite dès 12 000 DA.",
    ar: "أكياس نوم، جاكيتات مقاومة للماء، وحقائب — أفضل اختياراتنا في عرض حتى نهاية أكتوبر. توصيل مجاني ابتداءً من 12,000 دج.",
  },
  "promo.cta": { fr: "Voir les promotions", ar: "اطلع على العروض" },

  // Product card / floating actions
  "card.order":        { fr: "Commander",          ar: "اطلب" },
  "card.addToCart":    { fr: "Ajouter au panier",  ar: "أضف إلى السلة" },
  "card.addShort":     { fr: "Ajouter",            ar: "أضف" },
  "card.added":        { fr: "Ajouté",             ar: "تمت الإضافة" },
  "card.addedAria":    { fr: "Ajouté au panier",   ar: "تمت الإضافة إلى السلة" },
  "card.badge.new":    { fr: "Nouveau",            ar: "جديد" },
  "actions.favorite.add":    { fr: "Ajouter aux favoris", ar: "أضف إلى المفضلة" },
  "actions.favorite.remove": { fr: "Retirer des favoris", ar: "إزالة من المفضلة" },

  // Newest section header
  "newest.eyebrow": {
    fr: "Nouveautés · Cette semaine",
    ar: "الجديد · هذا الأسبوع",
  },
  "newest.title": { fr: "Tout juste arrivé", ar: "وصل للتو" },
  "newest.subtitle": {
    fr: "Les dernières arrivées en boutique — encore tièdes du déballage.",
    ar: "آخر ما وصل إلى المتجر — لا يزال طازجاً من التغليف.",
  },

  // Best-sellers section header
  "best.eyebrow": {
    fr: "Best-sellers · Choix de l'équipe",
    ar: "الأكثر مبيعاً · اختيار الفريق",
  },
  "best.title": {
    fr: "Les plus vendus ce mois-ci",
    ar: "الأكثر مبيعاً هذا الشهر",
  },
  "best.subtitle": {
    fr: "Notre top 4 des produits les plus comparés et achetés — testés sur le terrain, validés par la communauté.",
    ar: "أفضل 4 منتجات لدينا من حيث المقارنة والشراء — مختبرة في الميدان، ومعتمدة من المجتمع.",
  },
  "best.cta": {
    fr: "Voir le classement complet",
    ar: "عرض التصنيف الكامل",
  },

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

type TranslateVars = Record<string, string | number>;

type Ctx = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (
    key: keyof typeof TRANSLATIONS | string,
    vars?: TranslateVars
  ) => string;
};

/** Replace `{name}` placeholders in the translation string. */
function applyVars(str: string, vars?: TranslateVars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m
  );
}

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
    (key: string, vars?: TranslateVars) => {
      const entry = TRANSLATIONS[key];
      if (!entry) return applyVars(key, vars);
      return applyVars(entry[lang] ?? entry.fr, vars);
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

/**
 * Returns a localizer for product names. Pass an object with at least
 * a `name` field (FR) and optionally a `nameAr` field; the function
 * returns the right one for the active language, falling back to `name`
 * when an Arabic value is missing.
 */
export function useProductName() {
  const { lang } = useLanguage();
  return React.useCallback(
    (p: { name: string; nameAr?: string }) =>
      lang === "ar" && p.nameAr ? p.nameAr : p.name,
    [lang]
  );
}

/**
 * Same shape as `useProductName` but for the longer description field.
 */
export function useProductDescription() {
  const { lang } = useLanguage();
  return React.useCallback(
    (p: { description: string; descriptionAr?: string }) =>
      lang === "ar" && p.descriptionAr ? p.descriptionAr : p.description,
    [lang]
  );
}

/**
 * Returns a stable price formatter for the active language.
 * FR → "16 900 DA", AR → "16 900 دج".
 * Digits stay Latin so prices look identical in both languages; only
 * the currency suffix swaps.
 */
export function useFormatPrice() {
  const { lang } = useLanguage();
  return React.useCallback(
    (value: number) => {
      const formatted = new Intl.NumberFormat("fr-DZ", {
        maximumFractionDigits: 0,
      }).format(value);
      return `${formatted} ${lang === "ar" ? "دج" : "DA"}`;
    },
    [lang]
  );
}

export function useLanguage(): Ctx {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    // Fallback so non-wrapped trees still render in French
    return {
      lang: "fr",
      setLang: () => {},
      t: (key, vars) => applyVars(TRANSLATIONS[key]?.fr ?? key, vars),
    };
  }
  return ctx;
}
