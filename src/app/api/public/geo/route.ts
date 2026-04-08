import { ok } from "@/lib/api";
import { query } from "@/lib/db";

type Row = {
  country_id: string;
  country_name: string;
  region_id: string;
  region_name: string;
  city_id: string | null;
  city_name: string | null;
};

export async function GET() {
  const result = await query<Row>(
    `SELECT co.id::text AS country_id, co.name AS country_name,
            r.id::text AS region_id, r.name AS region_name,
            c.id::text AS city_id, c.name AS city_name
     FROM countries co
     JOIN regions r ON r.country_id = co.id
     LEFT JOIN cities c ON c.region_id = r.id
     ORDER BY co.sort_order, co.name, r.sort_order, r.name, c.sort_order, c.name`,
  );

  const countryMap = new Map<
    string,
    { id: string; name: string; regions: Map<string, { id: string; name: string; cities: { id: string; name: string }[] }> }
  >();

  for (const row of result.rows) {
    let ctry = countryMap.get(row.country_id);
    if (!ctry) {
      ctry = { id: row.country_id, name: row.country_name, regions: new Map() };
      countryMap.set(row.country_id, ctry);
    }
    let reg = ctry.regions.get(row.region_id);
    if (!reg) {
      reg = { id: row.region_id, name: row.region_name, cities: [] };
      ctry.regions.set(row.region_id, reg);
    }
    if (row.city_id && row.city_name) {
      if (!reg.cities.some((x) => x.id === row.city_id)) {
        reg.cities.push({ id: row.city_id, name: row.city_name });
      }
    }
  }

  const countries = [...countryMap.values()].map((c) => ({
    id: c.id,
    name: c.name,
    regions: [...c.regions.values()].map((r) => ({
      id: r.id,
      name: r.name,
      cities: r.cities,
    })),
  }));

  return ok({ countries });
}
