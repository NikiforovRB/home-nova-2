"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    setMessage(json.ok ? "Вход выполнен" : json.error ?? "Ошибка");
    if (json.ok) window.location.href = safeNext;
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const json = await res.json();
    setMessage(json.ok ? "Регистрация выполнена" : json.error ?? "Ошибка");
    if (json.ok) window.location.href = safeNext;
  }

  return (
    <>
      <SiteHeader />
      <main className="container-1600 flex-1 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Вход и регистрация</h1>
        <div className="grid gap-8 md:grid-cols-2">
          <form className="space-y-2" onSubmit={onLogin}>
            <h2 className="text-lg font-medium">Вход</h2>
            <input
              className="field w-full outline-none"
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="field w-full outline-none"
              type="password"
              required
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn-accent">
              Войти
            </button>
          </form>
          <form className="space-y-2" onSubmit={onRegister}>
            <h2 className="text-lg font-medium">Регистрация</h2>
            <input
              className="field w-full outline-none"
              required
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="field w-full outline-none"
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="field w-full outline-none"
              type="password"
              required
              placeholder="Пароль (от 8 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn-accent">
              Зарегистрироваться
            </button>
          </form>
        </div>
        {message && <p className="mt-4 text-sm text-[#757575]">{message}</p>}
        <p className="mt-6 text-sm">
          <Link href="/" className="text-[#0c78ed] hover:underline">
            На главную
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
