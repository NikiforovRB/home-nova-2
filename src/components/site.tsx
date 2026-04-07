export { SiteHeader } from "@/components/site-header";
export { HeroFilters } from "@/components/hero-filters";

import { ListingGrid } from "@/components/listing-grid";
import Link from "next/link";

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
