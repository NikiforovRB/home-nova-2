import { NextRequest } from "next/server";
import { fail, getAuthFromRequest, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { uploadUserAvatar } from "@/lib/s3/upload-avatar";

export async function POST(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Не авторизован", 401);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return fail("Файл обязателен", 422);

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = file.type?.trim() || "application/octet-stream";

  let key: string;
  try {
    const up = await uploadUserAvatar(bytes, contentType, auth.userId);
    key = up.key;
  } catch (e) {
    console.error("[avatar] S3:", e);
    return fail("Не удалось загрузить аватар", 502);
  }

  await query("UPDATE users SET avatar_url = $1 WHERE id = $2", [key, auth.userId]);

  return ok({ avatarKey: key });
}
