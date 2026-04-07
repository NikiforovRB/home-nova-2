import "dotenv/config";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";

async function run() {
  const migrationPath = join(process.cwd(), "db", "migrations", "001_init.sql");
  const sql = await readFile(migrationPath, "utf8");
  await db.query(sql);
  console.log("Migration 001_init.sql applied.");
  await db.end();
}

run().catch(async (error) => {
  console.error(error);
  await db.end();
  process.exit(1);
});
