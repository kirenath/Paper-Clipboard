import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session"

const PUBLIC_API_PATHS = new Set(["/api/auth/login", "/api/auth/logout", "/api/auth/session"])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = await verifySessionToken(token)

  // Login page handling
  if (pathname === "/login") {
    if (session) {
      const url = req.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Public auth API endpoints
  if (PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Protect API
  if (pathname.startsWith("/api/")) {
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "未登录" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    }
    return NextResponse.next()
  }

  // Protect app pages
  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-light-32x32.png|icon-dark-32x32.png|apple-icon.png).*)"],
}
