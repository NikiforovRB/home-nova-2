import { appConfig } from "@/lib/config";

/** Публичный URL объекта в бакете (после настройки CORS). */
export function publicObjectUrl(key: string) {
  const base = appConfig.mediaPublicBase.replace(/\/$/, "");
  const path = key.replace(/^\//, "");
  return `${base}/${path}`;
}
