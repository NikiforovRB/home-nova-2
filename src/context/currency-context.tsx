"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatPrice, formatPriceConverted } from "@/lib/currencies";

const STORAGE_KEY = "homenova_display_currency";

type Ctx = {
  displayCurrency: string;
  setDisplayCurrency: (code: string) => void;
  rates: Record<string, number>;
  symbols: Record<string, string>;
  ready: boolean;
  formatListingPrice: (amount: number | string, storedCurrency: string) => string;
};

const CurrencyContext = createContext<Ctx | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState("RUB");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [symbols, setSymbols] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s && ["RUB", "EUR", "USD", "TRY"].includes(s)) setDisplayCurrencyState(s);
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/public/rates");
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { rates?: Record<string, number>; symbols?: Record<string, string> };
      };
      if (cancelled || !json.ok || !json.data?.rates) return;
      setRates(json.data.rates);
      setSymbols(json.data.symbols ?? {});
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setDisplayCurrency = useCallback((code: string) => {
    if (!["RUB", "EUR", "USD", "TRY"].includes(code)) return;
    setDisplayCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const formatListingPrice = useCallback(
    (amount: number | string, storedCurrency: string) => {
      if (!ready || !Object.keys(rates).length) {
        return formatPrice(amount, storedCurrency);
      }
      return formatPriceConverted(amount, storedCurrency, displayCurrency, rates, symbols);
    },
    [displayCurrency, rates, symbols, ready],
  );

  const value = useMemo(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      rates,
      symbols,
      ready,
      formatListingPrice,
    }),
    [displayCurrency, setDisplayCurrency, rates, symbols, ready, formatListingPrice],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency outside CurrencyProvider");
  return ctx;
}
