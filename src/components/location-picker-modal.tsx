"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ModalCloseButton } from "@/components/modal-close-button";
import {
  useLocationPreference,
  type GeoCityPick,
  type GeoRegionPick,
  type GeoSelection,
} from "@/context/location-preference-context";

type City = { id: string; name: string };
type Region = { id: string; name: string; cities: City[] };
type Country = { id: string; name: string; regions: Region[] };

type Props = {
  open: boolean;
  onClose: () => void;
};

function BlueCheck({ className }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 text-[#0c78ed] ${className ?? ""}`}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LocationPickerModal({ open, onClose }: Props) {
  const titleId = useId();
  const { selection, setSelection } = useLocationPreference();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<GeoSelection>(selection);
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(selection);
      setExpandedRegionId(null);
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
      regions: [],
      cities: [],
    });
  }, []);

  const toggleDraftRegion = useCallback((reg: Region) => {
    setDraft((d) => {
      const has = d.regions.some((r) => r.id === reg.id);
      if (has) {
        return {
          ...d,
          regions: d.regions.filter((r) => r.id !== reg.id),
          cities: d.cities.filter((c) => c.regionId !== reg.id),
        };
      }
      const next: GeoRegionPick[] = [...d.regions, { id: reg.id, name: reg.name }];
      return { ...d, regions: next };
    });
  }, []);

  const toggleDraftCity = useCallback((reg: Region, city: City) => {
    setDraft((d) => {
      const has = d.cities.some((c) => c.id === city.id);
      if (has) {
        return { ...d, cities: d.cities.filter((c) => c.id !== city.id) };
      }
      const next: GeoCityPick[] = [
        ...d.cities,
        { id: city.id, name: city.name, regionId: reg.id },
      ];
      return { ...d, cities: next };
    });
  }, []);

  function toggleRegionCities(regionId: string) {
    setExpandedRegionId((prev) => (prev === regionId ? null : regionId));
  }

  function resetRegionsAndCities() {
    setDraft((d) => ({ ...d, regions: [], cities: [] }));
  }

  function applyCountryOnly(co: Country) {
    setSelection({
      countryId: co.id,
      countryName: co.name,
      regions: [],
      cities: [],
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
      className="fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-black/40 pt-16 md:pt-24"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="container-1600 w-full max-w-full px-0">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="mb-10 w-full rounded-[8px] border border-[#ececec] bg-white p-6 shadow-lg sm:p-8"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-normal text-[#151515]">
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
                        ? "border-[#22262a] bg-[#f2f1f0] text-[#0c78ed]"
                        : "border-transparent bg-[#f2f1f0] text-[#151515] hover:border-[#a4a4a4]"
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
                  <ul className="mb-4 grid max-h-[48vh] grid-cols-2 items-start gap-2 overflow-y-auto sm:grid-cols-4">
                    {activeCountry.regions.map((reg) => {
                      const expanded = expandedRegionId === reg.id;
                      const hasCities = reg.cities.length > 0;
                      const regionOn = draft.regions.some((r) => r.id === reg.id);
                      const selectedCitiesInRegion = draft.cities.filter((c) => c.regionId === reg.id).length;
                      return (
                        <li key={reg.id} className="self-start rounded-[8px] border border-[#ececec] p-2">
                          <div className="flex items-center gap-1">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <button
                                type="button"
                                className={`flex min-w-0 flex-1 items-center gap-2 text-left text-sm ${
                                  regionOn ? "text-[#0c78ed]" : "text-[#151515] hover:text-[#0c78ed]"
                                }`}
                                onClick={() => toggleDraftRegion(reg)}
                              >
                                {regionOn ? <BlueCheck /> : <span className="inline-block w-[18px] shrink-0" />}
                                <span className="min-w-0 break-words">{reg.name}</span>
                              </button>
                              {selectedCitiesInRegion >= 1 ? (
                                <span className="shrink-0 whitespace-nowrap text-sm font-normal text-[#a4a4a4]">
                                  Выбрано: {selectedCitiesInRegion}
                                </span>
                              ) : null}
                            </div>
                            {hasCities && (
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-[6px] text-[#757575] hover:bg-[#f2f1f0] hover:text-[#151515]"
                                aria-expanded={expanded}
                                aria-label={
                                  expanded ? "Свернуть населённые пункты" : "Развернуть населённые пункты"
                                }
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
                            <ul className="mt-2 space-y-1 border-t border-[#ececec] pt-2">
                              {reg.cities.map((city) => {
                                const cityOn = draft.cities.some((c) => c.id === city.id);
                                return (
                                  <li key={city.id}>
                                    <button
                                      type="button"
                                      className={`flex w-full items-center gap-2 text-left text-sm ${
                                        cityOn ? "text-[#0c78ed]" : "text-[#151515] hover:text-[#0c78ed]"
                                      }`}
                                      onClick={() => toggleDraftCity(reg, city)}
                                    >
                                      {cityOn ? <BlueCheck /> : <span className="inline-block w-[18px] shrink-0" />}
                                      <span>{city.name}</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="btn-accent w-fit" onClick={applyDraft}>
                    Применить выбор
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border border-[#ececec] bg-white px-4 text-sm text-[#a4a4a4] transition-colors hover:bg-[#f2f1f0]"
                    onClick={resetRegionsAndCities}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/close.svg" alt="" width={16} height={16} className="shrink-0" />
                    Сбросить все фильтры
                  </button>
                </div>
                <p className="text-xs text-[#757575]">
                  Выберите страну, затем отметьте один или несколько регионов и при необходимости населённые
                  пункты, и нажмите «Применить выбор». Либо нажмите «Выбрать всю страну».
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
