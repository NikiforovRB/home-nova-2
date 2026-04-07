import { NextRequest } from "next/server";
import slugify from "slugify";
import { fail, getAuthFromRequest, ok, parseJson } from "@/lib/api";
import { listingCreateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");
  const cityId = req.nextUrl.searchParams.get("cityId");
  const mine = req.nextUrl.searchParams.get("mine");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 60);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? 0);

  const filters: string[] = [];
  const params: Array<string | number> = [];

  if (mine === "1") {
    const auth = getAuthFromRequest(req);
    if (!auth) return fail("Требуется авторизация", 401);
    params.push(auth.userId);
    filters.push(`l.user_id = $${params.length}`);
  }

  if (mode) {
    params.push(mode);
    filters.push(`l.mode = $${params.length}`);
  }
  if (cityId) {
    params.push(Number(cityId));
    filters.push(`l.city_id = $${params.length}`);
  }

  params.push(limit);
  params.push(offset);

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await query(
    `SELECT l.id, l.public_number, l.slug, l.title, l.mode, l.property_type, l.rooms, l.price, l.currency_code, l.created_at,
            l.discount_comment, l.views_count, loc.city,
            m.preview_key
     FROM listings l
     JOIN locations loc ON loc.id = l.city_id
     LEFT JOIN LATERAL (
       SELECT preview_key FROM listing_media lm WHERE lm.listing_id = l.id ORDER BY lm.sort_order ASC LIMIT 1
     ) m ON TRUE
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return ok({ listings: result.rows });
}

export async function POST(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);

  const parsed = await parseJson(req, listingCreateSchema);
  if (parsed.error) return parsed.error;

  const data = parsed.data;
  const slug = slugify(data.title, { lower: true, strict: true });
  const publicNumberResult = await query<{ next_number: number }>(
    `SELECT nextval('listing_public_number_seq') AS next_number`,
  );

  const created = await query<{ id: number; slug: string; public_number: number }>(
    `INSERT INTO listings
     (public_number, slug, user_id, city_id, title, description, mode, property_type, rooms, price, currency_code, discount_comment, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, slug, public_number`,
    [
      publicNumberResult.rows[0].next_number,
      slug,
      auth.userId,
      data.cityId,
      data.title,
      data.description,
      data.mode,
      data.propertyType,
      data.rooms ?? null,
      data.price,
      data.currencyCode,
      data.discountComment ?? null,
      data.phone,
    ],
  );

  return ok({ listing: created.rows[0] }, { status: 201 });
}
