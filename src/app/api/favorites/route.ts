import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getAuthFromRequest, ok, parseJson } from "@/lib/api";
import { query } from "@/lib/db";

const bodySchema = z.object({
  listingId: z.coerce.number().int().positive(),
});

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);

  const count = await query<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM favorites WHERE user_id = $1",
    [auth.userId],
  );
  return ok({ count: Number(count.rows[0]?.c ?? 0) });
}

export async function POST(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);

  const parsed = await parseJson(req, bodySchema);
  if (parsed.error) return parsed.error;

  await query(
    `INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)
     ON CONFLICT (user_id, listing_id) DO NOTHING`,
    [auth.userId, parsed.data.listingId],
  );
  return ok({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);

  const parsed = await parseJson(req, bodySchema);
  if (parsed.error) return parsed.error;

  await query(`DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2`, [
    auth.userId,
    parsed.data.listingId,
  ]);
  return ok({ ok: true });
}
