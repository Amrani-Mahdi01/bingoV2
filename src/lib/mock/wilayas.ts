import type { Wilaya } from "@/lib/types";

/** Stop-desk (point-relais) price derived from home delivery: 300 DZD
 *  cheaper, floored at 200 DZD. Matches the Yalidine / Maystro pattern
 *  and the backend seeder's default. */
const stopDeskFromHome = (home: number): number => Math.max(200, home - 300);

/**
 * All 58 wilayas of Algeria, codes 01-58, French + Arabic names.
 *
 * Shipping prices and delivery delays mirror typical ZR Express ranges:
 *  - Algiers (16) is the cheapest hub (400 DZD / 2 days)
 *  - Saharan wilayas (Tindouf, Tamanrasset, Illizi, etc.) are most expensive
 *    (900-1200 DZD / 4-5 days)
 *  - Northern/coastal regions sit between 500-700 DZD / 2-3 days.
 *
 * `stopDeskPrice` is derived from `shippingPrice` via stopDeskFromHome
 * below (3-line .map after the array) so we don't have to maintain two
 * columns per row.
 */
const rawWilayas: Omit<Wilaya, "stopDeskPrice">[] = [
  { id: "01", code: "01", name: "Adrar", nameAr: "أدرار", region: "Sud", shippingPrice: 1100, deliveryDays: 5 },
  { id: "02", code: "02", name: "Chlef", nameAr: "الشلف", region: "Centre", shippingPrice: 600, deliveryDays: 3 },
  { id: "03", code: "03", name: "Laghouat", nameAr: "الأغواط", region: "Sud", shippingPrice: 800, deliveryDays: 4 },
  { id: "04", code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي", region: "Est", shippingPrice: 700, deliveryDays: 3 },
  { id: "05", code: "05", name: "Batna", nameAr: "باتنة", region: "Est", shippingPrice: 700, deliveryDays: 3 },
  { id: "06", code: "06", name: "Béjaïa", nameAr: "بجاية", region: "Est", shippingPrice: 600, deliveryDays: 2 },
  { id: "07", code: "07", name: "Biskra", nameAr: "بسكرة", region: "Sud", shippingPrice: 800, deliveryDays: 4 },
  { id: "08", code: "08", name: "Béchar", nameAr: "بشار", region: "Sud", shippingPrice: 1000, deliveryDays: 5 },
  { id: "09", code: "09", name: "Blida", nameAr: "البليدة", region: "Centre", shippingPrice: 450, deliveryDays: 2 },
  { id: "10", code: "10", name: "Bouira", nameAr: "البويرة", region: "Centre", shippingPrice: 500, deliveryDays: 2 },
  { id: "11", code: "11", name: "Tamanrasset", nameAr: "تمنراست", region: "Sud", shippingPrice: 1200, deliveryDays: 5 },
  { id: "12", code: "12", name: "Tébessa", nameAr: "تبسة", region: "Est", shippingPrice: 750, deliveryDays: 3 },
  { id: "13", code: "13", name: "Tlemcen", nameAr: "تلمسان", region: "Ouest", shippingPrice: 700, deliveryDays: 3 },
  { id: "14", code: "14", name: "Tiaret", nameAr: "تيارت", region: "Ouest", shippingPrice: 650, deliveryDays: 3 },
  { id: "15", code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو", region: "Centre", shippingPrice: 500, deliveryDays: 2 },
  { id: "16", code: "16", name: "Alger", nameAr: "الجزائر", region: "Centre", shippingPrice: 400, deliveryDays: 2 },
  { id: "17", code: "17", name: "Djelfa", nameAr: "الجلفة", region: "Sud", shippingPrice: 750, deliveryDays: 4 },
  { id: "18", code: "18", name: "Jijel", nameAr: "جيجل", region: "Est", shippingPrice: 650, deliveryDays: 3 },
  { id: "19", code: "19", name: "Sétif", nameAr: "سطيف", region: "Est", shippingPrice: 600, deliveryDays: 2 },
  { id: "20", code: "20", name: "Saïda", nameAr: "سعيدة", region: "Ouest", shippingPrice: 700, deliveryDays: 3 },
  { id: "21", code: "21", name: "Skikda", nameAr: "سكيكدة", region: "Est", shippingPrice: 650, deliveryDays: 3 },
  { id: "22", code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", region: "Ouest", shippingPrice: 700, deliveryDays: 3 },
  { id: "23", code: "23", name: "Annaba", nameAr: "عنابة", region: "Est", shippingPrice: 650, deliveryDays: 3 },
  { id: "24", code: "24", name: "Guelma", nameAr: "قالمة", region: "Est", shippingPrice: 700, deliveryDays: 3 },
  { id: "25", code: "25", name: "Constantine", nameAr: "قسنطينة", region: "Est", shippingPrice: 600, deliveryDays: 2 },
  { id: "26", code: "26", name: "Médéa", nameAr: "المدية", region: "Centre", shippingPrice: 500, deliveryDays: 2 },
  { id: "27", code: "27", name: "Mostaganem", nameAr: "مستغانم", region: "Ouest", shippingPrice: 650, deliveryDays: 3 },
  { id: "28", code: "28", name: "M'Sila", nameAr: "المسيلة", region: "Centre", shippingPrice: 650, deliveryDays: 3 },
  { id: "29", code: "29", name: "Mascara", nameAr: "معسكر", region: "Ouest", shippingPrice: 650, deliveryDays: 3 },
  { id: "30", code: "30", name: "Ouargla", nameAr: "ورقلة", region: "Sud", shippingPrice: 900, deliveryDays: 4 },
  { id: "31", code: "31", name: "Oran", nameAr: "وهران", region: "Ouest", shippingPrice: 550, deliveryDays: 2 },
  { id: "32", code: "32", name: "El Bayadh", nameAr: "البيض", region: "Sud", shippingPrice: 900, deliveryDays: 4 },
  { id: "33", code: "33", name: "Illizi", nameAr: "إليزي", region: "Sud", shippingPrice: 1200, deliveryDays: 5 },
  { id: "34", code: "34", name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", region: "Est", shippingPrice: 600, deliveryDays: 2 },
  { id: "35", code: "35", name: "Boumerdès", nameAr: "بومرداس", region: "Centre", shippingPrice: 450, deliveryDays: 2 },
  { id: "36", code: "36", name: "El Tarf", nameAr: "الطارف", region: "Est", shippingPrice: 750, deliveryDays: 3 },
  { id: "37", code: "37", name: "Tindouf", nameAr: "تندوف", region: "Sud", shippingPrice: 1200, deliveryDays: 5 },
  { id: "38", code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت", region: "Ouest", shippingPrice: 700, deliveryDays: 3 },
  { id: "39", code: "39", name: "El Oued", nameAr: "الوادي", region: "Sud", shippingPrice: 900, deliveryDays: 4 },
  { id: "40", code: "40", name: "Khenchela", nameAr: "خنشلة", region: "Est", shippingPrice: 750, deliveryDays: 3 },
  { id: "41", code: "41", name: "Souk Ahras", nameAr: "سوق أهراس", region: "Est", shippingPrice: 750, deliveryDays: 3 },
  { id: "42", code: "42", name: "Tipaza", nameAr: "تيبازة", region: "Centre", shippingPrice: 500, deliveryDays: 2 },
  { id: "43", code: "43", name: "Mila", nameAr: "ميلة", region: "Est", shippingPrice: 650, deliveryDays: 3 },
  { id: "44", code: "44", name: "Aïn Defla", nameAr: "عين الدفلى", region: "Centre", shippingPrice: 600, deliveryDays: 3 },
  { id: "45", code: "45", name: "Naâma", nameAr: "النعامة", region: "Sud", shippingPrice: 950, deliveryDays: 4 },
  { id: "46", code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت", region: "Ouest", shippingPrice: 700, deliveryDays: 3 },
  { id: "47", code: "47", name: "Ghardaïa", nameAr: "غرداية", region: "Sud", shippingPrice: 850, deliveryDays: 4 },
  { id: "48", code: "48", name: "Relizane", nameAr: "غليزان", region: "Ouest", shippingPrice: 650, deliveryDays: 3 },
  { id: "49", code: "49", name: "Timimoun", nameAr: "تيميمون", region: "Sud", shippingPrice: 1150, deliveryDays: 5 },
  { id: "50", code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", region: "Sud", shippingPrice: 1200, deliveryDays: 5 },
  { id: "51", code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال", region: "Sud", shippingPrice: 850, deliveryDays: 4 },
  { id: "52", code: "52", name: "Béni Abbès", nameAr: "بني عباس", region: "Sud", shippingPrice: 1100, deliveryDays: 5 },
  { id: "53", code: "53", name: "In Salah", nameAr: "عين صالح", region: "Sud", shippingPrice: 1200, deliveryDays: 5 },
  { id: "54", code: "54", name: "In Guezzam", nameAr: "عين قزام", region: "Sud", shippingPrice: 1200, deliveryDays: 5 },
  { id: "55", code: "55", name: "Touggourt", nameAr: "تقرت", region: "Sud", shippingPrice: 900, deliveryDays: 4 },
  { id: "56", code: "56", name: "Djanet", nameAr: "جانت", region: "Sud", shippingPrice: 1200, deliveryDays: 5 },
  { id: "57", code: "57", name: "El M'Ghair", nameAr: "المغير", region: "Sud", shippingPrice: 900, deliveryDays: 4 },
  { id: "58", code: "58", name: "El Meniaa", nameAr: "المنيعة", region: "Sud", shippingPrice: 950, deliveryDays: 4 },
];

export const wilayas: Wilaya[] = rawWilayas.map((w) => ({
  ...w,
  stopDeskPrice: stopDeskFromHome(w.shippingPrice),
}));

export function getWilayaById(id: string): Wilaya | undefined {
  return wilayas.find((w) => w.id === id);
}
