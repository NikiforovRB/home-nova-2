import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const r = await query<{ title: string; body: string }>(
    `SELECT title, body FROM site_documents WHERE id = $1`,
    ["privacy"],
  );
  const row = r.rows[0];
  return (
    <main className="container-1600 py-10">
      <h1 className="mb-4 text-2xl font-semibold">
        {row?.title ?? "Политика конфиденциальности"}
      </h1>
      <div className="max-w-3xl whitespace-pre-wrap text-[#444]">{row?.body ?? ""}</div>
    </main>
  );
}
