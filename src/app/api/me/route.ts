import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest, ok } from "@/lib/api";
import { isPgUndefinedColumn, query } from "@/lib/db";

type MeUser = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  patronymic: string;
  avatar_url: string | null;
  role_code: string;
};

const SELECT_ME_FULL = `SELECT u.id::text, u.email, u.name, u.last_name, u.patronymic, u.avatar_url, r.code AS role_code
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 LIMIT 1`;

const SELECT_ME_LEGACY = `SELECT u.id::text, u.email, u.name, u.avatar_url, r.code AS role_code
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 LIMIT 1`;

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) return ok({ user: null });

    let row: MeUser | undefined;
    try {
      const user = await query<MeUser>(SELECT_ME_FULL, [auth.userId]);
      row = user.rows[0];
    } catch (e) {
      if (!isPgUndefinedColumn(e)) throw e;
      const user = await query<Omit<MeUser, "last_name" | "patronymic">>(SELECT_ME_LEGACY, [auth.userId]);
      const r0 = user.rows[0];
      row = r0
        ? { ...r0, last_name: "", patronymic: "" }
        : undefined;
    }

    if (!row) return ok({ user: null });
    return ok({ user: row });
  } catch (e) {
    console.error("[GET /api/me]", e);
    return NextResponse.json(
      { ok: false, error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
