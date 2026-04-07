import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getAuthFromRequest, ok, parseJson } from "@/lib/api";
import { query } from "@/lib/db";

const noteSchema = z.object({
  noteText: z.string().min(1).max(4000),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);

  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) return fail("Некорректный id", 422);

  const parsed = await parseJson(req, noteSchema);
  if (parsed.error) return parsed.error;

  await query(
    `INSERT INTO notes (user_id, listing_id, note_text)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, listing_id) DO UPDATE SET note_text = EXCLUDED.note_text`,
    [auth.userId, listingId, parsed.data.noteText],
  );

  return ok({ saved: true });
}
