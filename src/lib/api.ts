import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { verifyToken, type AuthPayload } from "@/lib/security/jwt";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function parseJson<T>(req: NextRequest, schema: ZodSchema<T>) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: fail("Некорректный JSON", 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: fail(parsed.error.issues[0]?.message ?? "Validation error", 422),
    };
  }
  return { data: parsed.data };
}

/** JWT после verify может отдать userId строкой (BIGINT из PostgreSQL при выдаче токена). */
export function getAuthFromRequest(req: NextRequest): AuthPayload | null {
  function fromToken(token: string | undefined): AuthPayload | null {
    if (!token) return null;
    try {
      const raw = verifyToken(token) as AuthPayload & { userId?: unknown };
      const userId = Number(raw.userId);
      if (!Number.isFinite(userId)) return null;
      return {
        email: raw.email,
        role: raw.role,
        userId,
      };
    } catch {
      return null;
    }
  }

  // Основной короткоживущий токен.
  const access = fromToken(req.cookies.get("homenova_access_token")?.value);
  if (access) return access;

  // Fallback: если access протух, но refresh ещё жив — пользователь остаётся авторизованным.
  const refresh = fromToken(req.cookies.get("homenova_refresh_token")?.value);
  if (refresh) return refresh;

  return null;
}
