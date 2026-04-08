import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const result = await query<{ title: string; body: string; updated_at: Date }>(
    `SELECT title, body, updated_at FROM site_documents WHERE id = $1 LIMIT 1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return fail("Не найдено", 404);
  return ok({
    document: {
      title: row.title,
      body: row.body,
      updatedAt: row.updated_at.toISOString(),
    },
  });
}
