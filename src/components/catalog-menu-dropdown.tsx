"use client";

import Link from "next/link";

const I = (p: string) => `/icons/${p}`;

const BUY_RENT_LONG = [
  { label: "Квартиры", propertyType: "apartment" },
  { label: "Комнаты", propertyType: "room" },
  { label: "Дома, дачи, коттеджи", propertyType: "house" },
  { label: "Земельные участки", propertyType: "land" },
  { label: "Гаражи и машиноместа", propertyType: "garage" },
  { label: "Коммерческая недвижимость", propertyType: "commercial" },
] as const;

const DAILY = [
  { label: "Квартиры", propertyType: "apartment" },
  { label: "Дома", propertyType: "house" },
  { label: "Комнаты", propertyType: "room" },
  { label: "Отели", propertyType: "hotel" },
] as const;

function catalogHref(mode: string, propertyType: string) {
  const p = new URLSearchParams();
  p.set("mode", mode);
  p.set("propertyType", propertyType);
  return `/catalog?${p.toString()}`;
}

export function CatalogMenuDropdown() {
  return (
    <div className="group/cat relative inline-flex">
      <Link
        href="/catalog"
        className="btn-accent inline-flex items-center justify-center gap-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={I("catalog.svg")} alt="" width={18} height={18} className="shrink-0" />
        Каталог
      </Link>
      <div
        className="invisible absolute left-0 top-full z-[60] min-w-[min(100vw-2rem,64rem)] pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-hover/cat:visible group-hover/cat:opacity-100"
        role="menu"
        aria-label="Разделы каталога"
      >
        <div className="max-h-[min(70vh,520px)] overflow-y-auto rounded-[8px] border border-[#ececec] bg-white p-5 shadow-lg">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#757575]">
                Купить
              </p>
              <ul className="space-y-1">
                {BUY_RENT_LONG.map((item) => (
                  <li key={`buy-${item.propertyType}`}>
                    <Link
                      href={catalogHref("buy", item.propertyType)}
                      className="block rounded-[6px] px-2 py-1.5 text-sm text-[#151515] hover:bg-[#f2f1f0]"
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#757575]">
                Снять надолго
              </p>
              <ul className="space-y-1">
                {BUY_RENT_LONG.map((item) => (
                  <li key={`rent-${item.propertyType}`}>
                    <Link
                      href={catalogHref("rent_long", item.propertyType)}
                      className="block rounded-[6px] px-2 py-1.5 text-sm text-[#151515] hover:bg-[#f2f1f0]"
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#757575]">
                Посуточно
              </p>
              <ul className="space-y-1">
                {DAILY.map((item) => (
                  <li key={`daily-${item.propertyType}`}>
                    <Link
                      href={catalogHref("daily", item.propertyType)}
                      className="block rounded-[6px] px-2 py-1.5 text-sm text-[#151515] hover:bg-[#f2f1f0]"
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
