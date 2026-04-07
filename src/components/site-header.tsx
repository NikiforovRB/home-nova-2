"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrency } from "@/context/currency-context";
import { publicMediaUrlFromKey } from "@/lib/client-media";

const I = (p: string) => `/icons/${p}`;

async function readJsonBody<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function HoverIcon({
  normal,
  hover,
  alt,
  className,
  width = 18,
  height = 18,
}: {
  normal: string;
  hover: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const [h, setH] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={h ? hover : normal}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    />
  );
}

export function SiteHeader() {
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const [favCount, setFavCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [me, setMe] = useState<{
    email: string;
    name: string;
    avatar_url: string | null;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadUserAndFavorites = useCallback(async () => {
    const r = await fetch("/api/me", { credentials: "include" });
    const j = await readJsonBody<{
      ok?: boolean;
      data?: { user?: { email: string; name: string; avatar_url: string | null } | null };
    }>(r);
    if (!r.ok || !j?.ok) {
      setMe(null);
      setFavCount(0);
      return;
    }
    setMe(j.data?.user ?? null);
    const fav = await fetch("/api/favorites", { credentials: "include" });
    const fj = await readJsonBody<{ ok?: boolean; data?: { count?: number } }>(fav);
    if (fav.ok && fj?.ok) setFavCount(fj.data?.count ?? 0);
    else setFavCount(0);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadUserAndFavorites();
    });
    return () => cancelAnimationFrame(id);
  }, [loadUserAndFavorites, userMenuOpen]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [userMenuOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setMe(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  }

  const avatarSrc = me?.avatar_url ? publicMediaUrlFromKey(me.avatar_url) : null;

  return (
    <header className="relative z-20 border-b border-[#ececec] bg-[var(--background)] py-4">
      <div className="container-1600 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            className="group flex items-center gap-2 border-0 bg-transparent p-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={I("marker.svg")} alt="" width={20} height={20} className="shrink-0" />
            <span className="text-[#a4a4a4] transition-colors group-hover:text-[#5A86EE]">
              Москва
            </span>
          </button>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="inline-flex items-center gap-1 border-0 bg-transparent">
              <span className="sr-only">Валюта отображения</span>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value)}
                className="cursor-pointer border-0 bg-transparent text-[#a4a4a4] outline-none"
              >
                <option value="RUB">₽ RUB</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="TRY">₺ TRY</option>
              </select>
            </label>
            <Link
              href="/listing/new"
              className="inline-flex items-center gap-2 border-0 bg-transparent px-0 py-0 text-[#a4a4a4] hover:text-[#5A86EE]"
            >
              <HoverIcon normal={I("add-document.svg")} hover={I("add-document-nav.svg")} alt="" />
              <span>Разместить объявление</span>
            </Link>
            <Link
              href="/my-listings"
              className="inline-flex items-center gap-2 border-0 bg-transparent px-0 py-0 text-[#a4a4a4] hover:text-[#5A86EE]"
            >
              <HoverIcon normal={I("beklog.svg")} hover={I("beklog-nav.svg")} alt="" />
              <span>Мои объявления</span>
            </Link>
          </div>
        </div>

        <div className="grid min-w-0 items-center gap-3 md:grid-cols-[auto_140px_minmax(0,1fr)_auto_auto]">
          <Link href="/" className="inline-flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={I("logo.png")}
              alt="HOMENOVA"
              className="h-8 w-auto max-w-[160px] object-contain md:h-9"
            />
          </Link>
          <Link
            href="/catalog"
            className="btn-accent inline-flex items-center justify-center gap-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={I("catalog.svg")} alt="" width={18} height={18} className="shrink-0" />
            Каталог
          </Link>
          <div className="field flex min-h-[44px] w-full min-w-0 items-stretch overflow-hidden p-0">
            <input
              className="min-h-[44px] min-w-0 flex-1 border-0 bg-transparent py-2 pl-3 pr-2 outline-none"
              placeholder="Поиск по объявлениям"
            />
            <button
              type="button"
              className="btn-accent shrink-0 self-stretch rounded-tl-none rounded-bl-none rounded-br-[8px] rounded-tr-[8px] px-4 py-0"
            >
              Найти
            </button>
          </div>
          <Link
            href="/favorites"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f1f0]"
            aria-label="Избранное"
          >
            <span className="flex items-center justify-center">
              <HoverIcon
                normal={I("favorite.svg")}
                hover={I("favorite-nav.svg")}
                alt=""
                width={22}
                height={22}
              />
            </span>
            {favCount > 0 && (
              <span className="absolute right-0 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#22262a] px-1 text-[11px] text-white">
                {favCount}
              </span>
            )}
          </Link>
          <div className="relative flex justify-end" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#f2f1f0]"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label="Меню аккаунта"
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={I("user1.svg")}
                  alt=""
                  className="h-full w-full object-contain p-1.5"
                />
              )}
            </button>
            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] rounded-[8px] border border-[#ececec] bg-white py-1 shadow-lg"
              >
                {me ? (
                  <>
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="block px-4 py-2 text-left text-sm hover:bg-[#f2f1f0]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Мой профиль
                    </Link>
                    <Link
                      href="/my-listings"
                      role="menuitem"
                      className="block px-4 py-2 text-left text-sm hover:bg-[#f2f1f0]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Мои объявления
                    </Link>
                    <Link
                      href="/favorites"
                      role="menuitem"
                      className="block px-4 py-2 text-left text-sm hover:bg-[#f2f1f0]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Избранное
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[#f2f1f0]"
                      onClick={() => void logout()}
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      role="menuitem"
                      className="block px-4 py-2 text-sm hover:bg-[#f2f1f0]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Войти
                    </Link>
                    <Link
                      href="/login"
                      role="menuitem"
                      className="block px-4 py-2 text-sm hover:bg-[#f2f1f0]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Регистрация
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
