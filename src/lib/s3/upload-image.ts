import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3/client";
import { appConfig } from "@/lib/config";

export async function uploadListingImage(
  fileBuffer: Buffer,
  contentType: string,
  listingId: number,
) {
  const imageId = randomUUID();
  const basePath = `listings/${listingId}/${imageId}`;
  const originalKey = `${basePath}/original`;
  const previewKey = `${basePath}/preview.webp`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: appConfig.s3.bucket,
      Key: originalKey,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  const previewBuffer = await sharp(fileBuffer).resize(640).webp({ quality: 80 }).toBuffer();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: appConfig.s3.bucket,
      Key: previewKey,
      Body: previewBuffer,
      ContentType: "image/webp",
    }),
  );

  return {
    originalKey,
    previewKey,
  };
}
