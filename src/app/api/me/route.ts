import { NextRequest } from "next/server";
import { fail, getAuthFromRequest, ok } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Не авторизован", 401);

  const user = await query<{ id: string; email: string; name: string; role_code: string }>(
    `SELECT u.id::text, u.email, u.name, r.code AS role_code
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 LIMIT 1`,
    [auth.userId],
  );

  if (!user.rows[0]) return fail("Пользователь не найден", 404);
  return ok({ user: user.rows[0] });
}
