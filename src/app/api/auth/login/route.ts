import { NextRequest } from "next/server";
import { authLoginSchema } from "@/lib/validation/schemas";
import { fail, ok, parseJson } from "@/lib/api";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { signAccessToken, signRefreshToken } from "@/lib/security/jwt";
import { takeRateLimit } from "@/lib/security/rate-limit";
import { hashRefreshToken, refreshSessionExpiresAt } from "@/lib/security/session";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rate = takeRateLimit(`login:${ip}`, 10, 60_000);
  if (!rate.allowed) return fail("Слишком много попыток входа", 429);

  const parsed = await parseJson(req, authLoginSchema);
  if (parsed.error) return parsed.error;

  const { email, password } = parsed.data;
  const userResult = await query<{
    id: number;
    email: string;
    name: string;
    password_hash: string;
    role_code: "admin" | "user";
  }>(
    `SELECT u.id, u.email, u.name, u.password_hash, r.code as role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1 LIMIT 1`,
    [email],
  );

  const user = userResult.rows[0];
  if (!user) return fail("Неверный email или пароль", 401);

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return fail("Неверный email или пароль", 401);

  const payload = { userId: user.id, email: user.email, role: user.role_code };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshHash = hashRefreshToken(refreshToken);
  await query(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, refreshHash, refreshSessionExpiresAt()],
  );

  const response = ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role_code,
    },
  });

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
