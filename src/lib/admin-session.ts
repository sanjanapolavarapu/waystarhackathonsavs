import "server-only";

import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "qpp_admin";

function secret() {
  const s = process.env.ADMIN_AUTH_SECRET || process.env.AUTH_SECRET || "dev_only_change_me";
  return new TextEncoder().encode(s);
}

export function adminCookieName() {
  return COOKIE_NAME;
}

export async function createAdminSession() {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function isValidAdminSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

