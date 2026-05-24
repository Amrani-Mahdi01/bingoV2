import type { Banner } from "@/lib/types";

export const banners: Banner[] = [
  {
    id: "banner-1",
    image: "/hero/mountain-tent.jpg",
    titleFr: "Le printemps en montagne",
    titleAr: "الربيع في الجبال",
    subtitleFr:
      "Découvrez la nouvelle sélection randonnée — tentes, sacs et chaussures testés dans le Djurdjura.",
    subtitleAr:
      "اكتشف تشكيلة المشي الجديدة — خيام، حقائب وأحذية مُجرَّبة في جرجرة.",
    ctaLabelFr: "Voir la sélection",
    ctaLabelAr: "عرض التشكيلة",
    link: "/catalog?sort=new",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "banner-2",
    image: "/hero/lake-campfire.jpg",
    titleFr: "Soldes de saison — jusqu'à -40 %",
    titleAr: "تخفيضات الموسم — حتى -40%",
    subtitleFr:
      "Promotions sur plus de 30 références, livraison ZR Express dans toute l'Algérie.",
    subtitleAr:
      "تخفيضات على أكثر من 30 منتجاً، توصيل ZR Express في كل الجزائر.",
    ctaLabelFr: "Profiter des promotions",
    ctaLabelAr: "اغتنم العروض",
    link: "/catalog?promoOnly=true",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "banner-3",
    image: "/hero/overland-bivouac.jpg",
    titleFr: "Cap sur le Sud — équipement bivouac",
    titleAr: "نحو الجنوب — معدّات التخييم",
    subtitleFr:
      "Sacs de couchage grand froid, réchauds multi-combustible et lampes haute autonomie pour les nuits du désert.",
    subtitleAr:
      "أكياس نوم للبرد القارس، مواقد متعدّدة الوقود وكشّافات طويلة المدى لليالي الصحراء.",
    ctaLabelFr: "Explorer l'équipement Sud",
    ctaLabelAr: "اكتشف معدّات الجنوب",
    link: "/catalog/sacs-de-couchage",
    displayOrder: 3,
    isActive: true,
  },
];
