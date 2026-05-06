import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAppPassword } from "@/lib/auth";
import { createSessionToken, getSessionCookieOptions } from "@/lib/session";

const FAILURE_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILURES_PER_WINDOW = 10;
const loginFailures = new Map<
  string,
  { count: number; firstFailedAt: number }
>();

function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwardedFor = req.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (forwardedFor) return forwardedFor;

  return "unknown";
}

function getFailureRecord(ip: string, now = Date.now()) {
  const record = loginFailures.get(ip);
  if (!record || now - record.firstFailedAt > FAILURE_WINDOW_MS) {
    const fresh = { count: 0, firstFailedAt: now };
    loginFailures.set(ip, fresh);
    return fresh;
  }
  return record;
}

function isRateLimited(ip: string): boolean {
  return getFailureRecord(ip).count > MAX_FAILURES_PER_WINDOW;
}

function recordFailure(ip: string) {
  const record = getFailureRecord(ip);
  record.count += 1;
}

function delayFailedLogin(): Promise<void> {
  const delayMs = 500 + Math.floor(Math.random() * 1001);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    await delayFailedLogin();
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const password = (body.password ?? "").toString();
  if (!password) {
    return NextResponse.json({ error: "请输入密码" }, { status: 400 });
  }
  if (!(await verifyAppPassword(password))) {
    recordFailure(clientIp);
    await delayFailedLogin();
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }
  loginFailures.delete(clientIp);
  const { token, maxAge } = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set({
    ...getSessionCookieOptions(maxAge),
    value: token,
  });
  return NextResponse.json({ ok: true });
}
