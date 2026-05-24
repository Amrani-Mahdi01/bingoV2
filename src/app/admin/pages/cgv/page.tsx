"use client";

import * as React from "react";

import {
  PageContentEditor,
  type PageEditorDef,
} from "@/components/admin/PageContentEditor";

const CGV: PageEditorDef = {
  eyebrow: "Pages du site",
  title: "CGV — /cgv",
  subtitle:
    "Conditions générales de vente. Modifiez le français à gauche et l'arabe à droite.",
  sections: [
    {
      title: "En-tête",
      fields: [
        {
          id: "info-cgv-eyebrow",
          label: "Eyebrow (info.cgv.eyebrow)",
          type: "input",
          fr: "Légal",
          ar: "قانوني",
        },
        {
          id: "info-cgv-title",
          label: "Titre (info.cgv.title)",
          type: "input",
          fr: "Conditions générales de vente",
          ar: "الشروط العامة للبيع",
        },
      ],
    },
    {
      title: "Article 1 — Parties",
      fields: [
        {
          id: "cgv-art1-title",
          label: "Titre (cgv.art1.title)",
          type: "input",
          fr: "Article 1 — Parties",
          ar: "المادة 1 — الأطراف",
        },
        {
          id: "cgv-art1-p1",
          label: "Paragraphe 1 (cgv.art1.p1)",
          type: "textarea",
          rows: 2,
          fr: "Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre :",
          ar: "تنظّم الشروط العامة للبيع (CGV) الحالية العلاقات التعاقدية بين :",
        },
        {
          id: "cgv-art1-p2-bold",
          label: "Paragraphe 2 — gras (cgv.art1.p2.bold)",
          type: "input",
          fr: "BINGO SARL",
          ar: "بينغو ش.م.م",
        },
        {
          id: "cgv-art1-p2-text",
          label: "Paragraphe 2 — texte (cgv.art1.p2.text)",
          type: "textarea",
          rows: 3,
          fr: "(ci-après « le Vendeur »), au capital social de 100 000 DZD, dont le siège social est situé Cité Hassan Bey, Sétif 19000, Algérie, immatriculée au Registre du Commerce d'Algérie sous le numéro XX/00-XXXXXXX ;",
          ar: "(يُشار إليها لاحقاً بـ « البائع »)، برأسمال اجتماعي قدره 100 000 دج، يقع مقرّها الاجتماعي في حي حسن باي، سطيف 19000، الجزائر، مسجّلة في السجل التجاري الجزائري تحت رقم XX/00-XXXXXXX ؛",
        },
        {
          id: "cgv-art1-p3",
          label: "Paragraphe 3 (cgv.art1.p3)",
          type: "textarea",
          rows: 3,
          fr: "Et toute personne physique ou morale, majeure et résidant en Algérie, effectuant un achat sur le site bingo.dz (ci-après « le Client »).",
          ar: "وكل شخص طبيعي أو معنوي بالغ ومقيم في الجزائر، يقوم بعملية شراء على موقع bingo.dz (يُشار إليه لاحقاً بـ « العميل »).",
        },
      ],
    },
    {
      title: "Article 2 — Objet et acceptation",
      fields: [
        {
          id: "cgv-art2-title",
          label: "Titre (cgv.art2.title)",
          type: "input",
          fr: "Article 2 — Objet et acceptation",
          ar: "المادة 2 — الموضوع والقبول",
        },
        {
          id: "cgv-art2-p1",
          label: "Paragraphe (cgv.art2.p1)",
          type: "textarea",
          rows: 3,
          fr: "Les CGV ont pour objet de définir les modalités de vente entre BINGO et le Client. Toute commande implique l'acceptation pleine et entière des présentes conditions, opposables au Client à compter de la confirmation de commande.",
          ar: "تهدف هذه الشروط إلى تحديد كيفيات البيع بين بينغو والعميل. كل طلبية تعني القبول الكامل والتامّ لهذه الشروط، السارية على العميل اعتباراً من تأكيد الطلبية.",
        },
      ],
    },
    {
      title: "Article 3 — Produits",
      fields: [
        {
          id: "cgv-art3-title",
          label: "Titre (cgv.art3.title)",
          type: "input",
          fr: "Article 3 — Produits",
          ar: "المادة 3 — المنتجات",
        },
        {
          id: "cgv-art3-p1",
          label: "Paragraphe 1 (cgv.art3.p1)",
          type: "textarea",
          rows: 3,
          fr: "Les produits offerts à la vente sont décrits avec leurs caractéristiques essentielles sur les fiches produit du site. Les photographies sont fournies à titre indicatif et n'engagent pas le Vendeur.",
          ar: "المنتجات المعروضة للبيع موصوفة بخصائصها الأساسية في بطاقات المنتج على الموقع. الصور مقدّمة بشكل توضيحي ولا تُلزم البائع.",
        },
        {
          id: "cgv-art3-p2",
          label: "Paragraphe 2 (cgv.art3.p2)",
          type: "textarea",
          rows: 3,
          fr: "Les produits sont vendus dans la limite des stocks disponibles. En cas d'indisponibilité postérieure à la commande, le Client est informé et bénéficie d'un remboursement intégral.",
          ar: "تُباع المنتجات في حدود المخزون المتوفر. في حال نفاد المخزون بعد الطلبية، يُبلّغ العميل ويستفيد من استرداد كامل.",
        },
      ],
    },
    {
      title: "Article 4 — Prix",
      fields: [
        {
          id: "cgv-art4-title",
          label: "Titre (cgv.art4.title)",
          type: "input",
          fr: "Article 4 — Prix",
          ar: "المادة 4 — الأسعار",
        },
        {
          id: "cgv-art4-p1",
          label: "Paragraphe (cgv.art4.p1)",
          type: "textarea",
          rows: 3,
          fr: "Les prix sont indiqués en dinars algériens (DZD), toutes taxes comprises, hors frais de livraison. Les frais de livraison sont calculés à l'étape de validation de la commande, selon la wilaya de destination.",
          ar: "الأسعار مذكورة بالدينار الجزائري (DZD)، شاملةً جميع الرسوم، باستثناء رسوم التوصيل. تُحسب رسوم التوصيل في مرحلة تأكيد الطلبية، حسب الولاية المستلِمة.",
        },
      ],
    },
    {
      title: "Article 5 — Commande",
      fields: [
        {
          id: "cgv-art5-title",
          label: "Titre (cgv.art5.title)",
          type: "input",
          fr: "Article 5 — Commande",
          ar: "المادة 5 — الطلبية",
        },
        {
          id: "cgv-art5-p1",
          label: "Paragraphe (cgv.art5.p1)",
          type: "textarea",
          rows: 4,
          fr: "Toute commande passée sur le site fait l'objet d'une confirmation par téléphone sous 24h ouvrées. Sans réponse du Client après trois tentatives d'appel, la commande est automatiquement annulée. Le Client peut suivre l'état de sa commande depuis son espace client.",
          ar: "تخضع كل طلبية مُقدَّمة على الموقع لتأكيد عبر الهاتف خلال 24 ساعة عمل. في حال عدم ردّ العميل بعد ثلاث محاولات اتصال، تُلغى الطلبية تلقائياً. يمكن للعميل متابعة حالة طلبيته من فضاء الزبون.",
        },
      ],
    },
    {
      title: "Article 6 — Paiement",
      fields: [
        {
          id: "cgv-art6-title",
          label: "Titre (cgv.art6.title)",
          type: "input",
          fr: "Article 6 — Paiement",
          ar: "المادة 6 — الدفع",
        },
        {
          id: "cgv-art6-p1",
          label: "Paragraphe (cgv.art6.p1)",
          type: "textarea",
          rows: 4,
          fr: "Le paiement est effectué exclusivement à la livraison, en numéraire (cash) auprès du transporteur ZR Express. Le montant total est dû au livreur — aucun frais supplémentaire n'est appliqué pour ce mode de règlement.",
          ar: "يتمّ الدفع حصرياً عند الاستلام، نقداً لدى الناقل ZR Express. يُدفَع المبلغ كاملاً للموزّع — لا تُطبَّق أي رسوم إضافية على طريقة الدفع هذه.",
        },
      ],
    },
    {
      title: "Article 7 — Livraison",
      fields: [
        {
          id: "cgv-art7-title",
          label: "Titre (cgv.art7.title)",
          type: "input",
          fr: "Article 7 — Livraison",
          ar: "المادة 7 — التوصيل",
        },
        {
          id: "cgv-art7-p1",
          label: "Paragraphe (cgv.art7.p1)",
          type: "textarea",
          rows: 4,
          fr: "Les commandes sont expédiées sous 24 à 48h après confirmation, via notre partenaire logistique ZR Express. Les délais de livraison varient de 2 à 5 jours selon la wilaya. Les délais sont indicatifs et ne peuvent engager la responsabilité du Vendeur en cas de retard.",
          ar: "تُشحَن الطلبيات في غضون 24 إلى 48 ساعة بعد التأكيد، عبر شريكنا اللوجستي ZR Express. تتراوح مهل التوصيل من 2 إلى 5 أيام حسب الولاية. المهل تقديرية ولا يمكن أن تترتّب عنها مسؤولية البائع في حال التأخّر.",
        },
      ],
    },
    {
      title: "Article 8 — Droit de rétractation",
      fields: [
        {
          id: "cgv-art8-title",
          label: "Titre (cgv.art8.title)",
          type: "input",
          fr: "Article 8 — Droit de rétractation et retours",
          ar: "المادة 8 — حقّ التراجع والإرجاع",
        },
        {
          id: "cgv-art8-p1-before",
          label: "Texte avant lien (cgv.art8.p1.before)",
          type: "textarea",
          rows: 3,
          fr: "Le Client dispose d'un délai de 14 jours après réception pour retourner les produits, dans leur emballage d'origine et non utilisés. La procédure de retour est détaillée dans la rubrique",
          ar: "يستفيد العميل من مهلة 14 يوماً بعد الاستلام لإرجاع المنتجات، في تغليفها الأصلي وغير مستعملة. إجراء الإرجاع مفصّل في قسم",
        },
        {
          id: "cgv-art8-p1-em",
          label: "Lien italique (cgv.art8.p1.em)",
          type: "input",
          fr: "Retours",
          ar: "الإرجاع",
        },
        {
          id: "cgv-art8-p1-after",
          label: "Texte après lien (cgv.art8.p1.after)",
          type: "input",
          fr: "du site.",
          ar: "في الموقع.",
        },
      ],
    },
    {
      title: "Article 9 — Garantie",
      fields: [
        {
          id: "cgv-art9-title",
          label: "Titre (cgv.art9.title)",
          type: "input",
          fr: "Article 9 — Garantie",
          ar: "المادة 9 — الضمان",
        },
        {
          id: "cgv-art9-p1",
          label: "Paragraphe (cgv.art9.p1)",
          type: "textarea",
          rows: 3,
          fr: "Tous les produits BINGO bénéficient de la garantie légale de conformité ainsi que de la garantie fabricant lorsqu'elle est offerte par le constructeur (généralement 1 à 10 ans selon les marques).",
          ar: "تستفيد جميع منتجات بينغو من الضمان القانوني للمطابقة وكذلك ضمان المصنّع عندما يكون مقدّماً من قبل المُصنِّع (عادةً من سنة إلى 10 سنوات حسب العلامات).",
        },
      ],
    },
    {
      title: "Article 10 — Responsabilité",
      fields: [
        {
          id: "cgv-art10-title",
          label: "Titre (cgv.art10.title)",
          type: "input",
          fr: "Article 10 — Responsabilité",
          ar: "المادة 10 — المسؤولية",
        },
        {
          id: "cgv-art10-p1",
          label: "Paragraphe (cgv.art10.p1)",
          type: "textarea",
          rows: 3,
          fr: "Le Vendeur ne saurait être tenu responsable des dommages résultant d'une utilisation non conforme du produit, ni des cas de force majeure (catastrophe naturelle, grève des transporteurs, panne réseau).",
          ar: "لا يمكن أن تترتّب على البائع مسؤولية الأضرار الناتجة عن استخدام غير مطابق للمنتج، ولا حالات القوّة القاهرة (كارثة طبيعية، إضراب الناقلين، عطل في الشبكة).",
        },
      ],
    },
    {
      title: "Article 11 — Données personnelles",
      fields: [
        {
          id: "cgv-art11-title",
          label: "Titre (cgv.art11.title)",
          type: "input",
          fr: "Article 11 — Données personnelles",
          ar: "المادة 11 — البيانات الشخصية",
        },
        {
          id: "cgv-art11-p1",
          label: "Paragraphe (cgv.art11.p1)",
          type: "textarea",
          rows: 4,
          fr: "Les données collectées sont strictement nécessaires au traitement de la commande et à la livraison. Elles ne sont jamais cédées à des tiers en dehors du transporteur ZR Express. Le Client dispose d'un droit d'accès, de rectification et de suppression de ses données en écrivant à contact@bingo.dz.",
          ar: "البيانات المجمَّعة ضرورية فقط لمعالجة الطلبية والتوصيل. لا تُحَوَّل أبداً إلى أطراف ثالثة باستثناء الناقل ZR Express. يستفيد العميل من حقّ الوصول إلى بياناته وتصحيحها وحذفها بالكتابة إلى contact@bingo.dz.",
        },
      ],
    },
    {
      title: "Article 12 — Litiges",
      fields: [
        {
          id: "cgv-art12-title",
          label: "Titre (cgv.art12.title)",
          type: "input",
          fr: "Article 12 — Litiges et droit applicable",
          ar: "المادة 12 — النزاعات والقانون المُطبَّق",
        },
        {
          id: "cgv-art12-p1",
          label: "Paragraphe (cgv.art12.p1)",
          type: "textarea",
          rows: 4,
          fr: "Les présentes CGV sont soumises au droit algérien. En cas de litige, le Client est invité à contacter le Vendeur pour une résolution amiable préalable. À défaut d'accord, les tribunaux de Sétif seront seuls compétents.",
          ar: "تخضع هذه الشروط للقانون الجزائري. في حال نزاع، يُدعى العميل إلى الاتصال بالبائع لإيجاد حلّ ودّي مسبقاً. في غياب اتفاق، تكون محاكم سطيف وحدها مختصّة.",
        },
      ],
    },
    {
      title: "Pied de page",
      fields: [
        {
          id: "cgv-updated-label",
          label: "Libellé (cgv.updated.label)",
          type: "input",
          fr: "Mise à jour",
          ar: "آخر تحديث",
        },
        {
          id: "cgv-updated-date",
          label: "Date (cgv.updated.date)",
          type: "input",
          fr: "Dernière révision : 1er mars 2026",
          ar: "آخر مراجعة : 1 مارس 2026",
        },
      ],
    },
  ],
};

export default function AdminCgvPage() {
  return <PageContentEditor def={CGV} />;
}
