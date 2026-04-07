"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site";
import { buildListingPath } from "@/lib/listing-url";

type LocationRow = { id: string; country: string; region: string; city: string };

const PROPERTY_OPTIONS: { value: string; label: string }[] = [
  { value: "apartment", label: "Квартира" },
  { value: "room", label: "Комната" },
  { value: "house", label: "Дом" },
  { value: "land", label: "Участок" },
  { value: "garage", label: "Гараж / машиноместо" },
  { value: "commercial", label: "Коммерческая" },
  { value: "hotel", label: "Отель" },
];

export default function NewListingPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetch("/api/me", { credentials: "include" });
      if (!me.ok) {
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
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
        return;
      }
      const { id, slug, public_number } = json.data.listing;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i += 1) {
          const fd = new FormData();
          fd.append("file", files[i]);
          await fetch(`/api/listings/${id}/media`, {
            method: "POST",
            credentials: "include",
            body: fd,
          });
        }
      }
      router.push(buildListingPath(Number(public_number), slug));
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
            />
            <label className="block text-sm font-medium">Описание</label>
            <textarea
              className="field min-h-[140px] w-full resize-y py-2 outline-none"
              required
              minLength={30}
              maxLength={6000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Сделка</label>
                <select
                  className="field mt-1 w-full outline-none"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as typeof mode)}
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Валюта</label>
                <select
                  className="field mt-1 w-full outline-none"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value as typeof currencyCode)}
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
            />
            <label className="block text-sm font-medium">Комментарий о скидке (необязательно)</label>
            <input
              className="field w-full outline-none"
              value={discountComment}
              onChange={(e) => setDiscountComment(e.target.value)}
            />
            <label className="block text-sm font-medium">Фотографии (необязательно)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="text-sm"
              onChange={(e) => setFiles(e.target.files)}
            />
            {message && <p className="text-sm text-red-600">{message}</p>}
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-accent" disabled={saving}>
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
