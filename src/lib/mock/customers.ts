import type { Address, Customer } from "@/lib/types";
import { wilayas } from "@/lib/mock/wilayas";

/* Deterministic PRNG (mulberry32) — different seed from products so
   customer/product distributions are independent. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260318);
const rnd = () => rng();
const rndInt = (min: number, max: number) =>
  Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;

const FIRST_NAMES_M = [
  "Yacine", "Karim", "Mohamed", "Sofiane", "Amine", "Rachid", "Mehdi",
  "Hicham", "Walid", "Adel", "Bilal", "Réda", "Nabil", "Tarek", "Samir",
  "Massinissa", "Lyes", "Idir",
];
const FIRST_NAMES_F = [
  "Amina", "Sofia", "Lina", "Yasmine", "Nadia", "Sabrina", "Imene", "Sarah",
  "Wassila", "Hayet", "Lila", "Meriem", "Fatima", "Karima", "Tinhinane",
  "Dihya",
];
const LAST_NAMES = [
  "Benali", "Hammadi", "Boukhalfa", "Mansouri", "Khelifi", "Belkacem",
  "Saadi", "Belaid", "Aïssa", "Bouzid", "Mokrane", "Larbi", "Rahmani",
  "Touati", "Hamza", "Hadjadj", "Brahimi", "Cherif", "Ouali", "Said",
  "Iguer", "Ait Ouali", "Belarbi", "Mezerai",
];

const COMMUNES_BY_WILAYA: Record<string, string[]> = {
  "16": ["Bab El Oued", "Hydra", "El Biar", "Kouba", "Bir Mourad Raïs", "Dar El Beïda"],
  "19": ["Sétif Centre", "Aïn Arnat", "El Eulma", "Aïn Oulmène"],
  "31": ["Oran Centre", "Bir El Djir", "Es Sénia", "Aïn Turck"],
  "25": ["Constantine Centre", "El Khroub", "Hamma Bouziane", "Ali Mendjeli"],
  "06": ["Béjaïa Centre", "Akbou", "Tichy", "Aokas"],
  "15": ["Tizi Ouzou Centre", "Azazga", "Draâ Ben Khedda"],
  "23": ["Annaba Centre", "El Bouni", "Sidi Amar"],
  "09": ["Blida Centre", "Boufarik", "Ouled Yaïch"],
};

function communeFor(wilayaId: string): string {
  return COMMUNES_BY_WILAYA[wilayaId]?.[Math.floor(rnd() * (COMMUNES_BY_WILAYA[wilayaId]?.length ?? 1))] ??
    `Centre ${wilayas.find((w) => w.id === wilayaId)?.name ?? ""}`.trim();
}

function buildPhone(): string {
  const prefixes = ["5", "6", "7"];
  const p = pick(prefixes);
  let s = `+213 ${p}`;
  for (let i = 0; i < 8; i++) {
    if (i === 1 || i === 4) s += " ";
    s += rndInt(0, 9).toString();
  }
  return s.replace(/ +/g, " ").replace("+213 5", "+213 5").replace(/^(\+213 \d) /, "$1");
}

function buildAddress(
  firstName: string,
  lastName: string,
  phone: string,
  wilayaId: string,
  isDefault: boolean,
  label = "Domicile"
): Address {
  const commune = communeFor(wilayaId);
  const streetNumbers = ["12 Rue des Frères Belkacem", "45 Avenue de l'Indépendance", "8 Cité 1000 logements", "23 Rue Larbi Ben M'hidi", "Lot. Hassan Bey n°56", "Hai Mouhamadia, bât. B12"];
  return {
    id: `addr-${rndInt(1000, 9999)}`,
    label,
    firstName,
    lastName,
    phone,
    wilayaId,
    commune,
    street: pick(streetNumbers),
    isDefault,
  };
}

function buildCustomers(): Customer[] {
  const list: Customer[] = [];
  const baseDate = new Date("2026-05-15T08:00:00Z").getTime();

  // 40 customers — roughly 60/40 male/female names, distributed across wilayas
  // with a bias toward the major hubs (Algiers, Sétif, Oran, Constantine).
  const weights: Array<[string, number]> = [
    ["16", 6], ["19", 4], ["31", 4], ["25", 3], ["06", 3], ["09", 2],
    ["15", 2], ["23", 2], ["35", 2], ["02", 1], ["07", 1], ["13", 1],
    ["17", 1], ["26", 1], ["28", 1], ["42", 1], ["43", 1], ["44", 1],
    ["10", 1], ["34", 1], ["27", 1],
  ];
  const wilayaPool: string[] = [];
  weights.forEach(([id, w]) => {
    for (let i = 0; i < w; i++) wilayaPool.push(id);
  });

  for (let i = 0; i < 40; i++) {
    const isFemale = rnd() < 0.4;
    const firstName = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
    const lastName = pick(LAST_NAMES);
    const phone = buildPhone();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, "")}@example.dz`;
    const wilayaId = wilayaPool[i % wilayaPool.length]!;
    const addresses = [buildAddress(firstName, lastName, phone, wilayaId, true)];
    if (rnd() < 0.35) {
      addresses.push(
        buildAddress(firstName, lastName, phone, wilayaId, false, "Bureau")
      );
    }

    // Lifetime stats — long-tail distribution
    const orderCount = rnd() < 0.15 ? 0 : rndInt(1, 18);
    const avgBasket = rndInt(4500, 38000);
    const totalSpent = orderCount * avgBasket;
    const lastOrderOffset = orderCount === 0 ? null : rndInt(1, 180);
    const createdOffset = rndInt(30, 540);

    list.push({
      id: `cust-${(i + 1).toString().padStart(3, "0")}`,
      firstName,
      lastName,
      email,
      phone,
      wilayaId,
      addresses,
      totalSpent,
      orderCount,
      lastOrderDate:
        lastOrderOffset !== null
          ? new Date(baseDate - lastOrderOffset * 86_400_000).toISOString()
          : undefined,
      createdAt: new Date(baseDate - createdOffset * 86_400_000).toISOString(),
    });
  }
  return list;
}

export const customers: Customer[] = buildCustomers();

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}
