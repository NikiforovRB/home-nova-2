import { NextRequest } from "next/server";
import slugify from "slugify";
import { fail, getAuthFromRequest, ok, parseJson } from "@/lib/api";
import { listingCreateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");
  const cityId = req.nextUrl.searchParams.get("cityId");
  const mine = req.nextUrl.searchParams.get("mine");
  const propertyType = req.nextUrl.searchParams.get("propertyType");
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
  if (propertyType) {
    params.push(propertyType);
    filters.push(`l.property_type = $${params.length}`);
  }

  for (const [key, value] of req.nextUrl.searchParams) {
    if (!key.startsWith("filter_") || !value.trim()) continue;
    if (!propertyType) continue;
    const fieldKey = key.slice("filter_".length);
    if (!fieldKey) continue;
    params.push(propertyType, fieldKey, value.trim());
    const n = params.length;
    filters.push(
      `EXISTS (
        SELECT 1 FROM listing_filter_values lfv
        JOIN property_filter_definitions pfd ON pfd.id = lfv.filter_def_id
        WHERE lfv.listing_id = l.id
          AND pfd.property_type = $${n - 2}
          AND pfd.field_key = $${n - 1}
          AND lfv.value = $${n}
      )`,
    );
  }

  params.push(limit);
  params.push(offset);

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await query(
    `SELECT l.id, l.public_number, l.slug, l.title, l.mode, l.property_type, l.rooms, l.price, l.currency_code, l.created_at,
            l.discount_comment, l.views_count, c.name AS city,
            COALESCE(m.preview_keys, ARRAY[]::text[]) AS preview_keys
     FROM listings l
     JOIN cities c ON c.id = l.city_id
     LEFT JOIN LATERAL (
      SELECT ARRAY(
        SELECT lm.preview_key
        FROM listing_media lm
        WHERE lm.listing_id = l.id
        ORDER BY lm.sort_order ASC
        LIMIT 8
      ) AS preview_keys
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

  const listingId = created.rows[0].id;

  if (data.filterValues && Object.keys(data.filterValues).length > 0) {
    const keys = Object.keys(data.filterValues).filter((k) => data.filterValues![k]?.trim());
    if (keys.length > 0) {
      const defs = await query<{ id: string; field_key: string }>(
        `SELECT id::text, field_key FROM property_filter_definitions
         WHERE property_type = $1 AND field_key = ANY($2::text[])`,
        [data.propertyType, keys],
      );
      const idByKey = new Map(defs.rows.map((r) => [r.field_key, r.id]));
      for (const key of keys) {
        const defId = idByKey.get(key);
        const val = data.filterValues![key]?.trim();
        if (!defId || !val) continue;
        await query(
          `INSERT INTO listing_filter_values (listing_id, filter_def_id, value)
           VALUES ($1, $2, $3)
           ON CONFLICT (listing_id, filter_def_id) DO UPDATE SET value = EXCLUDED.value`,
          [listingId, Number(defId), val],
        );
      }
    }
  }

  return ok({ listing: created.rows[0] }, { status: 201 });
}
