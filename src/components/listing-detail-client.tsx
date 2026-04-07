"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/currencies";

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
}: Props) {
  const [active, setActive] = useState(0);
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);

  const hasPhotos = previewUrls.length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetch("/api/me");
      if (cancelled) return;
      setAuthed(me.ok);
      if (!me.ok) return;
      const st = await fetch(`/api/favorites/status?listingId=${listingId}`);
      if (cancelled || !st.ok) return;
      const payload = (await st.json()) as { ok?: boolean; data?: { favorite?: boolean } };
      if (payload.ok && payload.data) setFavorite(!!payload.data.favorite);
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

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

  return (
    <>
      <div className="mb-4 rounded-[8px] bg-[#22262a] px-4 py-3 text-sm">
        <nav aria-label="Хлебные крошки" className="flex flex-wrap gap-2 text-[#757575]">
          <Link
            href="/"
            className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Главная
          </Link>
          <span aria-hidden>/</span>
          <Link
            href="/catalog"
            className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Каталог
          </Link>
          <span aria-hidden>/</span>
          <span className="text-white">{title}</span>
        </nav>
      </div>

      <div className="grid gap-8 lg:grid-cols-[70%_30%]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="field px-4" onClick={toggleFavorite} disabled={!authed}>
              {favorite ? "В избранном" : "Добавить в избранное"}
            </button>
            <button
              type="button"
              className="field px-4"
              onClick={() => authed && setNoteOpen(true)}
              disabled={!authed}
            >
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
                  onClick={() => {
                    const url = originalUrls[active] ?? previewUrls[active];
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  aria-label="Открыть фото в полном размере"
                >
                  <Image
                    src={previewUrls[active]}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 70vw"
                  />
                </button>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {previewUrls.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-[8px] ${
                        active === index ? "ring-2 ring-[#0c78ed]" : ""
                      }`}
                      onClick={() => setActive(index)}
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                    </button>
                  ))}
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
            <p className="whitespace-pre-wrap">{description}</p>
            <p className="text-sm text-[#757575]">
              №{publicNumber} • размещено {createdAt} • {viewsDisplay} просмотров
            </p>
          </div>
        </div>

        <aside className="self-start rounded-[8px] border border-[#ececec] p-4 lg:sticky lg:top-4">
          <p className="mb-2 text-3xl font-bold">{formatPrice(Number(price), currencyCode)}</p>
          {discountComment && <p className="mb-3 text-sm text-[#757575]">{discountComment}</p>}
          <button
            type="button"
            className="btn-accent mb-3 w-full"
            onClick={revealPhone}
            disabled={phoneLoading}
          >
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
          <div className="w-full max-w-md rounded-[8px] bg-white p-4 shadow-lg">
            <h2 id="note-title" className="mb-2 text-lg font-semibold">
              Заметка (видите только вы)
            </h2>
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
    </>
  );
}
