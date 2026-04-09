"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ModalCloseButton } from "@/components/modal-close-button";
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

function IconEditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="group inline-flex shrink-0 items-center justify-center rounded-[6px] p-1.5 text-[#151515] outline-none transition-colors hover:bg-[#f2f1f0]"
      aria-label={label}
      onClick={onClick}
    >
      <span className="relative inline-block h-[18px] w-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/edit.svg"
          alt=""
          width={18}
          height={18}
          className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/edit-nav.svg"
          alt=""
          width={18}
          height={18}
          className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </span>
    </button>
  );
}

function IconDeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="group inline-flex shrink-0 items-center justify-center rounded-[6px] p-1.5 text-[#151515] outline-none transition-colors hover:bg-[#f2f1f0]"
      onClick={onClick}
      aria-label={label}
    >
      <span className="relative inline-block h-5 w-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/delete.svg"
          alt=""
          width={20}
          height={20}
          className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/delete-nav.svg"
          alt=""
          width={20}
          height={20}
          className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </span>
    </button>
  );
}

function SortableCountryChip({
  c,
  selected,
  onSelect,
  onEdit,
}: {
  c: Country;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const id = `country-${c.id}`;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`inline-flex items-stretch overflow-hidden rounded-[8px] border-2 bg-[#f2f1f0] ${
        selected ? "border-[#22262a]" : "border-transparent hover:border-[#a4a4a4]"
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="group inline-flex shrink-0 cursor-grab touch-none items-center justify-center border-r border-[#dddcdb]/80 px-1.5 active:cursor-grabbing"
        aria-label={`Перетащить: ${c.name}`}
        {...attributes}
        {...listeners}
      >
        <span className="relative inline-block h-5 w-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/drag.svg"
            alt=""
            width={20}
            height={20}
            className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/drag-black.svg"
            alt=""
            width={20}
            height={20}
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </span>
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="px-3 py-2 text-left text-sm text-[#151515]"
      >
        {c.name}
      </button>
      <div className="flex items-stretch border-l border-[#dddcdb]/80">
        <IconEditButton label={`Правка: ${c.name}`} onClick={onEdit} />
      </div>
    </div>
  );
}

function SortableRegionRow({
  reg,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  children,
}: {
  reg: Region;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const id = `region-${reg.id}`;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : 1,
    zIndex: isDragging ? 15 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="rounded-[8px] border border-[#ececec] p-3">
      <div className="flex flex-wrap items-center gap-1">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="group inline-flex shrink-0 cursor-grab touch-none items-center justify-center rounded-[6px] p-1.5 active:cursor-grabbing"
          aria-label={`Перетащить регион: ${reg.name}`}
          {...attributes}
          {...listeners}
        >
          <span className="relative inline-block h-5 w-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/drag.svg"
              alt=""
              width={20}
              height={20}
              className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/drag-black.svg"
              alt=""
              width={20}
              height={20}
              className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </span>
        </button>
        <span className="font-normal">{reg.name}</span>
        <IconEditButton label={`Редактировать: ${reg.name}`} onClick={onEdit} />
        <button
          type="button"
          className="group inline-flex shrink-0 items-center justify-center rounded-[6px] p-1.5 text-[#151515] outline-none transition-colors hover:bg-[#f2f1f0]"
          onClick={onToggleExpand}
          aria-label={expanded ? "Скрыть города" : "Населённые пункты"}
        >
          <span className="relative inline-block h-5 w-5">
            {expanded ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/up.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/up-nav.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/down.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/down-nav.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </>
            )}
          </span>
        </button>
        <IconDeleteButton label={`Удалить регион ${reg.name}`} onClick={onDelete} />
      </div>
      {children}
    </li>
  );
}

function SortableCityRow({
  city,
  regionName,
  onEdit,
  onDelete,
}: {
  city: City;
  regionName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const id = `city-${city.id}`;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : 1,
    zIndex: isDragging ? 12 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="flex flex-wrap items-center gap-2 text-sm">
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="group inline-flex shrink-0 cursor-grab touch-none items-center justify-center rounded-[6px] p-0.5 active:cursor-grabbing"
        aria-label={`Перетащить: ${city.name}`}
        {...attributes}
        {...listeners}
      >
        <span className="relative inline-block h-5 w-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/drag.svg"
            alt=""
            width={20}
            height={20}
            className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/drag-black.svg"
            alt=""
            width={20}
            height={20}
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </span>
      </button>
      <span>{city.name}</span>
      <IconEditButton label={`Редактировать: ${city.name}`} onClick={onEdit} />
      <span className="inline-block w-2.5 shrink-0" aria-hidden />
      <IconDeleteButton
        label={`Удалить населённый пункт ${city.name} (${regionName})`}
        onClick={onDelete}
      />
    </li>
  );
}

export function AdminLocationsPanel() {
  const { run } = useAdminUi();
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState<string>("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [citiesByRegion, setCitiesByRegion] = useState<Record<string, City[]>>({});
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [addCountryOpen, setAddCountryOpen] = useState(false);
  const [editRegionOpen, setEditRegionOpen] = useState<{ id: string; name: string } | null>(null);
  const [editCityOpen, setEditCityOpen] = useState<{ id: string; name: string; regionId: string } | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  async function persistCountryOrder(ordered: Country[]) {
    for (let i = 0; i < ordered.length; i++) {
      const r = await fetch(`/api/admin/geo/countries/${ordered[i].id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: i }),
      });
      const out = await adminJsonResult(r);
      if (!out.ok) {
        await loadCountries();
        return;
      }
    }
  }

  async function persistRegionOrder(ordered: Region[]) {
    for (let i = 0; i < ordered.length; i++) {
      const r = await fetch(`/api/admin/geo/regions/${ordered[i].id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: i }),
      });
      const out = await adminJsonResult(r);
      if (!out.ok) {
        await loadRegions(countryId);
        return;
      }
    }
  }

  async function persistCityOrder(regionId: string, ordered: City[]) {
    for (let i = 0; i < ordered.length; i++) {
      const r = await fetch(`/api/admin/geo/cities/${ordered[i].id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: i }),
      });
      const out = await adminJsonResult(r);
      if (!out.ok) {
        await loadCities(regionId);
        return;
      }
    }
  }

  function onCountriesDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const a = String(active.id);
    const b = String(over.id);
    if (!a.startsWith("country-") || !b.startsWith("country-")) return;
    setCountries((prev) => {
      const oldIndex = prev.findIndex((c) => `country-${c.id}` === a);
      const newIndex = prev.findIndex((c) => `country-${c.id}` === b);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      void persistCountryOrder(next);
      return next;
    });
  }

  function onRegionsDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const a = String(active.id);
    const b = String(over.id);
    if (!a.startsWith("region-") || !b.startsWith("region-")) return;
    setRegions((prev) => {
      const oldIndex = prev.findIndex((r) => `region-${r.id}` === a);
      const newIndex = prev.findIndex((r) => `region-${r.id}` === b);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      void persistRegionOrder(next);
      return next;
    });
  }

  function onCitiesDragEnd(regionId: string, e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const a = String(active.id);
    const b = String(over.id);
    if (!a.startsWith("city-") || !b.startsWith("city-")) return;
    setCitiesByRegion((prev) => {
      const list = prev[regionId] ?? [];
      const oldIndex = list.findIndex((c) => `city-${c.id}` === a);
      const newIndex = list.findIndex((c) => `city-${c.id}` === b);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(list, oldIndex, newIndex);
      void persistCityOrder(regionId, next);
      return { ...prev, [regionId]: next };
    });
  }

  async function onAddCountry(e: FormEvent<HTMLFormElement>, onSuccess?: () => void) {
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
          onSuccess?.();
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

  async function saveRegionFromModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editRegionOpen) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const rid = editRegionOpen.id;
    const cid = countryId;
    await run(
      async () => {
        const r = await fetch(`/api/admin/geo/regions/${rid}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) {
          setEditRegionOpen(null);
          await loadRegions(cid);
        }
        return out;
      },
      { ok: "Регион переименован", fail: "Не удалось сохранить" },
    );
  }

  async function saveCityFromModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editCityOpen) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const { id, regionId } = editCityOpen;
    await run(
      async () => {
        const r = await fetch(`/api/admin/geo/cities/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) {
          setEditCityOpen(null);
          await loadCities(regionId);
        }
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

  const countryIds = countries.map((c) => `country-${c.id}`);
  const regionIds = regions.map((r) => `region-${r.id}`);

  return (
    <div className="space-y-8">
      <section className="rounded-[8px] border border-[#ececec] p-4">
        <h2 className="mb-3 text-lg font-normal">Страны</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCountriesDragEnd}>
          <SortableContext items={countryIds} strategy={rectSortingStrategy}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {countries.map((c) => (
                <SortableCountryChip
                  key={c.id}
                  c={c}
                  selected={countryId === c.id}
                  onSelect={() => setCountryId(c.id)}
                  onEdit={() => void renameCountry(c.id, c.name)}
                />
              ))}
              <button
                type="button"
                className="text-sm text-[#0c78ed] underline decoration-[#0c78ed] underline-offset-2 hover:text-[#0956b5]"
                onClick={() => setAddCountryOpen(true)}
              >
                Добавить новую страну
              </button>
            </div>
          </SortableContext>
        </DndContext>
        {countryId && (
          <button
            type="button"
            className="text-sm text-red-600 underline decoration-[#F33737]/50 decoration-2 underline-offset-[6px]"
            onClick={() => void delCountry(countryId)}
          >
            Удалить выбранную страну
          </button>
        )}
      </section>

      {addCountryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-country-title"
        >
          <div className="relative w-full max-w-md rounded-[8px] bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 id="add-country-title" className="text-lg font-normal">
                Новая страна
              </h2>
              <ModalCloseButton onClose={() => setAddCountryOpen(false)} />
            </div>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => void onAddCountry(e, () => setAddCountryOpen(false))}
            >
              <input
                className="field w-full outline-none"
                name="name"
                placeholder="Новая страна"
                autoComplete="off"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="field px-4" onClick={() => setAddCountryOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-accent">
                  Добавить страну
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editCityOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-city-title"
        >
          <div className="relative w-full max-w-md rounded-[8px] bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 id="edit-city-title" className="text-lg font-normal">
                Редактирование населённого пункта
              </h2>
              <ModalCloseButton onClose={() => setEditCityOpen(null)} />
            </div>
            <form className="flex flex-col gap-3" onSubmit={(e) => void saveCityFromModal(e)}>
              <label className="text-sm text-[#757575]">
                Название
                <input
                  className="field mt-1 w-full outline-none"
                  name="name"
                  defaultValue={editCityOpen.name}
                  required
                  autoComplete="off"
                />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="field px-4" onClick={() => setEditCityOpen(null)}>
                  Отмена
                </button>
                <button type="submit" className="btn-accent inline-flex items-center justify-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/save-white.svg" alt="" width={16} height={16} className="shrink-0" />
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editRegionOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-region-title"
        >
          <div className="relative w-full max-w-md rounded-[8px] bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 id="edit-region-title" className="text-lg font-normal">
                Редактирование региона
              </h2>
              <ModalCloseButton onClose={() => setEditRegionOpen(null)} />
            </div>
            <form className="flex flex-col gap-3" onSubmit={(e) => void saveRegionFromModal(e)}>
              <input type="hidden" name="id" value={editRegionOpen.id} />
              <label className="text-sm text-[#757575]">
                Название
                <input
                  className="field mt-1 w-full outline-none"
                  name="name"
                  defaultValue={editRegionOpen.name}
                  required
                  autoComplete="off"
                />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="field px-4" onClick={() => setEditRegionOpen(null)}>
                  Отмена
                </button>
                <button type="submit" className="btn-accent inline-flex items-center justify-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/save-white.svg" alt="" width={16} height={16} className="shrink-0" />
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {countryId && (
        <section className="rounded-[8px] border border-[#ececec] p-4">
          <h2 className="mb-3 text-lg font-normal">Регионы</h2>
          <form className="mb-4 flex flex-wrap items-end gap-2" onSubmit={(e) => void onAddRegion(e)}>
            <input
              className="field min-w-[min(100%,22rem)] flex-1 outline-none sm:min-w-[22rem]"
              name="name"
              placeholder="Новый регион"
            />
            <button type="submit" className="btn-accent inline-flex items-center justify-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/plus-white.svg" alt="" width={16} height={16} className="shrink-0" />
              Добавить регион
            </button>
          </form>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRegionsDragEnd}>
            <SortableContext items={regionIds} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {regions.map((reg) => (
                  <SortableRegionRow
                    key={reg.id}
                    reg={reg}
                    expanded={expandedRegion === reg.id}
                    onToggleExpand={() => toggleRegion(reg.id)}
                    onEdit={() => setEditRegionOpen({ id: reg.id, name: reg.name })}
                    onDelete={() => void delRegion(reg.id)}
                  >
                    {expandedRegion === reg.id && (
                      <div className="mt-3 border-t border-[#ececec] pt-3">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(ev) => onCitiesDragEnd(reg.id, ev)}
                        >
                          <SortableContext
                            items={(citiesByRegion[reg.id] ?? []).map((c) => `city-${c.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            <ul className="mb-3 space-y-2">
                              {(citiesByRegion[reg.id] ?? []).map((city) => (
                                <SortableCityRow
                                  key={city.id}
                                  city={city}
                                  regionName={reg.name}
                                  onEdit={() =>
                                    setEditCityOpen({ id: city.id, name: city.name, regionId: reg.id })
                                  }
                                  onDelete={() => void delCity(city.id, reg.id)}
                                />
                              ))}
                            </ul>
                          </SortableContext>
                        </DndContext>
                        <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => void onAddCity(e, reg.id)}>
                          <input
                            className="field min-w-[min(100%,22rem)] flex-1 outline-none sm:min-w-[22rem]"
                            name="name"
                            placeholder="Новый населённый пункт"
                          />
                          <button
                            type="submit"
                            className="btn-accent inline-flex items-center justify-center gap-2 text-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icons/plus-white.svg" alt="" width={16} height={16} className="shrink-0" />
                            Добавить
                          </button>
                        </form>
                      </div>
                    )}
                  </SortableRegionRow>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </section>
      )}
    </div>
  );
}
