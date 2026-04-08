"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListingHoverSlider } from "@/components/listing-hover-slider";
import { useCurrency } from "@/context/currency-context";
import { listingDetailsLine } from "@/lib/listing-labels";
import { buildListingPath } from "@/lib/listing-url";
import { publicMediaUrlFromKey } from "@/lib/client-media";

const FAV_1 = "/icons/favorite-1.svg";
const FAV_NAV = "/icons/favorite-nav.svg";
const FAV_2 = "/icons/favorite-2.svg";

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
  preview_keys?: string[];
};

type Props = {
  variant: "home" | "catalog" | "mine" | "favorites";
  /** Доп. query: mode=buy и т.д. */
  extraQuery?: string;
};

export function ListingGrid({ variant, extraQuery = "" }: Props) {
  const router = useRouter();
  const { formatListingPrice } = useCurrency();
  const [listings, setListings] = useState<ListingApiRow[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [favoriteById, setFavoriteById] = useState<Record<string, boolean>>({});
  const [authed, setAuthed] = useState(false);
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
      if (variant === "favorites") return `/api/favorites/listings?${params.toString()}`;
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
        const json = (await res.json().catch(() => null)) as
          | {
              ok?: boolean;
              error?: string;
              data?: { listings?: ListingApiRow[] };
            }
          | null;
        if (!json) {
          if (variant === "home") {
            setListings([]);
            setHasMore(false);
            return;
          }
          setError("Ошибка сети");
          return;
        }
        if ((variant === "mine" || variant === "favorites") && res.status === 401) {
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
        if (variant === "home") {
          setListings([]);
          setHasMore(false);
        } else {
          setError("Ошибка сети");
        }
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

  useEffect(() => {
    let c = false;
    void (async () => {
      const me = await fetch("/api/me", { credentials: "include" });
      const j = (await me.json()) as { ok?: boolean; data?: { user?: unknown } };
      if (!c) setAuthed(Boolean(me.ok && j.ok && j.data?.user));
    })();
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    if (!listings.length || !authed) {
      if (!authed) setFavoriteById({});
      return;
    }
    let c = false;
    const ids = listings.map((l) => l.id).join(",");
    void (async () => {
      const r = await fetch(`/api/favorites/status?listingIds=${encodeURIComponent(ids)}`, {
        credentials: "include",
      });
      const j = (await r.json()) as {
        ok?: boolean;
        data?: { favorites?: Record<string, boolean> };
      };
      if (!c && r.ok && j.ok && j.data?.favorites) setFavoriteById(j.data.favorites);
    })();
    return () => {
      c = true;
    };
  }, [listings, authed]);

  function loadMore() {
    load(nextOffsetRef.current, true);
  }

  async function toggleFavorite(listingId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!authed) {
      window.location.href = `/login?next=${encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
      )}`;
      return;
    }
    const was = favoriteById[listingId];
    const method = was ? "DELETE" : "POST";
    const res = await fetch("/api/favorites", {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: Number(listingId) }),
    });
    if (res.ok) {
      setFavoriteById((prev) => ({ ...prev, [listingId]: !was }));
    }
  }

  const deleteListing = useCallback(
    async (id: string) => {
      if (!confirm("Удалить это объявление? Действие необратимо.")) return;
      setDeletingId(id);
      try {
        const res = await fetch(`/api/listings/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) {
          alert(json.error ?? "Не удалось удалить объявление");
          return;
        }
        setListings((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      } catch {
        alert("Ошибка сети");
      } finally {
        setDeletingId(null);
      }
    },
    [router],
  );

  if (loading && listings.length === 0) {
    return (
      <div className={columns}>
        {Array.from({ length: variant === "home" ? 6 : 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton aspect-[3/2] rounded-[8px]" />
            <div className="skeleton h-4 rounded-[8px]" />
            <div className="skeleton h-4 w-2/3 rounded-[8px]" />
          </div>
        ))}
      </div>
    );
  }

  if (error === "NEED_LOGIN") {
    const next = variant === "favorites" ? "/favorites" : "/my-listings";
    return (
      <p className="text-sm text-[#757575]">
        Войдите в аккаунт, чтобы продолжить:{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-[#0c78ed] underline">
          Вход
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
          : variant === "favorites"
            ? "В избранном пока пусто."
            : "Объявлений пока нет."}
      </p>
    );
  }

  return (
    <>
      <div className={columns}>
        {listings.map((row, index) => {
          const href = buildListingPath(Number(row.public_number), row.slug);
          const images = (row.preview_keys ?? [])
            .map((k) => publicMediaUrlFromKey(k))
            .filter((v): v is string => Boolean(v));
          const lcpPriority = variant === "home" && index === 0 && images.length > 0;
          return (
            <article key={row.id} className="overflow-hidden rounded-[8px]">
              <div className="relative">
                <Link href={href} className="block">
                  <ListingHoverSlider images={images} alt={row.title} priority={lcpPriority} />
                </Link>
                <button
                  type="button"
                  className="group/fav absolute right-2 top-2 z-10 border-0 bg-transparent p-0"
                  aria-label={favoriteById[row.id] ? "Убрать из избранного" : "В избранное"}
                  aria-pressed={favoriteById[row.id]}
                  onClick={(e) => void toggleFavorite(row.id, e)}
                >
                  {favoriteById[row.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={FAV_2} alt="" width={22} height={22} className="block" />
                  ) : (
                    <span className="relative inline-flex h-[22px] w-[22px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={FAV_1}
                        alt=""
                        width={22}
                        height={22}
                        className="absolute inset-0 opacity-100 transition-opacity duration-150 group-hover/fav:opacity-0"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={FAV_NAV}
                        alt=""
                        width={22}
                        height={22}
                        className="absolute inset-0 opacity-0 transition-opacity duration-150 group-hover/fav:opacity-100"
                      />
                    </span>
                  )}
                </button>
              </div>
              <Link href={href} className="block">
                <h3 className="mt-3 line-clamp-1 font-medium">{row.title}</h3>
                <p className="text-sm text-[#444]">{listingDetailsLine(row)}</p>
                <p className="text-sm text-[#757575]">{row.city}</p>
                <p className="mt-1 font-semibold">
                  {formatListingPrice(row.price, row.currency_code)}
                </p>
              </Link>
              {variant === "mine" && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#ececec] pt-3">
                  <Link
                    href={`/listing/edit/${row.id}`}
                    className="text-sm text-[#0c78ed] underline hover:no-underline"
                  >
                    Редактировать объявление
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-red-600 underline hover:no-underline disabled:opacity-50"
                    disabled={deletingId === row.id}
                    onClick={() => void deleteListing(row.id)}
                  >
                    {deletingId === row.id ? "Удаление…" : "Удалить объявление"}
                  </button>
                </div>
              )}
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
