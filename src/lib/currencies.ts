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
