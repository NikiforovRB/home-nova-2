"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DateRangeModal } from "@/components/custom-calendar";
import { filterModes } from "@/lib/mock";
import { useCurrency } from "@/context/currency-context";

const ROOM_OPTIONS_ROW1 = ["1", "2", "3", "4", "5+"] as const;
const ROOM_OPTIONS_ROW2 = ["Студия", "Свободная планировка"] as const;

function formatGroupedDigits(v: string) {
  const clean = v.replace(/[^\d]/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString("ru-RU");
}

function toggleBtnClass(active: boolean) {
  const base =
    "rounded-[8px] border-2 px-4 py-2.5 text-sm transition-colors";
  if (active) {
    return `${base} border-[#22262a] bg-[#f2f1f0] text-[#000000]`;
  }
  return `${base} border-transparent bg-[#f2f1f0] text-[#151515] hover:border-[#a4a4a4]`;
}

export function HeroFilters() {
  const { displayCurrency, symbols } = useCurrency();
  const sym = symbols[displayCurrency] ?? displayCurrency;

  const [mode, setMode] = useState<(typeof filterModes)[number]["id"]>("buy");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [propertyTypeBuyLong, setPropertyTypeBuyLong] = useState("Квартиры");
  const [propertyTypeDaily, setPropertyTypeDaily] = useState("Квартиры");

  const roomsRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      const t = e.target as Node;
      if (!roomsRef.current?.contains(t) && !priceRef.current?.contains(t)) {
        setRoomsOpen(false);
        setPriceOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const isDaily = mode === "daily";
  const isBuyOrLong = mode === "buy" || mode === "rent_long";

  const roomsLabel = useMemo(() => {
    if (selectedRooms.size === 0) return "Количество комнат";
    return Array.from(selectedRooms).join(", ");
  }, [selectedRooms]);

  const priceLabel = useMemo(() => {
    const from = priceFrom.trim();
    const to = priceTo.trim();
    if (!from && !to) return "Цена";
    if (from && !to) return `От ${formatGroupedDigits(from)}`;
    if (!from && to) return `До ${formatGroupedDigits(to)}`;
    return `${formatGroupedDigits(from)} - ${formatGroupedDigits(to)} ${sym}`;
  }, [priceFrom, priceTo, sym]);

  function toggleRoom(opt: string) {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  return (
    <section className="container-1600 py-14">
      <h1 className="mb-8 text-center text-4xl font-semibold md:text-6xl">
        Вся недвижимость на одной площадке
      </h1>
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {filterModes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={toggleBtnClass(mode === item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isBuyOrLong && (
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="field w-full appearance-none bg-[url('/icons/down.svg')] bg-[right_12px_center] bg-no-repeat pr-8 outline-none"
            value={propertyTypeBuyLong}
            onChange={(e) => setPropertyTypeBuyLong(e.target.value)}
          >
            <option>Квартиры</option>
            <option>Комнаты</option>
            <option>Дома, дачи, коттеджи</option>
            <option>Земельные участки</option>
            <option>Гаражи и машиноместа</option>
            <option>Коммерческая недвижимость</option>
          </select>

          <div className="relative" ref={roomsRef}>
            <button
              type="button"
              className="field flex w-full min-h-[44px] items-center justify-between text-left outline-none"
              onClick={() => {
                setRoomsOpen((o) => !o);
                setPriceOpen(false);
              }}
              aria-expanded={roomsOpen}
            >
              <span className="truncate">{roomsLabel}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/down.svg" alt="" width={14} height={14} className="opacity-60" />
            </button>
            {roomsOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 space-y-2 rounded-[8px] border border-[#ececec] bg-white p-3 shadow-md">
                <div className="flex flex-nowrap gap-2">
                  {ROOM_OPTIONS_ROW1.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleRoom(opt)}
                      className={toggleBtnClass(selectedRooms.has(opt))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROOM_OPTIONS_ROW2.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleRoom(opt)}
                      className={toggleBtnClass(selectedRooms.has(opt))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={priceRef}>
            <button
              type="button"
              className="field flex w-full min-h-[44px] items-center justify-between text-left outline-none"
              onClick={() => {
                setPriceOpen((o) => !o);
                setRoomsOpen(false);
              }}
              aria-expanded={priceOpen}
            >
              <span className="truncate">{priceLabel}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/down.svg" alt="" width={14} height={14} className="opacity-60" />
            </button>
            {priceOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 rounded-[8px] border border-[#ececec] bg-white p-3 shadow-md">
                <div className="flex gap-2">
                  <input
                    className="field min-h-10 w-full flex-1 outline-none"
                    placeholder="От"
                    inputMode="numeric"
                    value={formatGroupedDigits(priceFrom)}
                    onChange={(e) => setPriceFrom(e.target.value.replace(/[^\d]/g, ""))}
                  />
                  <input
                    className="field min-h-10 w-full flex-1 outline-none"
                    placeholder="До"
                    inputMode="numeric"
                    value={formatGroupedDigits(priceTo)}
                    onChange={(e) => setPriceTo(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
              </div>
            )}
          </div>

          <Link href="/catalog" className="btn-accent inline-flex items-center justify-center">
            Показать объявления
          </Link>
        </div>
      )}

      {isDaily && (
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="field w-full appearance-none bg-[url('/icons/down.svg')] bg-[right_12px_center] bg-no-repeat pr-8 outline-none"
            value={propertyTypeDaily}
            onChange={(e) => setPropertyTypeDaily(e.target.value)}
          >
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
