"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminUi } from "@/context/admin-ui-context";
import { adminJsonResult } from "@/lib/admin-json-result";

type RateRow = {
  code: string;
  name: string;
  symbol: string;
  rateToUsd: string;
  updatedAt?: string;
};

export function AdminCurrenciesPanel() {
  const { run } = useAdminUi();
  const [rates, setRates] = useState<RateRow[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/currencies", { credentials: "include" });
    const j = (await r.json()) as { ok?: boolean; data?: { rates?: RateRow[] } };
    if (j.ok && j.data?.rates) setRates(j.data.rates);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: String(fd.get("code") ?? ""),
      symbol: String(fd.get("symbol") ?? ""),
      rateToUsd: Number(fd.get("rateToUsd") ?? 1),
    };
    await run(
      async () => {
        const r = await fetch("/api/admin/currencies", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const out = await adminJsonResult(r);
        if (out.ok) await load();
        return out;
      },
      { ok: "Курс сохранён", fail: "Не удалось сохранить курс" },
    );
  }

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: String(fd.get("code") ?? "").toUpperCase(),
      name: String(fd.get("name") ?? ""),
      symbol: String(fd.get("symbol") ?? ""),
      rateToUsd: Number(fd.get("rateToUsd") ?? 1),
    };
    const form = e.currentTarget;
    await run(
      async () => {
        const r = await fetch("/api/admin/currencies", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const out = await adminJsonResult(r);
        if (out.ok) {
          form.reset();
          await load();
        }
        return out;
      },
      { ok: "Валюта добавлена", fail: "Не удалось добавить валюту" },
    );
  }

  async function onDelete(code: string) {
    if (!confirm(`Удалить валюту ${code}?`)) return;
    await run(
      async () => {
        const r = await fetch(
          `/api/admin/currencies?code=${encodeURIComponent(code)}`,
          { method: "DELETE", credentials: "include" },
        );
        const out = await adminJsonResult(r);
        if (out.ok) await load();
        return out;
      },
      { ok: "Валюта удалена", fail: "Не удалось удалить валюту" },
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[8px] border border-[#ececec] p-4">
        <h2 className="mb-4 text-lg font-normal">Текущие курсы (к USD)</h2>
        <div className="space-y-6">
          {rates.map((row) => (
            <form
              key={row.code}
              className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-[#ececec] pb-6"
              onSubmit={onSave}
            >
              <input type="hidden" name="code" value={row.code} />
              <div>
                <label className="mb-1 block text-xs text-[#757575]">Код</label>
                <div className="field min-w-[72px] bg-[#f2f1f0]">{row.code}</div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#757575]">Название</label>
                <div className="text-sm">{row.name}</div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#757575]">Символ</label>
                <input
                  className="field w-20 outline-none"
                  name="symbol"
                  defaultValue={row.symbol}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#757575]">Курс к USD</label>
                <input
                  className="field w-36 outline-none"
                  name="rateToUsd"
                  type="number"
                  step="any"
                  min={0}
                  required
                  defaultValue={row.rateToUsd}
                />
              </div>
              <div className="flex items-center gap-2 self-end">
                <button type="submit" className="btn-accent inline-flex items-center justify-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/save-white.svg" alt="" width={16} height={16} className="shrink-0" />
                  Сохранить
                </button>
                <button
                  type="button"
                  className="group inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[8px] border border-transparent text-[#151515] outline-none transition-colors hover:bg-[#f2f1f0]"
                  aria-label={`Удалить валюту ${row.code}`}
                  onClick={() => void onDelete(row.code)}
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
              </div>
            </form>
          ))}
        </div>
      </section>
      <section className="rounded-[8px] border border-[#ececec] p-4">
        <h2 className="mb-3 text-lg font-normal">Новая валюта</h2>
        <form className="flex flex-wrap items-end gap-x-6 gap-y-3" onSubmit={onAdd}>
          <div>
            <label className="mb-1 block text-xs text-[#757575]">Код</label>
            <input className="field w-24 outline-none" name="code" placeholder="Код" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#757575]">Название</label>
            <input className="field min-w-[140px] outline-none" name="name" placeholder="Название" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#757575]">Символ</label>
            <input className="field w-20 outline-none" name="symbol" placeholder="₿" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#757575]">Курс к USD</label>
            <input
              className="field w-36 outline-none"
              name="rateToUsd"
              type="number"
              step="any"
              min={0}
              placeholder="1"
              required
            />
          </div>
          <button type="submit" className="btn-accent">
            Добавить
          </button>
        </form>
      </section>
    </div>
  );
}
