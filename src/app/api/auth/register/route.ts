import { NextRequest } from "next/server";
import { authRegisterSchema } from "@/lib/validation/schemas";
import { fail, ok, parseJson } from "@/lib/api";
import { hashPassword } from "@/lib/security/password";
import { query } from "@/lib/db";
import { signAccessToken, signRefreshToken } from "@/lib/security/jwt";
import { hashRefreshToken, refreshSessionExpiresAt } from "@/lib/security/session";

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, authRegisterSchema);
  if (parsed.error) return parsed.error;

  const { email, name, password } = parsed.data;
  const exists = await query<{ id: number }>(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [email],
  );

  if (exists.rows.length) return fail("Пользователь уже существует", 409);

  const role = await query<{ id: number }>(
    "SELECT id FROM roles WHERE code = 'user' LIMIT 1",
  );
  if (!role.rows.length) return fail("Role user not found", 500);

  const passwordHash = await hashPassword(password);
  const inserted = await query<{ id: number }>(
    `INSERT INTO users (email, password_hash, name, role_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [email, passwordHash, name, role.rows[0].id],
  );

  const payload = { userId: inserted.rows[0].id, email, role: "user" as const };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshHash = hashRefreshToken(refreshToken);
  await query(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [inserted.rows[0].id, refreshHash, refreshSessionExpiresAt()],
  );

  const response = ok({ user: payload });
  response.cookies.set("homenova_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  response.cookies.set("homenova_refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
