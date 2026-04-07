"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site";
import {
  postFormDataWithProgress,
  readFileAsDataURLWithProgress,
} from "@/lib/client/file-read-progress";
import { buildListingPath } from "@/lib/listing-url";

type LocationRow = { id: string; country: string; region: string; city: string };

const MAX_PHOTOS = 20;

const PROPERTY_OPTIONS: { value: string; label: string }[] = [
  { value: "apartment", label: "Квартира" },
  { value: "room", label: "Комната" },
  { value: "house", label: "Дом" },
  { value: "land", label: "Участок" },
  { value: "garage", label: "Гараж / машиноместо" },
  { value: "commercial", label: "Коммерческая" },
  { value: "hotel", label: "Отель" },
];

type PhotoRow = {
  id: string;
  file: File;
  previewDataUrl: string | null;
  readProgress: number;
  isReading: boolean;
  readError: boolean;
  uploadProgress: number;
};

function Bar2pxDeterminate({ percent }: { percent: number }) {
  return (
    <div
      className="mt-1 h-[2px] w-full overflow-hidden rounded-sm bg-[#f2f1f0]"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-[#0c78ed] transition-[width] duration-100 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function Bar2pxIndeterminate() {
  return (
    <div
      className="mt-1 h-[2px] w-full overflow-hidden rounded-sm bg-[#f2f1f0]"
      role="progressbar"
      aria-busy="true"
      aria-label="Идёт сохранение"
    >
      <div className="homenova-progress-indeterminate" />
    </div>
  );
}

export default function NewListingPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [publishHint, setPublishHint] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"buy" | "rent_long" | "daily">("buy");
  const [propertyType, setPropertyType] = useState("apartment");
  const [rooms, setRooms] = useState("");
  const [price, setPrice] = useState("");
  const [currencyCode, setCurrencyCode] = useState<"RUB" | "EUR" | "USD" | "TRY">("RUB");
  const [cityId, setCityId] = useState("");
  const [phone, setPhone] = useState("");
  const [discountComment, setDiscountComment] = useState("");
  const [photos, setPhotos] = useState<PhotoRow[]>([]);

  const processPhotoRead = useCallback(async (id: string, file: File) => {
    try {
      const url = await readFileAsDataURLWithProgress(file, (p) => {
        setPhotos((prev) =>
          prev.map((ph) => (ph.id === id ? { ...ph, readProgress: p } : ph)),
        );
      });
      setPhotos((prev) =>
        prev.map((ph) =>
          ph.id === id
            ? {
                ...ph,
                previewDataUrl: url,
                isReading: false,
                readProgress: 100,
              }
            : ph,
        ),
      );
    } catch {
      setPhotos((prev) =>
        prev.map((ph) =>
          ph.id === id ? { ...ph, isReading: false, readError: true, readProgress: 0 } : ph,
        ),
      );
    }
  }, []);

  const onPickPhotos = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const list = input.files;
      if (!list?.length) return;
      const incoming = Array.from(list).filter((f) =>
        /^image\/(jpeg|png|webp)$/i.test(f.type),
      );
      input.value = "";

      setPhotos((prev) => {
        const room = Math.max(0, MAX_PHOTOS - prev.length);
        const slice = incoming.slice(0, room);
        const newRows: PhotoRow[] = slice.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewDataUrl: null,
          readProgress: 0,
          isReading: true,
          readError: false,
          uploadProgress: 0,
        }));
        for (const row of newRows) {
          void processPhotoRead(row.id, row.file);
        }
        return [...prev, ...newRows];
      });
    },
    [processPhotoRead],
  );

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetch("/api/me", { credentials: "include" });
      const meJson = (await me.json()) as { ok?: boolean; data?: { user?: unknown } };
      if (!me.ok || !meJson.ok || !meJson.data?.user) {
        router.replace("/login?next=/listing/new");
        return;
      }
      const loc = await fetch("/api/locations");
      const json = (await loc.json()) as { ok?: boolean; data?: { locations?: LocationRow[] } };
      if (!cancelled && json.ok && json.data?.locations) {
        setLocations(json.data.locations);
        if (json.data.locations[0]) setCityId(json.data.locations[0].id);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const anyReading = photos.some((p) => p.isReading);
  const anyReadError = photos.some((p) => p.readError);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (anyReading) {
      setMessage("Дождитесь окончания загрузки превью фотографий.");
      return;
    }
    if (anyReadError) {
      setMessage("Удалите фото с ошибкой чтения или выберите другие файлы.");
      return;
    }

    setSaving(true);
    setMessage("");
    setPublishHint("Сохранение объявления в базе данных…");
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          mode,
          propertyType,
          rooms: rooms.trim() || undefined,
          price: Number(price),
          currencyCode,
          cityId: Number(cityId),
          phone,
          discountComment: discountComment.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: { listing?: { id: string; slug: string; public_number: string } };
      };
      if (!res.ok || !json.ok || !json.data?.listing) {
        setMessage(json.error ?? "Не удалось сохранить");
        setPublishHint("");
        return;
      }

      const { id, slug, public_number } = json.data.listing;

      if (photos.length > 0) {
        setPublishHint(`Загрузка фотографий: 0 из ${photos.length}`);
        for (let i = 0; i < photos.length; i += 1) {
          const ph = photos[i];
          setPhotos((prev) =>
            prev.map((p) => (p.id === ph.id ? { ...p, uploadProgress: 0 } : p)),
          );
          const fd = new FormData();
          fd.append("file", ph.file);
          const result = await postFormDataWithProgress(
            `/api/listings/${id}/media`,
            fd,
            (pct) => {
              setPhotos((prev) =>
                prev.map((p) => (p.id === ph.id ? { ...p, uploadProgress: pct } : p)),
              );
            },
          );
          setPhotos((prev) =>
            prev.map((p) => (p.id === ph.id ? { ...p, uploadProgress: 100 } : p)),
          );
          if (!result.ok) {
            const err = (result.json as { error?: string })?.error ?? "Ошибка загрузки фото";
            setMessage(err);
            setPublishHint("");
            return;
          }
          setPublishHint(`Загрузка фотографий: ${i + 1} из ${photos.length}`);
        }
      }

      setPublishHint("Готово, переход к объявлению…");
      router.push(buildListingPath(Number(public_number), slug));
    } catch {
      setMessage("Ошибка сети");
      setPublishHint("");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="container-1600 py-10">
          <div className="skeleton h-10 w-64 rounded-[8px]" />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="container-1600 max-w-3xl py-10">
        <h1 className="mb-6 text-2xl font-semibold">Разместить объявление</h1>
        {locations.length === 0 ? (
          <p className="text-sm text-[#757575]">
            В базе пока нет локаций. Добавьте город в админ-панели{" "}
            <Link href="/superadmin-lk" className="text-[#0c78ed] underline">
              /superadmin-lk
            </Link>
            .
          </p>
        ) : (
          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block text-sm font-medium">Заголовок</label>
            <input
              className="field w-full outline-none"
              required
              minLength={10}
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
            <label className="block text-sm font-medium">Описание</label>
            <textarea
              className="field min-h-[140px] w-full resize-y py-2 outline-none"
              required
              minLength={30}
              maxLength={6000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Сделка</label>
                <select
                  className="field mt-1 w-full outline-none"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as typeof mode)}
                  disabled={saving}
                >
                  <option value="buy">Купить</option>
                  <option value="rent_long">Снять надолго</option>
                  <option value="daily">Посуточно</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Тип недвижимости</label>
                <select
                  className="field mt-1 w-full outline-none"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  disabled={saving}
                >
                  {PROPERTY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="block text-sm font-medium">Комнаты (необязательно)</label>
            <input
              className="field w-full outline-none"
              placeholder="Например: 2 или студия"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              disabled={saving}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Цена</label>
                <input
                  className="field mt-1 w-full outline-none"
                  required
                  type="number"
                  min={1}
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Валюта</label>
                <select
                  className="field mt-1 w-full outline-none"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value as typeof currencyCode)}
                  disabled={saving}
                >
                  <option value="RUB">₽ RUB</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="TRY">₺ TRY</option>
                </select>
              </div>
            </div>
            <label className="block text-sm font-medium">Город / населённый пункт</label>
            <select
              className="field w-full outline-none"
              required
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={saving}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.city} ({l.region}, {l.country})
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium">Телефон для связи</label>
            <input
              className="field w-full outline-none"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
            <label className="block text-sm font-medium">Комментарий о скидке (необязательно)</label>
            <input
              className="field w-full outline-none"
              value={discountComment}
              onChange={(e) => setDiscountComment(e.target.value)}
              disabled={saving}
            />

            <div>
              <label className="block text-sm font-medium">Фотографии (необязательно)</label>
              <p className="mb-1 text-xs text-[#757575]">
                До {MAX_PHOTOS} файлов (JPEG, PNG, WebP). Превью появляется сразу после выбора.
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="text-sm"
                onChange={onPickPhotos}
                disabled={saving || photos.length >= MAX_PHOTOS}
              />
            </div>

            {photos.length > 0 && (
              <ul className="flex flex-wrap gap-3 pt-1" aria-label="Превью фотографий">
                {photos.map((ph) => (
                  <li key={ph.id} className="w-[104px] shrink-0">
                    <div className="relative aspect-square overflow-hidden rounded-[8px] bg-[#f2f1f0]">
                      {ph.previewDataUrl ? (
                        <Image
                          src={ph.previewDataUrl}
                          alt=""
                          width={208}
                          height={208}
                          unoptimized
                          className="absolute inset-0 h-full w-full object-cover"
                          sizes="104px"
                        />
                      ) : ph.readError ? (
                        <span className="flex h-full items-center justify-center px-1 text-center text-xs text-red-600">
                          Ошибка
                        </span>
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-[#757575]">
                          …
                        </span>
                      )}
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-xs"
                        onClick={() => removePhoto(ph.id)}
                        disabled={saving}
                        aria-label="Удалить фото"
                      >
                        ×
                      </button>
                    </div>
                    <Bar2pxDeterminate percent={ph.isReading ? ph.readProgress : ph.uploadProgress} />
                    <p className="mt-0.5 text-center text-[11px] tabular-nums text-[#757575]">
                      {ph.isReading
                        ? `${ph.readProgress}%`
                        : ph.uploadProgress > 0 && ph.uploadProgress < 100
                          ? `${ph.uploadProgress}%`
                          : ph.readError
                            ? "—"
                            : "\u00a0"}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {saving && publishHint && (
              <div className="rounded-[8px] border border-[#ececec] bg-white p-3">
                <p className="text-sm font-medium text-[#151515]">{publishHint}</p>
                {publishHint.startsWith("Сохранение объявления") ? (
                  <Bar2pxIndeterminate />
                ) : publishHint.startsWith("Загрузка фотографий") ? (
                  <Bar2pxDeterminate
                    percent={
                      photos.length === 0
                        ? 100
                        : Math.round(
                            (photos.reduce((s, p) => s + p.uploadProgress, 0) /
                              (photos.length * 100)) *
                              100,
                          )
                    }
                  />
                ) : null}
              </div>
            )}

            {message && <p className="text-sm text-red-600">{message}</p>}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="btn-accent"
                disabled={saving || anyReading || anyReadError}
              >
                {saving ? "Публикация…" : "Опубликовать"}
              </button>
              <Link href="/" className="field inline-flex items-center px-4">
                Отмена
              </Link>
            </div>
          </form>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
