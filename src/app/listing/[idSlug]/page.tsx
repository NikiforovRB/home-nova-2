import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetailClient } from "@/components/listing-detail-client";
import { SiteFooter, SiteHeader } from "@/components/site";
import { listingDetailsLine } from "@/lib/listing-labels";
import { parseListingIdSlug } from "@/lib/listing-url";
import { getListingByPublicNumberAndSlug } from "@/lib/listings/get-listing";
import { publicObjectUrl } from "@/lib/media-url";

type Props = { params: Promise<{ idSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idSlug } = await params;
  const parsed = parseListingIdSlug(idSlug);
  if (!parsed) {
    return { title: "Объект | HOMENOVA" };
  }
  let data: Awaited<ReturnType<typeof getListingByPublicNumberAndSlug>> = null;
  try {
    data = await getListingByPublicNumberAndSlug(parsed.publicNumber, parsed.slug, {
      bumpViews: false,
    });
  } catch {
    return { title: "Объект | HOMENOVA" };
  }
  if (!data) {
    return { title: "Объект | HOMENOVA" };
  }
  const { listing } = data;
  const description = listing.description.slice(0, 160);
  return {
    title: `${listing.title} | HOMENOVA`,
    description,
    openGraph: {
      title: `${listing.title} | HOMENOVA`,
      description,
      type: "article",
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { idSlug } = await params;
  const parsed = parseListingIdSlug(idSlug);
  if (!parsed) notFound();

  let data: Awaited<ReturnType<typeof getListingByPublicNumberAndSlug>> = null;
  try {
    data = await getListingByPublicNumberAndSlug(parsed.publicNumber, parsed.slug, {
      bumpViews: true,
    });
  } catch {
    notFound();
  }
  if (!data) notFound();

  const { listing, media, viewsDisplay, filters } = data;
  const previewUrls = media.length ? media.map((m) => publicObjectUrl(m.preview_key)) : [];
  const originalUrls = media.length ? media.map((m) => publicObjectUrl(m.original_key)) : [];

  const characteristics = listingDetailsLine({
    property_type: listing.property_type,
    rooms: listing.rooms,
    mode: listing.mode,
  });

  const createdAt = new Date(listing.created_at).toLocaleString("ru-RU");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="container-1600 py-8">
          <ListingDetailClient
            listingId={Number(listing.id)}
            title={listing.title}
            description={listing.description}
            characteristics={characteristics}
            locationLine={`${listing.city}, ${listing.region}, ${listing.country}`}
            price={listing.price}
            currencyCode={listing.currency_code}
            discountComment={listing.discount_comment}
            publicNumber={Number(listing.public_number)}
            createdAt={createdAt}
            viewsDisplay={viewsDisplay}
            authorName={listing.author_name}
            previewUrls={previewUrls}
            originalUrls={originalUrls}
            filterRows={filters.map((f) => ({ label: f.label, value: f.value }))}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
