import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3/client";
import { appConfig } from "@/lib/config";

export async function uploadUserAvatar(fileBuffer: Buffer, contentType: string, userId: number) {
  const id = randomUUID();
  const key = `avatars/${userId}/${id}.webp`;
  const webp = await sharp(fileBuffer).resize(400, 400, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: appConfig.s3.bucket,
      Key: key,
      Body: webp,
      ContentType: "image/webp",
    }),
  );
  return { key };
}
