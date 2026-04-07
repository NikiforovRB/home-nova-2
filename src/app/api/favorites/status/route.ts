import { NextRequest } from "next/server";
import { fail, getAuthFromRequest, ok } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) return fail("listingId обязателен", 422);

  if (!auth) {
    return ok({ favorite: false, count: 0 });
  }

  const totalResult = await query<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM favorites WHERE user_id = $1",
    [auth.userId],
  );
  const total = Number(totalResult.rows[0]?.c ?? 0);

  const fav = await query<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM favorites WHERE user_id = $1 AND listing_id = $2",
    [auth.userId, Number(listingId)],
  );

  return ok({
    favorite: Number(fav.rows[0]?.c ?? 0) > 0,
    count: total,
  });
}
