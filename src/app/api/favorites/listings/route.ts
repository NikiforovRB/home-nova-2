import { NextRequest } from "next/server";
import { fail, getAuthFromRequest, ok } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 60);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? 0);

  const result = await query(
    `SELECT l.id::text, l.public_number::text, l.slug, l.title, l.mode, l.property_type, l.rooms, l.price::text, l.currency_code, l.created_at,
            l.discount_comment, l.views_count::text, loc.city,
            m.preview_key
     FROM favorites f
     JOIN listings l ON l.id = f.listing_id
     JOIN locations loc ON loc.id = l.city_id
     LEFT JOIN LATERAL (
       SELECT preview_key FROM listing_media lm WHERE lm.listing_id = l.id ORDER BY lm.sort_order ASC LIMIT 1
     ) m ON TRUE
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [auth.userId, limit, offset],
  );

  return ok({ listings: result.rows });
}
