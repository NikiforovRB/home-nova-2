"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ModalCloseButton } from "@/components/modal-close-button";
import { useLocationPreference, type GeoSelection } from "@/context/location-preference-context";

type City = { id: string; name: string };
type Region = { id: string; name: string; cities: City[] };
type Country = { id: string; name: string; regions: Region[] };

type Props = {
  open: boolean;
  onClose: () => void;
};

export function LocationPickerModal({ open, onClose }: Props) {
  const titleId = useId();
  const { selection, setSelection } = useLocationPreference();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<GeoSelection>(selection);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(selection);
      setExpandedRegions({});
    }
  }, [open, selection]);

  useEffect(() => {
    if (!open) return;
    let c = false;
    const id = requestAnimationFrame(() => {
      setLoading(true);
      void (async () => {
        try {
          const r = await fetch("/api/public/geo");
          const j = (await r.json()) as { ok?: boolean; data?: { countries?: Country[] } };
          if (!c && j.ok && j.data?.countries) setCountries(j.data.countries);
        } finally {
          if (!c) setLoading(false);
        }
      })();
    });
    return () => {
      c = true;
      cancelAnimationFrame(id);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => panelRef.current?.querySelector("button")?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const selectCountry = useCallback((co: Country) => {
    setDraft({
      countryId: co.id,
      countryName: co.name,
      regionId: null,
      regionName: null,
      cityId: null,
      cityName: null,
    });
  }, []);

  const selectRegion = useCallback((co: Country, reg: Region) => {
    setDraft({
      countryId: co.id,
      countryName: co.name,
      regionId: reg.id,
      regionName: reg.name,
      cityId: null,
      cityName: null,
    });
  }, []);

  const selectCity = useCallback((co: Country, reg: Region, city: City) => {
    setDraft({
      countryId: co.id,
      countryName: co.name,
      regionId: reg.id,
      regionName: reg.name,
      cityId: city.id,
      cityName: city.name,
    });
  }, []);

  function toggleRegionCities(regionId: string) {
    setExpandedRegions((prev) => ({ ...prev, [regionId]: !prev[regionId] }));
  }

  function applyCountryOnly(co: Country) {
    setSelection({
      countryId: co.id,
      countryName: co.name,
      regionId: null,
      regionName: null,
      cityId: null,
      cityName: null,
    });
    onClose();
  }

  function applyDraft() {
    setSelection(draft);
    onClose();
  }

  if (!open) return null;

  const activeCountry = countries.find((c) => c.id === draft.countryId);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16 md:pt-24"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-[8px] border border-[#ececec] bg-white p-6 shadow-lg sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">
            Выбор локации
          </h2>
          <ModalCloseButton onClose={onClose} />
        </div>

        {loading ? (
          <p className="text-sm text-[#757575]">Загрузка…</p>
        ) : (
          <>
            <p className="mb-2 text-xs text-[#757575]">Страна</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {countries.map((co) => (
                <button
                  key={co.id}
                  type="button"
                  onClick={() => selectCountry(co)}
                  className={`rounded-[8px] border-2 px-3 py-1.5 text-sm ${
                    draft.countryId === co.id
                      ? "border-[#22262a] bg-[#f2f1f0]"
                      : "border-transparent bg-[#f2f1f0] hover:border-[#a4a4a4]"
                  }`}
                >
                  {co.name}
                </button>
              ))}
            </div>

            {draft.countryId && activeCountry && (
              <button
                type="button"
                className="mb-4 w-full text-left text-sm text-[#0c78ed] underline decoration-[#0c78ed]/50 underline-offset-[6px] transition-colors hover:decoration-[#0c78ed]/80"
                onClick={() => applyCountryOnly(activeCountry)}
              >
                Выбрать всю страну: «{activeCountry.name}»
              </button>
            )}

            {draft.countryId && activeCountry && (
              <>
                <p className="mb-2 text-xs text-[#757575]">Регионы</p>
                <ul className="mb-4 max-h-[42vh] space-y-2 overflow-y-auto">
                  {activeCountry.regions.map((reg) => {
                    const expanded = !!expandedRegions[reg.id];
                    const hasCities = reg.cities.length > 0;
                    return (
                      <li key={reg.id} className="rounded-[8px] border border-[#ececec] p-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className={`min-w-0 flex-1 text-left text-sm font-medium hover:text-[#0c78ed] ${
                              draft.regionId === reg.id && !draft.cityId ? "text-[#0c78ed]" : ""
                            }`}
                            onClick={() => selectRegion(activeCountry, reg)}
                          >
                            {reg.name}
                          </button>
                          {hasCities && (
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#757575] hover:bg-[#f2f1f0] hover:text-[#151515]"
                              aria-expanded={expanded}
                              aria-label={expanded ? "Свернуть населённые пункты" : "Развернуть населённые пункты"}
                              onClick={() => toggleRegionCities(reg.id)}
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transition-transform ${expanded ? "rotate-180" : "-rotate-90"}`}
                                aria-hidden
                              >
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {hasCities && expanded && (
                          <ul className="mt-2 ml-1 space-y-1 border-l border-[#ececec] pl-3">
                            {reg.cities.map((city) => (
                              <li key={city.id}>
                                <button
                                  type="button"
                                  className={`text-sm hover:text-[#0c78ed] ${
                                    draft.cityId === city.id ? "font-semibold text-[#0c78ed]" : ""
                                  }`}
                                  onClick={() => selectCity(activeCountry, reg, city)}
                                >
                                  {city.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div className="flex flex-col gap-2 border-t border-[#ececec] pt-4">
              <button type="button" className="btn-accent w-fit" onClick={applyDraft}>
                Применить выбор
              </button>
              <p className="text-xs text-[#757575]">
                Выберите страну, при необходимости регион и город, затем «Применить выбор». Либо
                нажмите «Выбрать всю страну».
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
