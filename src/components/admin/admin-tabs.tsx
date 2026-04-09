"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/superadmin-lk/locations", label: "Локации" },
  { href: "/superadmin-lk/currencies", label: "Курсы валют" },
  { href: "/superadmin-lk/documents", label: "Документы" },
  { href: "/superadmin-lk/filters", label: "Фильтры" },
] as const;

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="relative mt-[10px] mb-8 inline-block max-w-full">
      <div className="relative z-10 flex flex-wrap items-end gap-x-6 gap-y-2 text-lg font-normal leading-normal">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`relative z-10 inline-block pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#151515] ${
                active ? "text-black" : "text-[#757575] hover:text-[#151515]"
              }`}
            >
              <span className="relative z-10 inline-block">{t.label}</span>
              {active ? (
                <span
                  className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-black"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-0.5 bg-[#dddcdb]"
        aria-hidden
      />
    </div>
  );
}
