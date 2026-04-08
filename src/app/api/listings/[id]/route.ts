import { NextRequest } from "next/server";
import slugify from "slugify";
import { fail, getAuthFromRequest, ok, parseJson } from "@/lib/api";
import { listingCreateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

async function assertOwner(listingId: number, userId: number) {
  const r = await query<{ user_id: string }>(
    `SELECT user_id::text FROM listings WHERE id = $1 LIMIT 1`,
    [listingId],
  );
  const row = r.rows[0];
  if (!row) return { error: fail("Не найдено", 404) };
  if (Number(row.user_id) !== userId) return { error: fail("Нет доступа", 403) };
  return { ok: true as const };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);
  const { id } = await ctx.params;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) return fail("Некорректный id", 400);

  const g = await assertOwner(listingId, auth.userId);
  if ("error" in g) return g.error;

  const listing = await query<{
    id: string;
    title: string;
    description: string;
    mode: string;
    property_type: string;
    rooms: string | null;
    price: string;
    currency_code: string;
    city_id: string;
    phone: string;
    discount_comment: string | null;
    public_number: string;
    slug: string;
  }>(
    `SELECT l.id::text, l.title, l.description, l.mode, l.property_type, l.rooms,
            l.price::text, l.currency_code, l.city_id::text, l.phone, l.discount_comment,
            l.public_number::text, l.slug
     FROM listings l WHERE l.id = $1 LIMIT 1`,
    [listingId],
  );
  const L = listing.rows[0];
  if (!L) return fail("Не найдено", 404);

  const fv = await query<{ field_key: string; value: string }>(
    `SELECT pfd.field_key, lfv.value
     FROM listing_filter_values lfv
     JOIN property_filter_definitions pfd ON pfd.id = lfv.filter_def_id
     WHERE lfv.listing_id = $1`,
    [listingId],
  );
  const filterValues: Record<string, string> = {};
  for (const row of fv.rows) filterValues[row.field_key] = row.value;

  return ok({
    listing: {
      id: L.id,
      title: L.title,
      description: L.description,
      mode: L.mode,
      propertyType: L.property_type,
      rooms: L.rooms ?? "",
      price: L.price,
      currencyCode: L.currency_code,
      cityId: Number(L.city_id),
      phone: L.phone,
      discountComment: L.discount_comment ?? "",
      publicNumber: L.public_number,
      slug: L.slug,
      filterValues,
    },
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);
  const { id } = await ctx.params;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) return fail("Некорректный id", 400);

  const g = await assertOwner(listingId, auth.userId);
  if ("error" in g) return g.error;

  const parsed = await parseJson(req, listingCreateSchema);
  if (parsed.error) return parsed.error;
  const d = parsed.data;
  const slug = slugify(d.title, { lower: true, strict: true });

  await query(
    `UPDATE listings SET
      slug = $1, city_id = $2, title = $3, description = $4, mode = $5, property_type = $6,
      rooms = $7, price = $8, currency_code = $9, discount_comment = $10, phone = $11
     WHERE id = $12`,
    [
      slug,
      d.cityId,
      d.title,
      d.description,
      d.mode,
      d.propertyType,
      d.rooms ?? null,
      d.price,
      d.currencyCode,
      d.discountComment ?? null,
      d.phone,
      listingId,
    ],
  );

  await query(`DELETE FROM listing_filter_values WHERE listing_id = $1`, [listingId]);
  if (d.filterValues && Object.keys(d.filterValues).length > 0) {
    const keys = Object.keys(d.filterValues).filter((k) => d.filterValues![k]?.trim());
    if (keys.length > 0) {
      const defs = await query<{ id: string; field_key: string }>(
        `SELECT id::text, field_key FROM property_filter_definitions
         WHERE property_type = $1 AND field_key = ANY($2::text[])`,
        [d.propertyType, keys],
      );
      const idByKey = new Map(defs.rows.map((r) => [r.field_key, r.id]));
      for (const key of keys) {
        const defId = idByKey.get(key);
        const val = d.filterValues![key]?.trim();
        if (!defId || !val) continue;
        await query(
          `INSERT INTO listing_filter_values (listing_id, filter_def_id, value) VALUES ($1, $2, $3)`,
          [listingId, Number(defId), val],
        );
      }
    }
  }

  const pn = await query<{ public_number: string }>(
    `SELECT public_number::text AS public_number FROM listings WHERE id = $1 LIMIT 1`,
    [listingId],
  );
  const publicNumber = pn.rows[0]?.public_number ?? null;

  return ok({ updated: true, slug, publicNumber });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);
  const { id } = await ctx.params;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) return fail("Некорректный id", 400);

  const g = await assertOwner(listingId, auth.userId);
  if ("error" in g) return g.error;

  await query(`DELETE FROM listings WHERE id = $1`, [listingId]);
  return ok({ deleted: true });
}
