import { NextRequest } from "next/server";
import { fail, getAuthFromRequest, ok, parseJson } from "@/lib/api";
import { locationSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

function guardAdmin(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") return false;
  return true;
}

export async function GET(req: NextRequest) {
  if (!guardAdmin(req)) return fail("Forbidden", 403);
  const result = await query(
    "SELECT id, country, region, city FROM locations ORDER BY country, region, city",
  );
  return ok({ locations: result.rows });
}

export async function POST(req: NextRequest) {
  if (!guardAdmin(req)) return fail("Forbidden", 403);
  const parsed = await parseJson(req, locationSchema);
  if (parsed.error) return parsed.error;

  const result = await query(
    `INSERT INTO locations (country, region, city)
     VALUES ($1, $2, $3)
     RETURNING id, country, region, city`,
    [parsed.data.country, parsed.data.region, parsed.data.city],
  );
  return ok({ location: result.rows[0] }, { status: 201 });
}
