"use client";

import { CurrencyProvider } from "@/context/currency-context";
import { LocationPreferenceProvider } from "@/context/location-preference-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <LocationPreferenceProvider>{children}</LocationPreferenceProvider>
    </CurrencyProvider>
  );
}
