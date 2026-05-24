import type { Brand } from "@/lib/types";

const SEED: Array<Omit<Brand, "id">> = [
  { slug: "coleman", name: "Coleman" },
  { slug: "quechua", name: "Quechua" },
  { slug: "msr", name: "MSR" },
  { slug: "petzl", name: "Petzl" },
  { slug: "black-diamond", name: "Black Diamond" },
  { slug: "salomon", name: "Salomon" },
  { slug: "columbia", name: "Columbia" },
  { slug: "the-north-face", name: "The North Face" },
  { slug: "nordic-gear", name: "Nordic Gear" },
  { slug: "atlas-outdoor", name: "Atlas Outdoor" },
  { slug: "sahara-equipment", name: "Sahara Equipment" },
  { slug: "kabylie-outdoor", name: "Kabylie Outdoor" },
  { slug: "decathlon-forclaz", name: "Forclaz" },
  { slug: "vaude", name: "Vaude" },
  { slug: "tatonka", name: "Tatonka" },
];

export const brands: Brand[] = SEED.map((b, i) => ({
  id: `brand-${i + 1}`,
  ...b,
}));

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}

export function getBrandById(id: string): Brand | undefined {
  return brands.find((b) => b.id === id);
}
