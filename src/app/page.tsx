import { BestSellers } from "@/components/sections/best-sellers";
import { Categories } from "@/components/sections/categories";
import { Hero } from "@/components/sections/hero";
import { Newest } from "@/components/sections/newest";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Categories />
      <BestSellers />
      <Newest />
    </main>
  );
}
