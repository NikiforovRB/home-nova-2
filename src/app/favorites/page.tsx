import { ListingGrid } from "@/components/listing-grid";

export default function FavoritesPage() {
  return (
    <main className="container-1600 flex-1 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Избранное</h1>
      <ListingGrid variant="favorites" />
    </main>
  );
}
