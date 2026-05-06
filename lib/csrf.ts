import "server-only"

import { NextResponse } from "next/server"

function getExpectedOrigin(req: Request): string {
  const configured = process.env.APP_ORIGIN?.trim()
  if (configured) return new URL(configured).origin
  return new URL(req.url).origin
}

export function enforceCsrf(req: Request): NextResponse | null {
  const method = req.method.toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null
  }

  const secFetchSite = req.headers.get("sec-fetch-site")?.toLowerCase()
  if (secFetchSite === "cross-site") {
    return NextResponse.json({ error: "请求来源不被允许" }, { status: 403 })
  }

  const originHeader = req.headers.get("origin")
  if (!originHeader) {
    return NextResponse.json({ error: "请求来源不被允许" }, { status: 403 })
  }

  let origin: string
  let expectedOrigin: string
  try {
    origin = new URL(originHeader).origin
    expectedOrigin = getExpectedOrigin(req)
  } catch {
    return NextResponse.json({ error: "请求来源不被允许" }, { status: 403 })
  }

  if (origin !== expectedOrigin) {
    return NextResponse.json({ error: "请求来源不被允许" }, { status: 403 })
  }

  return null
}
