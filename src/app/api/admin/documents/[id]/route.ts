import { NextRequest } from "next/server";
import { fail, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { siteDocumentPatchSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const { id } = await ctx.params;
  if (!["privacy", "privacy-processing"].includes(id)) return fail("Недопустимый id", 400);
  const parsed = await parseJson(req, siteDocumentPatchSchema);
  if (parsed.error) return parsed.error;
  const r = await query(
    `UPDATE site_documents SET title = $1, body = $2, updated_at = NOW() WHERE id = $3 RETURNING id`,
    [parsed.data.title, parsed.data.body, id],
  );
  if (!r.rowCount) return fail("Не найдено", 404);
  return ok({ updated: true });
}
