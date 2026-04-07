import { ListingGrid } from "@/components/listing-grid";
import { SiteFooter, SiteHeader } from "@/components/site";

export default function FavoritesPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-1600 flex-1 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Избранное</h1>
        <ListingGrid variant="favorites" />
      </main>
      <SiteFooter />
    </>
  );
}
