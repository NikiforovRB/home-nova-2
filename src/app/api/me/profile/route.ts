import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getAuthFromRequest, ok, parseJson } from "@/lib/api";
import { query } from "@/lib/db";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  lastName: z.string().max(120).optional(),
  patronymic: z.string().max(120).optional(),
  email: z.email().max(255).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Не авторизован", 401);

  const parsed = await parseJson(req, patchSchema);
  if (parsed.error) return parsed.error;

  const d = parsed.data;
  if (d.email) {
    const taken = await query<{ id: string }>(
      "SELECT id::text FROM users WHERE email = $1 AND id <> $2 LIMIT 1",
      [d.email, auth.userId],
    );
    if (taken.rows.length) return fail("Email уже занят", 409);
  }

  const updates: string[] = [];
  const vals: Array<string | number> = [];
  if (d.name !== undefined) {
    vals.push(d.name);
    updates.push(`name = $${vals.length}`);
  }
  if (d.lastName !== undefined) {
    vals.push(d.lastName);
    updates.push(`last_name = $${vals.length}`);
  }
  if (d.patronymic !== undefined) {
    vals.push(d.patronymic);
    updates.push(`patronymic = $${vals.length}`);
  }
  if (d.email !== undefined) {
    vals.push(d.email);
    updates.push(`email = $${vals.length}`);
  }

  if (!updates.length) return ok({ updated: false });

  vals.push(auth.userId);
  await query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${vals.length}`,
    vals,
  );

  return ok({ updated: true });
}
