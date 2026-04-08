import { ok } from "@/lib/api";
import { query } from "@/lib/db";

const FALLBACK_RATES: Record<string, number> = { RUB: 1, USD: 1, EUR: 0.92, TRY: 0.031 };
const FALLBACK_SYMBOLS: Record<string, string> = { RUB: "₽", USD: "$", EUR: "€", TRY: "₺" };
let lastGood: { rates: Record<string, number>; symbols: Record<string, string> } | null = null;

/** Публичные курсы к USD для пересчёта цен на сайте. */
export async function GET() {
  try {
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
    if (Object.keys(rates).length > 0) {
      lastGood = { rates, symbols };
      return ok({ rates, symbols, base: "USD" });
    }
  } catch {
    // ниже вернем cache/fallback
  }
  if (lastGood) return ok({ ...lastGood, base: "USD", stale: true });
  return ok({ rates: FALLBACK_RATES, symbols: FALLBACK_SYMBOLS, base: "USD", fallback: true });
}
