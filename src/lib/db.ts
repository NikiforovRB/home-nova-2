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
  });

if (process.env.NODE_ENV !== "production") {
  global.__homenovaPool = db;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: Array<string | number | boolean | null | Date> = [],
) {
  return db.query<T>(text, params);
}
