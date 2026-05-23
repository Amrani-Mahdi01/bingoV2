import { BestSellers } from "@/components/sections/best-sellers";
import { Categories } from "@/components/sections/categories";
import { CollectionCTA } from "@/components/sections/collection-cta";
import { Hero } from "@/components/sections/hero";
import { Newest } from "@/components/sections/newest";
import { Promotions } from "@/components/sections/promotions";
import { TrustBand } from "@/components/sections/trust-band";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Categories />
      <BestSellers />
      <Newest />
      <Promotions />
      <TrustBand />
      <CollectionCTA />
    </main>
  );
}
