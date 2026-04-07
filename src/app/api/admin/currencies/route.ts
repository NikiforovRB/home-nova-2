import { NextRequest } from "next/server";
import { fail, getAuthFromRequest, ok, parseJson } from "@/lib/api";
import { currencyRateSchema } from "@/lib/validation/schemas";
import { query } from "@/lib/db";

function guardAdmin(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  return !!auth && auth.role === "admin";
}

export async function GET(req: NextRequest) {
  if (!guardAdmin(req)) return fail("Forbidden", 403);
  const result = await query(
    `SELECT c.code, c.name, c.symbol, er.rate_to_usd
     FROM currencies c
     JOIN exchange_rates er ON er.code = c.code
     ORDER BY c.code`,
  );
  return ok({ rates: result.rows });
}

export async function PATCH(req: NextRequest) {
  if (!guardAdmin(req)) return fail("Forbidden", 403);
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
