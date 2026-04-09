"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListingGrid } from "@/components/listing-grid";
import { FILTER_PROPERTY_TYPES } from "@/lib/property-types";

type FilterDef = {
  fieldKey: string;
  label: string;
  fieldType: string;
  options?: string[];
};

function formatGroupedDigits(v: string) {
  const clean = v.replace(/[^\d]/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString("ru-RU");
}

function CatalogClientInner() {
  const searchParams = useSearchParams();
  const [propertyType, setPropertyType] = useState(
    () => searchParams.get("propertyType") ?? "",
  );
  const [filterDefs, setFilterDefs] = useState<FilterDef[]>([]);
  const [filterVals, setFilterVals] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      setFilterVals({});
      void (async () => {
        if (!propertyType) {
          if (!cancelled) setFilterDefs([]);
          return;
        }
        const r = await fetch(`/api/public/filters?propertyType=${encodeURIComponent(propertyType)}`);
        const j = (await r.json()) as { ok?: boolean; data?: { filters?: FilterDef[] } };
        if (cancelled || !j.ok || !j.data?.filters) return;
        setFilterDefs(j.data.filters);
      })();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [propertyType]);

  const extraQuery = useMemo(() => {
    const p = new URLSearchParams();
    const mode = searchParams.get("mode");
    if (mode) p.set("mode", mode);
    const pt = propertyType || searchParams.get("propertyType") || "";
    if (pt) p.set("propertyType", pt);
    for (const [k, v] of Object.entries(filterVals)) {
      if (v.trim()) p.set(`filter_${k}`, v.trim());
    }
    return p.toString();
  }, [propertyType, filterVals, searchParams]);

  return (
    <main className="container-1600 flex flex-1 flex-col gap-6 py-8 md:flex-row">
        <aside className="w-full shrink-0 rounded-[8px] border border-[#ececec] p-4 md:w-[300px]">
          <h2 className="mb-3 text-lg font-semibold">Фильтры</h2>
          <label className="mb-1 block text-sm text-[#757575]">Тип недвижимости</label>
          <select
            className="field mb-4 w-full outline-none"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="">Все типы</option>
            {FILTER_PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {filterDefs.map((fd) => (
            <div key={fd.fieldKey} className="mb-3">
              <label className="mb-1 block text-xs text-[#757575]">{fd.label}</label>
              {fd.fieldType === "select" && fd.options?.length ? (
                <select
                  className="field w-full outline-none"
                  value={filterVals[fd.fieldKey] ?? ""}
                  onChange={(e) =>
                    setFilterVals((p) => ({ ...p, [fd.fieldKey]: e.target.value }))
                  }
                >
                  <option value="">Любое</option>
                  {fd.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="field w-full outline-none"
                  type="text"
                  value={
                    fd.fieldType === "number"
                      ? formatGroupedDigits(filterVals[fd.fieldKey] ?? "")
                      : (filterVals[fd.fieldKey] ?? "")
                  }
                  onChange={(e) =>
                    setFilterVals((p) => ({
                      ...p,
                      [fd.fieldKey]:
                        fd.fieldType === "number"
                          ? e.target.value.replace(/[^\d]/g, "")
                          : e.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </aside>
        <section className="min-w-0 flex-1">
          <ListingGrid variant="catalog" extraQuery={extraQuery} />
        </section>
    </main>
  );
}

/** Сброс состояния фильтров при смене query (ссылки из шапки и т.д.). */
export function CatalogClient() {
  const sp = useSearchParams();
  return <CatalogClientInner key={sp.toString()} />;
}
