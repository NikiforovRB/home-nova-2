import jwt from "jsonwebtoken";
import { appConfig } from "@/lib/config";

type Role = "admin" | "user";

export type AuthPayload = {
  userId: number;
  email: string;
  role: Role;
};

export function signAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: appConfig.jwtAccessExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: AuthPayload) {
  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: appConfig.jwtRefreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, appConfig.jwtSecret) as AuthPayload;
}
