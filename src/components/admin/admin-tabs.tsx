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
    <nav className="mb-8 flex flex-wrap gap-3 border-b border-[#ececec] pb-4 text-sm">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              active
                ? "font-semibold text-[#0c78ed]"
                : "text-[#757575] hover:text-[#151515]"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
