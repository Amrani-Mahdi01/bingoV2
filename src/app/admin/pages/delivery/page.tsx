"use client";

import * as React from "react";

import {
  PageContentEditor,
  type PageEditorDef,
} from "@/components/admin/PageContentEditor";

const DELIVERY: PageEditorDef = {
  eyebrow: "Pages du site",
  title: "Livraison — /delivery",
  subtitle:
    "Contenu bilingue affiché sur la page Livraison du site. Modifiez le français à gauche et l'arabe à droite.",
  sections: [
    {
      title: "En-tête",
      fields: [
        {
          id: "info-delivery-eyebrow",
          label: "Eyebrow (info.delivery.eyebrow)",
          type: "input",
          fr: "Livraison",
          ar: "التوصيل",
        },
        {
          id: "info-delivery-title",
          label: "Titre (info.delivery.title)",
          type: "input",
          fr: "Livraison ZR Express",
          ar: "التوصيل عبر ZR Express",
        },
      ],
    },
    {
      title: "Bannière partenaire",
      fields: [
        {
          id: "delivery-banner-title",
          label: "Titre de la bannière (delivery.banner.title)",
          type: "input",
          fr: "Partenaire logistique exclusif : ZR Express",
          ar: "شريك لوجستي حصري : ZR Express",
        },
        {
          id: "delivery-banner-lead",
          label: "Description de la bannière (delivery.banner.lead)",
          type: "textarea",
          rows: 3,
          fr: "ZR Express dispose du plus large maillage de relais et livreurs d'Algérie. Taux de livraison réussie : 96 %.",
          ar: "تتوفّر ZR Express على أوسع شبكة نقاط استلام وموزّعين في الجزائر. نسبة التوصيل الناجح : 96%.",
        },
      ],
    },
    {
      title: "Zones desservies",
      fields: [
        {
          id: "delivery-zones-title",
          label: "Titre (delivery.zones.title)",
          type: "input",
          fr: "Zones desservies",
          ar: "المناطق المغطّاة",
        },
        {
          id: "delivery-zones-p1",
          label: "Paragraphe (delivery.zones.p1)",
          type: "textarea",
          rows: 4,
          fr: "Toutes les wilayas, sans exception. Les délais et frais varient selon la région. Les villages les plus reculés peuvent demander un retrait au relais ZR Express le plus proche.",
          ar: "كل الولايات، دون استثناء. تختلف المهل والرسوم حسب الجهة. قد تتطلّب القرى النائية الاستلام من أقرب نقطة ZR Express.",
        },
      ],
    },
    {
      title: "Délais par région — en-tête de tableau",
      fields: [
        {
          id: "delivery-table-title",
          label: "Titre du tableau (delivery.table.title)",
          type: "input",
          fr: "Délais par région",
          ar: "المهل حسب الجهة",
        },
        {
          id: "delivery-table-region",
          label: "Colonne — Région",
          type: "input",
          fr: "Région",
          ar: "الجهة",
        },
        {
          id: "delivery-table-wilayas",
          label: "Colonne — Wilayas",
          type: "input",
          fr: "Wilayas",
          ar: "الولايات",
        },
        {
          id: "delivery-table-delay",
          label: "Colonne — Délai",
          type: "input",
          fr: "Délai estimé",
          ar: "المهلة التقديرية",
        },
        {
          id: "delivery-table-fee",
          label: "Colonne — Frais",
          type: "input",
          fr: "Frais de livraison",
          ar: "رسوم التوصيل",
        },
        {
          id: "delivery-table-days",
          label: "Suffixe — jours",
          type: "input",
          fr: "jours",
          ar: "أيام",
        },
      ],
    },
    {
      title: "Suivi de commande",
      fields: [
        {
          id: "delivery-tracking-title",
          label: "Titre (delivery.tracking.title)",
          type: "input",
          fr: "Suivi de commande",
          ar: "متابعة الطلبية",
        },
        {
          id: "delivery-tracking-p1",
          label: "Paragraphe (delivery.tracking.p1)",
          type: "textarea",
          rows: 4,
          fr: "Dès l'expédition, vous recevez par SMS un numéro de suivi ZR Express. Vous pouvez également consulter le statut depuis votre espace client (Mes commandes).",
          ar: "بمجرّد الشحن، ستتلقّى عبر SMS رقم متابعة من ZR Express. يمكنك أيضاً مراجعة الحالة من فضاء الزبون (طلباتي).",
        },
      ],
    },
    {
      title: "Réception",
      fields: [
        {
          id: "delivery-reception-title",
          label: "Titre (delivery.reception.title)",
          type: "input",
          fr: "Réception de la commande",
          ar: "استلام الطلبية",
        },
        {
          id: "delivery-reception-p1",
          label: "Paragraphe 1 (delivery.reception.p1)",
          type: "textarea",
          rows: 4,
          fr: "Le livreur vous contacte avant le passage. Préparez le montant exact en cash. Vous pouvez ouvrir le colis devant le livreur pour vérifier le contenu — en cas de problème, refusez le colis sans frais.",
          ar: "يتّصل بك الموزّع قبل المرور. حضّر المبلغ بالضبط نقداً. يمكنك فتح الطرد أمام الموزّع للتحقّق من المحتوى — في حال وجود مشكلة، ارفض الطرد دون أي رسوم.",
        },
        {
          id: "delivery-reception-p2",
          label: "Paragraphe 2 (delivery.reception.p2)",
          type: "textarea",
          rows: 3,
          fr: "Si vous êtes absent, le livreur tente une nouvelle fois ou laisse le colis au relais ZR Express le plus proche, à retirer sous 7 jours.",
          ar: "إذا كنت غائباً، يحاول الموزّع مرّة أخرى أو يترك الطرد في أقرب نقطة ZR Express، ليتمّ استلامه في ظرف 7 أيام.",
        },
      ],
    },
  ],
};

export default function AdminDeliveryPage() {
  return <PageContentEditor def={DELIVERY} />;
}
