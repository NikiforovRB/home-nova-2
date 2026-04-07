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

export async function getListingByPublicNumberAndSlug(
  publicNumber: number,
  slug: string,
  options: { bumpViews?: boolean } = { bumpViews: true },
): Promise<{
  listing: ListingRow;
  media: ListingMediaRow[];
  viewsDisplay: number;
} | null> {
  const listingResult = await query<ListingRow>(
    `SELECT l.id, l.public_number, l.slug, l.title, l.description, l.mode, l.property_type, l.rooms,
            l.price::text, l.currency_code, l.discount_comment, l.phone, l.views_count::text, l.created_at,
            u.name AS author_name, u.avatar_url AS author_avatar_url,
            loc.country, loc.region, loc.city
     FROM listings l
     JOIN users u ON u.id = l.user_id
     JOIN locations loc ON loc.id = l.city_id
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

  return { listing, media: mediaResult.rows, viewsDisplay };
}
