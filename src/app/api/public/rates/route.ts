import { ok } from "@/lib/api";
import { query } from "@/lib/db";

/** Публичные курсы к USD для пересчёта цен на сайте. */
export async function GET() {
  const result = await query<{ code: string; symbol: string; rate_to_usd: string }>(
    `SELECT c.code, c.symbol, er.rate_to_usd::text
     FROM currencies c
     JOIN exchange_rates er ON er.code = c.code
     ORDER BY c.code`,
  );
  const rates: Record<string, number> = {};
  const symbols: Record<string, string> = {};
  for (const row of result.rows) {
    rates[row.code] = Number(row.rate_to_usd);
    symbols[row.code] = row.symbol;
  }
  return ok({ rates, symbols, base: "USD" });
}
