import { query } from "@/lib/db";
import type { QueryResultRow } from "pg";

export type ListingRow = QueryResultRow & {
  id: string;
  public_number: string;
  slug: string;
  title: string;
  description: string;
  mode: string;
  property_type: string;
  rooms: string | null;
  price: string;
  currency_code: string;
  discount_comment: string | null;
  phone: string;
  views_count: string;
  created_at: Date;
  author_name: string;
  author_avatar_url: string | null;
  country: string;
  region: string;
  city: string;
};

export type ListingMediaRow = {
  id: string;
  original_key: string;
  preview_key: string;
  sort_order: number;
};

export type ListingFilterDisplayRow = {
  field_key: string;
  label: string;
  value: string;
};

export async function getListingByPublicNumberAndSlug(
  publicNumber: number,
  slug: string,
  options: { bumpViews?: boolean } = { bumpViews: true },
): Promise<{
  listing: ListingRow;
  media: ListingMediaRow[];
  viewsDisplay: number;
  filters: ListingFilterDisplayRow[];
} | null> {
  const listingResult = await query<ListingRow>(
    `SELECT l.id, l.public_number, l.slug, l.title, l.description, l.mode, l.property_type, l.rooms,
            l.price::text, l.currency_code, l.discount_comment, l.phone, l.views_count::text, l.created_at,
            u.name AS author_name, u.avatar_url AS author_avatar_url,
            co.name AS country, r.name AS region, c.name AS city
     FROM listings l
     JOIN users u ON u.id = l.user_id
     JOIN cities c ON c.id = l.city_id
     JOIN regions r ON r.id = c.region_id
     JOIN countries co ON co.id = r.country_id
     WHERE l.public_number = $1 AND l.slug = $2
     LIMIT 1`,
    [publicNumber, slug],
  );

  const listing = listingResult.rows[0];
  if (!listing) return null;

  const bump = options.bumpViews !== false;
  let viewsDisplay = Number(listing.views_count);
  if (bump) {
    await query("UPDATE listings SET views_count = views_count + 1 WHERE id = $1", [listing.id]);
    viewsDisplay += 1;
  }

  const mediaResult = await query<ListingMediaRow>(
    `SELECT id::text, original_key, preview_key, sort_order
     FROM listing_media WHERE listing_id = $1 ORDER BY sort_order ASC, id ASC`,
    [listing.id],
  );

  const filtersResult = await query<ListingFilterDisplayRow>(
    `SELECT pfd.field_key, pfd.label, lfv.value
     FROM listing_filter_values lfv
     JOIN property_filter_definitions pfd ON pfd.id = lfv.filter_def_id
     WHERE lfv.listing_id = $1 AND TRIM(lfv.value) <> ''
     ORDER BY pfd.sort_order, pfd.label`,
    [listing.id],
  );

  return {
    listing,
    media: mediaResult.rows,
    viewsDisplay,
    filters: filtersResult.rows,
  };
}
