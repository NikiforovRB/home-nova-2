import { NextRequest } from "next/server";
import { fail, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { cityCreateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const regionId = req.nextUrl.searchParams.get("regionId");
  if (!regionId) return fail("regionId обязателен", 400);
  const result = await query(
    `SELECT id::text, region_id::text AS "regionId", name, sort_order AS "sortOrder"
     FROM cities WHERE region_id = $1 ORDER BY sort_order, name`,
    [Number(regionId)],
  );
  return ok({ cities: result.rows });
}

export async function POST(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const parsed = await parseJson(req, cityCreateSchema);
  if (parsed.error) return parsed.error;
  const so = parsed.data.sortOrder ?? 0;
  const result = await query(
    `INSERT INTO cities (region_id, name, sort_order) VALUES ($1, $2, $3)
     RETURNING id::text, region_id::text AS "regionId", name, sort_order AS "sortOrder"`,
    [parsed.data.regionId, parsed.data.name, so],
  );
  return ok({ city: result.rows[0] }, { status: 201 });
}
