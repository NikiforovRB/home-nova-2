"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminUi } from "@/context/admin-ui-context";
import { adminJsonResult } from "@/lib/admin-json-result";

type Country = { id: string; name: string; sortOrder: number };
type Region = { id: string; countryId: string; name: string; sortOrder: number };
type City = { id: string; regionId: string; name: string; sortOrder: number };

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  const r = await fetch(url, { credentials: "include", ...init });
  const j = (await r.json()) as { ok?: boolean; data?: T };
  if (!r.ok || !j.ok) return null;
  return j.data ?? null;
}

export function AdminLocationsPanel() {
  const { run } = useAdminUi();
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState<string>("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [citiesByRegion, setCitiesByRegion] = useState<Record<string, City[]>>({});
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const loadCountries = useCallback(async () => {
    const d = await adminFetch<{ countries: Country[] }>("/api/admin/geo/countries");
    if (!d?.countries) return;
    setCountries(d.countries);
    setCountryId((prev) => {
      if (prev && d!.countries.some((c) => c.id === prev)) return prev;
      return d!.countries[0]?.id ?? "";
    });
  }, []);

  const loadRegions = useCallback(async (cid: string) => {
    if (!cid) {
      setRegions([]);
      return;
    }
    const d = await adminFetch<{ regions: Region[] }>(
      `/api/admin/geo/regions?countryId=${encodeURIComponent(cid)}`,
    );
    setRegions(d?.regions ?? []);
    setCitiesByRegion({});
    setExpandedRegion(null);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadCountries();
    });
    return () => cancelAnimationFrame(id);
  }, [loadCountries]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadRegions(countryId);
    });
    return () => cancelAnimationFrame(id);
  }, [countryId, loadRegions]);

  async function loadCities(regionId: string) {
    const d = await adminFetch<{ cities: City[] }>(
      `/api/admin/geo/cities?regionId=${encodeURIComponent(regionId)}`,
    );
    setCitiesByRegion((prev) => ({ ...prev, [regionId]: d?.cities ?? [] }));
  }

  function toggleRegion(rid: string) {
    if (expandedRegion === rid) {
      setExpandedRegion(null);
      return;
    }
    setExpandedRegion(rid);
    void loadCities(rid);
  }

  async function onAddCountry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const form = e.currentTarget;
    await run(
      async () => {
        const r = await fetch("/api/admin/geo/countries", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) {
          form.reset();
          await loadCountries();
        }
        return out;
      },
      { ok: "Страна добавлена", fail: "Не удалось добавить страну" },
    );
  }

  async function onAddRegion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!countryId) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const form = e.currentTarget;
    const cid = countryId;
    await run(
      async () => {
        const r = await fetch("/api/admin/geo/regions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countryId: Number(cid), name }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) {
          form.reset();
          await loadRegions(cid);
        }
        return out;
      },
      { ok: "Регион добавлен", fail: "Не удалось добавить регион" },
    );
  }

  async function onAddCity(e: FormEvent<HTMLFormElement>, regionId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const form = e.currentTarget;
    await run(
      async () => {
        const r = await fetch("/api/admin/geo/cities", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regionId: Number(regionId), name }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) {
          form.reset();
          await loadCities(regionId);
        }
        return out;
      },
      { ok: "Населённый пункт добавлен", fail: "Не удалось добавить населённый пункт" },
    );
  }

  async function renameCountry(id: string, current: string) {
    const name = window.prompt("Название страны", current);
    if (!name?.trim()) return;
    await run(
      async () => {
        const r = await fetch(`/api/admin/geo/countries/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) await loadCountries();
        return out;
      },
      { ok: "Страна переименована", fail: "Не удалось сохранить" },
    );
  }

  async function renameRegion(id: string, current: string) {
    const name = window.prompt("Название региона", current);
    if (!name?.trim()) return;
    const cid = countryId;
    await run(
      async () => {
        const r = await fetch(`/api/admin/geo/regions/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) await loadRegions(cid);
        return out;
      },
      { ok: "Регион переименован", fail: "Не удалось сохранить" },
    );
  }

  async function renameCity(id: string, regionId: string, current: string) {
    const name = window.prompt("Название населённого пункта", current);
    if (!name?.trim()) return;
    await run(
      async () => {
        const r = await fetch(`/api/admin/geo/cities/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) await loadCities(regionId);
        return out;
      },
      { ok: "Населённый пункт переименован", fail: "Не удалось сохранить" },
    );
  }

  async function delCountry(id: string) {
    if (!confirm("Удалить страну и все регионы и города?")) return;
    await run(
      async () => {
        const r = await fetch(`/api/admin/geo/countries/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const out = await adminJsonResult(r);
        if (out.ok) await loadCountries();
        return out;
      },
      {
        ok: "Страна удалена",
        fail: "Не удалось удалить (возможно, есть объявления в городах)",
      },
    );
  }

  async function delRegion(id: string) {
    if (!confirm("Удалить регион и города?")) return;
    const cid = countryId;
    await run(
      async () => {
        const r = await fetch(`/api/admin/geo/regions/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const out = await adminJsonResult(r);
        if (out.ok) await loadRegions(cid);
        return out;
      },
      { ok: "Регион удалён", fail: "Не удалось удалить регион" },
    );
  }

  async function delCity(id: string, regionId: string) {
    if (!confirm("Удалить населённый пункт?")) return;
    await run(
      async () => {
        const r = await fetch(`/api/admin/geo/cities/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const out = await adminJsonResult(r);
        if (out.ok) await loadCities(regionId);
        return out;
      },
      {
        ok: "Населённый пункт удалён",
        fail: "Не удалось удалить (возможно, есть объявления)",
      },
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[8px] border border-[#ececec] p-4">
        <h2 className="mb-3 text-lg font-semibold">Страны</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {countries.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCountryId(c.id)}
                className={`rounded-[8px] border-2 px-3 py-2 text-sm ${
                  countryId === c.id
                    ? "border-[#22262a] bg-[#f2f1f0]"
                    : "border-transparent hover:border-[#a4a4a4]"
                }`}
              >
                {c.name}
              </button>
              <button
                type="button"
                className="text-xs text-[#757575] underline"
                onClick={() => void renameCountry(c.id, c.name)}
              >
                правка
              </button>
            </span>
          ))}
        </div>
        <form className="flex flex-wrap items-end gap-2" onSubmit={onAddCountry}>
          <input className="field min-w-[200px] outline-none" name="name" placeholder="Новая страна" />
          <button type="submit" className="btn-accent">
            Добавить страну
          </button>
        </form>
        {countryId && (
          <button
            type="button"
            className="mt-2 text-sm text-red-600 underline"
            onClick={() => void delCountry(countryId)}
          >
            Удалить выбранную страну
          </button>
        )}
      </section>

      {countryId && (
        <section className="rounded-[8px] border border-[#ececec] p-4">
          <h2 className="mb-3 text-lg font-semibold">Регионы</h2>
          <form className="mb-4 flex flex-wrap items-end gap-2" onSubmit={onAddRegion}>
            <input className="field min-w-[200px] outline-none" name="name" placeholder="Новый регион" />
            <button type="submit" className="btn-accent">
              Добавить регион
            </button>
          </form>
          <ul className="space-y-3">
            {regions.map((reg) => (
              <li key={reg.id} className="rounded-[8px] border border-[#ececec] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {reg.name}{" "}
                    <button
                      type="button"
                      className="ml-1 text-xs font-normal text-[#757575] underline"
                      onClick={() => void renameRegion(reg.id, reg.name)}
                    >
                      правка
                    </button>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-sm text-[#0c78ed] underline"
                      onClick={() => toggleRegion(reg.id)}
                    >
                      {expandedRegion === reg.id ? "Скрыть города" : "Населённые пункты"}
                    </button>
                    <button
                      type="button"
                      className="text-sm text-red-600 underline"
                      onClick={() => void delRegion(reg.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                {expandedRegion === reg.id && (
                  <div className="mt-3 border-t border-[#ececec] pt-3">
                    <ul className="mb-3 space-y-1">
                      {(citiesByRegion[reg.id] ?? []).map((city) => (
                        <li key={city.id} className="flex items-center justify-between text-sm">
                          <span>
                            {city.name}{" "}
                            <button
                              type="button"
                              className="text-xs text-[#757575] underline"
                              onClick={() => void renameCity(city.id, reg.id, city.name)}
                            >
                              правка
                            </button>
                          </span>
                          <button
                            type="button"
                            className="text-red-600 underline"
                            onClick={() => void delCity(city.id, reg.id)}
                          >
                            Удалить
                          </button>
                        </li>
                      ))}
                    </ul>
                    <form className="flex flex-wrap gap-2" onSubmit={(e) => void onAddCity(e, reg.id)}>
                      <input
                        className="field min-w-[180px] outline-none"
                        name="name"
                        placeholder="Новый населённый пункт"
                      />
                      <button type="submit" className="btn-accent text-sm">
                        Добавить
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
