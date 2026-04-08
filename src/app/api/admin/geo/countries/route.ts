import { NextRequest } from "next/server";
import { ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { countryCreateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const result = await query(
    `SELECT id::text, name, sort_order AS "sortOrder" FROM countries ORDER BY sort_order, name`,
  );
  return ok({ countries: result.rows });
}

export async function POST(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const parsed = await parseJson(req, countryCreateSchema);
  if (parsed.error) return parsed.error;
  const so = parsed.data.sortOrder ?? 0;
  const result = await query(
    `INSERT INTO countries (name, sort_order) VALUES ($1, $2)
     RETURNING id::text, name, sort_order AS "sortOrder"`,
    [parsed.data.name, so],
  );
  return ok({ country: result.rows[0] }, { status: 201 });
}
