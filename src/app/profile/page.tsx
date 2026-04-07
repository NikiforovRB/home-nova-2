"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site";
import { publicMediaUrlFromKey } from "@/lib/client-media";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [email, setEmail] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      const r = await fetch("/api/me", { credentials: "include" });
      const j = (await r.json()) as {
        ok?: boolean;
        data?: {
          user?: {
            name: string;
            last_name?: string;
            patronymic?: string;
            email: string;
            avatar_url: string | null;
          } | null;
        };
      };
      if (!r.ok || !j.ok || !j.data?.user) {
        router.replace("/login?next=/profile");
        return;
      }
      if (c) return;
      const u = j.data.user;
      setName(u.name ?? "");
      setLastName(u.last_name ?? "");
      setPatronymic(u.patronymic ?? "");
      setEmail(u.email ?? "");
      setAvatarKey(u.avatar_url);
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [router]);

  const avatarDisplay =
    previewAvatar ?? (avatarKey ? publicMediaUrlFromKey(avatarKey) : null);

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewAvatar(url);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/me/avatar", { method: "POST", credentials: "include", body: fd });
    const json = (await res.json()) as { ok?: boolean; data?: { avatarKey?: string }; error?: string };
    if (res.ok && json.ok && json.data?.avatarKey) {
      setAvatarKey(json.data.avatarKey);
      setPreviewAvatar(null);
      URL.revokeObjectURL(url);
    } else {
      URL.revokeObjectURL(url);
      setPreviewAvatar(null);
      setMessage(json.error ?? "Не удалось загрузить фото");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        lastName,
        patronymic,
        email,
      }),
    });
    const json = await res.json();
    setMessage(json.ok ? "Сохранено" : json.error ?? "Ошибка");
    setSaving(false);
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="container-1600 py-10">
          <div className="skeleton h-10 w-48 rounded-[8px]" />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="container-1600 max-w-lg py-10">
        <h1 className="mb-6 text-2xl font-semibold">Мой профиль</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#f2f1f0]">
              {avatarDisplay ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarDisplay} alt="" className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/icons/user1.svg" alt="" className="m-auto h-12 w-12" />
              )}
            </div>
            <label className="text-sm">
              <span className="cursor-pointer text-[#0c78ed] underline">Загрузить фото</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarChange} />
            </label>
          </div>
          <label className="block text-sm font-medium">Имя</label>
          <input className="field w-full outline-none" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="block text-sm font-medium">Фамилия</label>
          <input className="field w-full outline-none" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <label className="block text-sm font-medium">Отчество</label>
          <input className="field w-full outline-none" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} />
          <label className="block text-sm font-medium">Email</label>
          <input
            className="field w-full outline-none"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && <p className="text-sm text-[#757575]">{message}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-accent" disabled={saving}>
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
            <Link href="/" className="field inline-flex items-center px-4">
              На главную
            </Link>
          </div>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
