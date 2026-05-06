import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieOptions } from "@/lib/session";
import { enforceCsrf } from "@/lib/csrf";

export async function POST(req: Request) {
  const csrfError = enforceCsrf(req);
  if (csrfError) return csrfError;
  const cookieStore = await cookies();
  // Match the attributes used when setting the cookie so the browser
  // actually overwrites/clears the existing one.
  cookieStore.set({
    ...getSessionCookieOptions(0),
    value: "",
  });
  return NextResponse.json({ ok: true });
}
