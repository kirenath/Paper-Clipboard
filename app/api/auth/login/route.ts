import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAppPassword } from "@/lib/auth";
import { createSessionToken, getSessionCookieOptions } from "@/lib/session";

export async function POST(req: Request) {
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
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }
  const { token, maxAge } = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set({
    ...getSessionCookieOptions(maxAge),
    value: token,
  });
  return NextResponse.json({ ok: true });
}
