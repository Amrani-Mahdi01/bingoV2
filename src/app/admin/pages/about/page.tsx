"use client";

import * as React from "react";

import {
  PageContentEditor,
  type PageEditorDef,
} from "@/components/admin/PageContentEditor";

const ABOUT: PageEditorDef = {
  eyebrow: "Pages du site",
  title: "À propos — /about",
  subtitle:
    "Contenu bilingue affiché sur la page À propos du site. Modifiez le français à gauche et l'arabe à droite.",
  sections: [
    {
      title: "En-tête de section",
      fields: [
        {
          id: "info-about-eyebrow",
          label: "Eyebrow (info.about.eyebrow)",
          type: "input",
          fr: "Notre histoire",
          ar: "قصتنا",
        },
        {
          id: "info-about-title",
          label: "Titre (info.about.title)",
          type: "input",
          fr: "À propos de BINGO",
          ar: "عن بينغو",
        },
      ],
    },
    {
      title: "Hero",
      fields: [
        {
          id: "about-hero-eyebrow",
          label: "Eyebrow du hero (about.hero.eyebrow)",
          type: "input",
          fr: "Notre maison",
          ar: "بيتنا",
        },
        {
          id: "about-hero-title",
          label: "Titre du hero (about.hero.title)",
          type: "input",
          fr: "BINGO — L'aventure commence ici",
          ar: "بينغو — هنا تبدأ المغامرة",
        },
        {
          id: "about-hero-lead",
          label: "Lead du hero (about.hero.lead)",
          type: "textarea",
          rows: 3,
          fr: "Une petite équipe à Sétif, une obsession : équiper sérieusement celles et ceux qui sortent — pour une nuit ou pour un mois.",
          ar: "فريق صغير في سطيف، هاجسٌ واحد : تجهيز جادّ لمن يخرج إلى الطبيعة — لليلة واحدة أو لشهر كامل.",
        },
      ],
    },
    {
      title: "Pourquoi BINGO",
      fields: [
        {
          id: "about-section-why-title",
          label: "Titre (about.section.why.title)",
          type: "input",
          fr: "Pourquoi BINGO ?",
          ar: "لماذا بينغو ؟",
        },
        {
          id: "about-section-why-p1",
          label: "Paragraphe 1 (about.section.why.p1)",
          type: "textarea",
          rows: 4,
          fr: "BINGO est né d'une frustration simple : impossible de trouver en Algérie un équipement outdoor à la fois technique, durable et accompagné d'un vrai service client. Trop de boutiques vendent ce qui se vend, pas ce qui dure.",
          ar: "ولدت بينغو من إحباط بسيط : يصعب أن تجد في الجزائر معدّات هواء طلق تجمع بين الجودة التقنية، المتانة، وخدمة حقيقية. كثير من المتاجر يبيع ما يُباع، لا ما يدوم.",
        },
        {
          id: "about-section-why-p2",
          label: "Paragraphe 2 (about.section.why.p2)",
          type: "textarea",
          rows: 4,
          fr: "Nous avons commencé en 2024 par sélectionner moins de quinze marques, parmi des fabricants qui partagent notre approche : pas de greenwashing, pas de marketing creux, des matériaux honnêtes et un SAV qui répond vraiment.",
          ar: "بدأنا في 2024 باختيار أقلّ من خمس عشرة علامة، من مصنّعين يشاركوننا المنهج : لا غسيلاً أخضر، لا تسويقاً فارغاً، مواد صادقة وخدمة ما بعد البيع تردّ فعلاً.",
        },
      ],
    },
    {
      title: "Notre approche",
      fields: [
        {
          id: "about-section-approach-title",
          label: "Titre (about.section.approach.title)",
          type: "input",
          fr: "Notre approche",
          ar: "منهجنا",
        },
        {
          id: "about-section-approach-p1",
          label: "Paragraphe 1 (about.section.approach.p1)",
          type: "textarea",
          rows: 4,
          fr: "Chaque produit est testé en conditions réelles avant d'entrer au catalogue. Nous prêtons attention à trois choses : la durabilité (combien de saisons tiendra-t-il ?), la réparabilité (peut-on remplacer une pièce ?) et la transparence des fiches techniques.",
          ar: "كل منتج يُختبر ميدانياً قبل أن يدخل الكتالوج. نهتم بثلاثة أشياء : المتانة (كم موسماً سيصمد ؟)، إمكانية الإصلاح (هل يمكن استبدال قطعة ؟)، وشفافية البطاقات التقنية.",
        },
        {
          id: "about-section-approach-p2",
          label: "Paragraphe 2 (about.section.approach.p2)",
          type: "textarea",
          rows: 4,
          fr: "Côté logistique, nous travaillons en exclusivité avec ZR Express — leur réseau couvre les 58 wilayas et leur taux de livraison réussie est le plus élevé d'Algérie. Tout le monde est livré.",
          ar: "من الناحية اللوجستية، نعمل حصرياً مع ZR Express — شبكتهم تغطّي الولايات الثماني والخمسين ومعدّل تسليمهم الناجح هو الأعلى في الجزائر. الكل يتسلّم طلبه.",
        },
      ],
    },
    {
      title: "Valeurs — Curation",
      fields: [
        {
          id: "about-values-curation-title",
          label: "Titre (about.values.curation.title)",
          type: "input",
          fr: "Curation",
          ar: "الانتقاء",
        },
        {
          id: "about-values-curation-text",
          label: "Texte (about.values.curation.text)",
          type: "textarea",
          rows: 2,
          fr: "Moins de marques, mieux choisies. Nous écartons les gadgets et privilégions ce qui résiste au temps.",
          ar: "علامات أقل، مختارة أفضل. نستبعد الأدوات التافهة ونفضّل ما يصمد عبر الزمن.",
        },
      ],
    },
    {
      title: "Valeurs — Qualité",
      fields: [
        {
          id: "about-values-quality-title",
          label: "Titre (about.values.quality.title)",
          type: "input",
          fr: "Qualité",
          ar: "الجودة",
        },
        {
          id: "about-values-quality-text",
          label: "Texte (about.values.quality.text)",
          type: "textarea",
          rows: 2,
          fr: "Tests terrain dans le Djurdjura, l'Aurès et le Hoggar avant toute mise en catalogue.",
          ar: "اختبارات ميدانية في جرجرة، الأوراس، والهقار قبل أي إضافة للكتالوج.",
        },
      ],
    },
    {
      title: "Valeurs — Service",
      fields: [
        {
          id: "about-values-service-title",
          label: "Titre (about.values.service.title)",
          type: "input",
          fr: "Service",
          ar: "الخدمة",
        },
        {
          id: "about-values-service-text",
          label: "Texte (about.values.service.text)",
          type: "textarea",
          rows: 2,
          fr: "Conseil par téléphone et WhatsApp 7j/7. Le SAV traite chaque demande sous 24h.",
          ar: "نصيحة عبر الهاتف وواتساب 7/7. تعالج خدمة ما بعد البيع كل طلب خلال 24 ساعة.",
        },
      ],
    },
    {
      title: "Bannière de bas de page",
      fields: [
        {
          id: "about-banner-quote",
          label: "Citation (about.banner.quote)",
          type: "input",
          fr: "La meilleure publicité, c'est un client servi correctement.",
          ar: "أفضل دعاية هي عميل يُخدم كما يجب.",
        },
        {
          id: "about-banner-cta",
          label: "Libellé du bouton (about.banner.cta)",
          type: "input",
          fr: "Découvrir nos produits",
          ar: "اكتشف منتجاتنا",
        },
      ],
    },
  ],
};

export default function AdminAboutPage() {
  return <PageContentEditor def={ABOUT} />;
}
