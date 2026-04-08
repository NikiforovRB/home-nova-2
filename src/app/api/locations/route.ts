import { ok } from "@/lib/api";
import { query } from "@/lib/db";

/** Публичный список населённых пунктов для форм (id города + страна/регион/город). */
export async function GET() {
  const result = await query(
    `SELECT c.id::text,
            co.name AS country,
            r.name AS region,
            c.name AS city
     FROM cities c
     JOIN regions r ON r.id = c.region_id
     JOIN countries co ON co.id = r.country_id
     ORDER BY co.sort_order, co.name, r.name, c.sort_order, c.name`,
  );
  return ok({ locations: result.rows });
}
