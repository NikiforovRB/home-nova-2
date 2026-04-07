import { S3Client } from "@aws-sdk/client-s3";
import { appConfig } from "@/lib/config";

export const s3Client = new S3Client({
  endpoint: appConfig.s3.endpoint,
  region: appConfig.s3.region,
  forcePathStyle: true,
  credentials: {
    accessKeyId: appConfig.s3.accessKeyId,
    secretAccessKey: appConfig.s3.secretAccessKey,
  },
});
