"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "homenova_geo_selection_v1";

export type GeoSelection = {
  countryId: string | null;
  countryName: string | null;
  regionId: string | null;
  regionName: string | null;
  cityId: string | null;
  cityName: string | null;
};

function emptySelection(): GeoSelection {
  return {
    countryId: null,
    countryName: null,
    regionId: null,
    regionName: null,
    cityId: null,
    cityName: null,
  };
}

function loadFromStorage(): GeoSelection {
  if (typeof window === "undefined") return emptySelection();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySelection();
    const p = JSON.parse(raw) as GeoSelection;
    return {
      countryId: p.countryId ?? null,
      countryName: p.countryName ?? null,
      regionId: p.regionId ?? null,
      regionName: p.regionName ?? null,
      cityId: p.cityId ?? null,
      cityName: p.cityName ?? null,
    };
  } catch {
    return emptySelection();
  }
}

export function formatGeoLabel(s: GeoSelection): string {
  if (s.cityName && s.regionName && s.countryName) {
    return `${s.countryName} / ${s.regionName} / ${s.cityName}`;
  }
  if (s.regionName && s.countryName) {
    return `${s.countryName} / ${s.regionName}`;
  }
  if (s.countryName) {
    return s.countryName;
  }
  return "Локация";
}

type Ctx = {
  selection: GeoSelection;
  setSelection: (s: GeoSelection) => void;
  label: string;
};

const LocationPreferenceContext = createContext<Ctx | null>(null);

export function LocationPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelectionState] = useState<GeoSelection>(emptySelection);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSelectionState(loadFromStorage());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const setSelection = useCallback((s: GeoSelection) => {
    setSelectionState(s);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, []);

  const label = useMemo(() => formatGeoLabel(selection), [selection]);

  const value = useMemo(
    () => ({ selection, setSelection, label }),
    [selection, setSelection, label],
  );

  return (
    <LocationPreferenceContext.Provider value={value}>{children}</LocationPreferenceContext.Provider>
  );
}

export function useLocationPreference() {
  const ctx = useContext(LocationPreferenceContext);
  if (!ctx) throw new Error("useLocationPreference outside provider");
  return ctx;
}
