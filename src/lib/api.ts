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
  const body = await req.json();
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
  const token = req.cookies.get("homenova_access_token")?.value;
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
