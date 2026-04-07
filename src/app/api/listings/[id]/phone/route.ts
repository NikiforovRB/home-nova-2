import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { takeRateLimit } from "@/lib/security/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rate = takeRateLimit(`phone:${ip}`, 15, 60_000);
  if (!rate.allowed) return fail("Слишком много запросов", 429);

  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) return fail("Некорректный id", 422);

  const phone = await query<{ phone: string }>(
    "SELECT phone FROM listings WHERE id = $1 LIMIT 1",
    [listingId],
  );

  if (!phone.rows[0]) return fail("Объявление не найдено", 404);
  return ok({ phone: phone.rows[0].phone });
}
