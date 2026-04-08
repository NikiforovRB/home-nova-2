import { NextRequest } from "next/server";
import { fail, getAuthFromRequest } from "@/lib/api";
import type { AuthPayload } from "@/lib/security/jwt";

export function requireAdmin(
  req: NextRequest,
): { auth: AuthPayload } | { response: ReturnType<typeof fail> } {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") return { response: fail("Forbidden", 403) };
  return { auth };
}
