const SYMBOLS: Record<string, string> = {
  USD: "$",
  RUB: "₽",
  EUR: "€",
  TRY: "₺",
};

export function formatPrice(amount: number | string, currencyCode: string) {
  const num = typeof amount === "string" ? Number(amount) : amount;
  const symbol = SYMBOLS[currencyCode] ?? currencyCode;
  return `${num.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ${symbol}`;
}

/** Пересчёт суммы из валюты `from` в `to` по курсам к USD (как в exchange_rates). */
export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: Record<string, number>,
): number {
  if (fromCode === toCode) return amount;
  const rFrom = rates[fromCode];
  const rTo = rates[toCode];
  if (!rFrom || !rTo || rFrom <= 0 || rTo <= 0) return amount;
  const usd = amount * rFrom;
  return usd / rTo;
}

export function formatPriceConverted(
  amount: number | string,
  storedCurrencyCode: string,
  displayCurrencyCode: string,
  rates: Record<string, number>,
  symbols: Record<string, string>,
) {
  const num = typeof amount === "string" ? Number(amount) : amount;
  const converted = convertAmount(num, storedCurrencyCode, displayCurrencyCode, rates);
  const sym = symbols[displayCurrencyCode] ?? SYMBOLS[displayCurrencyCode] ?? displayCurrencyCode;
  return `${converted.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ${sym}`;
}
