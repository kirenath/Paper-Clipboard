import { NextResponse } from "next/server"
import {
  deleteClipboardTag,
  updateClipboardTag,
  StoreValidationError,
} from "@/lib/clipboard-store"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  let body: { name?: string; sortOrder?: number | null } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 })
  }
  try {
    const tag = await updateClipboardTag(id, body)
    return NextResponse.json({ tag })
  } catch (err) {
    if (err instanceof StoreValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  try {
    await deleteClipboardTag(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof StoreValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
