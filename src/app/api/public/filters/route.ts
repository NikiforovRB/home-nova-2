import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const propertyType = req.nextUrl.searchParams.get("propertyType");
  if (!propertyType) return fail("propertyType обязателен", 400);
  const result = await query<{
    id: string;
    field_key: string;
    label: string;
    field_type: string;
    options_json: string[] | null;
    sort_order: number;
  }>(
    `SELECT id::text, field_key, label, field_type, options_json, sort_order
     FROM property_filter_definitions
     WHERE property_type = $1
     ORDER BY sort_order, label`,
    [propertyType],
  );
  const filters = result.rows.map((r) => {
    const opts = r.options_json;
    const options = Array.isArray(opts) ? opts.map(String) : undefined;
    return {
      id: r.id,
      fieldKey: r.field_key,
      label: r.label,
      fieldType: r.field_type,
      options,
      sortOrder: r.sort_order,
    };
  });
  return ok({ filters });
}
