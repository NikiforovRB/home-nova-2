import { createHash } from "node:crypto";

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshSessionExpiresAt(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
