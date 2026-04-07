/** Для клиентских компонентов (только NEXT_PUBLIC_*). */
export function publicMediaUrlFromKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
