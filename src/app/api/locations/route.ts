import { ok } from "@/lib/api";
import { query } from "@/lib/db";

/** Публичный список локаций для форм (каталог городов). */
export async function GET() {
  const result = await query(
    `SELECT id::text, country, region, city FROM locations ORDER BY country, region, city`,
  );
  return ok({ locations: result.rows });
}
