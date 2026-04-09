"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY_V2 = "homenova_geo_selection_v2";
const STORAGE_KEY_V1 = "homenova_geo_selection_v1";

export type GeoRegionPick = { id: string; name: string };
export type GeoCityPick = { id: string; name: string; regionId: string };

export type GeoSelection = {
  countryId: string | null;
  countryName: string | null;
  regions: GeoRegionPick[];
  cities: GeoCityPick[];
};

function emptySelection(): GeoSelection {
  return {
    countryId: null,
    countryName: null,
    regions: [],
    cities: [],
  };
}

type LegacyV1 = {
  countryId?: string | null;
  countryName?: string | null;
  regionId?: string | null;
  regionName?: string | null;
  cityId?: string | null;
  cityName?: string | null;
};

function migrateV1ToV2(p: LegacyV1): GeoSelection {
  const countryId = p.countryId ?? null;
  const countryName = p.countryName ?? null;
  const regions: GeoRegionPick[] = [];
  const cities: GeoCityPick[] = [];
  if (p.regionId) {
    regions.push({ id: p.regionId, name: p.regionName ?? "" });
  }
  if (p.cityId && p.regionId) {
    cities.push({
      id: p.cityId,
      name: p.cityName ?? "",
      regionId: p.regionId,
    });
  }
  return { countryId, countryName, regions, cities };
}

function normalizeV2(raw: unknown): GeoSelection {
  if (!raw || typeof raw !== "object") return emptySelection();
  const o = raw as Record<string, unknown>;
  const regions = Array.isArray(o.regions)
    ? (o.regions as GeoRegionPick[]).filter((r) => r && typeof r.id === "string")
    : [];
  const cities = Array.isArray(o.cities)
    ? (o.cities as GeoCityPick[]).filter((c) => c && typeof c.id === "string" && typeof c.regionId === "string")
    : [];
  return {
    countryId: typeof o.countryId === "string" ? o.countryId : null,
    countryName: typeof o.countryName === "string" ? o.countryName : null,
    regions,
    cities,
  };
}

function loadFromStorage(): GeoSelection {
  if (typeof window === "undefined") return emptySelection();
  try {
    const raw2 = localStorage.getItem(STORAGE_KEY_V2);
    if (raw2) return normalizeV2(JSON.parse(raw2) as unknown);
    const raw1 = localStorage.getItem(STORAGE_KEY_V1);
    if (raw1) {
      const migrated = migrateV1ToV2(JSON.parse(raw1) as LegacyV1);
      try {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
      } catch {
        /* ignore */
      }
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return emptySelection();
}

export function formatGeoLabel(s: GeoSelection): string {
  if (!s.countryName) {
    return "Локация";
  }
  if (s.cities.length > 0) {
    const names = s.cities.map((c) => c.name).filter(Boolean);
    if (names.length === 0) return s.countryName;
    if (names.length <= 2) {
      return `${s.countryName} · ${names.join(", ")}`;
    }
    return `${s.countryName} · ${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }
  if (s.regions.length > 0) {
    const names = s.regions.map((r) => r.name).filter(Boolean);
    if (names.length === 0) return s.countryName;
    if (names.length <= 2) {
      return `${s.countryName} · ${names.join(", ")}`;
    }
    return `${s.countryName} · ${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }
  return s.countryName;
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
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(s));
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
