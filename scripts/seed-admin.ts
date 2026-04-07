import "dotenv/config";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/security/password";

async function run() {
  const email = "nikiforovrb@yandex.ru";
  const plainPassword = "1vngbwxcn78fg567";
  const name = "Администратор HOMENOVA";
  const passwordHash = await hashPassword(plainPassword);

  const roleResult = await db.query<{ id: number }>(
    "SELECT id FROM roles WHERE code = 'admin' LIMIT 1",
  );

  if (!roleResult.rows.length) {
    throw new Error("Admin role not found. Run migrations first.");
  }

  await db.query(
    `INSERT INTO users (email, password_hash, name, role_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role_id = EXCLUDED.role_id,
       name = EXCLUDED.name`,
    [email, passwordHash, name, roleResult.rows[0].id],
  );

  console.log(`Администратор создан/обновлён: ${email}`);
  await db.end();
}

run().catch(async (error) => {
  console.error(error);
  await db.end();
  process.exit(1);
});
