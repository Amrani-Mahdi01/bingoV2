/* Static banner data — mock for the BannerSlider.
   Each banner carries bilingual (fr/ar) title/subtitle/CTA so the
   slider can swap language alongside the rest of the UI. */
export type Banner = {
  id: string;
  image: string;
  link?: string;
  titleFr: string;
  titleAr: string;
  subtitleFr?: string;
  subtitleAr?: string;
  ctaLabelFr?: string;
  ctaLabelAr?: string;
};

export const BANNERS: Banner[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=2000&q=85&fit=crop",
    link: "/catalogue?promo=automne",
    titleFr: "L'automne s'installe au Djurdjura",
    titleAr: "الخريف يحلّ على جبال جرجرة",
    subtitleFr:
      "Notre sélection de sacs de couchage et hardshells pour les nuits les plus fraîches — testée sur le terrain.",
    subtitleAr:
      "تشكيلتنا من أكياس النوم والملابس المقاومة للماء لأبرد الليالي — مُختبرة في الميدان.",
    ctaLabelFr: "Voir la sélection",
    ctaLabelAr: "اطلع على التشكيلة",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=2000&q=85&fit=crop",
    link: "/categorie/tentes",
    titleFr: "Tentes ultralégères — −15 % cette semaine",
    titleAr: "خيم خفيفة الوزن — خصم 15٪ هذا الأسبوع",
    subtitleFr:
      "MSR, Big Agnes, Nemo — les meilleures références pour les longues traversées, livrées sous 48 h à Sétif.",
    subtitleAr:
      "MSR و Big Agnes و Nemo — أفضل العلامات للرحلات الطويلة، توصيل خلال 48 ساعة إلى سطيف.",
    ctaLabelFr: "Découvrir les tentes",
    ctaLabelAr: "اكتشف الخيم",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=2000&q=85&fit=crop",
    link: "/categorie/sacs-a-dos",
    titleFr: "Sacs à dos de trek — la collection 2025",
    titleAr: "حقائب الترحال — مجموعة 2025",
    subtitleFr:
      "Osprey Anti-Gravity, Gregory FreeFloat, Deuter Aircontact — un dos ventilé pour chaque morphologie.",
    subtitleAr:
      "Osprey Anti-Gravity و Gregory FreeFloat و Deuter Aircontact — ظهر مهوّى لكل بنية جسدية.",
    ctaLabelFr: "Comparer les modèles",
    ctaLabelAr: "قارن النماذج",
  },
];
