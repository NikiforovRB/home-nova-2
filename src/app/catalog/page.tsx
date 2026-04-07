import { ListingGrid } from "@/components/listing-grid";
import { FilterSidebar, SiteFooter, SiteHeader } from "@/components/site";

export default function CatalogPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-1600 flex flex-1 flex-col gap-6 py-8 md:flex-row">
        <FilterSidebar />
        <section className="flex-1">
          <ListingGrid variant="catalog" />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
