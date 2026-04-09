import { HeroFilters, RecommendationsSection } from "@/components/site";

export default function Home() {
  return (
    <main className="flex-1">
      <HeroFilters />
      <RecommendationsSection />
    </main>
  );
}
