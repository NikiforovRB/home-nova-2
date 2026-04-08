/** Parse admin/public JSON API response after fetch. */
export async function adminJsonResult(
  res: Response,
): Promise<{ ok: boolean; errorMessage?: string }> {
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok) return { ok: false, errorMessage: j.error ?? `Ошибка ${res.status}` };
  if (j.ok === false) return { ok: false, errorMessage: j.error ?? "Ошибка" };
  return { ok: true };
}
