import { NextRequest } from "next/server";
import { fail, getAuthFromRequest, ok } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  const listingIdsParam = req.nextUrl.searchParams.get("listingIds");
  const listingId = req.nextUrl.searchParams.get("listingId");

  if (listingIdsParam) {
    const ids = listingIdsParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (ids.length === 0) return ok({ favorites: {} as Record<string, boolean> });

    if (!auth) {
      const favorites: Record<string, boolean> = {};
      for (const id of ids) favorites[String(id)] = false;
      return ok({ favorites });
    }

    const r = await query<{ listing_id: string }>(
      `SELECT listing_id::text AS listing_id FROM favorites
       WHERE user_id = $1 AND listing_id = ANY($2::bigint[])`,
      [auth.userId, ids],
    );
    const favSet = new Set(r.rows.map((x) => x.listing_id));
    const favorites: Record<string, boolean> = {};
    for (const id of ids) {
      favorites[String(id)] = favSet.has(String(id));
    }
    return ok({ favorites });
  }

  if (!listingId) return fail("Укажите listingId или listingIds", 422);

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
