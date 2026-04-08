import { Pool, QueryResultRow } from "pg";
import { appConfig } from "@/lib/config";

declare global {
  var __homenovaPool: Pool | undefined;
}

export const db =
  global.__homenovaPool ??
  new Pool({
    host: appConfig.db.host,
    port: appConfig.db.port,
    user: appConfig.db.user,
    password: appConfig.db.password,
    database: appConfig.db.database,
    ssl:
      appConfig.db.sslmode === "disable"
        ? false
        : {
            rejectUnauthorized: false,
          },
    connectionTimeoutMillis: 5000,
    keepAlive: true,
  });

if (process.env.NODE_ENV !== "production") {
  global.__homenovaPool = db;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: Array<string | number | boolean | null | Date | string[] | number[]> = [],
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.query<T>(text, params);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      const transient =
        err?.code === "ETIMEDOUT" ||
        err?.code === "ECONNRESET" ||
        err?.code === "EPIPE" ||
        err?.code === "57P01" ||
        err?.message?.includes("Connection terminated unexpectedly") ||
        err?.message?.includes("connection timeout");
      if (!transient || attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }
  throw new Error("query retry exhausted");
}

/** PostgreSQL undefined_column — схема без миграции 002 (last_name / patronymic). */
export function isPgUndefinedColumn(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "42703";
}
