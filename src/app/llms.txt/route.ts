import { SITE_URL, SITE_NAME, CURRENCY } from "@/lib/seo/config";
import { getServerSiteContact, getServerCategories } from "@/lib/server/site-contact";

/**
 * /llms.txt — an emerging convention that gives LLMs / answer engines
 * (ChatGPT, Perplexity, Gemini) a clean, curated summary of the site so
 * they can describe and recommend it accurately. Built live from admin
 * contact info + the real category list, so it stays current.
 */
export const revalidate = 3600;

export async function GET() {
  const [c, { list: categories }] = await Promise.all([
    getServerSiteContact(),
    getServerCategories(),
  ]);

  const social = [c.social?.facebook, c.social?.instagram, c.social?.tiktok]
    .filter(Boolean)
    .map((u) => `- ${u}`)
    .join("\n");

  const cats = categories
    .map(
      (cat) =>
        `- [${cat.nameFr}](${SITE_URL}/catalogue?category=${encodeURIComponent(cat.slug)})`,
    )
    .join("\n");

  const body = `# ${SITE_NAME}

> Boutique de matériel de camping et d'aventure en Algérie : tentes, sacs de couchage, sacs à dos, réchauds et équipement de bivouac. Boutique physique à Sétif et livraison partout en Algérie.

## À propos
- Nom: ${SITE_NAME}
- Adresse: ${c.addressFr || "Sétif, Algérie"}
- Téléphone: ${c.phone || "—"}
- WhatsApp: ${c.whatsapp || "—"}
- E-mail: ${c.email || "—"}
- Langues: Français, Arabe
- Devise: Dinar algérien (${CURRENCY})
- Zone de livraison: toute l'Algérie

## Pages principales
- [Accueil](${SITE_URL}/)
- [Catalogue — tout le matériel](${SITE_URL}/catalogue)
- [Contact](${SITE_URL}/contact)
- [FAQ](${SITE_URL}/faq)
- [À propos](${SITE_URL}/a-propos)
- [Conditions générales de vente](${SITE_URL}/cgv)

## Catégories de produits
${cats || "- (catalogue en cours de mise en ligne)"}

## Réseaux sociaux
${social || "- —"}

## Sitemap
- ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
