import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { verifyToken } from "@/lib/security/jwt";

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

export function getAuthFromRequest(req: NextRequest) {
  const token = req.cookies.get("homenova_access_token")?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
