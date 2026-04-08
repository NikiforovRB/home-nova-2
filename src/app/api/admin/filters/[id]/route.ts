import { NextRequest } from "next/server";
import { fail, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { filterDefPatchSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const { id } = await ctx.params;
  const parsed = await parseJson(req, filterDefPatchSchema);
  if (parsed.error) return parsed.error;
  const d = parsed.data;
  const updates: string[] = [];
  const vals: Array<string | number | null> = [];
  if (d.label !== undefined) {
    vals.push(d.label);
    updates.push(`label = $${vals.length}`);
  }
  if (d.fieldType !== undefined) {
    vals.push(d.fieldType);
    updates.push(`field_type = $${vals.length}`);
  }
  if (d.sortOrder !== undefined) {
    vals.push(d.sortOrder);
    updates.push(`sort_order = $${vals.length}`);
  }
  if (d.fieldKey !== undefined) {
    vals.push(d.fieldKey);
    updates.push(`field_key = $${vals.length}`);
  }
  if (d.options !== undefined) {
    vals.push(d.options === null ? null : JSON.stringify(d.options));
    updates.push(`options_json = $${vals.length}::jsonb`);
  }
  if (!updates.length) return ok({ updated: false });
  vals.push(Number(id));
  const r = await query(
    `UPDATE property_filter_definitions SET ${updates.join(", ")} WHERE id = $${vals.length} RETURNING id`,
    vals,
  );
  if (!r.rowCount) return fail("Не найдено", 404);
  return ok({ updated: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const { id } = await ctx.params;
  const r = await query(`DELETE FROM property_filter_definitions WHERE id = $1 RETURNING id`, [
    Number(id),
  ]);
  if (!r.rowCount) return fail("Не найдено", 404);
  return ok({ deleted: true });
}
