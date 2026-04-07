"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DateRangeModal } from "@/components/custom-calendar";
import { ListingGrid } from "@/components/listing-grid";
import { filterModes } from "@/lib/mock";

function FavoriteBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetch("/api/me");
      if (!me.ok || cancelled) return;
      const fav = await fetch("/api/favorites");
      if (!fav.ok || cancelled) return;
      const json = (await fav.json()) as { data?: { count?: number } };
      setCount(json.data?.count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className="absolute right-0 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0c78ed] px-1 text-[11px] text-white">
      {count}
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-[#ececec] py-4">
      <div className="container-1600 space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <button type="button" className="flex items-center gap-2 text-[#444]">
            <span aria-hidden>📍</span>
            <span>Москва</span>
          </button>
          <div className="flex gap-2">
            <Link href="/listing/new" className="field inline-flex items-center px-4">
              Разместить объявление
            </Link>
            <Link href="/my-listings" className="field inline-flex items-center px-4">
              Мои объявления
            </Link>
          </div>
        </div>

        <div className="grid items-center gap-3 md:grid-cols-[180px_140px_1fr_auto_auto]">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            HOMENOVA
          </Link>
          <Link href="/catalog" className="btn-accent inline-flex items-center justify-center">
            Каталог
          </Link>
          <div className="field flex items-center gap-2">
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Поиск по объявлениям"
            />
            <button type="button" className="btn-accent h-9 px-3 text-sm">
              Найти
            </button>
          </div>
          <Link
            href="/catalog"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f1f0]"
            aria-label="Избранное"
          >
            <span aria-hidden>❤</span>
            <FavoriteBadge />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f1f0]"
            aria-label="Аккаунт"
          >
            <span aria-hidden>👤</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function HeroFilters() {
  const [mode, setMode] = useState<(typeof filterModes)[number]["id"]>("buy");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isDaily = mode === "daily";
  const isBuyOrLong = mode === "buy" || mode === "rent_long";

  return (
    <section className="container-1600 py-14">
      <h1 className="mb-8 text-center text-4xl font-semibold md:text-6xl">
        Вся недвижимость на одной площадке
      </h1>
      <div className="mb-6 flex justify-center gap-2">
        {filterModes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className="rounded-[8px] px-5 py-3"
            style={{
              backgroundColor: mode === item.id ? "var(--accent)" : "var(--field-bg)",
              color: mode === item.id ? "#fff" : "#151515",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isBuyOrLong && (
        <div className="grid gap-3 md:grid-cols-4">
          <select className="field w-full outline-none">
            <option>Тип недвижимости</option>
            <option>Квартиры</option>
            <option>Комнаты</option>
            <option>Дома, дачи, коттеджи</option>
            <option>Земельные участки</option>
            <option>Гаражи и машиноместа</option>
            <option>Коммерческая недвижимость</option>
          </select>
          <select className="field min-h-[120px] w-full py-1 outline-none" multiple aria-label="Количество комнат, можно выбрать несколько">
            <option>Студия</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5+</option>
            <option>Свободная планировка</option>
          </select>
          <div className="field flex items-center gap-2">
            <input className="w-full bg-transparent outline-none" placeholder="Цена от" />
            <input className="w-full bg-transparent outline-none" placeholder="До" />
          </div>
          <Link href="/catalog" className="btn-accent inline-flex items-center justify-center">
            Показать объявления
          </Link>
        </div>
      )}

      {isDaily && (
        <div className="grid gap-3 md:grid-cols-4">
          <select className="field w-full outline-none">
            <option>Тип недвижимости</option>
            <option>Квартиры</option>
            <option>Дома</option>
            <option>Комнаты</option>
            <option>Отели</option>
          </select>
          <input className="field w-full outline-none" placeholder="Локация" />
          <button type="button" className="field w-full text-left" onClick={() => setCalendarOpen(true)}>
            Даты
          </button>
          <Link href="/catalog" className="btn-accent inline-flex items-center justify-center">
            Показать объявления
          </Link>
        </div>
      )}

      <DateRangeModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </section>
  );
}

export function RecommendationsSection() {
  return (
    <section className="container-1600 pb-16">
      <h2 className="mb-6 text-3xl font-semibold">Рекомендации для вас</h2>
      <ListingGrid variant="home" />
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#22262a] py-7 text-sm text-white">
      <div className="container-1600 flex flex-wrap items-center justify-between gap-4">
        <span>©2026, Autonova</span>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:underline">
            Политика конфиденциальности
          </Link>
          <Link href="/privacy-processing" className="hover:underline">
            Политика обработки персональных данных
          </Link>
          <a href="https://ansara.ru/" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Сделано в студии ANSARA
          </a>
        </div>
      </div>
    </footer>
  );
}

export function FilterSidebar() {
  return (
    <aside className="w-full rounded-[8px] bg-white md:w-[300px]">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Фильтры</h2>
        <input className="field w-full outline-none" placeholder="Локация" />
        <select className="field w-full outline-none">
          <option>Тип недвижимости</option>
        </select>
        <select className="field w-full outline-none">
          <option>Количество комнат</option>
        </select>
        <input className="field w-full outline-none" placeholder="Цена от" />
        <input className="field w-full outline-none" placeholder="Цена до" />
        <button type="button" className="btn-accent w-full">
          Применить
        </button>
      </div>
    </aside>
  );
}
