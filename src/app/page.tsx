import { HeroFilters, RecommendationsSection, SiteFooter, SiteHeader } from "@/components/site";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HeroFilters />
        <RecommendationsSection />
      </main>
      <SiteFooter />
    </>
  );
}
