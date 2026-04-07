"use client";

import { FormEvent, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site";

export default function SuperAdminPage() {
  const [locationMsg, setLocationMsg] = useState("");
  const [currencyMsg, setCurrencyMsg] = useState("");

  async function onCreateLocation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      country: String(fd.get("country") ?? ""),
      region: String(fd.get("region") ?? ""),
      city: String(fd.get("city") ?? ""),
    };
    const response = await fetch("/api/admin/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLocationMsg(response.ok ? "Локация сохранена" : "Ошибка сохранения");
  }

  async function onSaveCurrency(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: String(fd.get("code") ?? "USD"),
      symbol: String(fd.get("symbol") ?? "$"),
      rateToUsd: Number(fd.get("rateToUsd") ?? 1),
    };
    const response = await fetch("/api/admin/currencies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setCurrencyMsg(response.ok ? "Курс обновлен" : "Ошибка обновления");
  }

  return (
    <>
      <SiteHeader />
      <main className="container-1600 flex-1 py-8">
        <h1 className="mb-6 text-3xl font-semibold">Панель администратора</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[8px] border border-[#ececec] p-4">
            <h2 className="mb-4 text-xl font-semibold">Локации</h2>
            <form className="space-y-2" onSubmit={onCreateLocation}>
              <input className="field w-full outline-none" name="country" placeholder="Страна" />
              <input className="field w-full outline-none" name="region" placeholder="Регион" />
              <input className="field w-full outline-none" name="city" placeholder="Город/НП" />
              <button type="submit" className="btn-accent">
                Добавить локацию
              </button>
              <p className="text-sm text-[#757575]">{locationMsg}</p>
            </form>
          </section>

          <section className="rounded-[8px] border border-[#ececec] p-4">
            <h2 className="mb-4 text-xl font-semibold">Курсы валют к USD</h2>
            <form className="space-y-2" onSubmit={onSaveCurrency}>
              <select name="code" className="field w-full outline-none">
                <option>USD</option>
                <option>RUB</option>
                <option>EUR</option>
                <option>TRY</option>
              </select>
              <input className="field w-full outline-none" name="symbol" placeholder="Символ" />
              <input className="field w-full outline-none" name="rateToUsd" placeholder="Курс к USD" />
              <button type="submit" className="btn-accent">
                Сохранить курс
              </button>
              <p className="text-sm text-[#757575]">{currencyMsg}</p>
            </form>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
