"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalCloseButton } from "@/components/modal-close-button";
import { useCurrency } from "@/context/currency-context";

type Props = {
  listingId: number;
  title: string;
  description: string;
  characteristics: string;
  locationLine: string;
  price: string;
  currencyCode: string;
  discountComment: string | null;
  publicNumber: number;
  createdAt: string;
  viewsDisplay: number;
  authorName: string;
  previewUrls: string[];
  originalUrls: string[];
  filterRows?: { label: string; value: string }[];
};

export function ListingDetailClient({
  listingId,
  title,
  description,
  characteristics,
  locationLine,
  price,
  currencyCode,
  discountComment,
  publicNumber,
  createdAt,
  viewsDisplay,
  authorName,
  previewUrls,
  originalUrls,
  filterRows = [],
}: Props) {
  const { formatListingPrice } = useCurrency();
  const [active, setActive] = useState(0);
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [thumbStart, setThumbStart] = useState(0);

  const hasPhotos = previewUrls.length > 0;
  const thumbWindow = 6;
  const visibleThumbs = previewUrls.slice(thumbStart, thumbStart + thumbWindow);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetch("/api/me", { credentials: "include" });
      if (cancelled) return;
      const meJson = (await me.json()) as { ok?: boolean; data?: { user?: unknown } };
      const loggedIn = Boolean(me.ok && meJson.ok && meJson.data?.user);
      setAuthed(loggedIn);
      if (!loggedIn) return;
      const st = await fetch(`/api/favorites/status?listingId=${listingId}`);
      if (cancelled || !st.ok) return;
      const payload = (await st.json()) as { ok?: boolean; data?: { favorite?: boolean } };
      if (payload.ok && payload.data) setFavorite(!!payload.data.favorite);
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  useEffect(() => {
    if (!viewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [viewerOpen]);

  async function revealPhone() {
    setPhoneLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/phone`, { method: "POST" });
      const json = (await res.json()) as { data?: { phone?: string } };
      setPhone(json.data?.phone ?? null);
    } finally {
      setPhoneLoading(false);
    }
  }

  async function toggleFavorite() {
    if (!authed) return;
    const method = favorite ? "DELETE" : "POST";
    await fetch("/api/favorites", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    setFavorite(!favorite);
  }

  async function saveNote() {
    await fetch(`/api/listings/${listingId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteText }),
    });
    setNoteOpen(false);
  }

  function prevPhoto() {
    if (!hasPhotos) return;
    setActive((p) => (p <= 0 ? previewUrls.length - 1 : p - 1));
  }

  function nextPhoto() {
    if (!hasPhotos) return;
    setActive((p) => (p >= previewUrls.length - 1 ? 0 : p + 1));
  }

  function shiftThumbs(dir: -1 | 1) {
    const maxStart = Math.max(0, previewUrls.length - thumbWindow);
    setThumbStart((s) => Math.min(maxStart, Math.max(0, s + dir)));
  }

  return (
    <>
      <div className="mb-3 bg-white text-sm">
        <nav aria-label="Хлебные крошки" className="flex flex-wrap gap-2 text-[#757575]">
          <Link
            href="/"
            className="hover:text-[#151515] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#151515]"
          >
            Главная
          </Link>
          <span aria-hidden>/</span>
          <Link
            href="/catalog"
            className="hover:text-[#151515] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#151515]"
          >
            Каталог
          </Link>
          <span aria-hidden>/</span>
          <span className="text-[#151515]">{title}</span>
        </nav>
      </div>

      <div className="grid gap-8 lg:grid-cols-[70%_30%]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border border-transparent bg-[#f2f1f0] px-4 text-[#151515] transition-colors hover:text-[#F33737]"
              onClick={toggleFavorite}
              disabled={!authed}
            >
              <span className="relative inline-flex h-4 w-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/favorite-3.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/favorite-nav.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </span>
              {favorite ? "В избранном" : "Добавить в избранное"}
            </button>
            <button
              type="button"
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border border-transparent bg-[#f2f1f0] px-4 text-[#151515] transition-colors hover:text-[#5A86EE]"
              onClick={() => authed && setNoteOpen(true)}
              disabled={!authed}
            >
              <span className="relative inline-flex h-4 w-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/zametki.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/zametki-nav.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </span>
              Добавить заметку
            </button>
          </div>
          {!authed && authed !== null && (
            <p className="text-sm text-[#757575]">Войдите, чтобы заметки и избранное работали.</p>
          )}

          <div>
            {hasPhotos ? (
              <>
                <button
                  type="button"
                  className="relative aspect-video w-full overflow-hidden rounded-[8px] text-left"
                  onClick={() => setViewerOpen(true)}
                  aria-label="Открыть слайдер фотографий"
                >
                  <Image
                    src={previewUrls[active]}
                    alt={title}
                    width={1920}
                    height={1080}
                    className="absolute inset-0 h-full w-full object-cover"
                    sizes="(max-width: 1024px) 100vw, 70vw"
                  />
                </button>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="field h-10 w-10 shrink-0 p-0"
                    onClick={() => shiftThumbs(-1)}
                    disabled={thumbStart === 0}
                    aria-label="Прокрутить превью влево"
                  >
                    ‹
                  </button>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex gap-2">
                      {visibleThumbs.map((src, i) => {
                        const index = thumbStart + i;
                        return (
                          <button
                            key={`${src}-${index}`}
                            type="button"
                            className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[8px]"
                            style={{
                              boxShadow:
                                active === index ? "inset 0 0 0 2px #0c78ed" : "inset 0 0 0 1px transparent",
                            }}
                            onClick={() => setActive(index)}
                          >
                            <Image
                              src={src}
                              alt=""
                              width={240}
                              height={160}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="field h-10 w-10 shrink-0 p-0"
                    onClick={() => shiftThumbs(1)}
                    disabled={thumbStart + thumbWindow >= previewUrls.length}
                    aria-label="Прокрутить превью вправо"
                  >
                    ›
                  </button>
                </div>
              </>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-[8px] bg-[#f2f1f0] text-[#757575]">
                Нет фото
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p>{characteristics}</p>
            <p>{locationLine}</p>
            {filterRows.length > 0 && (
              <dl className="grid gap-2 rounded-[8px] border border-[#ececec] p-3 text-sm">
                {filterRows.map((row) => (
                  <div key={`${row.label}-${row.value}`} className="flex flex-wrap gap-x-2 gap-y-1">
                    <dt className="text-[#757575]">{row.label}</dt>
                    <dd className="font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="whitespace-pre-wrap">{description}</p>
            <div className="mt-4 border-t border-[#a4a4a4] pt-3" />
            <p className="text-sm text-[#757575]">
              №{publicNumber} • размещено {createdAt} • {viewsDisplay} просмотров
            </p>
          </div>
        </div>

        <aside className="self-start rounded-[8px] border border-[#ececec] p-4 lg:sticky lg:top-4">
          <p className="mb-2 text-3xl font-bold">{formatListingPrice(price, currencyCode)}</p>
          {discountComment && <p className="mb-3 text-sm text-[#757575]">{discountComment}</p>}
          <button
            type="button"
            className="btn-accent mb-3 inline-flex w-full items-center justify-center gap-2"
            onClick={revealPhone}
            disabled={phoneLoading}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/phone.svg" alt="" width={16} height={16} />
            {phone ? phone : phoneLoading ? "Загрузка…" : "Показать телефон"}
          </button>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f1f0]">
              👤
            </span>
            <div>
              <div className="font-medium">{authorName}</div>
              <div className="text-sm text-[#757575]">Автор объявления</div>
            </div>
          </div>
        </aside>
      </div>

      {noteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-title"
        >
          <div className="relative w-full max-w-md rounded-[8px] bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 id="note-title" className="text-lg font-semibold">
                Заметка (видите только вы)
              </h2>
              <ModalCloseButton onClose={() => setNoteOpen(false)} />
            </div>
            <textarea
              className="field mb-3 min-h-[120px] w-full resize-y py-2 outline-none"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="field px-4" onClick={() => setNoteOpen(false)}>
                Отмена
              </button>
              <button type="button" className="btn-accent px-4" onClick={saveNote}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      {viewerOpen && hasPhotos && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Слайдер фотографий"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewerOpen(false);
          }}
        >
          <div className="relative w-full max-w-6xl">
            <div className="absolute right-0 top-0 z-10">
              <ModalCloseButton onClose={() => setViewerOpen(false)} />
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[8px]">
              <Image
                src={originalUrls[active] ?? previewUrls[active]}
                alt={title}
                fill
                className="object-contain"
                sizes="90vw"
              />
              {previewUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-xl text-white"
                    onClick={prevPhoto}
                    aria-label="Предыдущее фото"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-xl text-white"
                    onClick={nextPhoto}
                    aria-label="Следующее фото"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            <p className="mt-3 text-center text-sm text-white">
              Фото {active + 1} из {previewUrls.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
