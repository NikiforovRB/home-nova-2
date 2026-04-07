export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /** База для ключей S3: `https://endpoint/bucket` (доступна в браузере). */
  mediaPublicBase: process.env.NEXT_PUBLIC_MEDIA_BASE ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  db: {
    host: process.env.POSTGRESQL_HOST ?? "",
    port: Number(process.env.POSTGRESQL_PORT ?? 5432),
    user: process.env.POSTGRESQL_USER ?? "",
    password: process.env.POSTGRESQL_PASSWORD ?? "",
    database: process.env.POSTGRESQL_DBNAME ?? "",
    sslmode: process.env.POSTGRESQL_SSLMODE ?? "require",
  },
  s3: {
    endpoint: process.env.S3_URL ?? "",
    bucket: process.env.S3_BUCKET ?? "",
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    region: process.env.S3_REGION ?? "ru-1",
  },
};

export function ensureEnv() {
  if (!appConfig.jwtSecret) {
    throw new Error("JWT_SECRET is missing");
  }
}
