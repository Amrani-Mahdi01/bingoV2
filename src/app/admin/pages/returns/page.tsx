"use client";

import * as React from "react";

import {
  PageContentEditor,
  type PageEditorDef,
} from "@/components/admin/PageContentEditor";

const RETURNS: PageEditorDef = {
  eyebrow: "Pages du site",
  title: "Retours — /returns",
  subtitle:
    "Contenu bilingue affiché sur la page Retours du site. Modifiez le français à gauche et l'arabe à droite.",
  sections: [
    {
      title: "En-tête",
      fields: [
        {
          id: "info-returns-eyebrow",
          label: "Eyebrow (info.returns.eyebrow)",
          type: "input",
          fr: "Politique",
          ar: "السياسة",
        },
        {
          id: "info-returns-title",
          label: "Titre (info.returns.title)",
          type: "input",
          fr: "Retours & remboursements",
          ar: "الإرجاع والاسترداد",
        },
      ],
    },
    {
      title: "Délai de retour",
      fields: [
        {
          id: "returns-window-title",
          label: "Titre (returns.window.title)",
          type: "input",
          fr: "Délai de retour",
          ar: "مهلة الإرجاع",
        },
        {
          id: "returns-window-p1",
          label: "Paragraphe (returns.window.p1)",
          type: "textarea",
          rows: 3,
          fr: "Le délai court à compter du jour de réception. Au-delà de 14 jours, seuls les retours pour défaut produit sont acceptés (sous garantie fabricant).",
          ar: "تبدأ المهلة من يوم الاستلام. بعد 14 يوماً، تُقبل فقط طلبات الإرجاع بسبب عيب في المنتج (تحت ضمان المصنّع).",
        },
      ],
    },
    {
      title: "Conditions",
      fields: [
        {
          id: "returns-conditions-title",
          label: "Titre (returns.conditions.title)",
          type: "input",
          fr: "Conditions",
          ar: "الشروط",
        },
        {
          id: "returns-conditions-i1",
          label: "Item 1 (returns.conditions.i1)",
          type: "input",
          fr: "Produit non utilisé, dans son emballage d'origine.",
          ar: "منتج غير مستعمل، في تغليفه الأصلي.",
        },
        {
          id: "returns-conditions-i2",
          label: "Item 2 (returns.conditions.i2)",
          type: "input",
          fr: "Étiquettes et accessoires d'origine présents.",
          ar: "وجود البطاقات والملحقات الأصلية.",
        },
        {
          id: "returns-conditions-i3",
          label: "Item 3 (returns.conditions.i3)",
          type: "input",
          fr: "Preuve d'achat ou numéro de commande BINGO communicable.",
          ar: "وجود إثبات الشراء أو رقم طلبية بينغو.",
        },
      ],
    },
    {
      title: "Procédure",
      fields: [
        {
          id: "returns-procedure-title",
          label: "Titre (returns.procedure.title)",
          type: "input",
          fr: "Procédure",
          ar: "الإجراء",
        },
        {
          id: "returns-procedure-i1",
          label: "Étape 1 (returns.procedure.i1)",
          type: "textarea",
          rows: 2,
          fr: "Contactez-nous par téléphone, WhatsApp ou email avec votre numéro de commande et le motif du retour.",
          ar: "اتصل بنا عبر الهاتف أو واتساب أو البريد الإلكتروني مع رقم طلبيتك وسبب الإرجاع.",
        },
        {
          id: "returns-procedure-i2",
          label: "Étape 2 (returns.procedure.i2)",
          type: "textarea",
          rows: 2,
          fr: "Nous organisons un retour ZR Express depuis votre adresse. Vous recevez par SMS le numéro de prise en charge.",
          ar: "نُنظّم استرجاعاً عبر ZR Express من عنوانك. ستتلقّى رقم الاستلام عبر رسالة قصيرة.",
        },
        {
          id: "returns-procedure-i3",
          label: "Étape 3 (returns.procedure.i3)",
          type: "textarea",
          rows: 2,
          fr: "Préparez le colis avec le produit dans son emballage et les accessoires d'origine. Le livreur récupère le colis chez vous.",
          ar: "جهّز الطرد بالمنتج في تغليفه والملحقات الأصلية. يستلم الموزّع الطرد من عندك.",
        },
        {
          id: "returns-procedure-i4",
          label: "Étape 4 (returns.procedure.i4)",
          type: "textarea",
          rows: 2,
          fr: "Dès réception et contrôle dans nos locaux (sous 48h), nous procédons au remboursement.",
          ar: "فور الاستلام والفحص في مقرّنا (خلال 48 ساعة)، نباشر عملية الاسترداد.",
        },
      ],
    },
    {
      title: "Remboursement",
      fields: [
        {
          id: "returns-refund-title",
          label: "Titre (returns.refund.title)",
          type: "input",
          fr: "Remboursement",
          ar: "الاسترداد",
        },
        {
          id: "returns-refund-p1",
          label: "Paragraphe 1 (returns.refund.p1)",
          type: "textarea",
          rows: 3,
          fr: "Le remboursement est effectué par le moyen de votre choix : transfert BaridiMob, virement bancaire, ou avoir BINGO valable 1 an (avec un bonus de +10% sur le montant remboursé).",
          ar: "يُنفَّذ الاسترداد بالطريقة التي تختارها : تحويل BaridiMob، تحويل بنكي، أو رصيد بينغو صالح لمدة سنة (مع مكافأة +10% على المبلغ المُسترَدّ).",
        },
        {
          id: "returns-refund-p2",
          label: "Paragraphe 2 (returns.refund.p2)",
          type: "textarea",
          rows: 2,
          fr: "Délai de traitement : 5 jours ouvrés après réception du retour.",
          ar: "مهلة المعالجة : 5 أيام عمل بعد استلام المرتجَع.",
        },
      ],
    },
    {
      title: "Frais de retour",
      fields: [
        {
          id: "returns-fees-title",
          label: "Titre (returns.fees.title)",
          type: "input",
          fr: "Frais de retour",
          ar: "رسوم الإرجاع",
        },
        {
          id: "returns-fees-i1-bold",
          label: "Cas 1 — gras (returns.fees.i1.bold)",
          type: "input",
          fr: "Produit défectueux à l'arrivée :",
          ar: "منتج معيب عند الوصول :",
        },
        {
          id: "returns-fees-i1-text",
          label: "Cas 1 — texte (returns.fees.i1.text)",
          type: "input",
          fr: "retour gratuit, BINGO prend en charge.",
          ar: "الإرجاع مجاناً، بينغو يتكفّل بالرسوم.",
        },
        {
          id: "returns-fees-i2-bold",
          label: "Cas 2 — gras (returns.fees.i2.bold)",
          type: "input",
          fr: "Erreur de notre part (mauvais produit / taille) :",
          ar: "خطأ من طرفنا (منتج خاطئ / قياس خاطئ) :",
        },
        {
          id: "returns-fees-i2-text",
          label: "Cas 2 — texte (returns.fees.i2.text)",
          type: "input",
          fr: "retour gratuit.",
          ar: "الإرجاع مجاناً.",
        },
        {
          id: "returns-fees-i3-bold",
          label: "Cas 3 — gras (returns.fees.i3.bold)",
          type: "input",
          fr: "Changement d'avis :",
          ar: "تغيير في الرأي :",
        },
        {
          id: "returns-fees-i3-text",
          label: "Cas 3 — texte (returns.fees.i3.text)",
          type: "textarea",
          rows: 2,
          fr: "frais de retour ZR Express à votre charge (mêmes tarifs que la livraison initiale).",
          ar: "رسوم استرجاع ZR Express على عاتقك (نفس تعريفة التوصيل الأولي).",
        },
      ],
    },
    {
      title: "Exceptions",
      fields: [
        {
          id: "returns-exceptions-title",
          label: "Titre (returns.exceptions.title)",
          type: "input",
          fr: "Exceptions",
          ar: "الاستثناءات",
        },
        {
          id: "returns-exceptions-lead",
          label: "Intro (returns.exceptions.lead)",
          type: "textarea",
          rows: 2,
          fr: "Pour des raisons d'hygiène ou de sécurité, certains produits ne peuvent pas être retournés une fois ouverts :",
          ar: "لأسباب نظافة أو سلامة، بعض المنتجات لا يمكن إرجاعها بعد فتحها :",
        },
        {
          id: "returns-exceptions-i1",
          label: "Item 1 (returns.exceptions.i1)",
          type: "input",
          fr: "Sous-vêtements et chaussettes techniques.",
          ar: "الملابس الداخلية والجوارب التقنية.",
        },
        {
          id: "returns-exceptions-i2",
          label: "Item 2 (returns.exceptions.i2)",
          type: "input",
          fr: "Gourdes et popotes utilisées.",
          ar: "القارورات وأواني الطهي المستخدَمة.",
        },
        {
          id: "returns-exceptions-i3",
          label: "Item 3 (returns.exceptions.i3)",
          type: "input",
          fr: "Produits alimentaires (rations, lyophilisés).",
          ar: "المنتجات الغذائية (الحصص الميدانية، المجفّفة بالتجميد).",
        },
        {
          id: "returns-exceptions-i4",
          label: "Item 4 (returns.exceptions.i4)",
          type: "textarea",
          rows: 2,
          fr: "Produits soldés à plus de -50% : remboursement uniquement sous forme d'avoir.",
          ar: "المنتجات المخفّضة بأكثر من -50% : الاسترداد يكون فقط على شكل رصيد.",
        },
      ],
    },
    {
      title: "Bannière de bas de page",
      fields: [
        {
          id: "returns-banner-quote",
          label: "Citation (returns.banner.quote)",
          type: "input",
          fr: "Un problème avec votre commande ? On s'en occupe.",
          ar: "هل لديك مشكلة في طلبك ؟ نحن نتكفّل بها.",
        },
        {
          id: "returns-banner-cta",
          label: "Libellé du bouton (returns.banner.cta)",
          type: "input",
          fr: "Demander un retour",
          ar: "طلب إرجاع",
        },
      ],
    },
  ],
};

export default function AdminReturnsPage() {
  return <PageContentEditor def={RETURNS} />;
}
