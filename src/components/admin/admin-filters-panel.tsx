"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminUi } from "@/context/admin-ui-context";
import { adminJsonResult } from "@/lib/admin-json-result";
import { FILTER_PROPERTY_TYPES } from "@/lib/property-types";

type FilterRow = {
  id: string;
  propertyType: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  options?: string[] | null;
  sortOrder: number;
};

export function AdminFiltersPanel() {
  const { run } = useAdminUi();
  const [propertyType, setPropertyType] = useState<string>(FILTER_PROPERTY_TYPES[0].value);
  const [filters, setFilters] = useState<FilterRow[]>([]);

  const load = useCallback(async () => {
    const r = await fetch(
      `/api/admin/filters?propertyType=${encodeURIComponent(propertyType)}`,
      { credentials: "include" },
    );
    const j = (await r.json()) as { ok?: boolean; data?: { filters?: FilterRow[] } };
    if (j.ok && j.data?.filters) setFilters(j.data.filters);
  }, [propertyType]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fieldKey = String(fd.get("fieldKey") ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const label = String(fd.get("label") ?? "").trim();
    const fieldType = String(fd.get("fieldType") ?? "text") as "text" | "number" | "select";
    const optionsRaw = String(fd.get("options") ?? "").trim();
    const options =
      fieldType === "select" && optionsRaw
        ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
    if (!fieldKey || !label) return;
    const form = e.currentTarget;
    const pt = propertyType;
    await run(
      async () => {
        const r = await fetch("/api/admin/filters", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyType: pt,
            fieldKey,
            label,
            fieldType,
            options,
          }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) {
          form.reset();
          await load();
        }
        return out;
      },
      { ok: "Фильтр добавлен", fail: "Не удалось добавить фильтр" },
    );
  }

  async function onDelete(id: string) {
    if (!confirm("Удалить фильтр? Значения в объявлениях будут стёрты.")) return;
    await run(
      async () => {
        const r = await fetch(`/api/admin/filters/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const out = await adminJsonResult(r);
        if (out.ok) await load();
        return out;
      },
      { ok: "Фильтр удалён", fail: "Не удалось удалить фильтр" },
    );
  }

  async function rename(id: string, currentLabel: string) {
    const label = window.prompt("Подпись поля", currentLabel);
    if (!label?.trim()) return;
    await run(
      async () => {
        const r = await fetch(`/api/admin/filters/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: label.trim() }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) await load();
        return out;
      },
      { ok: "Подпись сохранена", fail: "Не удалось сохранить" },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTER_PROPERTY_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setPropertyType(t.value)}
            className={`rounded-[8px] border-2 px-3 py-2 text-sm ${
              propertyType === t.value
                ? "border-[#22262a] bg-[#f2f1f0]"
                : "border-transparent bg-[#f2f1f0] hover:border-[#a4a4a4]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <section className="rounded-[8px] border border-[#ececec] p-4">
        <h2 className="mb-3 text-lg font-normal">Новый фильтр</h2>
        <form className="grid gap-2 md:grid-cols-2" onSubmit={onAdd}>
          <input
            className="field outline-none"
            name="fieldKey"
            placeholder="Ключ (латиница, напр. total_area)"
            required
            pattern="[a-z0-9_]+"
          />
          <input className="field outline-none" name="label" placeholder="Подпись" required />
          <select className="field outline-none" name="fieldType" defaultValue="text">
            <option value="text">Текст</option>
            <option value="number">Число</option>
            <option value="select">Список</option>
          </select>
          <input
            className="field outline-none"
            name="options"
            placeholder="Для списка: варианты через запятую"
          />
          <div className="md:col-span-2">
            <button type="submit" className="btn-accent">
              Добавить
            </button>
          </div>
        </form>
      </section>
      <ul className="space-y-2">
        {filters.map((f) => (
          <li
            key={f.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#ececec] p-3 text-sm"
          >
            <div>
              <span className="font-normal">{f.label}</span>{" "}
              <span className="text-[#757575]">
                ({f.fieldKey}, {f.fieldType}
                {f.options?.length ? `: ${f.options.join(", ")}` : ""})
              </span>
              <button
                type="button"
                className="ml-2 text-xs text-[#757575] underline"
                onClick={() => void rename(f.id, f.label)}
              >
                переименовать
              </button>
            </div>
            <button
              type="button"
              className="text-red-600 underline"
              onClick={() => void onDelete(f.id)}
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
