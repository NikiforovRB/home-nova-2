import { NextRequest } from "next/server";
import { ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const result = await query(
    `SELECT id, title, body, updated_at AS "updatedAt" FROM site_documents ORDER BY id`,
  );
  return ok({ documents: result.rows });
}
