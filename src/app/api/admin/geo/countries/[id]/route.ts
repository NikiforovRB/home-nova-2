import { NextRequest } from "next/server";
import { fail, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { countryPatchSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const { id } = await ctx.params;
  const parsed = await parseJson(req, countryPatchSchema);
  if (parsed.error) return parsed.error;
  const d = parsed.data;
  const updates: string[] = [];
  const vals: Array<string | number> = [];
  if (d.name !== undefined) {
    vals.push(d.name);
    updates.push(`name = $${vals.length}`);
  }
  if (d.sortOrder !== undefined) {
    vals.push(d.sortOrder);
    updates.push(`sort_order = $${vals.length}`);
  }
  if (!updates.length) return ok({ updated: false });
  vals.push(Number(id));
  await query(`UPDATE countries SET ${updates.join(", ")} WHERE id = $${vals.length}`, vals);
  return ok({ updated: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const { id } = await ctx.params;
  const r = await query(`DELETE FROM countries WHERE id = $1 RETURNING id`, [Number(id)]);
  if (!r.rowCount) return fail("Не найдено", 404);
  return ok({ deleted: true });
}
