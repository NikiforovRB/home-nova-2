import { NextRequest } from "next/server";
import { fail, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { filterDefCreateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const propertyType = req.nextUrl.searchParams.get("propertyType");
  if (!propertyType) return fail("propertyType обязателен", 400);
  const result = await query(
    `SELECT id::text, property_type AS "propertyType", field_key AS "fieldKey", label,
            field_type AS "fieldType", options_json AS "options", sort_order AS "sortOrder"
     FROM property_filter_definitions
     WHERE property_type = $1
     ORDER BY sort_order, label`,
    [propertyType],
  );
  return ok({ filters: result.rows });
}

export async function POST(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const parsed = await parseJson(req, filterDefCreateSchema);
  if (parsed.error) return parsed.error;
  const d = parsed.data;
  const opts = d.fieldType === "select" ? JSON.stringify(d.options ?? []) : null;
  const so = d.sortOrder ?? 0;
  const result = await query(
    `INSERT INTO property_filter_definitions
     (property_type, field_key, label, field_type, options_json, sort_order)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)
     RETURNING id::text, property_type AS "propertyType", field_key AS "fieldKey", label,
               field_type AS "fieldType", options_json AS "options", sort_order AS "sortOrder"`,
    [d.propertyType, d.fieldKey, d.label, d.fieldType, opts, so],
  );
  return ok({ filter: result.rows[0] }, { status: 201 });
}
