import { NextRequest } from "next/server";
import { fail, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { regionCreateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const countryId = req.nextUrl.searchParams.get("countryId");
  if (!countryId) return fail("countryId обязателен", 400);
  const result = await query(
    `SELECT id::text, country_id::text AS "countryId", name, sort_order AS "sortOrder"
     FROM regions WHERE country_id = $1 ORDER BY sort_order, name`,
    [Number(countryId)],
  );
  return ok({ regions: result.rows });
}

export async function POST(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const parsed = await parseJson(req, regionCreateSchema);
  if (parsed.error) return parsed.error;
  const so = parsed.data.sortOrder ?? 0;
  const result = await query(
    `INSERT INTO regions (country_id, name, sort_order) VALUES ($1, $2, $3)
     RETURNING id::text, country_id::text AS "countryId", name, sort_order AS "sortOrder"`,
    [parsed.data.countryId, parsed.data.name, so],
  );
  return ok({ region: result.rows[0] }, { status: 201 });
}
