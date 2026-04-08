import { NextRequest } from "next/server";
import { fail, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { currencyCreateSchema, currencyRateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const result = await query(
    `SELECT c.code, c.name, c.symbol, er.rate_to_usd AS "rateToUsd", er.updated_at AS "updatedAt"
     FROM currencies c
     JOIN exchange_rates er ON er.code = c.code
     ORDER BY c.code`,
  );
  return ok({ rates: result.rows });
}

export async function POST(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const parsed = await parseJson(req, currencyCreateSchema);
  if (parsed.error) return parsed.error;
  const d = parsed.data;
  const exists = await query(`SELECT 1 FROM currencies WHERE code = $1`, [d.code]);
  if (exists.rows.length) return fail("Валюта уже есть", 409);
  await query(`INSERT INTO currencies (code, symbol, name, is_base) VALUES ($1, $2, $3, FALSE)`, [
    d.code,
    d.symbol,
    d.name,
  ]);
  await query(`INSERT INTO exchange_rates (code, rate_to_usd) VALUES ($1, $2)`, [
    d.code,
    d.rateToUsd,
  ]);
  return ok({ created: d.code }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const parsed = await parseJson(req, currencyRateSchema);
  if (parsed.error) return parsed.error;

  await query("UPDATE currencies SET symbol = $1 WHERE code = $2", [
    parsed.data.symbol,
    parsed.data.code,
  ]);
  await query(
    "UPDATE exchange_rates SET rate_to_usd = $1, updated_at = NOW() WHERE code = $2",
    [parsed.data.rateToUsd, parsed.data.code],
  );

  return ok({ updated: parsed.data.code });
}

export async function DELETE(req: NextRequest) {
  const g = requireAdmin(req);
  if ("response" in g) return g.response;
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return fail("code обязателен", 400);
  const used = await query(`SELECT 1 FROM listings WHERE currency_code = $1 LIMIT 1`, [code]);
  if (used.rows.length) return fail("Валюта используется в объявлениях", 409);
  const base = await query(`SELECT is_base FROM currencies WHERE code = $1`, [code]);
  if (base.rows[0]?.is_base) return fail("Нельзя удалить базовую валюту", 400);
  await query(`DELETE FROM exchange_rates WHERE code = $1`, [code]);
  await query(`DELETE FROM currencies WHERE code = $1`, [code]);
  return ok({ deleted: code });
}
