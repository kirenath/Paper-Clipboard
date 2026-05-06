import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Development fallback bcrypt hash for the explicit dev-only password: "dev-password".
// IMPORTANT: this must NOT be used in production. Always set APP_PASSWORD_HASH.
const DEV_FALLBACK_PASSWORD_HASH =
  "$2b$10$cN5JaR.y5yDUZZgFa1yDOOcvq1SenTUna2r6g4rmiqcBwUTzW45jC";

export function getAppPasswordHash(): string {
  const passwordHash = process.env.APP_PASSWORD_HASH;
  if (passwordHash) return passwordHash;

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_PASSWORD_HASH is required in production");
  }

  console.warn(
    "APP_PASSWORD_HASH is not set; using explicit development fallback password hash",
  );
  return DEV_FALLBACK_PASSWORD_HASH;
}

export function isUsingDevFallback(): boolean {
  return !process.env.APP_PASSWORD_HASH;
}

export async function verifyAppPassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, getAppPasswordHash());
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function requireAuth(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return null;
}
