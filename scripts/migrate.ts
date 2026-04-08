import "dotenv/config";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";

async function run() {
  const dir = join(process.cwd(), "db", "migrations");
  for (const name of [
    "001_init.sql",
    "002_user_names.sql",
    "003_admin_geo_documents_filters.sql",
    "004_add_studio_option.sql",
  ]) {
    const sql = await readFile(join(dir, name), "utf8");
    await db.query(sql);
    console.log(`Migration ${name} applied.`);
  }
  await db.end();
}

run().catch(async (error) => {
  console.error(error);
  await db.end();
  process.exit(1);
});
