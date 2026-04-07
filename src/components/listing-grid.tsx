"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListingHoverSlider } from "@/components/listing-hover-slider";
import { formatPrice } from "@/lib/currencies";
import { listingDetailsLine } from "@/lib/listing-labels";
import { buildListingPath } from "@/lib/listing-url";
import { publicMediaUrlFromKey } from "@/lib/client-media";

export type ListingApiRow = {
  id: string;
  public_number: string;
  slug: string;
  title: string;
  mode: string;
  property_type: string;
  rooms: string | null;
  price: string;
  currency_code: string;
  city: string;
  preview_key: string | null;
};

type Props = {
  variant: "home" | "catalog" | "mine";
  /** Доп. query: mode=buy и т.д. */
  extraQuery?: string;
};

export function ListingGrid({ variant, extraQuery = "" }: Props) {
  const [listings, setListings] = useState<ListingApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const nextOffsetRef = useRef(0);

  const limit = variant === "home" ? 12 : 60;
  const columns =
    variant === "home"
      ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
      : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4";

  const buildUrl = useCallback(
    (off: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(off));
      if (variant === "mine") params.set("mine", "1");
      if (extraQuery) {
        const q = new URLSearchParams(extraQuery);
        q.forEach((v, k) => params.set(k, v));
      }
      return `/api/listings?${params.toString()}`;
    },
    [limit, variant, extraQuery],
  );

  const load = useCallback(
    async (off: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildUrl(off), { credentials: "include" });
        const json = (await res.json()) as {
          ok?: boolean;
          error?: string;
          data?: { listings?: ListingApiRow[] };
        };
        if (variant === "mine" && res.status === 401) {
          setError("NEED_LOGIN");
          return;
        }
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Не удалось загрузить объявления");
          return;
        }
        const rows = json.data?.listings ?? [];
        if (append) {
          setListings((prev) => [...prev, ...rows]);
          nextOffsetRef.current += rows.length;
        } else {
          setListings(rows);
          nextOffsetRef.current = rows.length;
        }
        setHasMore(rows.length === limit);
      } catch {
        setError("Ошибка сети");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildUrl, limit, variant],
  );

  useEffect(() => {
    nextOffsetRef.current = 0;
    load(0, false);
  }, [load, variant, extraQuery]);

  function loadMore() {
    load(nextOffsetRef.current, true);
  }

  if (loading && listings.length === 0) {
    return (
      <div className={columns}>
        {Array.from({ length: variant === "home" ? 6 : 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton aspect-[3/4] rounded-[8px]" />
            <div className="skeleton h-4 rounded-[8px]" />
            <div className="skeleton h-4 w-2/3 rounded-[8px]" />
          </div>
        ))}
      </div>
    );
  }

  if (error === "NEED_LOGIN") {
    return (
      <p className="text-sm text-[#757575]">
        Чтобы видеть свои объявления,{" "}
        <Link href="/login?next=/my-listings" className="text-[#0c78ed] underline">
          войдите в аккаунт
        </Link>
        .
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-[#757575]">{error}</p>;
  }

  if (listings.length === 0) {
    return (
      <p className="text-sm text-[#757575]">
        {variant === "mine"
          ? "У вас пока нет объявлений. Разместите первое — кнопка «Разместить объявление»."
          : "Объявлений пока нет."}
      </p>
    );
  }

  return (
    <>
      <div className={columns}>
        {listings.map((row) => {
          const href = buildListingPath(Number(row.public_number), row.slug);
          const preview = publicMediaUrlFromKey(row.preview_key);
          const images = preview ? [preview] : [];
          return (
            <article key={row.id} className="overflow-hidden rounded-[8px]">
              <div className="relative">
                <Link href={href} className="block">
                  <ListingHoverSlider images={images} alt={row.title} />
                </Link>
                <button
                  type="button"
                  className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2 py-1 text-xs"
                  aria-label="В избранное"
                >
                  ❤
                </button>
              </div>
              <Link href={href} className="block">
                <h3 className="mt-3 line-clamp-1 font-medium">{row.title}</h3>
                <p className="text-sm text-[#444]">{listingDetailsLine(row)}</p>
                <p className="text-sm text-[#757575]">{row.city}</p>
                <p className="mt-1 font-semibold">
                  {formatPrice(row.price, row.currency_code)}
                </p>
              </Link>
            </article>
          );
        })}
      </div>
      {variant === "catalog" && hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="btn-accent"
            disabled={loadingMore}
            onClick={loadMore}
          >
            {loadingMore ? "Загрузка…" : "Загрузить ещё"}
          </button>
        </div>
      )}
    </>
  );
}
