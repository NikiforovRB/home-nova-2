import { NextRequest } from "next/server";
import { fail, getAuthFromRequest, ok } from "@/lib/api";
import { uploadListingImage } from "@/lib/s3/upload-image";
import { query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return fail("Требуется авторизация", 401);

  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) return fail("Некорректный id", 422);

  const owner = await query<{ user_id: string }>(
    "SELECT user_id::text FROM listings WHERE id = $1 LIMIT 1",
    [listingId],
  );
  const row = owner.rows[0];
  if (!row) return fail("Объявление не найдено", 404);
  if (Number(row.user_id) !== Number(auth.userId)) return fail("Нет доступа", 403);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return fail("Файл обязателен", 422);

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = file.type?.trim() || "application/octet-stream";

  let upload: { originalKey: string; previewKey: string };
  try {
    upload = await uploadListingImage(bytes, contentType, listingId);
  } catch (err) {
    console.error("[media] S3 upload failed:", err);
    return fail("Не удалось загрузить файл в хранилище S3", 502);
  }

  const media = await query(
    `INSERT INTO listing_media (listing_id, original_key, preview_key, sort_order)
     VALUES ($1, $2, $3, 0)
     RETURNING id, original_key, preview_key`,
    [listingId, upload.originalKey, upload.previewKey],
  );

  return ok({ media: media.rows[0] });
}
