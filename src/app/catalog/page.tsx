import { Suspense } from "react";
import { CatalogClient } from "@/components/catalog-client";

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="container-1600 py-10 text-sm text-[#757575]">Загрузка каталога…</div>
      }
    >
      <CatalogClient />
    </Suspense>
  );
}
