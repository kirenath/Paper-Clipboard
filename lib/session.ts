// Edge-compatible HMAC-signed session cookie (no external deps).
// The cookie payload only stores an expiration timestamp; ownership is
// implicit because there is a single shared password.

export const SESSION_COOKIE_NAME = "clipboard_session";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// IMPORTANT: this development fallback must NOT be used in production.
// It only exists so v0 preview works without environment variables.
const DEV_FALLBACK_SECRET = "dev-session-secret-do-not-use-in-production";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }

  return DEV_FALLBACK_SECRET;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function stringToBase64Url(input: string): string {
  return bytesToBase64Url(new TextEncoder().encode(input));
}

function base64UrlToString(input: string): string {
  return new TextDecoder().decode(base64UrlToBytes(input));
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return bytesToBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++)
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export type SessionPayload = {
  exp: number;
};

export async function createSessionToken(
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS,
): Promise<{
  token: string;
  maxAge: number;
  expiresAt: number;
}> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload: SessionPayload = { exp };
  const payloadEncoded = stringToBase64Url(JSON.stringify(payload));
  const sig = await hmac(payloadEncoded, getSecret());
  return {
    token: `${payloadEncoded}.${sig}`,
    maxAge: maxAgeSeconds,
    expiresAt: exp,
  };
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadEncoded, sig] = parts;
  const expectedSig = await hmac(payloadEncoded, getSecret());
  if (!timingSafeEqual(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(
      base64UrlToString(payloadEncoded),
    ) as SessionPayload;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge: number) {
  const thirdPartyIframeEnabled =
    process.env.ENABLE_THIRD_PARTY_IFRAME_COOKIES === "true";
  const secure =
    process.env.NODE_ENV === "production" || thirdPartyIframeEnabled;

  if (thirdPartyIframeEnabled) {
    return {
      name: SESSION_COOKIE_NAME,
      httpOnly: true as const,
      sameSite: "none" as const,
      secure: true as const,
      partitioned: true as const,
      path: "/",
      maxAge,
    };
  }

  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}
