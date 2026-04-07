import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plainTextPassword: string) {
  return bcrypt.hash(plainTextPassword, ROUNDS);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string,
) {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
