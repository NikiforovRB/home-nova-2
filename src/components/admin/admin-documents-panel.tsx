"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminUi } from "@/context/admin-ui-context";
import { adminJsonResult } from "@/lib/admin-json-result";

type Doc = { id: string; title: string; body: string };

export function AdminDocumentsPanel() {
  const { run } = useAdminUi();
  const [docs, setDocs] = useState<Doc[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/documents", { credentials: "include" });
    const j = (await r.json()) as { ok?: boolean; data?: { documents?: Doc[] } };
    if (j.ok && j.data?.documents) setDocs(j.data.documents);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  async function onSave(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "");
    const body = String(fd.get("body") ?? "");
    await run(
      async () => {
        const r = await fetch(`/api/admin/documents/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body }),
        });
        const out = await adminJsonResult(r);
        if (out.ok) await load();
        return out;
      },
      { ok: "Документ сохранён", fail: "Не удалось сохранить документ" },
    );
  }

  return (
    <div className="space-y-8">
      {docs.map((d) => (
        <section key={d.id} className="rounded-[8px] border border-[#ececec] p-4">
          <h2 className="mb-3 text-lg font-normal">{d.id}</h2>
          <form className="space-y-2" onSubmit={(e) => void onSave(e, d.id)}>
            <label className="block text-sm font-normal">Заголовок</label>
            <input
              className="field w-full outline-none"
              name="title"
              defaultValue={d.title}
              required
            />
            <label className="block text-sm font-normal">Текст</label>
            <textarea
              className="field min-h-[200px] w-full resize-y py-2 outline-none"
              name="body"
              defaultValue={d.body}
              required
            />
            <button type="submit" className="btn-accent">
              Сохранить
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
